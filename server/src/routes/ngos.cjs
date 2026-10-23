const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");

router.get("/", (req, res) => {
  const ngos = db.prepare(`
    SELECT 
      id, on_chain_id AS onChainId, name, category, short_description AS shortDescription,
      full_description AS fullDescription, verified_wallet AS verifiedWallet,
      contract_address AS contractAddress, legal_reg_no AS legalRegNo,
      ipfs_kyc_cid AS ipfsAuditReport, status, raised_inr AS raised,
      goal_inr AS goal, donors_count AS donorsCount
    FROM ngos
    WHERE status != 'REVOKED'
    ORDER BY id ASC
  `).all();

  res.json({
    success: true,
    data: ngos,
  });
});

router.get("/:id", (req, res) => {
  const ngo = db.prepare(`
    SELECT 
      id, on_chain_id AS onChainId, name, category, short_description AS shortDescription,
      full_description AS fullDescription, verified_wallet AS verifiedWallet,
      contract_address AS contractAddress, legal_reg_no AS legalRegNo,
      ipfs_kyc_cid AS ipfsAuditReport, status, raised_inr AS raised,
      goal_inr AS goal, donors_count AS donorsCount
    FROM ngos
    WHERE id = ?
  `).get(req.params.id);

  if (!ngo) {
    return res.status(404).json({
      success: false,
      error: { code: "NGO_NOT_FOUND", message: `NGO with ID '${req.params.id}' not found.` },
    });
  }

  // Fetch recent donations for this NGO
  const recentDonations = db.prepare(`
    SELECT id, tx_hash AS txHash, donor_name AS donor, amount_formatted AS amountCrypto,
           inr_equivalent AS amountInr, token_symbol AS token, tax_receipt_no AS taxReceiptNo,
           status, created_at AS date
    FROM donations
    WHERE ngo_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(req.params.id);

  res.json({
    success: true,
    data: {
      ...ngo,
      recentDonations,
    },
  });
});

router.get("/:id/stats", (req, res) => {
  const ngo = db.prepare("SELECT * FROM ngos WHERE id = ?").get(req.params.id);
  if (!ngo) {
    return res.status(404).json({
      success: false,
      error: { code: "NGO_NOT_FOUND", message: "NGO not found" },
    });
  }

  const donationsSummary = db.prepare(`
    SELECT 
      COUNT(*) AS total_donations,
      COALESCE(SUM(inr_equivalent), 0) AS total_raised_inr,
      COUNT(DISTINCT donor_address) AS unique_donors
    FROM donations
    WHERE ngo_id = ?
  `).get(req.params.id);

  res.json({
    success: true,
    data: {
      ngoId: ngo.id,
      name: ngo.name,
      totalRaisedInr: donationsSummary.total_raised_inr,
      donationCount: donationsSummary.total_donations,
      uniqueDonors: donationsSummary.unique_donors,
      goalInr: ngo.goal_inr,
      percentFunded: ngo.goal_inr > 0 ? Math.round((donationsSummary.total_raised_inr / ngo.goal_inr) * 100) : 0,
    },
  });
});

module.exports = router;
