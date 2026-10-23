# TrustDonate Phase 2 — Comprehensive Backend Architecture Audit

## 1. Executive Summary

This document performs an exhaustive audit of the Phase 1 backend implementation of **TrustDonate — Blockchain-Enabled Transparent Donation Tracking Platform for NGOs**, analyzing the existing data models, authentication mechanisms, smart contract integration, authorization boundaries, and identifying key technical gaps addressed in Phase 2.

---

## 2. Existing Architecture Audit

### 2.1 User & Identity Models
- **Current State**: Users authenticate using EIP-4361 Sign-In with Ethereum (SIWE) through `server/src/services/authService.cjs`. The system issues an HMAC-SHA256 signed session token containing `address`, `role`, and `ngoId`.
- **Existing Limitation**: 
  - Roles were coarsely assigned: if the wallet address matches an NGO's `verified_wallet`, the role defaults to `NGO_OPERATOR`; otherwise, it defaults to `AUTHORIZED_DONOR`.
  - There is no persistent `users`, `user_roles`, or `organization_memberships` table.
  - Multiple team members per NGO (e.g. Finance Officer vs. Project Manager vs. NGO Administrator) cannot be distinguished.
  - No session revocation or token versioning mechanism existed; token invalidation relies purely on time expiry.

### 2.2 NGO Registration & Verification
- **Current State**: NGOs are represented in the SQLite `ngos` table with statuses: `ACTIVE`, `SUSPENDED`, `REVOKED`.
- **Existing Limitation**:
  - Missing a complete onboarding lifecycle (`DRAFT` $\to$ `SUBMITTED` $\to$ `UNDER_REVIEW` $\to$ `APPROVED`/`REJECTED`).
  - No document verification checklist (e.g. 80G tax certificate, FCRA registration, PAN, bank proof) with verification status tracking.
  - No reviewer assignment, reviewer notes, conflict-of-interest safeguards, or duplicate registration heuristics.

### 2.3 Role-Based Access Control (RBAC) & Authorization Boundaries
- **Current State**: Only two middleware functions existed in `server/src/middleware/authMiddleware.cjs`: `requireAuth` and `requireNgoAdmin`.
- **Existing Limitation**:
  - Lacks fine-grained permissions (e.g., `DONATIONS_VIEW`, `DISBURSEMENTS_PROPOSE`, `DISBURSEMENTS_APPROVE`, `AUDIT_SUBMIT`, `MEMBERS_INVITE`).
  - Missing enterprise roles: `PLATFORM_SUPER_ADMIN`, `NGO_ADMIN`, `FINANCE_OFFICER`, `PROJECT_MANAGER`, `INDEPENDENT_AUDITOR`, `DONOR`, `VIEWER`.
  - Missing organization-level and project-level boundary checks (IDOR vulnerability potential if an NGO operator accessed another NGO's ID).
  - No server-side separation of duties (e.g. Proposer $\ne$ Approver $\ne$ Executor).

### 2.4 Smart Contract & Financial Governance
- **Current State**:
  - Solidity contracts deployed: `NgoRegistry.sol`, `TrustDonateTreasury.sol`, `MilestoneEscrow.sol`, `MultiSigTreasury.sol`, `MockERC20.sol`.
  - 3-of-5 multisig on-chain contracts and 3-approver milestone disbursement contracts compiled and tested (22 passing tests).
- **Existing Limitation**:
  - No server-side governance policy engine prior to on-chain execution.
  - No configurable spending thresholds, daily limits, token-specific maximums, or material-change invalidation of proposals.
  - Proposals did not bind immutable payload hashes on the backend to prevent parameter tampering.

### 2.5 Treasury Reconciliation & Accounting
- **Current State**: Donations are stored in `donations` table, and basic milestone records are stored in `milestones`.
- **Existing Limitation**:
  - No double-entry or append-only treasury ledger (`treasury_ledger`).
  - No reconciliation service comparing on-chain balances with database accounting totals.
  - No discrepancy detection, discrepancy reporting, or auditable adjustment workflows.

### 2.6 Fraud & Anomaly Monitoring
- **Current State**: Basic transaction hash lookup via `/api/v1/transactions/:txHash`.
- **Existing Limitation**:
  - No automated risk engine to detect duplicate payments, rapid successive disbursements, sudden recipient wallet changes, or failed authentication brute-forcing.
  - No severity classification (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) or risk alert management lifecycle.

### 2.7 Auditor & Compliance Workflows
- **Current State**: Basic static reports table (`reports`) with IPFS CID resolution.
- **Existing Limitation**:
  - Independent auditors cannot initiate formal audit engagements, request project evidence, or log formal findings with severity ratings.
  - No cryptographic integrity verification or report versioning for published audits.

### 2.8 Notifications & Background Processing
- **Current State**: Only direct synchronous HTTP responses; no persistent notification inbox or retry queue.
- **Existing Limitation**:
  - No in-app notification inbox or user preference management.
  - No idempotent background job queue with exponential backoff for asynchronous tasks.

---

## 3. Phase 2 Target Architecture Roadmap

| Module | Core Upgrades |
|---|---|
| **RBAC & Isolation** | Unified permission registry, organization/project scoping middleware, user & membership tables, token revocation checks. |
| **Onboarding & Team** | Multi-stage lifecycle (`DRAFT` $\to$ `APPROVED`), document checklist, reviewer notes, single-use team invitations with expiration. |
| **Financial Governance** | Configurable approval policies, spending thresholds, separation-of-duties enforcement, payload hash binding. |
| **Reconciliation** | Append-only treasury accounting ledger, integer-safe base unit math, on-chain vs. internal reconciliation engine. |
| **Fraud Monitoring** | Heuristic risk engine for velocity, large disbursements, destination changes, and explainable risk alert resolution. |
| **Auditor Workflows** | Audit engagements, evidence submission requests, findings lifecycle, cryptographic report versioning. |
| **Notifications & Jobs** | In-app notification delivery, user preferences, idempotent job queue with retry and backoff. |
| **Security Hardening** | Rate limiting, input validation, strict IDOR prevention, and sanitized structured audit logging. |

---

## 4. Verification & Testing Baseline

- **Current Contract Tests**: 22 / 22 Passing
- **Current Server Tests**: 12 / 12 Passing
- **Current Frontend Tests**: 41 / 41 Passing
- **Total Passing Baseline**: 75 / 75 Passing
- **Constraint**: All existing 75 tests and new Phase 2 test suites must pass cleanly without regressions.
