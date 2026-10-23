const crypto = require("crypto");
const db = require("../db/database.cjs");
const { logSecurityEvent } = require("../utils/auditLogger.cjs");
const authService = require("./authService.cjs");

const REQUIRED_DOCS = [
  "reg_certificate",
  "tax_80g",
  "bank_proof",
  "pan_card",
];

class OnboardingService {
  /**
   * Submits or drafts a new NGO onboarding application with document verification checklist.
   */
  submitApplication({
    legalName,
    registrationNumber,
    category,
    contactEmail,
    applicantWallet,
    panNumber = null,
    registeredAddress = null,
    website = null,
    establishedYear = null,
    representative = null,
    documents = {},
    status = "SUBMITTED",
  }) {
    if (!legalName || !registrationNumber || !contactEmail || !applicantWallet) {
      throw new Error("Missing required onboarding fields (legalName, registrationNumber, contactEmail, applicantWallet)");
    }

    // Check for duplicate registration number in active NGOs or pending applications
    const existingNgo = db.prepare(`SELECT * FROM ngos WHERE LOWER(legal_reg_no) = LOWER(?)`).get(registrationNumber);
    if (existingNgo) {
      throw new Error(`An organization with registration number '${registrationNumber}' is already registered on TrustDonate.`);
    }

    const existingApp = db.prepare(`
      SELECT * FROM ngo_applications 
      WHERE LOWER(registration_number) = LOWER(?) AND status IN ('SUBMITTED', 'UNDER_REVIEW')
    `).get(registrationNumber);
    if (existingApp) {
      throw new Error(`An application for registration number '${registrationNumber}' is currently under active review.`);
    }

    // Validate document checklist if submitting
    const docChecklist = {};
    if (status === "SUBMITTED") {
      for (const docKey of REQUIRED_DOCS) {
        const doc = documents[docKey];
        if (!doc || !doc.cid) {
          throw new Error(`Missing required verification document: ${docKey}. An IPFS CID is mandatory.`);
        }
        docChecklist[docKey] = {
          cid: doc.cid,
          fileName: doc.fileName || `${docKey}.pdf`,
          submittedAt: new Date().toISOString(),
          verified: false,
        };
      }
    } else {
      // Allow partial documents in DRAFT status
      for (const [k, v] of Object.entries(documents)) {
        if (v && v.cid) {
          docChecklist[k] = {
            cid: v.cid,
            fileName: v.fileName || `${k}.pdf`,
            submittedAt: new Date().toISOString(),
            verified: false,
          };
        }
      }
    }

    const applicationId = `app-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const representativeJson = representative ? JSON.stringify(representative) : null;
    const initialStatus = status === "DRAFT" ? "DRAFT" : "SUBMITTED";

    db.prepare(`
      INSERT INTO ngo_applications (
        id, legal_name, registration_number, category, contact_email,
        applicant_wallet, pan_number, registered_address, website, established_year,
        representative_json, documents_json, status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      applicationId,
      legalName,
      registrationNumber,
      category || "General Charity",
      contactEmail,
      applicantWallet,
      panNumber,
      registeredAddress,
      website,
      establishedYear,
      representativeJson,
      JSON.stringify(docChecklist),
      initialStatus
    );

    logSecurityEvent({
      actorAddress: applicantWallet,
      action: `NGO_APPLICATION_${initialStatus}`,
      resourceType: "NGO_APPLICATION",
      resourceId: applicationId,
      status: "SUCCESS",
      details: { legalName, registrationNumber },
    });

    return db.prepare("SELECT * FROM ngo_applications WHERE id = ?").get(applicationId);
  }

