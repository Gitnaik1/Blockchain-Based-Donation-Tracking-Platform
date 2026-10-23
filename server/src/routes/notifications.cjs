const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware.cjs");
const notificationService = require("../services/notificationService.cjs");

router.use(requireAuth);

/**
 * GET /api/v1/notifications
 */
router.get("/", (req, res) => {
  const unreadOnly = req.query.unread === "true";
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const notifs = notificationService.getUserNotifications(req.user.address, { unreadOnly, limit });

  res.json({
    success: true,
    data: notifs,
  });
});

/**
 * POST /api/v1/notifications/:id/read
 */
router.post("/:id/read", (req, res) => {
  notificationService.markAsRead(req.params.id, req.user.address);
  res.json({ success: true, message: "Notification marked as read." });
});

/**
 * POST /api/v1/notifications/read-all
 */
router.post("/read-all", (req, res) => {
  notificationService.markAllAsRead(req.user.address);
  res.json({ success: true, message: "All notifications marked as read." });
});

/**
 * GET /api/v1/notifications/preferences
 */
router.get("/preferences", (req, res) => {
  const prefs = notificationService.getPreferences(req.user.address);
  res.json({
    success: true,
    data: prefs,
  });
});

/**
 * PUT /api/v1/notifications/preferences
 */
router.put("/preferences", (req, res) => {
  const updated = notificationService.updatePreferences(req.user.address, req.body);
  res.json({
    success: true,
    data: updated,
  });
});

module.exports = router;
