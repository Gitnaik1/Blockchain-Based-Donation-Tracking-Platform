const express = require("express");
const router = express.Router({ mergeParams: true });
const db = require("../db/database.cjs");
const { requireAuth } = require("../middleware/authMiddleware.cjs");
const { requireNgoScope, requirePermission } = require("../middleware/rbacMiddleware.cjs");
const { PERMISSIONS } = require("../rbac/permissions.cjs");
const onboardingService = require("../services/onboardingService.cjs");

router.use(requireAuth);
router.use(requireNgoScope("id"));

/**
 * GET /api/v1/ngos/:id/members
 * Lists verified organization members.
 */
router.get("/:id/members", (req, res) => {
  const members = db.prepare(`
    SELECT m.id, m.role, m.status, m.created_at, u.id AS userId, u.wallet_address AS walletAddress, u.display_name AS displayName, u.email
    FROM ngo_memberships m
    JOIN users u ON m.user_id = u.id
    WHERE m.ngo_id = ?
    ORDER BY m.created_at ASC
  `).all(req.params.id);

  res.json({
    success: true,
    data: members,
  });
});

/**
 * POST /api/v1/ngos/:id/invitations
 * Creates single-use team member invitation.
 */
router.post("/:id/invitations", requirePermission(PERMISSIONS.NGO_MEMBERS_MANAGE), (req, res, next) => {
  try {
    const { email, role } = req.body;
    const invitation = onboardingService.createInvitation({
      ngoId: req.params.id,
      email,
      role,
      invitedById: req.user.userId,
      actorAddress: req.user.address,
    });

    res.status(201).json({
      success: true,
      data: invitation,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/ngos/:id/members/:userId
 * Updates a member's role and immediately invalidates active sessions.
 */
router.patch("/:id/members/:userId", requirePermission(PERMISSIONS.NGO_MEMBERS_MANAGE), (req, res, next) => {
  try {
    const { role } = req.body;
    const result = onboardingService.updateMemberRole({
      ngoId: req.params.id,
      userId: req.params.userId,
      newRole: role,
      actorAddress: req.user.address,
    });

    res.json({
      success: true,
      data: result,
      message: `Member '${req.params.userId}' role updated to '${role}'.`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/ngos/:id/members/:userId
 * Revokes team member and immediately invalidates active sessions.
 */
router.delete("/:id/members/:userId", requirePermission(PERMISSIONS.NGO_MEMBERS_MANAGE), (req, res, next) => {
  try {
    onboardingService.removeMember({
      ngoId: req.params.id,
      userId: req.params.userId,
      actorAddress: req.user.address,
    });

    res.json({
      success: true,
      message: `Member '${req.params.userId}' revoked from NGO '${req.params.id}'.`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