  /**
   * Resubmits an application after rejection or updates a draft.
   */
  resubmitApplication({ applicationId, applicantWallet, documents = {}, updatedDetails = {} }) {
    const app = db.prepare("SELECT * FROM ngo_applications WHERE id = ?").get(applicationId);
    if (!app) {
      throw new Error(`Application '${applicationId}' not found.`);
    }

    if (applicantWallet && app.applicant_wallet.toLowerCase() !== applicantWallet.toLowerCase()) {
      throw new Error("Access denied: only the applicant wallet can resubmit this application.");
    }

    if (app.status !== "REJECTED" && app.status !== "DRAFT") {
      throw new Error(`Application cannot be resubmitted while in status '${app.status}'.`);
    }

    // Merge documents
    let currentDocs = {};
    try {
      currentDocs = JSON.parse(app.documents_json || "{}");
    } catch {}

    for (const [k, v] of Object.entries(documents)) {
      if (v && v.cid) {
        currentDocs[k] = {
          cid: v.cid,
          fileName: v.fileName || `${k}.pdf`,
          submittedAt: new Date().toISOString(),
          verified: false,
        };
      }
    }

    // Validate that all required documents are present
    for (const docKey of REQUIRED_DOCS) {
      if (!currentDocs[docKey] || !currentDocs[docKey].cid) {
        throw new Error(`Missing required verification document: ${docKey}. An IPFS CID is mandatory.`);
      }
    }

    const legalName = updatedDetails.legalName || app.legal_name;
    const category = updatedDetails.category || app.category;
    const contactEmail = updatedDetails.contactEmail || app.contact_email;
    const resubmissionCount = (app.resubmission_count || 0) + 1;

    db.prepare(`
      UPDATE ngo_applications SET
        legal_name = ?,
        category = ?,
        contact_email = ?,
        documents_json = ?,
        status = 'SUBMITTED',
        resubmission_count = ?,
        resubmitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(legalName, category, contactEmail, JSON.stringify(currentDocs), resubmissionCount, applicationId);

    logSecurityEvent({
      actorAddress: applicantWallet || app.applicant_wallet,
      action: "NGO_APPLICATION_RESUBMITTED",
      resourceType: "NGO_APPLICATION",
      resourceId: applicationId,
      status: "SUCCESS",
      details: { resubmissionCount },
    });

    return db.prepare("SELECT * FROM ngo_applications WHERE id = ?").get(applicationId);
  }

  /**
   * Requests reactivation for a suspended application/organization.
   */
  requestReactivation({ applicationId, applicantWallet, reason }) {
    if (!reason) {
      throw new Error("A justification reason must be provided for reactivation requests.");
    }

    const app = db.prepare("SELECT * FROM ngo_applications WHERE id = ?").get(applicationId);
    if (!app) {
      throw new Error(`Application '${applicationId}' not found.`);
    }

    if (applicantWallet && app.applicant_wallet.toLowerCase() !== applicantWallet.toLowerCase()) {
      throw new Error("Access denied: only the authorized applicant can request reactivation.");
    }

    if (app.status !== "SUSPENDED") {
      throw new Error(`Reactivation can only be requested for suspended organizations (current status: '${app.status}').`);
    }

    db.prepare(`
      UPDATE ngo_applications SET
        status = 'REACTIVATION_REQUESTED',
        reactivation_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason, applicationId);

    logSecurityEvent({
      actorAddress: applicantWallet || app.applicant_wallet,
      action: "NGO_REACTIVATION_REQUESTED",
      resourceType: "NGO_APPLICATION",
      resourceId: applicationId,
      status: "SUCCESS",
      details: { reason },
    });

    return db.prepare("SELECT * FROM ngo_applications WHERE id = ?").get(applicationId);
  }

