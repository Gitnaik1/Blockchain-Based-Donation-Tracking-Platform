# TrustDonate NGO Onboarding & Lifecycle Specification

This document details the complete NGO verification and lifecycle workflow on the TrustDonate platform, including regulatory document requirements, independent verification tracks, conflict-of-interest safeguards, suspension, and reactivation.

---

## 1. Onboarding State Machine

An NGO application progresses through well-defined lifecycle states:

```
[ DRAFT ] ────────► [ SUBMITTED ] ────────► [ UNDER_REVIEW ]
                          │                       │
                          ▼                       ▼
                     [ REJECTED ]            [ APPROVED ]
                          │                       │
                          ▼                       ▼
                     [ RESUBMIT ]           [ SUSPENDED ]
                                                  │
                                                  ▼
                                       [ REACTIVATION_REQUESTED ]
                                                  │
                                                  ▼
                                            [ APPROVED ]
```

### Lifecycle State Definitions
- **`DRAFT`**: Registration initiated by applicant; documents are being uploaded or edited.
- **`SUBMITTED`**: All mandatory documents and organization details provided; pending administrative assignment.
- **`UNDER_REVIEW`**: Assigned to an independent Platform Super Admin; verification checks actively in progress.
- **`APPROVED`**: All verification tracks confirmed; NGO organization record created; applicant promoted to `NGO_ADMIN`.
- **`REJECTED`**: Application failed verification; formal rejection reason logged; applicant permitted to rectify and resubmit.
- **`SUSPENDED`**: Organization temporarily frozen by Platform Super Admin due to risk alerts, compliance failures, or fraud investigation. Active member sessions immediately revoked.
- **`REACTIVATION_REQUESTED`**: Formal justification submitted by applicant seeking lifting of suspension.

---

## 2. Document Checklist & Requirements

Every NGO applying for verified status on TrustDonate must supply IPFS CIDs for four required legal documents:

| Document Key | Document Name | Regulatory Standard | Description |
| :--- | :--- | :--- | :--- |
| `reg_certificate` | **Registration Certificate** | Trust Act / Societies Registration Act / Section 8 | Official certificate of incorporation or legal formation in the jurisdiction. |
| `pan_card` | **Entity PAN Card** | Income Tax Department | Permanent Account Number card issued in the legal entity's registered name. |
| `tax_80g` | **80G / 12A Tax Exemption** | Income Tax Act Section 80G | Authorizes issuance of tax-deductible donation receipts to Indian donors. |
| `bank_proof` | **Bank Account Proof** | RBI Banking Guidelines | Cancelled cheque or official bank statement showing account title matching legal name. |
| `fcra_certificate` | *(Optional)* **FCRA Registration** | Foreign Contribution Regulation Act | Mandatory for NGOs accepting cross-border foreign currency donations. |

### Document Submission Schema
```json
{
  "legalName": "CleanWater India Foundation",
  "registrationNumber": "REG-IN-2024-8891",
  "category": "Clean Water & Sanitation",
  "contactEmail": "contact@cleanwaterindia.org",
  "applicantWallet": "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
  "panNumber": "AAATC1234F",
  "registeredAddress": "104 Riverfront Road, New Delhi 110001",
  "establishedYear": 2018,
  "representative": {
    "name": "Dr. Rajesh Verma",
    "designation": "Executive Director",
    "email": "r.verma@cleanwaterindia.org",
    "phone": "+91-9876543210"
  },
  "documents": {
    "reg_certificate": {
      "cid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      "fileName": "trust_registration.pdf"
    },
    "tax_80g": {
      "cid": "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R",
      "fileName": "80g_approval_2024.pdf"
    },
    "bank_proof": {
      "cid": "QmbWqxBEKC3P8tTXBSFL1ZZBodj125JYf4txJS4UCE2ndC",
      "fileName": "cancelled_cheque.pdf"
    },
    "pan_card": {
      "cid": "QmPK1s3pNYLi9ERiq3BDxKa4XosgW4fcTX6xVDwk1M43Pq",
      "fileName": "entity_pan.pdf"
    }
  }
}
```

---

## 3. Independent Verification Tracks

Verification decisions record granular verification checks across four distinct dimensions in the database:
1. `legal_reg_verified` (Boolean): Legal existence confirmed with regulatory registry.
2. `bank_verified` (Boolean): Bank account title verified against legal registration.
3. `tax_80g_verified` (Boolean): 80G tax exemption validity confirmed with tax authorities.
4. `fcra_verified` (Boolean): FCRA status checked for foreign contributions.

---

## 4. Conflict-of-Interest Safeguards

To prevent self-approval and compromised compliance:
- **Server Enforcement**: When reviewing an application via `POST /api/v1/admin/onboarding/:id/decision`, the server checks:
  ```javascript
  if (reviewerWallet.toLowerCase() === application.applicant_wallet.toLowerCase()) {
    throw new ForbiddenError("Conflict of Interest: You cannot review an application you submitted.");
  }
  ```
- Any attempt by an applicant to review their own application results in an immediate **`403 Forbidden`** and logs a `CONFLICT_OF_INTEREST_ATTEMPT` audit event.

---

## 5. Resubmission Workflow

When an application is rejected:
1. The Platform Super Admin records explicit rejection reasons in `rejection_reason`.
2. The applicant queries `GET /api/v1/onboarding/status/:id` to inspect the feedback.
3. The applicant rectifies invalid documents or details and submits:
   `POST /api/v1/onboarding/:id/resubmit`
4. The application state returns to `SUBMITTED`, increments `resubmission_count`, and triggers a fresh review cycle.

---

## 6. Suspension and Reactivation

### Suspension
- Triggered by Platform Super Admin via `POST /api/v1/admin/ngos/:id/suspend`.
- Marks the organization as `SUSPENDED` and application as `SUSPENDED`.
- Increments the `token_version` for all NGO members, instantly terminating active sessions and preventing further financial disbursements.

### Reactivation
- Applicant submits justification via `POST /api/v1/onboarding/:id/reactivate`.
- Status updates to `REACTIVATION_REQUESTED`.
- Super Admin reviews corrective measures and restores status to `ACTIVE` via `POST /api/v1/admin/ngos/:id/reactivate`.

---

## 7. Member Invitations & Role Delegation

Once an NGO is active:
1. **NGO Admin** issues invitations via `POST /api/v1/ngos/:id/invitations` specifying role (`NGO_ADMIN`, `FINANCE_OFFICER`, `PROJECT_MANAGER`).
2. An unpredictable 32-byte single-use token (`inv_...`) is generated with a strict **7-day expiration**.
3. Recipient accepts via `POST /api/v1/onboarding/invitations/accept` with their cryptographic wallet address.
4. The invitation is marked `ACCEPTED` and can never be reused.
5. Removing a member via `DELETE /api/v1/ngos/:id/members/:userId` increments that user's `token_version`, immediately revoking all active sessions across all devices.
