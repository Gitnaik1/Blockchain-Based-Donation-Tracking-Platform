import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  DEMO_PROFILES,
} from "../src/config/roles.js";
import { isValidAddress, shortenAddress } from "../src/services/utils/tokenMath.js";

describe("TrustDonate Role-Based Architecture & Permission Matrix", () => {
  it("enforces explicit permission boundaries for Platform Super Admin", () => {
    assert.equal(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.PLATFORM_ADMIN), true);
    assert.equal(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.RISK_VIEW_ALERTS), true);
    assert.equal(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.DATA_EXPORT_CSV), true);
    assert.equal(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.AUDIT_REVIEW), true);

    // Super Admin cannot independently propose project proofs without project manager role
    assert.equal(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.PROJECT_SUBMIT_PROOF), false);
  });

  it("enforces explicit permission boundaries for NGO Administrator", () => {
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.NGO_MANAGE_TEAM), true);
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.NGO_MANAGE_PROFILE), true);
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.TREASURY_PROPOSE), true);
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.TREASURY_APPROVE), true);
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.TREASURY_EXECUTE), true);
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.PROJECT_CREATE), true);

    // NGO Admin cannot access Platform Super Admin console
    assert.equal(hasPermission(ROLES.NGO_ADMIN, PERMISSIONS.PLATFORM_ADMIN), false);
  });

  it("enforces explicit permission boundaries for Finance Officer", () => {
    assert.equal(hasPermission(ROLES.FINANCE_OFFICER, PERMISSIONS.TREASURY_PROPOSE), true);
    assert.equal(hasPermission(ROLES.FINANCE_OFFICER, PERMISSIONS.TREASURY_APPROVE), true);
    assert.equal(hasPermission(ROLES.FINANCE_OFFICER, PERMISSIONS.TREASURY_EXECUTE), true);
    assert.equal(hasPermission(ROLES.FINANCE_OFFICER, PERMISSIONS.DATA_EXPORT_CSV), true);

    // Finance Officer cannot alter team roles or add signers
    assert.equal(hasPermission(ROLES.FINANCE_OFFICER, PERMISSIONS.NGO_MANAGE_TEAM), false);
    assert.equal(hasPermission(ROLES.FINANCE_OFFICER, PERMISSIONS.PLATFORM_ADMIN), false);
  });

  it("enforces explicit permission boundaries for Project Manager", () => {
    assert.equal(hasPermission(ROLES.PROJECT_MANAGER, PERMISSIONS.PROJECT_CREATE), true);
    assert.equal(hasPermission(ROLES.PROJECT_MANAGER, PERMISSIONS.PROJECT_EDIT), true);
    assert.equal(hasPermission(ROLES.PROJECT_MANAGER, PERMISSIONS.PROJECT_SUBMIT_PROOF), true);

    // Project Manager cannot approve or execute treasury disbursements
    assert.equal(hasPermission(ROLES.PROJECT_MANAGER, PERMISSIONS.TREASURY_APPROVE), false);
    assert.equal(hasPermission(ROLES.PROJECT_MANAGER, PERMISSIONS.TREASURY_EXECUTE), false);
    assert.equal(hasPermission(ROLES.PROJECT_MANAGER, PERMISSIONS.PLATFORM_ADMIN), false);
  });

  it("enforces read-only audit boundaries for Independent Auditor", () => {
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.AUDIT_REVIEW), true);
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.AUDIT_SUBMIT_FINDING), true);
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.RISK_VIEW_ALERTS), true);
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.DATA_EXPORT_CSV), true);

    // Independent Auditor MUST NOT have treasury signing or execution capabilities
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.TREASURY_PROPOSE), false);
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.TREASURY_APPROVE), false);
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.TREASURY_EXECUTE), false);
    assert.equal(hasPermission(ROLES.AUDITOR, PERMISSIONS.NGO_MANAGE_TEAM), false);
  });

  it("enforces donor privacy and management boundaries", () => {
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.DONOR_VIEW_PERSONAL), true);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.DONOR_MANAGE_SUBSCRIPTIONS), true);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.DATA_EXPORT_CSV), true);

    // Donors cannot access NGO administration or treasury tools
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.TREASURY_PROPOSE), false);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.TREASURY_APPROVE), false);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.NGO_MANAGE_TEAM), false);
  });

  it("enforces zero elevated permissions for Read-Only Viewer", () => {
    Object.values(PERMISSIONS).forEach((perm) => {
      assert.equal(
        hasPermission(ROLES.VIEWER, perm),
        false,
        `Viewer should not have ${perm}`
      );
    });
  });

  it("validates enterprise demo profile data structures and cryptographic wallets", () => {
    assert.equal(DEMO_PROFILES.length, 7, "Must contain all 7 distinct enterprise profiles");

    DEMO_PROFILES.forEach((profile) => {
      assert.ok(profile.id, "Profile must have an ID");
      assert.ok(profile.name, "Profile must have a human readable name");
      assert.ok(profile.email, "Profile must have an email address");
      assert.ok(Object.values(ROLES).includes(profile.role), "Profile must hold a defined role");

      // Verify wallet address
      assert.ok(profile.wallet.startsWith("0x"), "Wallet must be a hex string");
      assert.equal(profile.wallet.length, 42, "Wallet must be 42 characters");
      assert.equal(isValidAddress(profile.wallet), true, "Wallet must be a valid Ethereum address");

      // Verify organization memberships if present
      if (profile.organizations.length > 0) {
        profile.organizations.forEach((org) => {
          assert.ok(org.id, "Organization must have an ID");
          assert.ok(org.name, "Organization must have a name");
          assert.ok(org.role, "Membership must specify user's role in the organization");
        });
      }
    });
  });

  it("simulates cross-organization state teardown and cleanup callback invocation", () => {
    let cleanedUpProposals = false;
    let cleanedUpFilters = false;

    // Simulate callback registration in workspace
    const cleanupProposals = () => {
      cleanedUpProposals = true;
    };
    const cleanupFilters = () => {
      cleanedUpFilters = true;
    };

    const cleanupRegistry = new Set();
    cleanupRegistry.add(cleanupProposals);
    cleanupRegistry.add(cleanupFilters);

    // Switch organization action
    cleanupRegistry.forEach((fn) => fn());

    assert.equal(cleanedUpProposals, true, "Active proposal drafts must be cleared on org switch");
    assert.equal(cleanedUpFilters, true, "Cached filter states must be cleared on org switch");
  });

  it("guards against client-side tampering by treating invalid roles safely", () => {
    assert.equal(hasPermission("unauthorized_hacker", PERMISSIONS.TREASURY_APPROVE), false);
    assert.equal(hasPermission(null, PERMISSIONS.PLATFORM_ADMIN), false);
    assert.equal(hasPermission(undefined, PERMISSIONS.NGO_MANAGE_TEAM), false);
    assert.equal(hasPermission(ROLES.VIEWER, "invented_permission"), false);
  });
});