  /**
   * Reviews an application (Approve, Reject, or put Under Review).
   * Enforces Conflict-of-Interest Safeguards: Reviewer cannot be the applicant.
   */
  reviewApplication({
    applicationId,
    reviewerId,
    reviewerWallet,
    decision,
    rejectionReason = null,
    internalNote = null,
    verificationTracks = {},
  }) {
    const app = db.prepare("SELECT * FROM ngo_applications WHERE id = ?").get(applicationId);
    if (!app) {
      throw new Error(`Application '${applicationId}' not found.`);
    }

    if (app.status === "APPROVED" && decision === "APPROVED") {
      throw new Error("Application has already been approved.");
    }

    // Conflict of Interest Safeguard:
    if (reviewerWallet && app.applicant_wallet.toLowerCase() === reviewerWallet.toLowerCase()) {
      logSecurityEvent({
        actorAddress: reviewerWallet,
        action: "CONFLICT_OF_INTEREST_ATTEMPT",
        resourceType: "NGO_APPLICATION",
        resourceId: applicationId,
        status: "DENIED",
        details: { message: "Reviewer attempted to review their own application." },
      });
      const err = new Error("Conflict of Interest: You cannot review an application you submitted.");
      err.statusCode = 403;
      throw err;
    }

    // Update separate verification track statuses
    const legalRegVerified = verificationTracks.legalRegVerified ? 1 : 0;
    const bankVerified = verificationTracks.bankVerified ? 1 : 0;
    const tax80gVerified = verificationTracks.tax80gVerified ? 1 : 0;
    const fcraVerified = verificationTracks.fcraVerified ? 1 : 0;

    if (decision === "UNDER_REVIEW") {
      db.prepare(`
        UPDATE ngo_applications
        SET status = 'UNDER_REVIEW',
            assigned_reviewer_id = ?,
            legal_reg_verified = ?,
            bank_verified = ?,
            tax_80g_verified = ?,
            fcra_verified = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reviewerId, legalRegVerified, bankVerified, tax80gVerified, fcraVerified, applicationId);
    } else if (decision === "REJECTED") {
      if (!rejectionReason) {
        throw new Error("A rejection reason must be provided when rejecting an onboarding application.");
      }
      db.prepare(`
        UPDATE ngo_applications
        SET status = 'REJECTED',
            assigned_reviewer_id = ?,
            rejection_reason = ?,
            legal_reg_verified = ?,
            bank_verified = ?,
            tax_80g_verified = ?,
            fcra_verified = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reviewerId, rejectionReason, legalRegVerified, bankVerified, tax80gVerified, fcraVerified, applicationId);
    } else if (decision === "APPROVED") {
      const ngoId = `ngo-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      // Insert NGO into authoritative ngos table
      db.prepare(`
        INSERT INTO ngos (
          id, name, category, short_description, full_description, verified_wallet,
          legal_reg_no, status, raised_inr, goal_inr, donors_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 1000000, 0)
      `).run(
        ngoId,
        app.legal_name,
        app.category,
        `Verified ${app.category} organization.`,
        `Non-profit organization ${app.legal_name} fully verified on TrustDonate.`,
        app.applicant_wallet,
        app.registration_number
      );

      // Find or provision user for applicant
      let user = db.prepare("SELECT * FROM users WHERE LOWER(wallet_address) = LOWER(?)").get(app.applicant_wallet);
      if (!user) {
        const userId = `usr-${crypto.randomBytes(6).toString("hex")}`;
        db.prepare(`
          INSERT INTO users (id, wallet_address, display_name, email, global_role)
          VALUES (?, ?, ?, ?, 'DONOR')
        `).run(userId, app.applicant_wallet, app.legal_name, app.contact_email);
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      }

      // Assign applicant as NGO_ADMIN
      db.prepare(`
        INSERT OR IGNORE INTO ngo_memberships (id, ngo_id, user_id, role, status)
        VALUES (?, ?, ?, 'NGO_ADMIN', 'ACTIVE')
      `).run(`mem-${crypto.randomBytes(6).toString("hex")}`, ngoId, user.id);

      // Create default governance policy
      db.prepare(`
        INSERT OR IGNORE INTO approval_policies (id, ngo_id, name, per_tx_limit_inr, daily_limit_inr, required_approvals, allowed_tokens_json)
        VALUES (?, ?, 'Standard Governance Policy', 200000, 1000000, 2, '["POL","USDC","USDT"]')
      `).run(`pol-${ngoId}`, ngoId);

      // Update application
      db.prepare(`
        UPDATE ngo_applications
        SET status = 'APPROVED',
            ngo_id = ?,
            assigned_reviewer_id = ?,
            legal_reg_verified = 1,
            bank_verified = 1,
            tax_80g_verified = ?,
            fcra_verified = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(ngoId, reviewerId, tax80gVerified, fcraVerified, applicationId);

      // Invalidate applicant's existing session so new NGO_ADMIN role is immediately active
      authService.revokeUserSessions(user.id, reviewerWallet || "SYSTEM");
    } else {
      throw new Error(`Invalid decision '${decision}'. Must be one of: [UNDER_REVIEW, APPROVED, REJECTED]`);
    }

    if (internalNote) {
      db.prepare(`
        INSERT INTO ngo_application_notes (id, application_id, author_id, author_role, note, is_internal)
        VALUES (?, ?, ?, 'REVIEWER', ?, 1)
      `).run(`note-${Date.now()}-${Math.floor(Math.random() * 100000)}`, applicationId, reviewerId, internalNote);
    }

    logSecurityEvent({
      actorAddress: reviewerWallet || reviewerId,
      action: `NGO_APPLICATION_${decision}`,
      resourceType: "NGO_APPLICATION",
      resourceId: applicationId,
      status: "SUCCESS",
      details: { decision, rejectionReason, verificationTracks },
    });

    return db.prepare("SELECT * FROM ngo_applications WHERE id = ?").get(applicationId);
  }

