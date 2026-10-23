const express = require("express");
const router = express.Router();
const addressRegistry = require("../contractsConfig.cjs");

router.get("/config", (req, res) => {
  const contracts = addressRegistry.contracts || {};

  res.json({
    success: true,
    data: {
      chainId: addressRegistry.chainId || 80002,
      chainHex: "0x" + (addressRegistry.chainId || 80002).toString(16),
      networkName: "Polygon Amoy Testnet",
      contracts: {
        ngoRegistry: contracts.NgoRegistry,
        treasury: contracts.TrustDonateTreasury,
        milestoneEscrow: contracts.MilestoneEscrow,
        multiSig: contracts.MultiSigTreasury,
      },
      supportedTokens: [
        {
          symbol: "POL",
          name: "Native POL",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
          isNative: true,
        },
        {
          symbol: "USDC",
          name: "USD Coin (Amoy)",
          address: contracts.USDC || "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
          decimals: 6,
          isNative: false,
        },
        {
          symbol: "USDT",
          name: "Tether USD",
          address: contracts.USDT || "0x1205f31718499dBf1fCa446663B532Ef87481fe1",
          decimals: 6,
          isNative: false,
        },
      ],
      rpcUrls: ["https://rpc-amoy.polygon.technology/"],
      blockExplorer: "https://amoy.polygonscan.com/",
    },
  });
});

module.exports = router;
