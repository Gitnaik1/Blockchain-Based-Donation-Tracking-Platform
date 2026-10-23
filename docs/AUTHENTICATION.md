# TrustDonate Authentication, RBAC & Session Security Specification

This document provides a comprehensive technical overview of the TrustDonate authentication, session management, and authorization subsystems.

---

## 1. Dual-Track Authentication Architecture

TrustDonate supports two unified authentication mechanisms that yield equivalent authenticated sessions:

1. **Sign-In with Ethereum (SIWE / EIP-4361)**: Non-custodial, cryptographic proof-of-possession of an EVM wallet.
2. **Email & Password Authentication**: Standard donor credentials protected with modern memory-hard password hashing and rate-limited brute-force mitigation.

Both tracks resolve into an authenticated session represented as:
- A signed **JWT** returned in the response payload (for mobile clients, test suites, or SPA storage).
- An **HttpOnly, SameSite, Secure cookie** named `trustdonate_session` issued automatically to protect web clients against Cross-Site Scripting (XSS) token exfiltration.

---

## 2. Cryptographic Wallet Authentication (SIWE)

TrustDonate implements the **EIP-4361** standard for Ethereum account sign-in.

### Challenge Request Flow
1. **Initiation**: The client requests a challenge by sending `POST /api/v1/auth/challenge` with the donor/operator wallet address.
2. **Nonce Generation**: The server generates a cryptographically random 16-byte hex nonce via `crypto.randomBytes(16).toString("hex")`.
3. **Binding**: The challenge is strictly bound to:
   - **Domain**: `process.env.APP_DOMAIN` (default: `trustdonate.org`)
   - **URI**: `process.env.APP_URI` (default: `https://trustdonate.org`)
   - **Chain ID**: `80002` (Polygon Amoy Testnet)
   - **Address**: Checksummed Ethereum wallet address
   - **Issued At**: Current ISO 8601 timestamp
   - **Expiration**: 5 minutes (`300,000 ms`) from issuance
4. **Persistence & Replay Prevention**: The challenge is stored in SQLite table `auth_challenges` with status `ISSUED`. Challenges can only be consumed once.

### Verification Flow
1. The client signs the full SIWE message using `personal_sign` via MetaMask or a Web3 wallet provider.
2. The client submits `POST /api/v1/auth/verify` with `{ message, signature }`.
3. The server:
   - Reconstructs and parses the challenge parameters from the message.
   - Verifies the address matches the expected challenge.
   - Verifies the challenge has not expired.
   - Verifies the challenge has not already been used (`status === 'ISSUED'`).
   - Executes cryptographic signature recovery (`ethers.verifyMessage(message, signature)`).
   - Marks the challenge as `USED` in the database immediately, rejecting any replay attempt.
   - Auto-provisions or retrieves the user record in SQLite `users`.
   - Issues a session token with role and permission payload.

---

## 3. Email & Password Security

### Password Hashing Policy
TrustDonate uses Node.js native `crypto.scryptSync` with memory-hard parameters conforming to RFC 7914 / OWASP guidelines:
- **Algorithm**: `scrypt`
- **Cost parameter (N)**: `16384` ($2^{14}$)
- **Block size (r)**: `8`
- **Parallelization (p)**: `1`
- **Key length**: `64 bytes` (`512 bits`)
- **Salt**: 16 cryptographically secure random bytes generated per user (`crypto.randomBytes(16).toString("hex")`)
- **Comparison**: Verified using `crypto.timingSafeEqual` over fixed-length 64-byte digest buffers.

### Password Complexity Rules
The system enforces client and server-side complexity:
- Minimum length: **8 characters**
- At least one uppercase letter (`[A-Z]`)
- At least one lowercase letter (`[a-z]`)
- At least one numeric digit (`[0-9]`)

### Timing Side-Channel Protection
To prevent attacker enumeration of registered email addresses via response time variance:
- If a user lookup returns no matching record during `POST /api/v1/auth/login`, the server executes a dummy `crypto.scryptSync` computation with identical parameters before throwing a generic `"Invalid email or password."` error.
- Response latencies for existing and non-existing accounts remain statistically indistinguishable.

