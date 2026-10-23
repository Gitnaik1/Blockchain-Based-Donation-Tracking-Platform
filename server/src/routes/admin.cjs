const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");
const { requireAuth } = require("../middleware/authMiddleware.cjs");
const { requirePermission } = require("../middleware/rbacMiddleware.cjs");
const { PERMISSIONS } = require("../rbac/permissions.cjs");
const onboardingService = require("../services/onboardingService.cjs");

router.use(requireAuth);

/**
 * GET /api/v1/admin/audit-logs
 * Retrieves security and platform audit trail.
 */
router.get("/audit-logs", requirePermission(PERMISSIONS.PLATFORM_AUDIT_VIEW), (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const logs = db.prepare(`SELECT * FROM security_audit_logs ORDER BY created_at DESC LIMIT ?`).all(limit);

  res.json({
    success: true,
    data: logs.map((l) => ({
      ...l,
      details: JSON.parse(l.details_json || "{}"),
    })),
  });
});

/**
 * GET /api/v1/admin/applications & /onboarding/queue
 * Lists onboarding applications for Platform Super Admin review.
 */
const handleListApplications = (req, res) => {
  const status = req.query.status;
  let query = "SELECT * FROM ngo_applications";
  const params = [];
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY created_at DESC";

  const applications = db.prepare(query).all(...params);
  res.json({
    success: true,
    data: applications.map((a) => {
      let docs = {};
      try { docs = JSON.parse(a.documents_json || "{}"); } catch {}
      return {
        ...a,
        documents: docs,
        verificationTracks: {
          legalRegVerified: Boolean(a.legal_reg_verified),
          bankVerified: Boolean(a.bank_verified),
          tax80gVerified: Boolean(a.tax_80g_verified),
          fcraVerified: Boolean(a.fcra_verified),
        },
      };
    }),
  });
};

router.get("/applications", requirePermission(PERMISSIONS.NGO_ONBOARDING_REVIEW), handleListApplications);
router.get("/onboarding/queue", requirePermission(PERMISSIONS.NGO_ONBOARDING_REVIEW), handleListApplications);

/**
 * POST /api/v1/admin/applications/:id/review & /onboarding/:id/decision
 * Decides an onboarding application (APPROVED, REJECTED, UNDER_REVIEW).
 */
const handleReviewApplication = (req, res, next) => {
  try {
    const { decision, rejectionReason, internalNote, verificationTracks } = req.body;
    const reviewed = onboardingService.reviewApplication({
      applicationId: req.params.id,
      reviewerId: req.user.userId,
      reviewerWallet: req.user.address,
      decision,
      rejectionReason,
      internalNote,
      verificationTracks,
    });

    let docs = {};
    try { docs = JSON.parse(reviewed.documents_json || "{}"); } catch {}

    res.json({
      success: true,
      data: {
        ...reviewed,
        documents: docs,
        verificationTracks: {
          legalRegVerified: Boolean(reviewed.legal_reg_verified),
          bankVerified: Boolean(reviewed.bank_verified),
          tax80gVerified: Boolean(reviewed.tax_80g_verified),
          fcraVerified: Boolean(reviewed.fcra_verified),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

router.post("/applications/:id/review", requirePermission(PERMISSIONS.NGO_ONBOARDING_REVIEW), handleReviewApplication);
router.post("/applications/:id/decision", requirePermission(PERMISSIONS.NGO_ONBOARDING_REVIEW), handleReviewApplication);
router.post("/onboarding/:id/decision", requirePermission(PERMISSIONS.NGO_ONBOARDING_REVIEW), handleReviewApplication);

/**
 * POST /api/v1/admin/ngos/:id/suspend
 */
router.post("/ngos/:id/suspend", requirePermission(PERMISSIONS.NGO_SUSPEND_REACTIVATE), (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = onboardingService.suspendNgo({
      ngoId: req.params.id,
      reviewerId: req.user.userId,
      reviewerWallet: req.user.address,
      reason,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/ngos/:id/reactivate
 */
router.post("/ngos/:id/reactivate", requirePermission(PERMISSIONS.NGO_SUSPEND_REACTIVATE), (req, res, next) => {
  try {
    db.prepare("UPDATE ngos SET status = 'ACTIVE' WHERE id = ?").run(req.params.id);
    db.prepare("UPDATE ngo_applications SET status = 'APPROVED' WHERE ngo_id = ?").run(req.params.id);
    res.json({ success: true, message: `NGO '${req.params.id}' reactivated.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
