const express = require("express");
const router = express.Router();
const authService = require("../services/authService.cjs");
const { requireAuth, extractToken } = require("../middleware/authMiddleware.cjs");
const db = require("../db/database.cjs");

function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("trustdonate_session", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

function clearSessionCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("trustdonate_session", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
  });
}

/**
 * POST /api/v1/auth/challenge
 * Issues an unpredictable EIP-4361 challenge bound to domain, URI, and chainId.
 */
router.post("/challenge", (req, res, next) => {
  try {
    const address = req.body.address || req.body.wallet;
    const { domain, uri, chainId } = req.body;
    if (!address) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_ADDRESS", message: "Ethereum wallet address is required." },
      });
    }

    const challenge = authService.generateChallenge(address, domain, uri, chainId);
    res.json({ success: true, data: challenge });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/verify
 * Validates cryptographic challenge signature and returns session with HttpOnly cookie.
 */
router.post("/verify", async (req, res, next) => {
  try {
    let { message, signature, nonce } = req.body;
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_BODY", message: "Both message and signature are required." },
      });
    }

    if (!message && nonce) {
      const challengeRecord = db.prepare("SELECT * FROM auth_challenges WHERE nonce = ? AND used = 0").get(nonce);
      if (challengeRecord) {
        message = challengeRecord.message;
      }
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_BODY", message: "Both message and signature are required." },
      });
    }

    const session = await authService.verifySignature(message, signature);
    setSessionCookie(res, session.token);

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: "VERIFICATION_FAILED", message: err.message },
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticates user via email and password with lockout defense.
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "Email and password are required." },
      });
    }

    const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const session = await authService.loginWithPassword(email, password, ipAddress);
    setSessionCookie(res, session.token);

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: { code: "LOGIN_FAILED", message: err.message },
    });
  }
});

/**
 * POST /api/v1/auth/signup
 * Registers a new donor account with server-side validation and terms consent.
 */
router.post("/signup", async (req, res, next) => {
  try {
    const {
      email,
      password,
      displayName,
      acceptedTerms,
      acceptedPrivacy,
      walletAddress,
      message,
      signature,
    } = req.body;

    const result = await authService.registerDonor({
      email,
      password,
      displayName,
      acceptedTerms,
      acceptedPrivacy,
      walletAddress,
      message,
      signature,
    });

    res.status(201).json({
      success: true,
      message: "Account registered successfully. Please verify your email.",
      data: result,
    });
  } catch (err) {
    if (err.code === "EMAIL_ALREADY_EXISTS" || err.code === "WALLET_ALREADY_LINKED") {
      return res.status(409).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
    res.status(400).json({
      success: false,
      error: { code: "SIGNUP_FAILED", message: err.message },
    });
  }
});

/**
 * POST /api/v1/auth/verify-email
 * Verifies email address using the supplied token.
 */
router.post("/verify-email", (req, res, next) => {
  try {
    const { token } = req.body;
    const result = authService.verifyEmail(token);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: "EMAIL_VERIFICATION_FAILED", message: err.message },
    });
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Dispatches a password reset link (constant response to prevent enumeration).
 */
router.post("/forgot-password", (req, res, next) => {
  try {
    const { email } = req.body;
    const result = authService.requestPasswordReset(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Resets password using the single-use reset token and invalidates active sessions.
 */
router.post("/reset-password", (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: { code: "RESET_FAILED", message: err.message },
    });
  }
});

/**
 * POST /api/v1/auth/link-wallet
 * Cryptographically verifies and binds a Web3 wallet to the authenticated user.
 */
router.post("/link-wallet", requireAuth, (req, res, next) => {
  try {
    const { address, message, signature } = req.body;
    const updatedUser = authService.linkWallet({
      userId: req.user.userId,
      address,
      message,
      signature,
    });

    res.json({
      success: true,
      message: "Wallet successfully linked to your account.",
      data: updatedUser,
    });
  } catch (err) {
    if (err.code === "WALLET_ALREADY_LINKED") {
      return res.status(409).json({
        success: false,
        error: { code: err.code, message: err.message },
      });
    }
    res.status(400).json({
      success: false,
      error: { code: "WALLET_LINK_FAILED", message: err.message },
    });
  }
});

/**
 * POST /api/v1/auth/switch-org
 * Switches the active organization context for multi-membership users.
 */
router.post("/switch-org", requireAuth, (req, res, next) => {
  try {
    const { ngoId } = req.body;
    const session = authService.switchOrganization({
      userId: req.user.userId,
      targetNgoId: ngoId || null,
    });

    setSessionCookie(res, session.token);
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(403).json({
      success: false,
      error: { code: "SWITCH_ORG_DENIED", message: err.message },
    });
  }
});

/**
 * GET /api/v1/auth/memberships
 * Returns all active organization memberships for the authenticated user.
 */
router.get("/memberships", requireAuth, (req, res) => {
  const memberships = db.prepare(`
    SELECT m.id, m.ngo_id, m.role, m.status, m.created_at, n.name AS ngo_name, n.category AS ngo_category, n.verified_wallet AS ngo_wallet
    FROM ngo_memberships m
    JOIN ngos n ON m.ngo_id = n.id
    WHERE m.user_id = ? AND m.status = 'ACTIVE'
  `).all(req.user.userId);

  res.json({
    success: true,
    data: memberships,
  });
});

/**
 * GET /api/v1/auth/permissions
 * Returns a summary of active roles and effective permissions for the session.
 */
router.get("/permissions", requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user.userId,
      globalRole: req.user.globalRole,
      activeRole: req.user.activeRole,
      activeNgoId: req.user.activeNgoId,
      permissions: req.user.permissions || [],
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Revokes token, invalidates active sessions, and clears HttpOnly cookie.
 */
router.post("/logout", (req, res) => {
  const token = extractToken(req);
  authService.logout(token, req.user?.userId);
  clearSessionCookie(res);

  res.json({
    success: true,
    message: "Logged out successfully. Session invalidated.",
  });
});

/**
 * GET /api/v1/auth/session
 * Backward-compatible session route.
 */
router.get("/session", requireAuth, (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

/**
 * GET /api/v1/auth/me
 * Retrieves full user profile and active memberships.
 */
router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.userId);
  const memberships = db.prepare(`
    SELECT m.id, m.ngo_id, m.role, m.status, m.created_at, n.name AS ngo_name, n.category AS ngo_category
    FROM ngo_memberships m
    JOIN ngos n ON m.ngo_id = n.id
    WHERE m.user_id = ? AND m.status = 'ACTIVE'
  `).all(req.user.userId);

  res.json({
    success: true,
    data: {
      userId: req.user.userId,
      address: user ? user.wallet_address : req.user.address,
      displayName: user ? user.display_name : null,
      email: user ? user.email : null,
      emailVerified: user ? Boolean(user.email_verified) : false,
      globalRole: req.user.globalRole,
      activeRole: req.user.activeRole,
      activeNgoId: req.user.activeNgoId,
      permissions: req.user.permissions,
      walletLinkedAt: user ? user.wallet_linked_at : null,
      memberships,
    },
  });
});

module.exports = router;
