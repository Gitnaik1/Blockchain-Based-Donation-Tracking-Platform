const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");
const onboardingService = require("../services/onboardingService.cjs");

function formatApplicationResponse(app) {
  let docs = {};
  try {
    docs = JSON.parse(app.documents_json || "{}");
  } catch {}

  let rep = null;
  try {
    if (app.representative_json) rep = JSON.parse(app.representative_json);
  } catch {}

  return {
    id: app.id,
    legalName: app.legal_name,
    registrationNumber: app.registration_number,
    category: app.category,
    contactEmail: app.contact_email,
    applicantWallet: app.applicant_wallet,
    panNumber: app.pan_number,
    registeredAddress: app.registered_address,
    website: app.website,
    establishedYear: app.established_year,
    representative: rep,
    documents: docs,
    status: app.status,
    verificationTracks: {
      legalRegVerified: Boolean(app.legal_reg_verified),
      bankVerified: Boolean(app.bank_verified),
      tax80gVerified: Boolean(app.tax_80g_verified),
      fcraVerified: Boolean(app.fcra_verified),
    },
    resubmissionCount: app.resubmission_count || 0,
    resubmittedAt: app.resubmitted_at,
    reactivationReason: app.reactivation_reason,
    verificationNotes: app.verification_notes,
    assignedReviewerId: app.assigned_reviewer_id,
    submittedAt: app.submitted_at,
    reviewedAt: app.reviewed_at,
    rejectionReason: app.rejection_reason,
    ngoId: app.ngo_id,
  };
}

/**
 * POST /api/v1/onboarding/apply & /register
 * Allows an NGO representative to submit or draft an onboarding application.
 */
const handleRegister = (req, res, next) => {
  try {
    const {
      legalName,
      registrationNumber,
      category,
      contactEmail,
      applicantWallet,
      panNumber,
      registeredAddress,
      website,
      establishedYear,
      representative,
      documents,
      status,
    } = req.body;

    const application = onboardingService.submitApplication({
      legalName,
      registrationNumber,
      category,
      contactEmail,
      applicantWallet,
      panNumber,
      registeredAddress,
      website,
      establishedYear,
      representative,
      documents,
      status,
    });

    res.status(201).json({
      success: true,
      data: formatApplicationResponse(application),
    });
  } catch (err) {
    next(err);
  }
};

router.post("/apply", handleRegister);
router.post("/register", handleRegister);

/**
 * GET /api/v1/onboarding/applications/:id & /status/:id
 * Retrieves the verification status of an application.
 */
const handleGetStatus = (req, res) => {
  const application = db.prepare("SELECT * FROM ngo_applications WHERE id = ?").get(req.params.id);
  if (!application) {
    return res.status(404).json({
      success: false,
      error: { code: "APPLICATION_NOT_FOUND", message: `Application '${req.params.id}' not found.` },
    });
  }

  res.json({
    success: true,
    data: formatApplicationResponse(application),
  });
};

router.get("/applications/:id", handleGetStatus);
router.get("/status/:id", handleGetStatus);

/**
 * POST /api/v1/onboarding/applications/:id/resubmit & /:id/resubmit
 * Resubmits application after rejection with updated evidence.
 */
const handleResubmit = (req, res, next) => {
  try {
    const { applicantWallet, documents, updatedDetails } = req.body;
    const application = onboardingService.resubmitApplication({
      applicationId: req.params.id,
      applicantWallet,
      documents,
      updatedDetails,
    });

    res.json({
      success: true,
      message: "Application resubmitted successfully for review.",
      data: formatApplicationResponse(application),
    });
  } catch (err) {
    next(err);
  }
};

router.post("/applications/:id/resubmit", handleResubmit);
router.post("/:id/resubmit", handleResubmit);

/**
 * POST /api/v1/onboarding/applications/:id/reactivate & /:id/reactivate
 * Requests reactivation for a suspended application.
 */
const handleReactivate = (req, res, next) => {
  try {
    const { applicantWallet, reason } = req.body;
    const application = onboardingService.requestReactivation({
      applicationId: req.params.id,
      applicantWallet,
      reason,
    });

    res.json({
      success: true,
      message: "Reactivation request submitted.",
      data: formatApplicationResponse(application),
    });
  } catch (err) {
    next(err);
  }
};

router.post("/applications/:id/reactivate", handleReactivate);
router.post("/:id/reactivate", handleReactivate);

/**
 * POST /api/v1/onboarding/invitations/accept
 * Single-use invitation acceptance linking wallet to NGO organization.
 */
router.post("/invitations/accept", (req, res, next) => {
  try {
    const { inviteToken, walletAddress } = req.body;
    if (!inviteToken || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "inviteToken and walletAddress are required." },
      });
    }

    const result = onboardingService.acceptInvitation({ inviteToken, walletAddress });
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
