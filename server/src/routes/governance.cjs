const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware.cjs");
const { requireNgoScope, requirePermission } = require("../middleware/rbacMiddleware.cjs");
const { PERMISSIONS } = require("../rbac/permissions.cjs");
const governanceService = require("../services/governanceService.cjs");
const riskService = require("../services/riskService.cjs");
const notificationService = require("../services/notificationService.cjs");

router.use(requireAuth);

/**
 * GET /api/v1/ngos/:id/policy
 */
router.get("/ngos/:id/policy", requireNgoScope("id"), (req, res) => {
  const policy = governanceService.getPolicy(req.params.id);
  res.json({
    success: true,
    data: policy,
  });
});

/**
 * PUT /api/v1/ngos/:id/policy
 */
router.put("/ngos/:id/policy", requireNgoScope("id"), requirePermission(PERMISSIONS.POLICIES_MANAGE), (req, res, next) => {
  try {
    const updated = governanceService.updatePolicy(req.params.id, {
      ...req.body,
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
 * GET /api/v1/ngos/:id/proposals
 */
router.get("/ngos/:id/proposals", requireNgoScope("id"), (req, res) => {
  const proposals = governanceService.listProposals(req.params.id);
  res.json({
    success: true,
    data: proposals,
  });
});

/**
 * POST /api/v1/ngos/:id/proposals
 */
router.post("/ngos/:id/proposals", requireNgoScope("id"), requirePermission(PERMISSIONS.DISBURSEMENTS_PROPOSE), (req, res, next) => {
  try {
    const { projectId, milestoneId, title, tokenSymbol, tokenAddress, amountRaw, amountFormatted, inrEquivalent, recipientWallet } = req.body;
    
    // Evaluate operational & transaction fraud risk
    const alerts = riskService.evaluateDisbursementRisk({
      ngoId: req.params.id,
      projectId,
      recipientWallet,
      inrEquivalent,
      proposerAddress: req.user.address,
    });

    const proposal = governanceService.proposeDisbursement({
      ngoId: req.params.id,
      projectId,
      milestoneId,
      title,
      tokenSymbol,
      tokenAddress,
      amountRaw,
      amountFormatted,
      inrEquivalent,
      recipientWallet,
      proposerId: req.user.userId,
      proposerAddress: req.user.address,
    });

    // Notify organization approvers
    notificationService.notifyNgoMembers({
      ngoId: req.params.id,
      targetRole: "FINANCE_OFFICER",
      type: "DISBURSEMENT_PENDING",
      title: "New Disbursement Pending Approval",
      message: `Proposal '${title}' for ₹${inrEquivalent.toLocaleString()} requires your governance review.`,
      severity: "INFO",
    });

    res.status(201).json({
      success: true,
      data: proposal,
      riskAlertsCount: alerts.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/governance/proposals/:id/review
 * Enforces separation of duties (proposer cannot review/approve own proposal).
 */
router.post("/governance/proposals/:id/review", requirePermission(PERMISSIONS.DISBURSEMENTS_APPROVE), (req, res, next) => {
  try {
    const { decision, reason } = req.body;
    const reviewed = governanceService.reviewProposal({
      proposalId: req.params.id,
      approverId: req.user.userId,
      approverAddress: req.user.address,
      decision,
      reason,
    });

    res.json({
      success: true,
      data: reviewed,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/governance/proposals/:id/execute
 */
router.post("/governance/proposals/:id/execute", requirePermission(PERMISSIONS.DISBURSEMENTS_EXECUTE), (req, res, next) => {
  try {
    const { txHash } = req.body;
    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_TX_HASH", message: "Transaction hash is required for disbursement execution confirmation." },
      });
    }

    const executed = governanceService.markExecuted({
      proposalId: req.params.id,
      txHash,
      executorId: req.user.userId,
      executorAddress: req.user.address,
    });

    res.json({
      success: true,
      data: executed,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
