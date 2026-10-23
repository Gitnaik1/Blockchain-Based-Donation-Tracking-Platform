import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  getDefaultDashboardForRole,
  resolveFallbackRoute,
} from "../src/config/roles.js";

describe("TrustDonate Frontend Navigation & Role-Based Access Guarding", () => {
  it("maps roles to correct context-aware default dashboards", () => {
    assert.equal(getDefaultDashboardForRole(ROLES.SUPER_ADMIN), "/admin");
    assert.equal(getDefaultDashboardForRole(ROLES.AUDITOR), "/auditor");
    assert.equal(getDefaultDashboardForRole(ROLES.FINANCE_OFFICER), "/finance");
    assert.equal(getDefaultDashboardForRole(ROLES.PROJECT_MANAGER), "/projects");
    assert.equal(getDefaultDashboardForRole(ROLES.DONOR), "/donor/dashboard");
    assert.equal(getDefaultDashboardForRole(ROLES.NGO_ADMIN), "/ngo/dashboard");
    assert.equal(getDefaultDashboardForRole(ROLES.VIEWER), "/ngo/dashboard");
  });

  it("calculates correct context-aware fallback routes when history stack is empty", () => {
    assert.equal(resolveFallbackRoute("/ngo/dashboard"), "/ngo/dashboard");
    assert.equal(resolveFallbackRoute("/finance"), "/ngo/dashboard");
    assert.equal(resolveFallbackRoute("/projects/p-101"), "/ngo/dashboard");
    assert.equal(resolveFallbackRoute("/admin/settings"), "/admin");
    assert.equal(resolveFallbackRoute("/auditor/reports"), "/auditor");
    assert.equal(resolveFallbackRoute("/donor/dashboard"), "/donor/dashboard");
    assert.equal(resolveFallbackRoute("/login"), "/");
    assert.equal(resolveFallbackRoute("/signup"), "/");
    assert.equal(resolveFallbackRoute("/random-404"), "/");
  });

  it("encodes returnUrl correctly for deep internal destinations", () => {
    const targetPath = "/finance?filter=pending";
    const encoded = encodeURIComponent(targetPath);
    assert.equal(encoded, "%2Ffinance%3Ffilter%3Dpending");
    assert.equal(decodeURIComponent(encoded), targetPath);
  });

  it("enforces permission checks accurately across sensitive operations", () => {
    // Treasury proposals require FINANCE_OFFICER or NGO_ADMIN
    assert.equal(hasPermission(ROLES.FINANCE_OFFICER, PERMISSIONS.TREASURY_PROPOSE), true);
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.TREASURY_PROPOSE), true);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.TREASURY_PROPOSE), false);
    assert.equal(hasPermission(ROLES.VIEWER, PERMISSIONS.TREASURY_PROPOSE), false);

    // Audit reviews require AUDITOR or SUPER_ADMIN
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.AUDIT_REVIEW), true);
    assert.equal(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.AUDIT_REVIEW), true);
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.AUDIT_REVIEW), false);

    // Project creation requires PROJECT_MANAGER or NGO_ADMIN
    assert.equal(hasPermission(ROLES.PROJECT_MANAGER, PERMISSIONS.PROJECT_CREATE), true);
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.PROJECT_CREATE), true);
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.PROJECT_CREATE), false);
  });
});
