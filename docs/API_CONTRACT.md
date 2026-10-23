# TrustDonate API Contract (v1)

Base URL: `http://localhost:5001/api/v1`

---

## 1. Global Standards

### Error Format
All errors return consistent JSON:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested donation record was not found.",
    "details": null
  },
  "timestamp": "2026-10-23T18:45:00.000Z"
}
```

### Monetary Units & Token Decimals
* Amounts sent and received for calculations must include raw base units (`amountRaw` as a string for `uint256`) and formatted human-readable strings (`amountFormatted`, `tokenSymbol`).
* Never pass JavaScript floating-point representations as authoritative values.

---

## 2. Endpoints

### A. Health & System Configuration
#### `GET /health`
* **Description**: Service health and chain status.
* **Response**:
```json
{
  "success": true,
  "data": {
    "status": "HEALTHY",
    "chainId": 80002,
    "chainName": "Polygon Amoy Testnet",
    "contracts": {
      "ngoRegistry": "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      "treasury": "0x71F39082Bc45199201aDeF80B91244019aA2C81B",
      "escrow": "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
      "multiSig": "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE"
    },
    "blockHeight": 12489321
  }
}
```

#### `GET /config`
* **Description**: Public tokens, supported chains, and address registry.
* **Response**:
```json
{
  "success": true,
  "data": {
    "chainId": 80002,
    "supportedTokens": [
      {
        "symbol": "POL",
        "name": "Native POL",
        "address": "0x0000000000000000000000000000000000000000",
        "decimals": 18,
        "isNative": true
      },
      {
        "symbol": "USDC",
        "name": "USD Coin (Amoy)",
        "address": "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
        "decimals": 6,
        "isNative": false
      },
      {
        "symbol": "USDT",
        "name": "Tether USD",
        "address": "0x1205f31718499dBf1fCa446663B532Ef87481fe1",
        "decimals": 6,
        "isNative": false
      }
    ]
  }
}
```

---

### B. Wallet Authentication (SIWE)
#### `POST /auth/challenge`
* **Body**:
```json
{
  "address": "0x7a3B19D412bF249f7b189Ec24A00518774f2E"
}
```
* **Response**:
```json
{
  "success": true,
  "data": {
    "nonce": "d8f1e29c0b7a42",
    "message": "trustdonate.org wants you to sign in with your Ethereum account:\n0x7a3B19D412bF249f7b189Ec24A00518774f2E\n\nURI: https://trustdonate.org\nVersion: 1\nChain ID: 80002\nNonce: d8f1e29c0b7a42\nIssued At: 2026-10-23T18:45:00.000Z",
    "expiresAt": "2026-10-23T18:50:00.000Z"
  }
}
```

#### `POST /auth/verify`
* **Body**:
```json
{
  "message": "<Full SIWE formatted message>",
  "signature": "0x4a9b...71c2"
}
```
* **Response**:
```json
{
  "success": true,
  "data": {
    "token": "jwt_session_token_here",
    "wallet": "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
    "role": "NGO_OPERATOR",
    "ngoId": "ngo-1"
  }
}
```

---

### C. NGOs & Projects
#### `GET /ngos`
* Returns verified NGOs and their on-chain addresses.

#### `GET /ngos/:id`
* Detailed metrics, active initiatives, verified wallet, and 80G tax registration ID.

---

### D. Donations
#### `POST /donations/prepare`
* **Body**:
```json
{
  "ngoId": "ngo-1",
  "tokenSymbol": "USDC",
  "amount": "100.00",
  "donorAddress": "0x8B2D198AcfE92B1047192801F524Ab902C511F90"
}
```
* **Response**: Calldata, target contract address, estimated gas, token approval requirements.

#### `POST /donations/record`
* Submit an observed on-chain transaction hash for instant indexing:
```json
{
  "txHash": "0x3f5c2901a812b4e72d93e114f6b21908a812b4e7",
  "ngoId": "ngo-1"
}
```

#### `GET /donations` (Query parameters: `token`, `ngoId`, `page`, `limit`)
#### `GET /donations/by-tx/:txHash`
#### `GET /donations/by-wallet/:address`

---

### E. Transparency & IPFS Reports
#### `GET /transactions/:txHash`
* Inspect verification status, validator details, block height, and calldata.

#### `GET /reports` and `POST /reports` (Authenticated NGO)
* Submit report metadata with IPFS CID and third-party auditor signatures.
