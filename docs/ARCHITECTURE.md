# TrustDonate Architecture Specification

## 1. System Overview

TrustDonate is a decentralized, non-custodial donation tracking and milestone release platform designed for NGOs and public donors. The system guarantees end-to-end transparency by recording donations, multi-signature approvals, and milestone disbursements directly on the Polygon blockchain (Amoy Testnet, Chain ID `80002`), while anchoring supporting audit documentation (invoices, receipts, field photographs) to IPFS.

```
+-----------------------------------------------------------------------------------+
|                                 TRUSTDONATE PLATFORM                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +--------------------+        +---------------------+      +------------------+  |
|  |  Public Donor UI   |        | NGO Management UI   |      |  Auditor / Public|  |
|  |  (MetaMask, React) |        | (SIWE Auth, Portal) |      |  (Receipt Search)|  |
|  +---------+----------+        +----------+----------+      +--------+---------+  |
|            |                              |                          |            |
|            +---------------+--------------+--------------------------+            |
|                            | HTTP/WS / RPC                                        |
|                            v                                                      |
|  +-----------------------------------------------------------------------------+  |
|  |                             BACKEND API LAYER                               |  |
|  | - Express REST APIs (v1)                                                    |  |
|  | - SIWE Challenge-Response Wallet Authenticator                              |  |
|  | - Blockchain Event Indexer & Reconciliation Engine                          |  |
|  | - Content-Addressed IPFS Gateway Adapter                                    |  |
|  | - SQLite / PostgreSQL Normalized Accounting Store                           |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|                                        v                                          |
|  +-----------------------------------------------------------------------------+  |
|  |                          SMART CONTRACT SYSTEM                              |  |
|  |                          (Polygon Amoy / EVM)                               |  |
|  |                                                                             |  |
|  |  +-------------------+   +-----------------------+   +-------------------+  |  |
|  |  |   NgoRegistry     |   |  TrustDonateTreasury  |   |  MilestoneEscrow  |  |  |
|  |  | - NGO KYC/Status  |   | - Token Allowlists    |   | - Proposals       |  |  |
|  |  | - Verified Wallets|   | - POL / ERC20 Accept  |   | - Multi-Sig Locks |  |  |
|  |  | - Category/Meta   |   | - Accounting Events   |   | - Safe Release    |  |  |
|  |  +---------+---------+   +-----------+-----------+   +---------+---------+  |  |
|  |            ^                         ^                         ^            |  |
|  |            |                         |                         |            |  |
|  |            +-------------------------+-------------------------+            |  |
|  |                                      |                                      |  |
|  |                           +----------v-----------+                          |  |
|  |                           |  MultiSigTreasury    |                          |  |
|  |                           |  - 3-of-5 Threshold  |                          |  |
|  |                           |  - Signer Registry   |                          |  |
|  |                           |  - Replay-Safe Exec  |                          |  |
|  |                           +----------------------+                          |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### A. Non-Custodial Multi-Token Treasury
* **Native Currency**: Native POL (Polygon gas token, 18 decimals).
* **Approved ERC-20 Tokens**: Configured allowlist for standard stablecoins (USDC with 6 decimals, USDT with 6 decimals).
* **Strict Accounting**: All financial calculations are stored as native unsigned integer units (`uint256`), eliminating floating-point rounding errors.
* **Separation of Concerns**: Donors interact with `TrustDonateTreasury`, which routes verifiable deposits into project escrow vaults.

### B. Milestone Escrow & Multi-Sig Governance
* Funds earmarked for NGO projects remain locked in `MilestoneEscrow`.
* Capital can only be released upon:
  1. Proposal submission by the verified NGO operator.
  2. Cryptographic confirmation by at least 3 of 5 registered Multi-Sig trustees (`MultiSigTreasury`).
  3. Submission of an IPFS-anchored verification proof (invoice, audit certificate).

### C. Off-Chain Event Indexing & Persistent Ledger
* The backend does not rely on transient client state or in-memory arrays.
* The `IndexerService` ingests on-chain events (`DonationReceived`, `MilestoneProposed`, `MilestoneApproved`, `FundsDisbursed`), verifies confirmations (12 blocks on Amoy / 1 block on local node), and stores normalized records in persistent SQL storage.

### D. Server-Side Wallet Authentication (SIWE)
* Uses Sign-In with Ethereum (EIP-4361 / SIWE).
* One-time cryptographically random challenge nonces with expiration (5 minutes).
* Prevents replay attacks, impersonation, and unauthorized access to NGO administration endpoints.

---

## 3. Network Configuration
* **Target Network**: Polygon Amoy Testnet
* **Chain ID**: `80002` (`0x13882` hex)
* **Native Token**: POL (18 decimals)
* **Public RPC Endpoint**: `https://rpc-amoy.polygon.technology/`
* **Block Explorer**: `https://amoy.polygonscan.com/`
* **Local Test Environment**: Hardhat Local Network (`chainId: 31337`)
