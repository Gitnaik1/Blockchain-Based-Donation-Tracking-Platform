const db = require("../db/database.cjs");
const { logSecurityEvent } = require("../utils/auditLogger.cjs");

/**
 * Deny-by-default permission check middleware.
 */
function requirePermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    const userPermissions = req.user.permissions || [];
    const isSuperAdmin = req.user.globalRole === "PLATFORM_SUPER_ADMIN";

    if (!isSuperAdmin && !userPermissions.includes(requiredPermission)) {
      logSecurityEvent({
        actorAddress: req.user.address,
        action: "PERMISSION_DENIED",
        resourceType: "API_ENDPOINT",
        resourceId: req.originalUrl,
        ngoId: req.user.activeNgoId,
        status: "DENIED",
        details: { requiredPermission, userRole: req.user.activeRole },
      });

      return res.status(403).json({
        success: false,
        error: {
          code: "PERMISSION_DENIED",
          message: `Access denied. Required permission '${requiredPermission}' is missing.`,
        },
      });
    }

    next();
  };
}

/**
 * Validates role membership against allowed roles.
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    const userRoles = [req.user.globalRole, req.user.activeRole].filter(Boolean);
    const hasRole = allowedRoles.some((r) => userRoles.includes(r));

    if (!hasRole && req.user.globalRole !== "PLATFORM_SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN_ROLE",
          message: `Access denied. Role must be one of: [${allowedRoles.join(", ")}].`,
        },
      });
    }

    next();
  };
}

/**
 * IDOR Prevention: Enforces organizational data isolation.
 * Prevents members of NGO A from reading or modifying NGO B's resources.
 */
function requireNgoScope(ngoIdParamName = "id") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    // Super Admin has global read/review capability across NGOs
    if (req.user.globalRole === "PLATFORM_SUPER_ADMIN") {
      return next();
    }

    const requestedNgoId = req.params?.[ngoIdParamName] || req.body?.ngoId || req.query?.ngoId;
    if (!requestedNgoId) {
      return next(); // If no explicit NGO specified, proceed to handler
    }

    // Check user memberships
    const memberships = req.user.memberships || [];
    const isMember = memberships.some((m) => m.ngo_id === requestedNgoId && m.status === "ACTIVE");
    const isLegacyNgo = req.user.ngoId === requestedNgoId;

    if (!isMember && !isLegacyNgo) {
      logSecurityEvent({
        actorAddress: req.user.address,
        action: "CROSS_ORGANIZATION_ACCESS_BLOCKED",
        resourceType: "NGO",
        resourceId: requestedNgoId,
        ngoId: requestedNgoId,
        status: "DENIED",
        details: { userNgoId: req.user.activeNgoId, attemptedNgoId: requestedNgoId },
      });

      return res.status(403).json({
        success: false,
        error: {
          code: "ORGANIZATION_MISMATCH",
          message: "Access forbidden: you do not possess an active membership in the target organization.",
        },
      });
    }

    next();
  };
}

/**
 * IDOR Prevention: Enforces project-level isolation.
 */
function requireProjectScope(projectIdParamName = "id") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    if (req.user.globalRole === "PLATFORM_SUPER_ADMIN") {
      return next();
    }

    const projectId = req.params[projectIdParamName];
    if (!projectId) return next();

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "PROJECT_NOT_FOUND", message: `Project '${projectId}' not found.` },
      });
    }

    // Check if user has membership in project's NGO
    const memberships = req.user.memberships || [];
    const hasOrgAccess = memberships.some((m) => m.ngo_id === project.ngo_id) || req.user.ngoId === project.ngo_id;

    if (!hasOrgAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: "PROJECT_ACCESS_DENIED",
          message: "You do not have authorization to access projects outside your registered NGO.",
        },
      });
    }

    req.project = project;
    next();
  };
}

module.exports = {
  requirePermission,
  requireRole,
  requireNgoScope,
  requireProjectScope,
};
