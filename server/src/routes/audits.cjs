const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");
const { requireAuth } = require("../middleware/authMiddleware.cjs");
const { requirePermission } = require("../middleware/rbacMiddleware.cjs");
const { PERMISSIONS } = require("../rbac/permissions.cjs");
const complianceService = require("../services/complianceService.cjs");

router.use(requireAuth);

/**
 * GET /api/v1/audits/engagements
 */
router.get("/engagements", (req, res) => {
  const ngoId = req.query.ngoId;
  let query = "SELECT e.*, n.name AS ngo_name FROM audit_engagements e JOIN ngos n ON e.ngo_id = n.id";
  const params = [];
  if (ngoId) {
    query += " WHERE e.ngo_id = ?";
    params.push(ngoId);
  }
  query += " ORDER BY e.created_at DESC";

  const engagements = db.prepare(query).all(...params);
  res.json({
    success: true,
    data: engagements,
  });
});

/**
 * POST /api/v1/audits/engagements
 */
router.post("/engagements", requirePermission(PERMISSIONS.AUDIT_ENGAGEMENTS_VIEW), (req, res, next) => {
  try {
    const { ngoId, projectId, auditorName, scope, startDate, endDate } = req.body;
    const engagement = complianceService.createEngagement({
      ngoId,
      projectId,
      auditorId: req.user.userId,
      auditorName: auditorName || req.user.displayName,
      scope,
      startDate,
      endDate,
    });

    res.status(201).json({
      success: true,
      data: engagement,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/audits/engagements/:id
 */
router.get("/engagements/:id", (req, res) => {
  const details = complianceService.getEngagementDetails(req.params.id);
  if (!details) {
    return res.status(404).json({
      success: false,
      error: { code: "ENGAGEMENT_NOT_FOUND", message: `Engagement '${req.params.id}' not found.` },
    });
  }

  res.json({
    success: true,
    data: details,
  });
});

/**
 * POST /api/v1/audits/engagements/:id/evidence-requests
 */
router.post("/engagements/:id/evidence-requests", requirePermission(PERMISSIONS.AUDIT_EVIDENCE_REQUEST), (req, res, next) => {
  try {
    const { title, description, dueDate } = req.body;
    const request = complianceService.requestEvidence({
      engagementId: req.params.id,
      requestedBy: req.user.userId,
      title,
      description,
      dueDate,
    });

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/audits/evidence-requests/:id/submit
 */
router.post("/evidence-requests/:id/submit", requirePermission(PERMISSIONS.EVIDENCE_SUBMIT), (req, res, next) => {
  try {
    const { submissionCid, submissionNotes } = req.body;
    const updated = complianceService.submitEvidence({
      requestId: req.params.id,
      submissionCid,
      submissionNotes,
      actorAddress: req.user.address,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/audits/engagements/:id/findings
 */
router.post("/engagements/:id/findings", requirePermission(PERMISSIONS.AUDIT_FINDINGS_LOG), (req, res, next) => {
  try {
    const { severity, title, description, recommendation } = req.body;
    const finding = complianceService.logFinding({
      engagementId: req.params.id,
      auditorId: req.user.userId,
      severity,
      title,
      description,
      recommendation,
    });

    res.status(201).json({
      success: true,
      data: finding,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/audits/findings/:id/respond
 */
router.post("/findings/:id/respond", (req, res, next) => {
  try {
    const { managementResponse, status } = req.body;
    const updated = complianceService.respondToFinding({
      findingId: req.params.id,
      managementResponse,
      status,
      actorAddress: req.user.address,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/audits/engagements/:id/publish
 */
router.post("/engagements/:id/publish", requirePermission(PERMISSIONS.AUDIT_REPORT_SIGN), (req, res, next) => {
  try {
    const { ngoId, title, summary, ipfsCid, auditorSignature } = req.body;
    const report = complianceService.publishReport({
      engagementId: req.params.id,
      ngoId,
      title,
      summary,
      ipfsCid,
      auditorSignature,
      actorAddress: req.user.address,
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
