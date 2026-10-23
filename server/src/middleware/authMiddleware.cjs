const authService = require("../services/authService.cjs");

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Fallback to cookie
  if (req.cookies && req.cookies.trustdonate_session) {
    return req.cookies.trustdonate_session;
  }

  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/trustdonate_session=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Bearer token or session cookie missing.",
      },
    });
  }

  // CSRF protection for cookie-based state-changing requests
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const isUsingCookie = !req.headers.authorization && !!(req.cookies?.trustdonate_session || req.headers.cookie?.includes("trustdonate_session="));

  if (isMutation && isUsingCookie) {
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
    if (origin && !origin.startsWith(allowedOrigin) && !origin.includes("trustdonate.org") && !origin.includes("localhost")) {
      return res.status(403).json({
        success: false,
        error: {
          code: "CSRF_DETECTED",
          message: "Cross-site request forgery protection triggered.",
        },
      });
    }
  }

  const session = authService.verifyToken(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Session token is invalid, expired, or has been revoked.",
      },
    });
  }

  req.user = session;
  req.token = token;
  next();
}

function requireNgoAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "NGO_OPERATOR" && req.user.role !== "PLATFORM_ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Access restricted to authorized NGO operators.",
        },
      });
    }
    next();
  });
}

module.exports = {
  requireAuth,
  requireNgoAdmin,
  extractToken,
};