  /**
   * Suspends an NGO and invalidates all its active member sessions.
   */
  suspendNgo({ ngoId, reviewerId, reviewerWallet, reason }) {
    if (!reason) {
      throw new Error("A suspension justification reason is required.");
    }

    const ngo = db.prepare("SELECT * FROM ngos WHERE id = ?").get(ngoId);
    if (!ngo) {
      throw new Error(`NGO '${ngoId}' not found.`);
    }

    db.prepare(`UPDATE ngos SET status = 'SUSPENDED' WHERE id = ?`).run(ngoId);
    db.prepare(`UPDATE ngo_applications SET status = 'SUSPENDED' WHERE ngo_id = ?`).run(ngoId);

    // Invalidate sessions of all active members of this NGO
    const members = db.prepare("SELECT user_id FROM ngo_memberships WHERE ngo_id = ?").all(ngoId);
    for (const m of members) {
      authService.revokeUserSessions(m.user_id, reviewerWallet || "SYSTEM");
    }

    logSecurityEvent({
      actorAddress: reviewerWallet || reviewerId,
      action: "NGO_SUSPENDED",
      resourceType: "NGO",
      resourceId: ngoId,
      status: "SUCCESS",
      details: { reason, membersAffected: members.length },
    });

    return { success: true, ngoId, status: "SUSPENDED", reason };
  }

