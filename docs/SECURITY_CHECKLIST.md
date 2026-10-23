# TrustDonate Platform Security Verification Checklist

This document details the complete security verification checklist for the TrustDonate platform across backend authentication, smart contract integration, role-based access controls, and data lifecycle management.

---

## 1. Authentication & Identity Safeguards

- [x] **Sign-In with Ethereum (EIP-4361 / SIWE)**:
  - Unpredictable single-use nonce generated via CSPRNG (`crypto.randomBytes(16)`).
  - Explicit binding to domain (`trustdonate.org`), URI, chain ID (`80002`), and recipient wallet.
  - Strict 5-minute challenge expiration.
  - Replay protection: challenges transition to `USED` atomically upon initial verification.
  - Cryptographic signature recovery performed via `ethers.verifyMessage`.

- [x] **Password Protection & Key Derivation**:
  - Memory-hard password hashing using `scrypt` ($N=16384, r=8, p=1, \text{keylen}=64$).
  - Per-user cryptographically random 16-byte salt (`crypto.randomBytes(16)`).
  - Password verification performed via constant-time buffer comparison (`crypto.timingSafeEqual`).
  - Constant-time dummy hashing executed when email is not found, mitigating username enumeration via timing attacks.
  - Password complexity enforcement (minimum 8 characters, uppercase, lowercase, number).

- [x] **Brute-Force & Credential Stuffing Defense**:
  - Failed login attempt counter tracked in persistent database.
  - Automatic account lockout for 15 minutes after 5 consecutive failures.
  - Generic authentication error messages (`"Invalid email or password."`) preventing account discovery.

- [x] **Password Reset & Verification Lifecycle**:
  - High-entropy single-use reset tokens (256-bit entropy).
  - Tokens stored as SHA-256 hashes at rest; plaintext tokens never persisted.
  - Strict 1-hour reset token expiration.
  - Automatic revocation of all active sessions upon password reset via `token_version` increment.

---

## 2. Session Management & Token Revocation

- [x] **Dual Session Delivery**:
  - JWT Bearer authentication supported for programmatic and mobile API clients.
  - Automatic issuance of `trustdonate_session` HttpOnly, SameSite, Secure cookie.
  - Session cookie cannot be accessed via JavaScript (`document.cookie`), neutralizing token theft via XSS.

- [x] **CSRF Mitigation**:
  - Cookie-authenticated state mutations (`POST`, `PUT`, `PATCH`, `DELETE`) require custom HTTP headers (`X-Requested-With`) or validated origin match.

- [x] **Instant Session Revocation via Token Versioning**:
  - Global `token_version` checked on every authenticated request.
  - Modifying membership, revoking a member, suspending an NGO, or changing credentials immediately increments `token_version`, instantly revoking all active sessions across all devices.
  - Explicit logout inserts token hash into `revoked_tokens` blacklist.

---

## 3. Cryptographic Wallet Linking

- [x] **Proof of Possession**:
  - Linking a wallet to an email account requires a cryptographic signature over a fresh challenge.
  - Wallets cannot be bound merely by supplying an address.
- [x] **Exclusivity & Conflict Prevention**:
  - A wallet already linked to another account cannot be linked without prior disassociation (returns `409 Conflict`).

---

## 4. Role-Based Access Control (RBAC) & Authorization

- [x] **Deny-by-Default Authorization**:
  - Every protected route enforces explicit permission checks (`requirePermission(...)`).
  - Unauthenticated requests receive `401 Unauthorized`.
  - Authenticated users lacking required permissions receive `403 Forbidden`.

- [x] **Separation of Duties (SoD)**:
  - Financial disbursements: The user who proposes a disbursement cannot approve or execute it.
  - NGO Onboarding: The applicant wallet cannot review or approve its own application (enforces `403 Forbidden`).

- [x] **IDOR & Multi-Tenant Data Isolation**:
  - NGO operators can only access records, policies, members, and ledgers belonging to their scoped `activeNgoId`.
  - Cross-organization resource access attempts receive `403 Forbidden`.

---

## 5. Non-Custodial & Blockchain Principles

- [x] **Zero Custody of Private Keys**:
  - The server never generates, accepts, handles, or persists wallet private keys or mnemonic seed phrases.
  - All transactions and signatures originate on the client side via the user's Web3 wallet.

- [x] **Idempotent Blockchain Execution**:
  - Transaction hashes are unique and enforced via database constraints.
  - Disbursement proposal executions prevent double-execution via proposal status state checks.

- [x] **Integer-Safe Arithmetic**:
  - Token amounts, wei, and ledger balances are computed exclusively using `BigInt` arithmetic without floating-point precision loss.

---

## 6. Audit Trail & Incident Response

- [x] **Immutable Security Event Logging**:
  - All critical security events (login attempts, failed authentications, lockouts, wallet linkings, conflict-of-interest attempts, role updates) are recorded in `security_audit_logs`.
  - Audit logs are accessible strictly to `PLATFORM_SUPER_ADMIN`.
