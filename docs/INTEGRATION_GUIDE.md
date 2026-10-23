# TrustDonate Frontend-to-Backend Integration Guide

This guide describes how the frontend application connects to the contracts and backend services.

---

## 1. Importing Contracts in Frontend

All contract ABIs and address registry files are generated in `src/contracts/`:

```javascript
import {
  addressRegistry,
  NgoRegistryAbi,
  TrustDonateTreasuryAbi,
  MilestoneEscrowAbi,
  MultiSigTreasuryAbi,
} from "./contracts";

// Initialize contract instance with ethers.js
const treasuryContract = new ethers.Contract(
  addressRegistry.contracts.TrustDonateTreasury,
  TrustDonateTreasuryAbi.abi,
  signer
);
```

---

## 2. Real-Time Donation Flow

1. **Pre-Flight Validation**:
   ```javascript
   const res = await fetch("http://localhost:5001/api/v1/donations/prepare", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       ngoId: "ngo-1",
       tokenSymbol: "USDC",
       amount: "100.00",
       donorAddress: account,
     }),
   });
   const { data } = await res.json();
   ```

2. **On-Chain Execution**:
   - For **POL**: call `treasury.donatePOL(ngoId, taxReceiptNo, { value: amountWei })`.
   - For **USDC / USDT**:
     1. Check allowance; if needed, call `token.approve(treasuryAddress, amountRaw)`.
     2. Call `treasury.donateERC20(ngoId, tokenAddress, amountRaw, taxReceiptNo)`.

3. **Receipt & Indexing**:
   ```javascript
   await fetch("http://localhost:5001/api/v1/donations/record", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       txHash: tx.hash,
       ngoId: "ngo-1",
       donorAddress: account,
       tokenSymbol: "USDC",
       amount: "100.00",
     }),
   });
   ```

---

## 3. NGO Wallet Sign-In (SIWE)

1. **Request Challenge**:
   ```javascript
   const res = await fetch("http://localhost:5001/api/v1/auth/challenge", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ address: account }),
   });
   const { data } = await res.json();
   ```

2. **Sign with MetaMask**:
   ```javascript
   const signature = await signer.signMessage(data.message);
   ```

3. **Verify and Receive Session Token**:
   ```javascript
   const verifyRes = await fetch("http://localhost:5001/api/v1/auth/verify", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ message: data.message, signature }),
   });
   const { data: session } = await verifyRes.json();
   // Store session.token for authenticated requests
   ```