  /**
   * Generates a single-use team member invitation token with expiration.
   */
  createInvitation({ ngoId, email, role, invitedById, actorAddress }) {
    const validRoles = ["NGO_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "VIEWER"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role '${role}'. Must be one of: [${validRoles.join(", ")}]`);
    }

    const inviteToken = `inv_${crypto.randomBytes(24).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const inviteId = `invite-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    db.prepare(`
      INSERT INTO ngo_invitations (id, ngo_id, email, role, invite_token, invited_by_id, status, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(inviteId, ngoId, email.toLowerCase(), role, inviteToken, invitedById, expiresAt);

    logSecurityEvent({
      actorAddress: actorAddress || invitedById,
      action: "NGO_MEMBER_INVITATION_CREATED",
      resourceType: "NGO_INVITATION",
      resourceId: inviteId,
      ngoId,
      status: "SUCCESS",
      details: { email, role },
    });

    return {
      inviteId,
      ngoId,
      email,
      role,
      inviteToken,
      expiresAt,
    };
  }

  /**
   * Accepts an invitation and links wallet to NGO team membership.
   */
  acceptInvitation({ inviteToken, walletAddress }) {
    const invite = db.prepare("SELECT * FROM ngo_invitations WHERE invite_token = ?").get(inviteToken);
    if (!invite) {
      throw new Error("Invalid invitation token.");
    }

    if (invite.status !== "PENDING") {
      throw new Error(`Invitation is already ${invite.status.toLowerCase()}.`);
    }

    if (new Date(invite.expires_at) < new Date()) {
      db.prepare("UPDATE ngo_invitations SET status = 'EXPIRED' WHERE id = ?").run(invite.id);
      throw new Error("Invitation has expired. Please request a new invitation from your NGO administrator.");
    }

    // Resolve or provision user
    let user = db.prepare("SELECT * FROM users WHERE LOWER(wallet_address) = LOWER(?)").get(walletAddress);
    if (!user) {
      const newUserId = `usr-${crypto.randomBytes(6).toString("hex")}`;
      db.prepare(`
        INSERT INTO users (id, wallet_address, display_name, email, global_role)
        VALUES (?, ?, ?, ?, 'DONOR')
      `).run(newUserId, walletAddress, invite.email.split("@")[0], invite.email);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(newUserId);
    }

    // Create or update membership
    const existingMembership = db.prepare(`
      SELECT * FROM ngo_memberships WHERE ngo_id = ? AND user_id = ?
    `).get(invite.ngo_id, user.id);

    if (existingMembership) {
      db.prepare(`
        UPDATE ngo_memberships SET role = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(invite.role, existingMembership.id);
    } else {
      db.prepare(`
        INSERT INTO ngo_memberships (id, ngo_id, user_id, role, status)
        VALUES (?, ?, ?, ?, 'ACTIVE')
      `).run(`mem-${crypto.randomBytes(6).toString("hex")}`, invite.ngo_id, user.id, invite.role);
    }

    // Mark invitation as single-use accepted
    db.prepare("UPDATE ngo_invitations SET status = 'ACCEPTED' WHERE id = ?").run(invite.id);

    // Invalidate prior sessions to issue new permissions upon next request
    authService.revokeUserSessions(user.id, walletAddress);

    logSecurityEvent({
      actorAddress: walletAddress,
      action: "NGO_INVITATION_ACCEPTED",
      resourceType: "NGO_MEMBERSHIP",
      resourceId: invite.ngo_id,
      ngoId: invite.ngo_id,
      status: "SUCCESS",
      details: { role: invite.role },
    });

    return {
      success: true,
      ngoId: invite.ngo_id,
      role: invite.role,
      userId: user.id,
    };
  }

  /**
   * Updates a member's role and invalidates their active sessions.
   */
  updateMemberRole({ ngoId, userId, newRole, actorAddress }) {
    const validRoles = ["NGO_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "VIEWER"];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role '${newRole}'. Must be one of: [${validRoles.join(", ")}]`);
    }

    const membership = db.prepare(`SELECT * FROM ngo_memberships WHERE ngo_id = ? AND user_id = ?`).get(ngoId, userId);
    if (!membership) {
      throw new Error(`Membership not found for user '${userId}' in NGO '${ngoId}'.`);
    }

    db.prepare(`
      UPDATE ngo_memberships SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(newRole, membership.id);

    // Invalidate sessions immediately so new role permissions apply
    authService.revokeUserSessions(userId, actorAddress);

    logSecurityEvent({
      actorAddress,
      action: "NGO_MEMBER_ROLE_UPDATED",
      resourceType: "NGO_MEMBERSHIP",
      resourceId: membership.id,
      ngoId,
      status: "SUCCESS",
      details: { oldRole: membership.role, newRole },
    });

    return { success: true, ngoId, userId, role: newRole };
  }

  /**
   * Revokes a team member's role and invalidates all their active sessions.
   */
  removeMember({ ngoId, userId, actorAddress }) {
    const membership = db.prepare(`SELECT * FROM ngo_memberships WHERE ngo_id = ? AND user_id = ?`).get(ngoId, userId);
    if (!membership) {
      throw new Error(`Membership not found for user '${userId}' in NGO '${ngoId}'.`);
    }

    db.prepare(`UPDATE ngo_memberships SET status = 'REVOKED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(membership.id);

    // Instant session invalidation
    authService.revokeUserSessions(userId, actorAddress);

    logSecurityEvent({
      actorAddress,
      action: "NGO_MEMBER_REMOVED",
      resourceType: "NGO_MEMBERSHIP",
      resourceId: membership.id,
      ngoId,
      status: "SUCCESS",
      details: { removedUserId: userId },
    });

    return true;
  }
}

module.exports = new OnboardingService();
