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
---

## 4. Phase 2 Enterprise Governance & Security Architecture

### A. Centralized Enterprise Role-Based Access Control (RBAC)
* **Centralized Registry**: Defined in `server/src/rbac/permissions.cjs` with fine-grained action permissions.
* **Deny-by-Default**: Endpoints strictly reject callers unless explicit permission claims are present.
* **Organization Scoping & IDOR Prevention**: Validates that non-super-admin actors possess active memberships within the specific NGO whose resources are requested.
* **Instant Session Revocation**: Every user record contains a `token_version` column. Administrative role changes increment this version, instantaneously invalidating previously issued session tokens.

### B. Controlled NGO Onboarding & Document Verification
* **Lifecycle State Machine**: `DRAFT` $\to$ `SUBMITTED` $\to$ `UNDER_REVIEW` $\to$ `APPROVED` / `REJECTED` $\to$ `SUSPENDED` / `REACTIVATED`.
* **Verification Checklist**: Document uploads for Legal Registration Certificate, 80G Tax Exemption, FCRA clearance, and Bank Account Proof are pinned to IPFS and validated.
* **Conflict of Interest Protection**: Platform reviewers cannot review or approve onboarding applications they authored.
* **Single-Use Team Invitations**: Cryptographically signed invitation tokens with a 7-day expiration link team members to organization roles.

### C. Financial Governance & Dual-Control Separation of Duties
* **Approval Policies**: Configurable per-NGO spending thresholds, per-transaction maximums, and required approval counts.
* **Payload Hash Binding**: Proposals generate a deterministic SHA-256 hash of all financial parameters (`ngoId`, `projectId`, `token`, `amountRaw`, `recipientWallet`). Any change to these parameters invalidates prior approvals.
* **Separation of Duties**: Proposers cannot review, approve, or execute their own financial disbursements.

### D. Treasury Reconciliation & Auditable Accounting
* **Append-Only Ledger**: All financial inflows, outflows, refunds, and adjustments are recorded as immutable entries in `treasury_ledger`.
* **Integer-Safe Monetary Math**: Uses JavaScript `BigInt` for exact token wei / mwei accounting.
* **On-Chain vs. Internal Reconciliation**: Automated checks compare authoritative blockchain state against internal accounting balances, raising automated alerts upon variance.

### E. Explainable Fraud & Anomaly Monitoring
* Heuristic evaluation of transaction velocity, unusually large payouts, recipient destination discrepancies, and authentication failures.
* Explainable risk alerts classified by severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) with required resolution audit trails.

### F. Independent Auditor & Compliance Workflows
* Formal audit engagement lifecycle with evidence requests, IPFS proof submissions, severity-rated findings, and management action plans.
* Versioned audit reports cryptographically signed and content-addressed on IPFS.

### G. Notifications & Background Job Runner
* In-app notification delivery and user preference settings.
* Non-custodial reminder mechanism for recurring donations (alerts user to sign periodic contributions with their own wallet, strictly avoiding private key custody).
* Idempotent background job queue with exponential backoff and retry limits.

