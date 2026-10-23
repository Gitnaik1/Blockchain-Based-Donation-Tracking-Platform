import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ROLES, DEMO_PROFILES, hasPermission } from "../config/roles.js";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

const STORAGE_KEY_AUTH = "trustdonate_auth_profile_v2";
const STORAGE_KEY_ACTIVE_ORG = "trustdonate_active_org_v2";

export const AuthProvider = ({ children }) => {
  // Initialize with persisted authenticated user if available, otherwise null (unauthenticated visitor)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        return JSON.parse(stored);
      }
      // Also check if authService has a valid live session
      const liveSession = authService.getSession();
      if (liveSession && liveSession.token) {
        // Map live session to user profile
        const matchingProfile = DEMO_PROFILES.find(
          (p) => p.wallet?.toLowerCase() === liveSession.wallet?.toLowerCase()
        );
        if (matchingProfile) {
          return matchingProfile;
        }
        return {
          id: liveSession.userId || `usr-${liveSession.wallet?.substring(2, 8)}`,
          name: liveSession.ngoName || "Authenticated Member",
          wallet: liveSession.wallet,
          role: liveSession.role || ROLES.VIEWER,
          email: "authenticated@trustdonate.org",
          organizations: liveSession.ngoId
            ? [{ id: liveSession.ngoId, name: liveSession.ngoName || "Assigned NGO", role: liveSession.role }]
            : [],
        };
      }
    } catch {
      // Ignore parse errors
    }
    return null; // Default to unauthenticated guest
  });

  const [activeOrganization, setActiveOrganization] = useState(() => {
    try {
      const storedOrg = sessionStorage.getItem(STORAGE_KEY_ACTIVE_ORG);
      if (storedOrg) {
        return JSON.parse(storedOrg);
      }
    } catch {
      // Ignore parse errors
    }
    return currentUser?.organizations?.[0] || null;
  });

  // State cleanup on org switch callback registry
  const cleanupCallbacks = useState(() => new Set())[0];

  const registerCleanupCallback = useCallback((fn) => {
    cleanupCallbacks.add(fn);
    return () => cleanupCallbacks.delete(fn);
  }, [cleanupCallbacks]);

  const switchOrganization = useCallback((orgId) => {
    if (!currentUser || !currentUser.organizations) return;
    const targetOrg = currentUser.organizations.find((o) => o.id === orgId);
    if (targetOrg) {
      cleanupCallbacks.forEach((fn) => {
        try {
          fn();
        } catch (err) {
          console.error("Error during organization cleanup:", err);
        }
      });

      setActiveOrganization(targetOrg);
      try {
        sessionStorage.setItem(STORAGE_KEY_ACTIVE_ORG, JSON.stringify(targetOrg));
      } catch {}
    }
  }, [currentUser, cleanupCallbacks]);

  // Demo profile switcher (used in test & interactive demonstration)
  const switchProfile = useCallback((profileIdOrRole) => {
    const profile = DEMO_PROFILES.find(
      (p) => p.id === profileIdOrRole || p.role === profileIdOrRole
    );
    if (profile) {
      cleanupCallbacks.forEach((fn) => {
        try { fn(); } catch {}
      });

      setCurrentUser(profile);
      const firstOrg = profile.organizations?.[0] || null;
      setActiveOrganization(firstOrg);

      try {
        sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(profile));
        if (firstOrg) {
          sessionStorage.setItem(STORAGE_KEY_ACTIVE_ORG, JSON.stringify(firstOrg));
        } else {
          sessionStorage.removeItem(STORAGE_KEY_ACTIVE_ORG);
        }
      } catch {}
    }
  }, [cleanupCallbacks]);

  /**
   * Log in via SIWE verified wallet session.
   */
  const loginWithWallet = useCallback(async (session) => {
    const normalizedWallet = session.wallet?.toLowerCase();
    const matchingProfile = DEMO_PROFILES.find(
      (p) => p.wallet?.toLowerCase() === normalizedWallet
    );

    let userProfile;
    if (matchingProfile) {
      userProfile = {
        ...matchingProfile,
        wallet: session.wallet,
        sessionToken: session.token,
      };
    } else {
      // Map verified backend role
      let assignedRole = ROLES.DONOR;
      if (session.globalRole === "PLATFORM_SUPER_ADMIN" || session.role === "PLATFORM_ADMIN") {
        assignedRole = ROLES.SUPER_ADMIN;
      } else if (session.globalRole === "INDEPENDENT_AUDITOR" || session.role === "INDEPENDENT_AUDITOR") {
        assignedRole = ROLES.AUDITOR;
      } else if (session.role === "NGO_OPERATOR" || session.activeRole === "NGO_ADMIN") {
        assignedRole = ROLES.NGO_ADMIN;
      } else if (session.activeRole === "FINANCE_OFFICER") {
        assignedRole = ROLES.FINANCE_OFFICER;
      } else if (session.activeRole === "PROJECT_MANAGER") {
        assignedRole = ROLES.PROJECT_MANAGER;
      }

      userProfile = {
        id: session.userId || `usr-${session.wallet?.substring(2, 8)}`,
        name: session.ngoName || (assignedRole === ROLES.DONOR ? "Public Patron" : "Verified Representative"),
        email: session.email || `${session.wallet?.substring(2, 10)}@trustdonate.org`,
        wallet: session.wallet,
        role: assignedRole,
        sessionToken: session.token,
        organizations: session.ngoId
          ? [{ id: session.ngoId, name: session.ngoName || "Assigned NGO", role: assignedRole }]
          : (session.memberships?.map((m) => ({ id: m.ngo_id, name: m.ngo_name, role: m.role })) || []),
      };
    }

    setCurrentUser(userProfile);
    const primaryOrg = userProfile.organizations?.[0] || null;
    setActiveOrganization(primaryOrg);

    try {
      sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(userProfile));
      if (primaryOrg) {
        sessionStorage.setItem(STORAGE_KEY_ACTIVE_ORG, JSON.stringify(primaryOrg));
      }
    } catch {}

    return userProfile;
  }, []);

  /**
   * Log in via Email & Password credentials.
   */
  const loginWithCredentials = useCallback(async (email, password) => {
    // Check demo accounts first
    const matchedProfile = DEMO_PROFILES.find(
      (p) => p.email.toLowerCase() === email.toLowerCase()
    );

    if (!matchedProfile && password !== "DemoPass2026!") {
      // Simulated custom donor
      if (email.includes("@")) {
        const customUser = {
          id: `usr-custom-${Date.now()}`,
          name: email.split("@")[0],
          email,
          role: ROLES.DONOR,
          wallet: null,
          organizations: [],
        };
        setCurrentUser(customUser);
        setActiveOrganization(null);
        try {
          sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(customUser));
        } catch {}
        return customUser;
      }
      throw new Error("Invalid email or password.");
    }

    const userProfile = matchedProfile || DEMO_PROFILES[1];
    setCurrentUser(userProfile);
    const primaryOrg = userProfile.organizations?.[0] || null;
    setActiveOrganization(primaryOrg);

    try {
      sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(userProfile));
      if (primaryOrg) {
        sessionStorage.setItem(STORAGE_KEY_ACTIVE_ORG, JSON.stringify(primaryOrg));
      }
    } catch {}

    return userProfile;
  }, []);

  const logout = useCallback(() => {
    cleanupCallbacks.forEach((fn) => {
      try { fn(); } catch {}
    });

    authService.clearSession();
    setCurrentUser(null);
    setActiveOrganization(null);

    try {
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
      sessionStorage.removeItem(STORAGE_KEY_ACTIVE_ORG);
    } catch {}
  }, [cleanupCallbacks]);

  const hasAccess = useCallback(
    (permission) => {
      if (!currentUser) return false;
      return hasPermission(currentUser.role, permission);
    },
    [currentUser]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        activeRole: currentUser?.role || null,
        activeOrganization,
        organizations: currentUser?.organizations || [],
        hasAccess,
        loginWithWallet,
        loginWithCredentials,
        switchOrganization,
        switchProfile,
        logout,
        registerCleanupCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
