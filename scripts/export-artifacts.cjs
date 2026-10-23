const fs = require("fs");
const path = require("path");

function exportArtifacts() {
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const targetDir = path.join(__dirname, "../src/contracts/abis");

  fs.mkdirSync(targetDir, { recursive: true });

  const contracts = [
    "NgoRegistry.sol/NgoRegistry.json",
    "TrustDonateTreasury.sol/TrustDonateTreasury.json",
    "MilestoneEscrow.sol/MilestoneEscrow.json",
    "MultiSigTreasury.sol/MultiSigTreasury.json",
    "MockERC20.sol/MockERC20.json",
  ];

  for (const c of contracts) {
    const src = path.join(artifactsDir, c);
    if (fs.existsSync(src)) {
      const data = JSON.parse(fs.readFileSync(src, "utf-8"));
      const outName = path.basename(c);
      const outPath = path.join(targetDir, outName);
      fs.writeFileSync(
        outPath,
        JSON.stringify(
          {
            contractName: data.contractName,
            abi: data.abi,
          },
          null,
          2
        )
      );
      console.log(`✓ Exported ABI: ${data.contractName} -> ${outPath}`);
    }
  }

  // Create standard ES Module index file for frontend
  const indexJs = `// Automatically generated contract exports for TrustDonate frontend
import addressRegistry from "./address-registry.json";
import NgoRegistryAbi from "./abis/NgoRegistry.json";
import TrustDonateTreasuryAbi from "./abis/TrustDonateTreasury.json";
import MilestoneEscrowAbi from "./abis/MilestoneEscrow.json";
import MultiSigTreasuryAbi from "./abis/MultiSigTreasury.json";
import MockERC20Abi from "./abis/MockERC20.json";

export {
  addressRegistry,
  NgoRegistryAbi,
  TrustDonateTreasuryAbi,
  MilestoneEscrowAbi,
  MultiSigTreasuryAbi,
  MockERC20Abi,
};
`;

  fs.writeFileSync(path.join(__dirname, "../src/contracts/index.js"), indexJs);
  console.log("✓ Generated src/contracts/index.js for frontend integration.");
}

if (require.main === module) {
  exportArtifacts();
}

module.exports = { exportArtifacts };
