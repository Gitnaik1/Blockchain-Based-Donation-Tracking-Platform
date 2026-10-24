import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  getDefaultDashboardForRole,
  resolveFallbackRoute,
  getRoleNavItems,
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

  it("enforces strict role-segregated navigation items in sidebar", () => {
    // 1. Donor nav items
    const donorItems = getRoleNavItems(ROLES.DONOR);
    const donorLabels = donorItems.map((i) => i.label);
    assert.ok(donorLabels.includes("My Donations"));
    assert.ok(donorLabels.includes("Impact Milestones"));
    assert.ok(donorLabels.includes("Recurring Pledges"));
    assert.ok(donorLabels.includes("Profile & Wallet"));
    assert.ok(donorLabels.includes("Tax & Settings"));

    // Donor must NEVER have NGO internal governance tabs
    assert.equal(donorLabels.includes("Finance"), false);
    assert.equal(donorLabels.includes("Approvals"), false);
    assert.equal(donorLabels.includes("Fund Allocation"), false);
    assert.equal(donorLabels.includes("Team Management"), false);
    assert.equal(donorLabels.includes("Auditor Portal"), false);
    assert.equal(donorLabels.includes("Risk Alerts"), false);

    // 2. Finance Officer nav items
    const financeItems = getRoleNavItems(ROLES.FINANCE_OFFICER);
    const financeLabels = financeItems.map((i) => i.label);
    assert.ok(financeLabels.includes("Finance Workspace"));
    assert.ok(financeLabels.includes("Approvals"));
    assert.ok(financeLabels.includes("Fund Allocation"));
    assert.equal(financeLabels.includes("Team Management"), false);
    assert.equal(financeLabels.includes("My Donations"), false);

    // 3. Auditor nav items
    const auditorItems = getRoleNavItems(ROLES.AUDITOR);
    const auditorLabels = auditorItems.map((i) => i.label);
    assert.ok(auditorLabels.includes("Auditor Portal"));
    assert.ok(auditorLabels.includes("Compliance Vault"));
    assert.equal(auditorLabels.includes("Finance Workspace"), false);
    assert.equal(auditorLabels.includes("Team Management"), false);

    // 4. Project Manager nav items
    const pmItems = getRoleNavItems(ROLES.PROJECT_MANAGER);
    const pmLabels = pmItems.map((i) => i.label);
    assert.ok(pmLabels.includes("Projects & Milestones"));
    assert.ok(pmLabels.includes("Deliverables & Proofs"));
    assert.equal(pmLabels.includes("Finance Workspace"), false);
    assert.equal(pmLabels.includes("Approvals"), false);

    // 5. Super Admin nav items
    const adminItems = getRoleNavItems(ROLES.SUPER_ADMIN);
    const adminLabels = adminItems.map((i) => i.label);
    assert.ok(adminLabels.includes("Super Admin"));
    assert.ok(adminLabels.includes("Auditor Portal"));
    assert.ok(adminLabels.includes("Risk Alerts"));
  });
});
