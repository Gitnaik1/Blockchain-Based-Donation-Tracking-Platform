const db = require("../db/database.cjs");

/**
 * Structured Security & Administrative Audit Logger
 * Logs security-relevant actions to the database without leaking sensitive credentials,
 * private keys, or donor PII.
 */
function logSecurityEvent({
  actorAddress,
  action,
  resourceType,
  resourceId = null,
  ngoId = null,
  status = "SUCCESS",
  ipAddress = null,
  details = {},
}) {
  try {
    // Sanitize details: strip sensitive fields
    const sanitizedDetails = { ...details };
    const forbiddenKeys = ["password", "secret", "privateKey", "token", "signature", "donor_email"];
    for (const key of Object.keys(sanitizedDetails)) {
      if (forbiddenKeys.some((fk) => key.toLowerCase().includes(fk.toLowerCase()))) {
        sanitizedDetails[key] = "[REDACTED]";
      }
    }

    db.prepare(`
      INSERT INTO security_audit_logs (actor_address, action, resource_type, resource_id, ngo_id, status, ip_address, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      actorAddress || "SYSTEM",
      action,
      resourceType,
      resourceId,
      ngoId,
      status,
      ipAddress,
      JSON.stringify(sanitizedDetails)
    );
  } catch (err) {
    console.error("[AuditLogger] Failed to write security audit log:", err.message);
  }
}

module.exports = {
  logSecurityEvent,
};
