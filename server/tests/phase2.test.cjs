const { expect } = require("chai");
const http = require("http");
const crypto = require("crypto");
const { callApp } = require("./testHelper.cjs");
const app = require("../src/app.cjs");
const db = require("../src/db/database.cjs");
const authService = require("../src/services/authService.cjs");
const governanceService = require("../src/services/governanceService.cjs");
const reconciliationService = require("../src/services/reconciliationService.cjs");
const riskService = require("../src/services/riskService.cjs");
const queueService = require("../src/services/queueService.cjs");

describe("TrustDonate Phase 2 — Advanced RBAC, Governance, Risk & Audits", function () {
  let server;
  let baseUrl;

  let superAdminToken;
  let ngo1AdminToken;
  let ngo1FinanceToken;
  let ngo1PmToken;
  let ngo2AdminToken;
  let auditorToken;
  let donorToken;

  function createTestToken(userId, wallet, globalRole, activeRole, ngoId, permissions, tokenVersion = 1) {
    const payload = {
      userId,
      address: wallet,
      globalRole,
      activeRole,
      activeNgoId: ngoId,
      role: ["NGO_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER"].includes(activeRole) ? "NGO_OPERATOR" : (globalRole === "PLATFORM_SUPER_ADMIN" ? "PLATFORM_ADMIN" : "AUTHORIZED_DONOR"),
      ngoId,
      permissions,
      tokenVersion,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto.createHmac("sha256", "trustdonate_dev_secret_key_2026_xyz").update(b64).digest("base64url");
    return `${b64}.${sig}`;
  }

  before(function () {
    process.env.NODE_ENV = "test";

    // Clean up residual test artifacts from previous runs
    db.prepare("UPDATE users SET token_version = 1").run();
    db.prepare("DELETE FROM treasury_ledger WHERE adjustment_reason LIKE '%Resolution of bank fee%'").run();
    db.prepare("DELETE FROM reconciliation_reports").run();
    db.prepare("DELETE FROM risk_alerts").run();

    const { getPermissionsForRoles } = require("../src/rbac/permissions.cjs");

    superAdminToken = createTestToken(
      "usr-superadmin",
      "0x51E2aC9005934571A3793f0bB75A1F7096e1304B",
      "PLATFORM_SUPER_ADMIN",
      "PLATFORM_SUPER_ADMIN",
      null,
      getPermissionsForRoles(["PLATFORM_SUPER_ADMIN"])
    );

    ngo1AdminToken = createTestToken(
      "usr-ngo1-admin",
      "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
      "DONOR",
      "NGO_ADMIN",
      "ngo-1",
      getPermissionsForRoles(["DONOR", "NGO_ADMIN"])
    );

    ngo1FinanceToken = createTestToken(
      "usr-ngo1-finance",
      "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
      "DONOR",
      "FINANCE_OFFICER",
      "ngo-1",
      getPermissionsForRoles(["DONOR", "FINANCE_OFFICER"])
    );

    ngo1PmToken = createTestToken(
      "usr-ngo1-pm",
      "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
      "DONOR",
      "PROJECT_MANAGER",
      "ngo-1",
      getPermissionsForRoles(["DONOR", "PROJECT_MANAGER"])
    );

    ngo2AdminToken = createTestToken(
      "usr-ngo2-admin",
      "0x2bE48f5C8eB2d8c32A91D65b7A48E4424A3521b7",
      "DONOR",
      "NGO_ADMIN",
      "ngo-2",
      getPermissionsForRoles(["DONOR", "NGO_ADMIN"])
    );

    auditorToken = createTestToken(
      "usr-auditor",
      "0x19a0EFA23F2718E27ffB906560Bfc30Dfe7D0A24",
      "INDEPENDENT_AUDITOR",
      "INDEPENDENT_AUDITOR",
      null,
      getPermissionsForRoles(["INDEPENDENT_AUDITOR"])
    );

    donorToken = createTestToken(
      "usr-donor-1",
      "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
      "DONOR",
      "DONOR",
      null,
      getPermissionsForRoles(["DONOR"])
    );
  });

  after(function () {
    // Teardown
  });

  async function apiGet(path, token = null) {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return callApp(app, { method: "GET", url: path, headers });
  }

  async function apiPost(path, body, token = null) {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return callApp(app, { method: "POST", url: path, headers, body });
  }

  async function apiPut(path, body, token = null) {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return callApp(app, { method: "PUT", url: path, headers, body });
  }

  describe("1. Enterprise RBAC & Data Isolation", function () {
    it("allows Platform Super Admin to view global audit logs", async function () {
      const res = await apiGet("/api/v1/admin/audit-logs", superAdminToken);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.be.an("array");
    });

    it("rejects non-admin from accessing platform audit logs (deny-by-default)", async function () {
      const res = await apiGet("/api/v1/admin/audit-logs", donorToken);
      expect(res.status).to.equal(403);
      expect(res.body.error.code).to.equal("PERMISSION_DENIED");
    });

    it("blocks IDOR cross-organization access (NGO 1 member cannot access NGO 2 policy)", async function () {
      const res = await apiGet("/api/v1/ngos/ngo-2/policy", ngo1AdminToken);
      expect(res.status).to.equal(403);
      expect(res.body.error.code).to.equal("ORGANIZATION_MISMATCH");
    });

    it("allows NGO 1 admin to access their own NGO policy", async function () {
      const res = await apiGet("/api/v1/ngos/ngo-1/policy", ngo1AdminToken);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.ngo_id).to.equal("ngo-1");
    });

    it("enforces session invalidation when token version increments", async function () {
      const resBefore = await apiGet("/api/v1/auth/me", donorToken);
      expect(resBefore.status).to.equal(200);

      // Invalidate sessions for usr-donor-1
      authService.revokeUserSessions("usr-donor-1");

      const resAfter = await apiGet("/api/v1/auth/me", donorToken);
      expect(resAfter.status).to.equal(401);
      expect(resAfter.body.error.code).to.equal("INVALID_TOKEN");
    });
  });

  describe("2. NGO Onboarding Lifecycle & Member Administration", function () {
    const testRegNo = `REG-TEST-${Date.now()}`;
    const testApplicantWallet = "0x" + crypto.randomBytes(20).toString("hex");
    const testApplicantUserId = `usr-app-${Date.now()}`;
    let testAppId;
    let testInviteToken;

    it("submits application with document checklist", async function () {
      db.prepare(`
        INSERT INTO users (id, wallet_address, display_name, global_role, token_version)
        VALUES (?, ?, 'Applicant User', 'PLATFORM_SUPER_ADMIN', 1)
      `).run(testApplicantUserId, testApplicantWallet);

      const res = await apiPost("/api/v1/onboarding/apply", {
        legalName: "Solar Canopy Alliance",
        registrationNumber: testRegNo,
        category: "Environment",
        contactEmail: "contact@solarcanopy.org",
        applicantWallet: testApplicantWallet,
        documents: {
          reg_certificate: { cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", fileName: "reg.pdf" },
          tax_80g: { cid: "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R", fileName: "tax.pdf" },
          bank_proof: { cid: "QmbWqxBEKC3P8tTXBSFL1ZZBodj125JYf4txJS4UCE2ndC", fileName: "cheque.pdf" },
          pan_card: { cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", fileName: "pan.pdf" },
        },
      });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body.data.status).to.equal("SUBMITTED");
      testAppId = res.body.data.id;
    });

    it("rejects duplicate registration number submission", async function () {
      const res = await apiPost("/api/v1/onboarding/apply", {
        legalName: "Duplicate Org",
        registrationNumber: testRegNo,
        contactEmail: "dup@example.com",
        applicantWallet: "0x1111111111111111111111111111111111111111",
        documents: {
          reg_certificate: { cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
          tax_80g: { cid: "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R" },
          bank_proof: { cid: "QmbWqxBEKC3P8tTXBSFL1ZZBodj125JYf4txJS4UCE2ndC" },
          pan_card: { cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
        },
      });
      expect(res.status).to.equal(500);
      expect(res.body.error.message).to.include("currently under active review");
    });

    it("enforces conflict-of-interest check: applicant cannot approve own application", async function () {
      const applicantToken = createTestToken(
        testApplicantUserId,
        testApplicantWallet,
        "PLATFORM_SUPER_ADMIN",
        "PLATFORM_SUPER_ADMIN",
        null,
        ["ngo:onboarding:review"]
      );

      const res = await apiPost(`/api/v1/admin/applications/${testAppId}/review`, { decision: "APPROVED" }, applicantToken);
      expect(res.status).to.equal(403);
      expect(res.body.error.message).to.include("Conflict of Interest");
    });

    it("allows independent Platform Super Admin to approve application", async function () {
      const res = await apiPost(`/api/v1/admin/applications/${testAppId}/review`, {
        decision: "APPROVED",
        internalNote: "All 80G and PAN documents verified against registry.",
      }, superAdminToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal("APPROVED");
      expect(res.body.data.ngo_id).to.be.ok;
    });

    it("creates member invitation with single-use token", async function () {
      const res = await apiPost("/api/v1/ngos/ngo-1/invitations", {
        email: "newfinance@greencanopy.org",
        role: "FINANCE_OFFICER",
      }, ngo1AdminToken);

      expect(res.status).to.equal(201);
      expect(res.body.data.inviteToken).to.be.a("string");
      testInviteToken = res.body.data.inviteToken;
    });

    it("accepts single-use invitation and binds wallet", async function () {
      const inviteeWallet = "0x91F5B612E0987c320dE51A186B1095d315682C89";
      const res = await apiPost("/api/v1/onboarding/invitations/accept", {
        inviteToken: testInviteToken,
        walletAddress: inviteeWallet,
      });

      expect(res.status).to.equal(200);
      expect(res.body.data.ngoId).to.equal("ngo-1");
      expect(res.body.data.role).to.equal("FINANCE_OFFICER");

      // Second attempt must fail (single-use guard)
      const resSecond = await apiPost("/api/v1/onboarding/invitations/accept", {
        inviteToken: testInviteToken,
        walletAddress: inviteeWallet,
      });
      expect(resSecond.status).to.equal(500);
      expect(resSecond.body.error.message).to.include("already accepted");
    });
  });

  describe("3. Governance Policies & Financial Controls", function () {
    let proposalId;

    it("submits disbursement proposal with immutable payload hash", async function () {
      const res = await apiPost("/api/v1/ngos/ngo-1/proposals", {
        projectId: "proj-1",
        title: "Borewell Drilling Contractor Advance",
        tokenSymbol: "POL",
        tokenAddress: "0x0000000000000000000000000000000000000000",
        amountRaw: "100000000000000000000",
        amountFormatted: "100 POL",
        inrEquivalent: 10000,
        recipientWallet: "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
      }, ngo1AdminToken);

      expect(res.status).to.equal(201);
      expect(res.body.data.status).to.equal("PENDING_APPROVAL");
      expect(res.body.data.payload_hash).to.be.a("string");
      proposalId = res.body.data.id;
    });

    it("enforces separation of duties: proposer cannot review their own proposal", async function () {
      const res = await apiPost(`/api/v1/governance/proposals/${proposalId}/review`, {
        decision: "APPROVED",
        reason: "Self-approval attempt",
      }, ngo1AdminToken);

      expect(res.status).to.equal(500);
      expect(res.body.error.message).to.include("Separation of Duties Violation");
    });

    it("allows independent Finance Officer to review and approve proposal", async function () {
      const res = await apiPost(`/api/v1/governance/proposals/${proposalId}/review`, {
        decision: "APPROVED",
        reason: "Invoices verified against engineering quote.",
      }, ngo1FinanceToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.approvals).to.have.lengthOf(1);
    });

    it("executes approved proposal idempotently and records debit", async function () {
      db.prepare("UPDATE disbursement_proposals SET status = 'APPROVED' WHERE id = ?").run(proposalId);

      const fakeTxHash = "0x" + crypto.randomBytes(32).toString("hex");
      const res = await apiPost(`/api/v1/governance/proposals/${proposalId}/execute`, {
        txHash: fakeTxHash,
      }, ngo1FinanceToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal("EXECUTED");
      expect(res.body.data.executed_tx_hash).to.equal(fakeTxHash);

      // Attempt to execute again must fail (idempotency guard)
      const resDuplicate = await apiPost(`/api/v1/governance/proposals/${proposalId}/execute`, {
        txHash: fakeTxHash,
      }, ngo1FinanceToken);

      expect(resDuplicate.status).to.equal(500);
      expect(resDuplicate.body.error.message).to.include("Idempotency Safeguard");
    });
  });

  describe("4. Treasury Accounting & Reconciliation", function () {
    it("computes accurate internal accounting balance from append-only ledger", async function () {
      const res = await apiGet("/api/v1/ngos/ngo-3/accounting-balance?token=POL", superAdminToken);
      expect(res.status).to.equal(200);
      expect(res.body.data.balanceRaw).to.equal("250000000000000000000");
    });

    it("reconciles matching on-chain balance without discrepancy", async function () {
      const res = await apiPost("/api/v1/ngos/ngo-3/reconcile", {
        tokenSymbol: "POL",
        onChainBalanceRaw: "250000000000000000000",
        notes: "Routine daily audit",
      }, superAdminToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal("RECONCILED");
      expect(res.body.data.discrepancyRaw).to.equal("0");
    });

    it("detects discrepancy when on-chain balance deviates and creates risk alert", async function () {
      const res = await apiPost("/api/v1/ngos/ngo-3/reconcile", {
        tokenSymbol: "POL",
        onChainBalanceRaw: "240000000000000000000",
        notes: "Unexpected variance check",
      }, superAdminToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal("DISCREPANCY_DETECTED");
      expect(res.body.data.discrepancyRaw).to.equal("-10000000000000000000");

      const alerts = riskService.listAlerts({ ngoId: "ngo-3", status: "NEW" });
      expect(alerts.some((a) => a.rule_code === "BALANCE_DISCREPANCY")).to.be.true;
    });

    it("records manual adjustment with explicit justification and actor", async function () {
      const res = await apiPost("/api/v1/ngos/ngo-3/ledger/adjust", {
        tokenSymbol: "POL",
        amountRaw: "10000000000000000000",
        inrEquivalent: 1000,
        reason: "Resolution of bank fee adjustment #8921",
      }, superAdminToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.success).to.be.true;
    });
  });

  describe("5. Fraud & Risk Anomaly Detection", function () {
    it("generates risk alert on high-value disbursement", async function () {
      const alerts = riskService.evaluateDisbursementRisk({
        ngoId: "ngo-1",
        projectId: "proj-1",
        recipientWallet: "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
        inrEquivalent: 600000,
        proposerAddress: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
      });

      expect(alerts).to.have.lengthOf.at.least(1);
      expect(alerts[0].rule_code).to.equal("LARGE_DISBURSEMENT");
      expect(alerts[0].severity).to.equal("CRITICAL");
    });

    it("allows authorized admin to resolve risk alert with notes", async function () {
      const newAlert = riskService.createAlert({
        ngoId: "ngo-1",
        ruleCode: "LARGE_DISBURSEMENT",
        severity: "HIGH",
        title: "Large payment review",
        description: "Payment review required.",
      });

      const res = await apiPost(`/api/v1/risk/alerts/${newAlert.id}/resolve`, {
        status: "RESOLVED",
        resolutionNotes: "Verified with board meeting resolution minutes #2026-05.",
      }, superAdminToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal("RESOLVED");
    });
  });

  describe("6. Auditor & Compliance Workflows", function () {
    let engagementId;
    let evidenceRequestId;
    let findingId;

    it("creates an independent audit engagement", async function () {
      const res = await apiPost("/api/v1/audits/engagements", {
        ngoId: "ngo-1",
        projectId: "proj-1",
        scope: "Q2 2026 Procurement & Vendor Payment Audit",
        startDate: "2026-06-01",
      }, auditorToken);

      expect(res.status).to.equal(201);
      expect(res.body.data.status).to.equal("ACTIVE");
      engagementId = res.body.data.id;
    });

    it("requests compliance evidence with due date", async function () {
      const res = await apiPost(`/api/v1/audits/engagements/${engagementId}/evidence-requests`, {
        title: "Submersible Solar Pump Procurement Invoices",
        description: "Provide tax invoices with vendor GST/PAN numbers.",
        dueDate: "2026-06-15",
      }, auditorToken);

      expect(res.status).to.equal(201);
      expect(res.body.data.status).to.equal("PENDING");
      evidenceRequestId = res.body.data.id;
    });

    it("submits verified IPFS evidence in response", async function () {
      const res = await apiPost(`/api/v1/audits/evidence-requests/${evidenceRequestId}/submit`, {
        submissionCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        submissionNotes: "Invoices verified and countersigned by field engineer.",
      }, ngo1PmToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal("SUBMITTED");
      expect(res.body.data.submission_cid).to.equal("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
    });

    it("logs audit finding with severity rating", async function () {
      const res = await apiPost(`/api/v1/audits/engagements/${engagementId}/findings`, {
        severity: "MEDIUM",
        title: "Vendor Quotation Comparison Incomplete",
        description: "Only two comparative quotations were archived instead of three.",
        recommendation: "Update procurement SOP to mandate three competitive bids.",
      }, auditorToken);

      expect(res.status).to.equal(201);
      expect(res.body.data.severity).to.equal("MEDIUM");
      findingId = res.body.data.id;
    });

    it("records NGO management response to audit finding", async function () {
      const res = await apiPost(`/api/v1/audits/findings/${findingId}/respond`, {
        managementResponse: "Acknowledged. Procurement policy revised to require 3 sealed bids.",
        status: "RESOLVED",
      }, ngo1AdminToken);

      expect(res.status).to.equal(200);
      expect(res.body.data.status).to.equal("RESOLVED");
    });

    it("publishes versioned, cryptographically hashed audit report", async function () {
      const res = await apiPost(`/api/v1/audits/engagements/${engagementId}/publish`, {
        ngoId: "ngo-1",
        title: "Clean Water Initiative Phase 1 Assurance Report",
        summary: "Satisfactory assurance with all major milestones verified on-chain.",
        ipfsCid: "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R",
        auditorSignature: "0x" + crypto.randomBytes(65).toString("hex"),
      }, auditorToken);

      expect(res.status).to.equal(201);
      expect(res.body.data.version).to.equal(1);
      expect(res.body.data.sha256_hash).to.be.a("string");
      expect(res.body.data.status).to.equal("PUBLISHED");
    });
  });

  describe("7. Notifications & Background Job Runner", function () {
    it("manages notification preferences and inbox", async function () {
      const resPref = await apiPut("/api/v1/notifications/preferences", {
        emailEnabled: true,
        email: "director@greencanopy.org",
      }, ngo1AdminToken);

      expect(resPref.status).to.equal(200);
      expect(resPref.body.data.email_enabled).to.equal(1);

      const resList = await apiGet("/api/v1/notifications", ngo1AdminToken);
      expect(resList.status).to.equal(200);
      expect(resList.body.data).to.be.an("array");
    });

    it("enqueues and processes background jobs with deduplication", async function () {
      let executed = false;
      queueService.registerWorker("email_notifications", async (payload) => {
        executed = true;
      });

      const dedupKey = `test-dedup-${Date.now()}`;
      const job1 = queueService.enqueueJob({
        queueName: "email_notifications",
        payload: { to: "user@example.com" },
        dedupKey,
      });

      const job2 = queueService.enqueueJob({
        queueName: "email_notifications",
        payload: { to: "user@example.com" },
        dedupKey,
      });

      expect(job1.id).to.equal(job2.id);

      const outcome = await queueService.processNextJob();
      expect(outcome.status).to.equal("COMPLETED");
      expect(executed).to.be.true;
    });
  });
});
