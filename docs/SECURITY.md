# TrustDonate Security Architecture & Threat Model

## 1. Threat Mitigation Strategies

| Threat Vector | Mitigation Strategy |
| :--- | :--- |
| **Reentrancy Attacks** | All contracts handling transfers use OpenZeppelin `ReentrancyGuard` (`nonReentrant` modifier) and follow the Checks-Effects-Interactions (CEI) pattern. |
| **Unauthorized Token Drain** | `TrustDonateTreasury` uses an explicit token allowlist (`address(0)` for POL, approved addresses for ERC-20). Disallows arbitrary token sweeps. |
| **Fee-On-Transfer Token Discrepancies** | Transfers measure balance deltas (`balanceAfter - balanceBefore`) rather than trusting parameter amounts blindly. |
| **Multi-Sig Replay & Sybil Attacks** | Unique `txId` hashes, nonce checking, and signer uniqueness validation enforce a strict 3-of-5 threshold. |
| **Donor Wallet Impersonation** | Backend never stores or uses private keys to sign on behalf of donors. Donors must sign transactions directly via MetaMask. |
| **SIWE Authentication Hijacking** | Server issues single-use random nonces with short 5-minute expirations. Validates `domain`, `uri`, and server-verified signatures before issuing session JWTs. |
| **Injection & Malicious Input** | Strict parameterized SQL queries and schema validation middleware. |
| **Data Fabrication** | Blockchain event indexer checks actual block receipt logs before marking transactions as confirmed. |

---

## 2. Access Control Matrix

* **Platform Admin**: Can register NGOs and adjust token allowlists. Cannot withdraw funds designated for specific NGOs.
* **Verified NGO Operator**: Can submit milestone release proposals for their projects. Cannot self-approve disbursements without Multi-Sig consensus.
* **Multi-Sig Signers (3-of-5)**: Trustees who independently confirm milestone proof authenticity before releasing escrow funds.
* **Public Donors**: Direct deposit permissions only. Non-custodial refund claims available if milestones are officially cancelled.
