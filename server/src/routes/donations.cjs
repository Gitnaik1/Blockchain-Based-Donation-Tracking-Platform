const express = require("express");
const router = express.Router();
const donationService = require("../services/donationService.cjs");

router.post("/prepare", (req, res, next) => {
  try {
    const { ngoId, tokenSymbol, amount, donorAddress } = req.body;
    const prepData = donationService.prepareDonation({
      ngoId,
      tokenSymbol,
      amount,
      donorAddress,
    });

    res.json({
      success: true,
      data: prepData,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/record", (req, res, next) => {
  try {
    const { txHash, blockNumber, ngoId, donorAddress, donorName, tokenSymbol, amount } = req.body;
    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_TX_HASH", message: "Transaction hash is required." },
      });
    }

    const recorded = donationService.recordDonation({
      txHash,
      blockNumber,
      ngoId,
      donorAddress,
      donorName,
      tokenSymbol,
      amount,
    });

    res.json({
      success: true,
      data: recorded,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", (req, res, next) => {
  try {
    const { token, ngoId, donorAddress, page, limit } = req.query;
    const result = donationService.getDonations({
      token,
      ngoId,
      donorAddress,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.donations,
      summary: result.summary,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/by-tx/:txHash", (req, res) => {
  const donation = donationService.getDonationByTx(req.params.txHash);
  if (!donation) {
    return res.status(404).json({
      success: false,
      error: { code: "TRANSACTION_NOT_FOUND", message: `Donation with hash '${req.params.txHash}' not found.` },
    });
  }

  res.json({
    success: true,
    data: donation,
  });
});

router.get("/by-wallet/:address", (req, res, next) => {
  try {
    const result = donationService.getDonations({
      donorAddress: req.params.address,
      page: req.query.page || 1,
      limit: req.query.limit || 50,
    });

    res.json({
      success: true,
      data: result.donations,
      summary: result.summary,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", (req, res) => {
  const donation = donationService.getDonationByTx(req.params.id);
  if (!donation) {
    return res.status(404).json({
      success: false,
      error: { code: "DONATION_NOT_FOUND", message: "Donation record not found" },
    });
  }

  res.json({
    success: true,
    data: donation,
  });
});

module.exports = router;
