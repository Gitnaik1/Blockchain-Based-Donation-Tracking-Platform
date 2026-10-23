# Pre-Seeded Development & Test Users Catalog

This document lists all seeded user accounts available in the local database (`server/data/trustdonate.db`). All seeded accounts have their default password initialized to `TestPass123!`.

---

## 1. Seed Accounts Overview

| User ID | Email | Wallet Address | Global Role | Active NGO | Default Password | Primary Function |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `usr-superadmin` | `admin@trustdonate.org` | `0x51E2aC9005934571A3793f0bB75A1F7096e1304B` | `PLATFORM_SUPER_ADMIN` | None (Platform-wide) | `TestPass123!` | System-wide admin, audit review, NGO onboarding decisions, emergency freeze |
| `usr-ngoadmin` | `director@cleanwater.org` | `0x7a3B19D412bF249f7b189Ec24A00518774f2E` | `DONOR` | `ngo-1` (CleanWater) | `TestPass123!` | CleanWater India NGO Administrator, member invites, spending policy updates |
| `usr-finance` | `finance@cleanwater.org` | `0x98bA41f532822C05b22b7245b04cE508e68407B1` | `DONOR` | `ngo-1` (CleanWater) | `TestPass123!` | Finance Officer, approves disbursements, runs treasury reconciliation, adjusts ledger |
| `usr-pm` | `projects@cleanwater.org` | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `DONOR` | `ngo-1` (CleanWater) | `TestPass123!` | Project Manager, proposes project disbursements, tracks project milestones |
| `usr-auditor` | `auditor@kpmg-trust.io` | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4df` | `INDEPENDENT_AUDITOR` | None (Independent) | `TestPass123!` | Independent Auditor, requests compliance evidence, logs findings, publishes audit reports |
| `usr-donor` | `priya.sharma@gmail.com` | `0x8B2D198AcfE92B1047192801F524Ab902C511F90` | `DONOR` | None (Personal) | `TestPass123!` | Verified Donor, makes crypto donations, downloads 80G tax receipts, tracks project impact |
| `usr-viewer` | `public.viewer@observer.org` | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `VIEWER` | None (Public) | `TestPass123!` | Read-Only Viewer, inspects public ledger, checks transparency proofs, reads reports |

---

## 2. Seeded NGO Organizations

| NGO ID | Organization Name | Verified Address | Category | Status | 80G Tax ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ngo-1` | CleanWater India Initiative | `0x7a3B19D412bF249f7b189Ec24A00518774f2E` | Clean Water & Sanitation | `ACTIVE` | `AAATC1234F20231` |
| `ngo-2` | Rural Education Foundation | `0x2546BcD3c84621e976D8185a91A922aE77ECEc30` | Education & Literacy | `ACTIVE` | `AABTR5678G20224` |
| `ngo-3` | Solar Village Canopy | `0xbDA5747bFD65F08deb54cb465eB87D40e51B197E` | Renewable Energy & Climate | `ACTIVE` | `AACCS9012H20242` |

---

## 3. Seeded Organization Memberships

| Membership ID | NGO ID | User ID | Role | Status |
| :--- | :--- | :--- | :--- | :--- |
| `mem-1` | `ngo-1` | `usr-ngoadmin` | `NGO_ADMIN` | `ACTIVE` |
| `mem-2` | `ngo-1` | `usr-finance` | `FINANCE_OFFICER` | `ACTIVE` |
| `mem-3` | `ngo-1` | `usr-pm` | `PROJECT_MANAGER` | `ACTIVE` |
| `mem-4` | `ngo-2` | `usr-ngoadmin` | `NGO_ADMIN` | `ACTIVE` (Multi-org test) |

---

## 4. Test Sign-in Instructions

### Testing Email/Password Login
```bash
curl -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@cleanwater.org",
    "password": "TestPass123!"
  }'
```

### Testing Wallet Authentication (SIWE)
1. Request a challenge:
```bash
curl -X POST http://localhost:5001/api/v1/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{ "address": "0x51E2aC9005934571A3793f0bB75A1F7096e1304B" }'
```
2. Sign the returned `message` using your wallet's private key.
3. Submit the signature to `POST /api/v1/auth/verify`:
```bash
curl -X POST http://localhost:5001/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{ "message": "<SIWE Message>", "signature": "<Signature>" }'
```

### Testing Organization Switching
```bash
curl -X POST http://localhost:5001/api/v1/auth/switch-org \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "targetNgoId": "ngo-2" }'
```