### Brute-Force Rate Limiting & Account Lockout
- Failed login attempts increment `failed_login_attempts` on the user record.
- Upon **5 consecutive failed attempts**, the account is locked for **15 minutes** (`locked_until = Date.now() + 15 * 60 * 1000`).
- While locked, all login attempts are rejected with a generic lockout message.
- A successful login resets `failed_login_attempts` to `0` and clears `locked_until`.

---

## 4. Password Reset & Verification Token Architecture

### Token Generation and Storage
1. Password reset tokens are generated using `crypto.randomBytes(32).toString("hex")` (256-bit entropy).
2. Plaintext tokens are **never** stored in the database.
3. The database stores the **SHA-256 hash** of the token (`password_reset_token_hash`), along with an expiration timestamp (`password_reset_expires_at = now + 1 hour`).
4. When a reset request is submitted:
   - The supplied token is hashed with SHA-256 and looked up in the database.
   - If found and not expired, the user's password is updated with a fresh salt and scrypt hash.
   - `password_reset_token_hash` and `password_reset_expires_at` are cleared to null immediately, preventing replay attacks.
   - The user's `token_version` is incremented to terminate all existing sessions across all devices.

---

## 5. Cryptographic Wallet Linking

Users who register via email and password can optionally link an Ethereum wallet to their account:
1. The user requests a challenge for their wallet address.
2. The user signs the challenge using `personal_sign`.
3. The user submits `POST /api/v1/auth/link-wallet` with `{ walletAddress, message, signature }`.
4. The server:
   - Recovers the signer address from the signature.
   - Rejects the request if the recovered address does not match `walletAddress`.
   - Verifies whether the wallet is already linked to another user account. If so, rejects with `409 Conflict`.
   - Binds the wallet to `users.wallet_address` and records `wallet_linked_at = CURRENT_TIMESTAMP`.

---

## 6. Multi-Organization Switching & Dynamic RBAC

TrustDonate supports users who are members of multiple NGOs or hold global administrative roles.

### Organization Context Switching (`POST /api/v1/auth/switch-org`)
- **Body**: `{ "targetNgoId": "ngo-1" }` (or `null` to return to personal donor view).
- **Validation**: Verifies that the user holds an `ACTIVE` membership in the specified organization.
- **Role Elevation**: Sets `activeRole` to the role held within that NGO (`NGO_ADMIN`, `FINANCE_OFFICER`, etc.), and dynamically recomputes the active permission set.
- **Session Issuance**: Returns a fresh session JWT reflecting the new active role and organization scope.

---

## 7. Session Invalidation & Token Revocation

### Instantaneous Token Versioning
Every user record includes a `token_version` counter (integer).
- Each issued JWT contains `tokenVersion: user.token_version`.
- On every authenticated API request, `authenticateToken` middleware compares the JWT `tokenVersion` against the live value in the database.
- **Immediate Revocation Triggers**:
  - User logs out via `POST /api/v1/auth/logout`.
  - User changes or resets their password.
  - User's membership in an NGO is revoked or role updated.
  - NGO is suspended by Platform Super Admin.
- When `token_version` is incremented, all previously issued tokens for that user become invalid across all devices within **0 milliseconds**.

### Revoked Token Blacklist
When `POST /api/v1/auth/logout` is called:
- The token's SHA-256 hash is inserted into SQLite table `revoked_tokens` with its expiration time.
- The `trustdonate_session` HttpOnly cookie is cleared with an expired cookie header.
- The user's `token_version` is incremented.

---

## 8. CSRF Defense for Cookie Sessions
- Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) authenticated via cookie require the `X-Requested-With: XMLHttpRequest` header or a valid `Origin` header matching `CORS_ORIGIN`.
- Cross-origin form submissions without custom headers are rejected by the API middleware before any state change occurs.
