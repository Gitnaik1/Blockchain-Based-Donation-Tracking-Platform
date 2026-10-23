const crypto = require("crypto");
const db = require("../db/database.cjs");
const { logSecurityEvent } = require("../utils/auditLogger.cjs");
const ipfsService = require("./ipfsService.cjs");

class ComplianceService {
  /**
   * Creates a formal independent audit engagement.
   */
  createEngagement({ ngoId, projectId = null, auditorId, auditorName, scope, startDate, endDate = null }) {
    if (!ngoId || !auditorId || !scope) {
      throw new Error("Missing required engagement parameters (ngoId, auditorId, scope).");
    }

    const engagementId = `eng-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    db.prepare(`
      INSERT INTO audit_engagements (id, ngo_id, project_id, auditor_id, auditor_name, scope, status, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(
      engagementId,
      ngoId,
      projectId,
      auditorId,
      auditorName || "Independent Impact Auditor",
      scope,
      startDate || new Date().toISOString().split("T")[0],
      endDate
    );

    return db.prepare("SELECT * FROM audit_engagements WHERE id = ?").get(engagementId);
  }

  /**
   * Auditor requests specific documentation/evidence from the NGO.
   */
  requestEvidence({ engagementId, requestedBy, title, description, dueDate }) {
    if (!title || !description || !dueDate) {
      throw new Error("Evidence request requires title, description, and due date.");
    }

    const requestId = `ev-req-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    db.prepare(`
      INSERT INTO audit_evidence_requests (id, engagement_id, requested_by, title, description, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `).run(requestId, engagementId, requestedBy, title, description, dueDate);

    return db.prepare("SELECT * FROM audit_evidence_requests WHERE id = ?").get(requestId);
  }

  /**
   * NGO submits verified IPFS evidence in response to auditor's request.
   */
  submitEvidence({ requestId, submissionCid, submissionNotes, actorAddress }) {
    const request = db.prepare("SELECT * FROM audit_evidence_requests WHERE id = ?").get(requestId);
    if (!request) {
      throw new Error(`Evidence request '${requestId}' not found.`);
    }

    // Verify CID format (Qm... or baf...)
    const isCidFormat = submissionCid && typeof submissionCid === "string" && (submissionCid.startsWith("Qm") || submissionCid.startsWith("baf"));
    if (!isCidFormat) {
      throw new Error("Invalid IPFS CID provided for evidence submission.");
    }

    db.prepare(`
      UPDATE audit_evidence_requests
      SET status = 'SUBMITTED', submission_cid = ?, submission_notes = ?
      WHERE id = ?
    `).run(submissionCid, submissionNotes, requestId);

    logSecurityEvent({
      actorAddress,
      action: "AUDIT_EVIDENCE_SUBMITTED",
      resourceType: "AUDIT_EVIDENCE",
      resourceId: requestId,
      status: "SUCCESS",
      details: { submissionCid },
    });

    return db.prepare("SELECT * FROM audit_evidence_requests WHERE id = ?").get(requestId);
  }

  /**
   * Auditor logs a formal compliance or financial finding with severity.
   */
  logFinding({ engagementId, auditorId, severity = "MEDIUM", title, description, recommendation }) {
    const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (!validSeverities.includes(severity)) {
      throw new Error(`Invalid severity '${severity}'. Must be one of: [${validSeverities.join(", ")}]`);
    }

    const findingId = `find-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    db.prepare(`
      INSERT INTO audit_findings (id, engagement_id, auditor_id, severity, title, description, recommendation, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN')
    `).run(findingId, engagementId, auditorId, severity, title, description, recommendation);

    return db.prepare("SELECT * FROM audit_findings WHERE id = ?").get(findingId);
  }

  /**
   * NGO management provides an official response and corrective action plan.
   */
  respondToFinding({ findingId, managementResponse, status = "RESOLVED", actorAddress }) {
    db.prepare(`
      UPDATE audit_findings
      SET management_response = ?, status = ?
      WHERE id = ?
    `).run(managementResponse, status, findingId);

    logSecurityEvent({
      actorAddress,
      action: "AUDIT_FINDING_RESPONDED",
      resourceType: "AUDIT_FINDING",
      resourceId: findingId,
      status: "SUCCESS",
      details: { status },
    });

    return db.prepare("SELECT * FROM audit_findings WHERE id = ?").get(findingId);
  }

  /**
   * Publishes a versioned, cryptographically hashed audit report pinned to IPFS.
   */
  publishReport({ engagementId, ngoId, title, summary, ipfsCid, auditorSignature = null, actorAddress }) {
    const highestVer = db.prepare(`
      SELECT MAX(version) AS max_ver FROM audit_reports_v2 WHERE engagement_id = ?
    `).get(engagementId).max_ver || 0;

    const newVersion = highestVer + 1;
    const sha256Hash = crypto.createHash("sha256").update(`${title}:${summary}:${ipfsCid}:${newVersion}`).digest("hex");
    const reportId = `rep-v2-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    db.prepare(`
      INSERT INTO audit_reports_v2 (
        id, engagement_id, ngo_id, version, title, summary, ipfs_cid,
        sha256_hash, auditor_signature, status, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', CURRENT_TIMESTAMP)
    `).run(
      reportId,
      engagementId,
      ngoId,
      newVersion,
      title,
      summary,
      ipfsCid,
      sha256Hash,
      auditorSignature
    );

    logSecurityEvent({
      actorAddress,
      action: "AUDIT_REPORT_PUBLISHED",
      resourceType: "AUDIT_REPORT",
      resourceId: reportId,
      ngoId,
      status: "SUCCESS",
      details: { version: newVersion, ipfsCid, sha256Hash },
    });

    return db.prepare("SELECT * FROM audit_reports_v2 WHERE id = ?").get(reportId);
  }

  getEngagementDetails(engagementId) {
    const engagement = db.prepare("SELECT * FROM audit_engagements WHERE id = ?").get(engagementId);
    if (!engagement) return null;

    const evidenceRequests = db.prepare("SELECT * FROM audit_evidence_requests WHERE engagement_id = ?").all(engagementId);
    const findings = db.prepare("SELECT * FROM audit_findings WHERE engagement_id = ?").all(engagementId);
    const reports = db.prepare("SELECT * FROM audit_reports_v2 WHERE engagement_id = ? ORDER BY version DESC").all(engagementId);

    return {
      ...engagement,
      evidenceRequests,
      findings,
      reports,
    };
  }
}

module.exports = new ComplianceService();
