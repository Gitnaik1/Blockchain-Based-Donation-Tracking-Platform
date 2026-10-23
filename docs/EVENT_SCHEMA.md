# TrustDonate Blockchain Event Schema

This document specifies the exact Solidity events emitted by the contracts and ingested by the `IndexerService`.

---

## 1. `NgoRegistry.sol`

### `NgoRegistered`
```solidity
event NgoRegistered(
    uint256 indexed ngoId,
    string name,
    address indexed adminWallet,
    string legalRegNo,
    string ipfsKycCid,
    uint256 timestamp
);
```

### `NgoVerificationStatusChanged`
```solidity
event NgoVerificationStatusChanged(
    uint256 indexed ngoId,
    uint8 oldStatus,
    uint8 newStatus,
    address indexed updatedBy,
    uint256 timestamp
);
```
* Status enum:
  * `0`: Pending
  * `1`: Active & Verified
  * `2`: Suspended
  * `3`: Revoked

---

## 2. `TrustDonateTreasury.sol`

### `DonationReceived`
```solidity
event DonationReceived(
    bytes32 indexed donationId,
    uint256 indexed ngoId,
    address indexed donor,
    address token, // address(0) for native POL
    uint256 amountRaw,
    string taxReceiptNo,
    uint256 timestamp
);
```

### `TokenAllowlistUpdated`
```solidity
event TokenAllowlistUpdated(
    address indexed token,
    bool isAllowed,
    uint8 decimals
);
```

---

## 3. `MilestoneEscrow.sol`

### `MilestoneProposed`
```solidity
event MilestoneProposed(
    bytes32 indexed milestoneId,
    uint256 indexed ngoId,
    uint256 indexed projectId,
    string title,
    address token,
    uint256 amountRaw,
    address recipientWallet,
    string ipfsInvoiceCid,
    uint256 deadline
);
```

### `MilestoneApproved`
```solidity
event MilestoneApproved(
    bytes32 indexed milestoneId,
    address indexed approver,
    uint256 currentApprovals,
    uint256 requiredApprovals
);
```

### `MilestoneFundsDisbursed`
```solidity
event MilestoneFundsDisbursed(
    bytes32 indexed milestoneId,
    address indexed recipient,
    address token,
    uint256 amountRaw,
    uint256 timestamp
);
```

---

## 4. `MultiSigTreasury.sol`

### `TransactionProposed`
```solidity
event TransactionProposed(
    uint256 indexed txId,
    address indexed proposer,
    address indexed destination,
    uint256 value,
    bytes data
);
```

### `TransactionConfirmed`
```solidity
event TransactionConfirmed(
    uint256 indexed txId,
    address indexed signer,
    uint256 currentConfirmations
);
```

### `TransactionExecuted`
```solidity
event TransactionExecuted(
    uint256 indexed txId,
    address indexed executor
);
```
