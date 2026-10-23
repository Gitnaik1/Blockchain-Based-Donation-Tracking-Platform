const express = require("express");
const router = express.Router();
const authService = require("../services/authService.cjs");
const { requireAuth } = require("../middleware/authMiddleware.cjs");

router.post("/challenge", (req, res, next) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_ADDRESS", message: "Ethereum wallet address is required." },
      });
    }

    const challenge = authService.generateChallenge(address);
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
});

router.post("/verify", async (req, res, next) => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_BODY", message: "Both message and signature are required." },
      });
    }

    const session = await authService.verifySignature(message, signature);
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: "VERIFICATION_FAILED", message: err.message },
    });
  }
});

router.get("/session", requireAuth, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

module.exports = router;
