const path = require("path");
const fs = require("fs");

const registryPath = path.join(__dirname, "../../src/contracts/address-registry.json");
let addressRegistry = {
  chainId: 80002,
  network: "amoy",
  contracts: {
    NgoRegistry: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    TrustDonateTreasury: "0x71F39082Bc45199201aDeF80B91244019aA2C81B",
    MilestoneEscrow: "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
    MultiSigTreasury: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
    USDC: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
    USDT: "0x1205f31718499dBf1fCa446663B532Ef87481fe1",
  },
};

if (fs.existsSync(registryPath)) {
  try {
    addressRegistry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
  } catch (err) {
    console.warn("Failed to parse address-registry.json, using defaults.");
  }
}

module.exports = addressRegistry;
