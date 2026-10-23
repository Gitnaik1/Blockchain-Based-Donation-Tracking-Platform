const authService = require("../services/authService.cjs");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Bearer token missing.",
      },
    });
  }

  const token = authHeader.split(" ")[1];
  const session = authService.verifyToken(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Session token is invalid or has expired.",
      },
    });
  }

  req.user = session;
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
};
