const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware.cjs");
const { requireNgoScope, requirePermission } = require("../middleware/rbacMiddleware.cjs");
const { PERMISSIONS } = require("../rbac/permissions.cjs");
const reconciliationService = require("../services/reconciliationService.cjs");

router.use(requireAuth);

/**
 * GET /api/v1/ngos/:id/ledger
 */
router.get("/ngos/:id/ledger", requireNgoScope("id"), requirePermission(PERMISSIONS.TREASURY_VIEW), (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const ledger = reconciliationService.getLedger(req.params.id, limit);

  res.json({
    success: true,
    data: ledger,
  });
});

/**
 * GET /api/v1/ngos/:id/accounting-balance
 */
router.get("/ngos/:id/accounting-balance", requireNgoScope("id"), requirePermission(PERMISSIONS.TREASURY_VIEW), (req, res) => {
  const tokenSymbol = req.query.token || "POL";
  const balanceRaw = reconciliationService.getAccountingBalance(req.params.id, tokenSymbol);

  res.json({
    success: true,
    data: {
      ngoId: req.params.id,
      tokenSymbol,
      balanceRaw,
    },
  });
});

/**
 * POST /api/v1/ngos/:id/reconcile
 */
router.post("/ngos/:id/reconcile", requireNgoScope("id"), requirePermission(PERMISSIONS.RECONCILIATION_RUN), (req, res, next) => {
  try {
    const { tokenSymbol, onChainBalanceRaw, notes } = req.body;
    const report = reconciliationService.reconcileBalances({
      ngoId: req.params.id,
      tokenSymbol: tokenSymbol || "POL",
      onChainBalanceRaw,
      performedBy: req.user.address,
      notes,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/ngos/:id/ledger/adjust
 */
router.post("/ngos/:id/ledger/adjust", requireNgoScope("id"), requirePermission(PERMISSIONS.RECONCILIATION_ADJUST), (req, res, next) => {
  try {
    const { tokenSymbol, tokenAddress, amountRaw, inrEquivalent, reason } = req.body;
    const result = reconciliationService.recordAdjustment({
      ngoId: req.params.id,
      tokenSymbol,
      tokenAddress,
      amountRaw,
      inrEquivalent,
      reason,
      actorAddress: req.user.address,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
