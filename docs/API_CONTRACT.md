# TrustDonate Authoritative API Contract (v1)

Base URL: `http://localhost:5001/api/v1`

---

## 1. Global Standards & Conventions

### Error Format
All errors return consistent JSON with semantic HTTP status codes (`400`, `401`, `403`, `404`, `409`, `429`, `500`):
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found.",
    "details": null
  },
  "timestamp": "2026-10-23T18:45:00.000Z"
}
```

### Authentication Headers & Cookies
- **Bearer Token**: `Authorization: Bearer <JWT>`
- **Session Cookie**: `trustdonate_session=<JWT>; HttpOnly; SameSite=Lax; Path=/`
- **CSRF Defense**: On mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) authenticated via cookie, clients must send the `X-Requested-With: XMLHttpRequest` header.

### Monetary Units & Token Decimals
- Monetary amounts in API payloads must provide raw integer strings (`amountRaw` representing base units: wei or mwei) alongside formatted strings (`amountFormatted`, `tokenSymbol`).
- Floating-point representations are strictly forbidden for balance computations.

---

## 2. Authentication & Account Lifecycle Endpoints

### A. Wallet SIWE (EIP-4361)
#### `POST /auth/challenge`
* **Description**: Generates a single-use cryptographically random nonce and formatted SIWE message.
* **Body**:
```json
{
  "address": "0x7a3B19D412bF249f7b189Ec24A00518774f2E"
}
```
* **Response (200 OK)**:
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
* **Description**: Verifies cryptographic signature against single-use nonce, issues session JWT and HttpOnly cookie.
* **Body**:
```json
{
  "message": "<SIWE formatted message>",
  "signature": "0x4a9b...71c2"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "globalRole": "DONOR",
    "activeRole": "NGO_ADMIN",
    "activeNgoId": "ngo-1",
    "activeNgoName": "CleanWater India Initiative",
    "permissions": ["donations:create", "ngo:members:manage", "..."],
    "user": {
      "id": "usr-ngoadmin",
      "email": "director@cleanwater.org",
      "walletAddress": "0x7a3B19D412bF249f7b189Ec24A00518774f2E"
    },
    "memberships": [
      { "ngoId": "ngo-1", "ngoName": "CleanWater India Initiative", "role": "NGO_ADMIN" }
    ]
  }
}
```

### B. Donor Email/Password Registration & Lifecycle
#### `POST /auth/signup`
* **Description**: Registers a new donor account with email, password, terms/privacy acceptance, and optional initial wallet link.
* **Body**:
```json
{
  "email": "priya.sharma@gmail.com",
  "password": "TestPass123!",
  "displayName": "Priya Sharma",
  "acceptedTerms": true,
  "acceptedPrivacy": true,
  "walletAddress": "0x8B2D198AcfE92B1047192801F524Ab902C511F90",
  "message": "<SIWE Message>",
  "signature": "<Signature>"
}
```
* **Response (201 Created)**: Returns created user profile and verification token.
* **Errors**: `400 Bad Request` (weak password, missing terms), `409 Conflict` (email or wallet already registered).

#### `POST /auth/login`
* **Description**: Constant-time memory-hard scrypt verification with 5-attempt brute-force lockout.
* **Body**: `{ "email": "director@cleanwater.org", "password": "TestPass123!" }`
* **Response (200 OK)**: Authenticated session payload + sets HttpOnly cookie.
* **Errors**: `401 Unauthorized` (generic "Invalid email or password"), `429 Too Many Requests` (account locked for 15 min).

#### `POST /auth/verify-email`
* **Body**: `{ "token": "<email_verification_token>" }`
* **Response (200 OK)**: `{ "success": true, "message": "Email address successfully verified." }`

#### `POST /auth/forgot-password`
* **Body**: `{ "email": "donor@example.com" }`
* **Response (200 OK)**: Generic confirmation message preventing account enumeration.

#### `POST /auth/reset-password`
* **Body**: `{ "token": "<single_use_token>", "newPassword": "FreshPassword456!" }`
* **Response (200 OK)**: Password updated and all previous sessions across all devices revoked.

#### `POST /auth/link-wallet`
* **Headers**: `Authorization: Bearer <token>`
* **Description**: Cryptographically binds an Ethereum wallet to an existing account via signed proof-of-possession.
* **Body**: `{ "walletAddress": "0x...", "message": "...", "signature": "0x..." }`
* **Errors**: `400 Bad Request` (invalid signature), `409 Conflict` (wallet already associated with another account).

#### `POST /auth/switch-org`
* **Headers**: `Authorization: Bearer <token>`
* **Description**: Switches active organization context and recomputes effective roles and permissions.
* **Body**: `{ "targetNgoId": "ngo-2" }` (or `{ "targetNgoId": null }` for donor view).
* **Response (200 OK)**: Fresh session JWT with new `activeNgoId` and `activeRole`.

#### `GET /auth/me` / `GET /auth/session`
* **Headers**: `Authorization: Bearer <token>` or session cookie.
* **Response (200 OK)**: Current authenticated profile, permissions, active NGO, and all memberships.

#### `GET /auth/memberships`
* **Response (200 OK)**: Array of all active organization memberships held by the user.

#### `GET /auth/permissions`
* **Response (200 OK)**: Effective permissions granted in the current organization scope.

#### `POST /auth/logout`
* **Description**: Blacklists the token hash, clears session cookie, and increments `token_version`.

---

## 3. NGO Onboarding & Lifecycle Endpoints

#### `POST /onboarding/register` (alias `/onboarding/apply`)
* **Description**: Submits organization verification application with document checklist (80G, FCRA, PAN, bank proof).
* **Body**:
```json
{
  "legalName": "CleanWater India Foundation",
  "registrationNumber": "REG-IN-2024-8891",
  "category": "Clean Water & Sanitation",
  "contactEmail": "contact@cleanwaterindia.org",
  "applicantWallet": "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
  "panNumber": "AAATC1234F",
  "registeredAddress": "104 Riverfront Road, New Delhi",
  "establishedYear": 2018,
  "documents": {
    "reg_certificate": { "cid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
    "tax_80g": { "cid": "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R" },
    "bank_proof": { "cid": "QmbWqxBEKC3P8tTXBSFL1ZZBodj125JYf4txJS4UCE2ndC" },
    "pan_card": { "cid": "QmPK1s3pNYLi9ERiq3BDxKa4XosgW4fcTX6xVDwk1M43Pq" }
  }
}
```
* **Response (201 Created)**: Application record with initial status `SUBMITTED`.

#### `GET /onboarding/status/:id` (alias `/onboarding/applications/:id`)
* **Description**: Retrieves application review status, review notes, and verification track statuses.

#### `POST /onboarding/:id/resubmit`
* **Description**: Rectifies documents and resubmits a previously rejected application.
* **Body**: `{ "documents": { ... }, "updatedDetails": { ... } }`

#### `POST /onboarding/:id/reactivate`
* **Description**: Requests reactivation for a suspended organization with formal justification.
* **Body**: `{ "reason": "Audit finding remediated and board resolution attached." }`

#### `POST /onboarding/invitations/accept`
* **Description**: Single-use token acceptance binding recipient wallet to organization role.
* **Body**: `{ "inviteToken": "inv_...", "walletAddress": "0x..." }`

---

## 4. Platform Administration Endpoints

#### `GET /admin/applications` / `GET /admin/onboarding/queue`
* **Required Permission**: `ngo:onboarding:review`
* **Description**: Lists pending NGO onboarding applications awaiting review.

#### `POST /admin/onboarding/:id/decision` (alias `/admin/applications/:id/review`)
* **Required Permission**: `ngo:onboarding:review`
* **Enforces Conflict of Interest**: Applicant wallet cannot review or approve their own application (`403 Forbidden`).
* **Body**:
```json
{
  "decision": "APPROVED",
  "verificationTracks": {
    "legalRegVerified": true,
    "bankVerified": true,
    "tax80gVerified": true,
    "fcraVerified": false
  },
  "internalNote": "Registry and bank records verified successfully."
}
```

#### `POST /admin/ngos/:id/suspend`
* **Required Permission**: `ngo:suspend:reactivate`
* **Description**: Freezes an NGO and revokes all active sessions for its members via token versioning.
* **Body**: `{ "reason": "Treasury balance discrepancy under investigation" }`

#### `POST /admin/ngos/:id/reactivate`
* **Required Permission**: `ngo:suspend:reactivate`
* **Description**: Restores suspended NGO to `ACTIVE` status.

#### `GET /admin/audit-logs`
* **Required Permission**: `platform:audit_logs:view`
* **Description**: Returns immutable security event audit trail.

---

## 5. Team & Member Administration Endpoints

#### `GET /ngos/:id/members`
* **Required Permission**: Authenticated NGO Member.
* **Description**: Returns list of active team members, wallets, and roles.

#### `POST /ngos/:id/invitations`
* **Required Permission**: `ngo:members:manage`
* **Body**: `{ "email": "finance@org.org", "role": "FINANCE_OFFICER" }`
* **Description**: Issues 7-day single-use invitation token.

#### `PATCH /ngos/:id/members/:userId`
* **Required Permission**: `ngo:members:manage`
* **Body**: `{ "role": "PROJECT_MANAGER" }`
* **Description**: Updates member role and increments user's `token_version` to refresh active permissions.

#### `DELETE /ngos/:id/members/:userId`
* **Required Permission**: `ngo:members:manage`
* **Description**: Revokes member and immediately invalidates active user sessions via token versioning.

---

## 6. Donations, Transparency & Verification Endpoints

#### `GET /health` & `GET /config`
* Service status, chain parameters (`chainId: 80002`), supported tokens (`POL`, `USDC`, `USDT`), and contract addresses.

#### `POST /donations/prepare`
* **Body**: `{ "ngoId": "ngo-1", "tokenSymbol": "USDC", "amount": "100.00", "donorAddress": "0x..." }`
* **Response**: Calldata, destination address, and gas estimate.

#### `POST /donations/record`
* **Body**: `{ "txHash": "0x...", "ngoId": "ngo-1" }`
* **Description**: Indexes confirmed transaction and issues tax receipt.

#### `GET /donations` (Filters: `token`, `ngoId`, `page`, `limit`)
#### `GET /transactions/:txHash` (Full cryptographic transparency pipeline verification)
#### `GET /reports` & `POST /reports` (Verified impact reports with IPFS CIDs)

---

## 7. Governance, Reconciliation & Audits

#### `GET /ngos/:id/policy` & `PUT /ngos/:id/policy` (`policies:manage`)
* Governance spending thresholds and required approval counts.

#### `POST /ngos/:id/proposals` (`disbursements:propose`)
* Submits disbursement proposal with immutable SHA-256 payload hash.

#### `POST /governance/proposals/:id/review` (`disbursements:approve`)
* **Enforces Separation of Duties**: Proposer cannot approve their own proposal (`403 Forbidden`).

#### `POST /governance/proposals/:id/execute` (`disbursements:execute`)
* Records on-chain disbursement execution and updates treasury balances idempotently.

#### `GET /ngos/:id/ledger` & `GET /ngos/:id/accounting-balance`
* Append-only ledger and integer-safe BigInt treasury balances.

#### `POST /ngos/:id/reconcile` (`reconciliation:run`)
* Compares on-chain authoritative balance against internal ledger; flags discrepancies.

#### `GET /risk/alerts` & `POST /risk/alerts/:id/resolve` (`risk:alerts:manage`)
* Anomaly and fraud risk monitoring and resolution.

#### `GET /audits/engagements`, `POST /audits/engagements/:id/evidence-requests`, `POST /audits/engagements/:id/findings`, `POST /audits/engagements/:id/publish`
* End-to-end independent auditor compliance pipeline.
