const db = require("../db/database.cjs");
const { logSecurityEvent } = require("../utils/auditLogger.cjs");

class RiskService {
  /**
   * Analyzes an incoming disbursement proposal for financial and operational anomalies.
   */
  evaluateDisbursementRisk({ ngoId, projectId, recipientWallet, inrEquivalent, proposerAddress }) {
    const alertsTriggered = [];

    // 1. Large Disbursement Anomaly
    if (inrEquivalent >= 200000) {
      alertsTriggered.push(
        this.createAlert({
          ngoId,
          ruleCode: "LARGE_DISBURSEMENT",
          severity: inrEquivalent >= 500000 ? "CRITICAL" : "HIGH",
          title: "High Value Disbursement Proposal",
          description: `Disbursement proposal of ₹${inrEquivalent.toLocaleString()} exceeds conservative monitoring threshold.`,
          evidence: { inrEquivalent, proposerAddress, recipientWallet },
        })
      );
    }

    // 2. Velocity Check: Rapid successive disbursement proposals within 15 minutes
    const recentCount = db.prepare(`
      SELECT COUNT(*) AS count FROM disbursement_proposals
      WHERE ngo_id = ? AND datetime(created_at) >= datetime('now', '-15 minutes')
    `).get(ngoId).count;

    if (recentCount >= 2) {
      alertsTriggered.push(
        this.createAlert({
          ngoId,
          ruleCode: "VELOCITY_LIMIT",
          severity: "MEDIUM",
          title: "High Frequency Disbursement Activity",
          description: `NGO has initiated ${recentCount + 1} disbursement proposals within a 15-minute window.`,
          evidence: { recentCount: recentCount + 1, ngoId },
        })
      );
    }

    // 3. Destination Change Check: Compare recipient with project's established wallet
    if (projectId) {
      const project = db.prepare("SELECT wallet FROM projects WHERE id = ?").get(projectId);
      if (project && project.wallet && recipientWallet.toLowerCase() !== project.wallet.toLowerCase()) {
        alertsTriggered.push(
          this.createAlert({
            ngoId,
            ruleCode: "DESTINATION_CHANGED",
            severity: "HIGH",
            title: "Disbursement Recipient Deviates from Project Wallet",
            description: `Recipient ${recipientWallet} does not match project's primary designated recipient (${project.wallet}).`,
            evidence: { proposedRecipient: recipientWallet, projectWallet: project.wallet },
          })
        );
      }
    }

    return alertsTriggered;
  }

  /**
   * Checks for duplicate transaction recording attempt.
   */
  checkDuplicateTx(txHash) {
    const existing = db.prepare("SELECT * FROM donations WHERE LOWER(tx_hash) = LOWER(?)").get(txHash);
    if (existing) {
      this.createAlert({
        ngoId: existing.ngo_id,
        ruleCode: "DUPLICATE_TX",
        severity: "CRITICAL",
        title: "Duplicate Transaction Submission Attempt",
        description: `Transaction hash ${txHash} has already been indexed on-chain.`,
        evidence: { txHash, existingDonationId: existing.id },
      });
      return true;
    }
    return false;
  }

  /**
   * Records a structured risk alert into the database.
   */
  createAlert({ ngoId = null, ruleCode, severity = "MEDIUM", title, description, evidence = {} }) {
    const alertId = `risk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    db.prepare(`
      INSERT INTO risk_alerts (id, ngo_id, rule_code, severity, title, description, evidence_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW')
    `).run(
      alertId,
      ngoId,
      ruleCode,
      severity,
      title,
      description,
      JSON.stringify(evidence)
    );

    return db.prepare("SELECT * FROM risk_alerts WHERE id = ?").get(alertId);
  }

  /**
   * Updates risk alert status (e.g. resolve as true positive or dismiss as false positive).
   */
  resolveAlert({ alertId, reviewerId, reviewerAddress, status, resolutionNotes }) {
    const validStatuses = ["UNDER_REVIEW", "RESOLVED", "FALSE_POSITIVE"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status '${status}'. Must be one of: [${validStatuses.join(", ")}]`);
    }

    const alert = db.prepare("SELECT * FROM risk_alerts WHERE id = ?").get(alertId);
    if (!alert) {
      throw new Error(`Risk alert '${alertId}' not found.`);
    }

    db.prepare(`
      UPDATE risk_alerts
      SET status = ?, assigned_to = ?, resolution_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, reviewerId, resolutionNotes || "", alertId);

    logSecurityEvent({
      actorAddress: reviewerAddress || reviewerId,
      action: `RISK_ALERT_${status}`,
      resourceType: "RISK_ALERT",
      resourceId: alertId,
      ngoId: alert.ngo_id,
      status: "SUCCESS",
      details: { ruleCode: alert.rule_code, resolutionNotes },
    });

    return db.prepare("SELECT * FROM risk_alerts WHERE id = ?").get(alertId);
  }

  listAlerts({ ngoId = null, status = null, severity = null }) {
    let query = "SELECT * FROM risk_alerts WHERE 1=1";
    const params = [];

    if (ngoId) {
      query += " AND ngo_id = ?";
      params.push(ngoId);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (severity) {
      query += " AND severity = ?";
      params.push(severity);
    }

    query += " ORDER BY created_at DESC";
    const alerts = db.prepare(query).all(...params);
    return alerts.map((a) => ({
      ...a,
      evidence: JSON.parse(a.evidence_json || "{}"),
    }));
  }
}

module.exports = new RiskService();
