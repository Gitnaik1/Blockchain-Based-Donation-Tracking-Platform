const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware.cjs");
const { requirePermission } = require("../middleware/rbacMiddleware.cjs");
const { PERMISSIONS } = require("../rbac/permissions.cjs");
const riskService = require("../services/riskService.cjs");

router.use(requireAuth);

/**
 * GET /api/v1/risk/alerts
 * Lists fraud, velocity, and anomaly detection alerts.
 */
router.get("/alerts", requirePermission(PERMISSIONS.RISK_ALERTS_MANAGE), (req, res) => {
  const { ngoId, status, severity } = req.query;
  const alerts = riskService.listAlerts({ ngoId, status, severity });

  res.json({
    success: true,
    data: alerts,
  });
});

/**
 * POST /api/v1/risk/alerts/:id/resolve
 * Resolves or dismisses an alert with explainable notes and audit logging.
 */
router.post("/alerts/:id/resolve", requirePermission(PERMISSIONS.RISK_ALERTS_MANAGE), (req, res, next) => {
  try {
    const { status, resolutionNotes } = req.body;
    const resolved = riskService.resolveAlert({
      alertId: req.params.id,
      reviewerId: req.user.userId,
      reviewerAddress: req.user.address,
      status,
      resolutionNotes,
    });

    res.json({
      success: true,
      data: {
        ...resolved,
        evidence: JSON.parse(resolved.evidence_json || "{}"),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
