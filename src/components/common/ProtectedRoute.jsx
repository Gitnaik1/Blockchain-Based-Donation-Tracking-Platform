import React, { useEffect } from "react";
import { useRouter } from "../../context/RouterContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLES, getDefaultDashboardForRole } from "../../config/roles.js";
import { ForbiddenView } from "./ForbiddenView.jsx";
import { Loader2 } from "lucide-react";

/**
 * Route protection guard for authenticated pages and specific role/permission policies.
 * Redirects unauthenticated visitors to /login?returnUrl=<destination>.
 * Displays ForbiddenView for authenticated users lacking authorization.
 */
export const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredRoles = null,
  requiredPermission = null,
  fallback = null,
}) => {
  const { currentPath, navigate, goBack } = useRouter();
  const { isAuthenticated, activeRole, hasAccess } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(currentPath + (typeof window !== "undefined" ? window.location.search : ""));
      navigate(`/login?returnUrl=${returnUrl}`, { replace: true });
    }
  }, [isAuthenticated, currentPath, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-inter p-6">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
          <p className="text-xs font-medium">Checking authorization credentials...</p>
        </div>
      </div>
    );
  }

  // 1. Role validation
  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : null);
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole =
      activeRole === ROLES.SUPER_ADMIN || allowedRoles.includes(activeRole);

    if (!hasAllowedRole) {
      return (
        <ForbiddenView
          requiredRole={allowedRoles.join(" or ")}
          onBack={() => {
            if (fallback) {
              navigate(fallback);
            } else {
              goBack(getDefaultDashboardForRole(activeRole));
            }
          }}
        />
      );
    }
  }

  // 2. Permission validation
  if (requiredPermission) {
    const hasPerm =
      activeRole === ROLES.SUPER_ADMIN ||
      (Array.isArray(requiredPermission)
        ? requiredPermission.some((perm) => hasAccess(perm))
        : hasAccess(requiredPermission));

    if (!hasPerm) {
      return (
        <ForbiddenView
          requiredPermission={
            Array.isArray(requiredPermission)
              ? requiredPermission.join(", ")
              : requiredPermission
          }
          onBack={() => {
            if (fallback) {
              navigate(fallback);
            } else {
              goBack(getDefaultDashboardForRole(activeRole));
            }
          }}
        />
      );
    }
  }

  return <>{children}</>;
};
