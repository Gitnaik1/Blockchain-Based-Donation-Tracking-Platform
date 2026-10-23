# TrustDonate Phase 2 — Advanced Frontend, Role-Based Portals & Product Experience Audit

## 1. Executive Summary & Audit Baseline

- **Date**: October 2026
- **Current Stack**: React 18.3.1, Vite 6.0.7, Tailwind CSS 3.4.17, Lucide React, Canvas Confetti.
- **Test Baseline**: 41 unit and end-to-end tests passing under Node's native test runner (`node --test tests/*.test.js`).
- **Production Build Status**: Passing cleanly (`npm run build` generates 387 kB bundle in 1.3s).

---

## 2. Existing Functionality vs Phase 2 Requirements

| Area | Current Implementation | Phase 2 Required Expansion |
| :--- | :--- | :--- |
| **Authentication & Identity** | Basic EIP-4361 challenge-response for single NGO wallet. Single static role (`Admin` / `NGO_OPERATOR`). | Comprehensive multi-role session support (7 distinct roles: Super Admin, NGO Admin, Finance Officer, Project Manager, Auditor, Donor, Viewer). Organization switcher supporting multi-org memberships with clean state teardown. |
| **Platform Administration** | None (public + single NGO portal). | **Platform Super Admin Console**: Global operational KPIs, NGO onboarding review queue, verification status, user directory, system health monitor, risk alert queue. |
| **Team Management** | Static signers list in settings. | **NGO Administration & Team Workspace**: Org profile, member directory, invitation lifecycle (Invited, Active, Expired, Suspended, Revoked), project assignments, signer thresholds. |
| **Treasury & Finance** | Simplified fund allocation screen with INR/ETH conversions. | **Finance Officer Treasury Workspace**: Strict distinctions between on-chain token balances, accounting balances, proposed vs approved vs executed disbursements, spending limits, reconciliation discrepancies. |
| **Approval & Multisig Governance** | Basic modal with simulated progress. | **Centralized Approval Center**: Threshold tracking (3-of-5), pending approval queues, material change detection, distinction between application approval and cryptographic multisig execution. |
| **Project Management** | Basic project cards with milestone status tags. | **Project Manager Workspace**: Full milestone lifecycle, funding requests, progress updates, verifiable evidence uploads with IPFS hashing, beneficiary metrics tracking. |
| **Independent Audit** | Static list of reports with test fixture labels. | **Auditor Portal**: Dedicated read-only audit workspace, evidence checklists, disbursement inspection, findings & severity tracking, corrective actions, report publication status. |
| **Donor Experience** | Anonymous or public donation flow with receipt download. | **Donor Account & Engagement Center**: Personal donation ledger, receipt repository, impact timeline, cause subscriptions, transparent recurring donation model explanations. |
| **Notifications & Risk Alerts** | Basic notification bell with red dot. | **Unified Notification Center & Risk Monitor**: Role-filtered notifications, unread badges, risk alert queue (severity, detection triggers, review status: Acknowledge/Investigate/Resolve/Dismiss). |
| **Analytics & Transparency** | KPI cards on dashboard. | **Advanced Analytics Dashboard**: Multi-period cashflow, token breakdown, donor retention trends, milestone completion, exportable reports. |
| **Global Search & Activity** | Tab-level table filters. | **Global Search Engine & Activity History**: Unified search across NGOs, projects, tx hashes, reports, and audit events with permission boundary enforcement. |

---

## 3. The 7 Role Specifications & Permission Matrix

```
┌────────────────────────┬─────────────┬───────────┬───────────┬───────────┬───────────┬───────────┬───────────┐
│ Permission / Feature   │ Super Admin │ NGO Admin │ Finance   │ PM        │ Auditor   │ Donor     │ Viewer    │
├────────────────────────┼─────────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│ View Public Portal     │ ✓           │ ✓         │ ✓         │ ✓         │ ✓         │ ✓         │ ✓         │
│ Platform Admin Console │ ✓           │ ✗         │ ✗         │ ✗         │ ✗         │ ✗         │ ✗         │
│ NGO Onboarding / KYC   │ ✓           │ ✗         │ ✗         │ ✗         │ ✗         │ ✗         │ ✗         │
│ Manage Team & Roles    │ ✗           │ ✓         │ ✗         │ ✗         │ ✗         │ ✗         │ ✗         │
│ Propose Disbursements  │ ✗           │ ✓         │ ✓         │ ✗         │ ✗         │ ✗         │ ✗         │
│ Multi-Sig Sign / Exec  │ ✗           │ ✓         │ ✓         │ ✗         │ ✗         │ ✗         │ ✗         │
│ Submit Project Request │ ✗           │ ✗         │ ✗         │ ✓         │ ✗         │ ✗         │ ✗         │
│ Upload Milestone Proof │ ✗           │ ✗         │ ✗         │ ✓         │ ✗         │ ✗         │ ✗         │
│ Perform Audit & Review │ ✗           │ ✗         │ ✗         │ ✗         │ ✓         │ ✗         │ ✗         │
│ Personal History & 80G │ ✗           │ ✗         │ ✗         │ ✗         │ ✗         │ ✓         │ ✗         │
│ View Risk Alerts       │ ✓           │ ✓         │ ✓         │ ✗         │ ✓         │ ✗         │ ✗         │
│ Export Authorized Data │ ✓           │ ✓         │ ✓         │ ✓         │ ✓         │ Self Only │ ✗         │
└────────────────────────┴─────────────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

---

## 4. Architectural Strategy & Safety Boundaries

1. **Client-Side Role Checks Are For Usability Only**:
   - Backend APIs must enforce cryptographic verification for every sensitive mutation.
   - The UI displays explicit reasoning when actions are restricted (`disabled` with tooltip or role badge).
2. **Organization Context & State Isolation**:
   - Switching active organization clears active proposals, draft allocations, and scoped notifications to prevent cross-tenant data leakage.
3. **No Unexplained Exchange Rates**:
   - Distinguish cryptocurrency native balances (`POL`, `USDC`, `USDT`) from estimated INR values.
4. **Preservation of Existing Functionality**:
   - The existing public landing page, donation modal, Polygon Amoy connection, and ledger reactivity remain fully functional.
