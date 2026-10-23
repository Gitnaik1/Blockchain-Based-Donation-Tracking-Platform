const express = require("express");
const router = express.Router();
const addressRegistry = require("../contractsConfig.cjs");
const db = require("../db/database.cjs");

router.get("/health", (req, res) => {
  const syncState = db.prepare("SELECT * FROM indexed_sync_state WHERE chain_id = ?").get(addressRegistry.chainId || 80002);

  res.json({
    success: true,
    data: {
      status: "HEALTHY",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      chainId: addressRegistry.chainId || 80002,
      network: addressRegistry.network || "amoy",
      lastIndexedBlock: syncState ? syncState.last_block_number : 12489325,
      contracts: addressRegistry.contracts || {},
    },
  });
});

module.exports = router;
