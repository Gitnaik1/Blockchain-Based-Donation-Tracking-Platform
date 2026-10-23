const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const allSigners = await ethers.getSigners();
  const deployer = allSigners[0];
  const network = await ethers.provider.getNetwork();

  console.log("=================================================");
  console.log("TrustDonate Contract Deployment");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("=================================================");

  // 1. Deploy NgoRegistry
  console.log("\nDeploying NgoRegistry...");
  const NgoRegistry = await ethers.getContractFactory("NgoRegistry");
  const ngoRegistry = await NgoRegistry.deploy(deployer.address);
  await ngoRegistry.waitForDeployment();
  const ngoRegistryAddress = await ngoRegistry.getAddress();
  console.log(`✓ NgoRegistry deployed to: ${ngoRegistryAddress}`);

  // Register the 3 initial NGOs with valid operational addresses
  console.log("Registering verified NGOs...");
  await ngoRegistry.registerNgo(
    "Green Canopy Initiative",
    "Environment",
    allSigners[1].address,
    "REG-AMAZON-2026-001",
    "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
  );
  await ngoRegistry.registerNgo(
    "Hope Horizon Schools",
    "Education",
    allSigners[2].address,
    "REG-EDU-2026-002",
    "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R"
  );
  await ngoRegistry.registerNgo(
    "CleanWater Labs",
    "Healthcare",
    allSigners[3].address,
    "REG-WATER-2026-003",
    "QmbWqxBEKC3P8tTXBSFL1ZZBodj125JYf4txJS4UCE2ndC"
  );
  console.log("✓ 3 NGOs registered on-chain.");

  // 2. Deploy TrustDonateTreasury
  console.log("\nDeploying TrustDonateTreasury...");
  const TrustDonateTreasury = await ethers.getContractFactory("TrustDonateTreasury");
  const treasury = await TrustDonateTreasury.deploy(deployer.address, ngoRegistryAddress);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`✓ TrustDonateTreasury deployed to: ${treasuryAddress}`);

  // 3. Deploy MultiSigTreasury (3-of-5 threshold)
  console.log("\nDeploying MultiSigTreasury (3-of-5 threshold)...");
  const multisigSigners = [
    deployer.address,
    allSigners[4].address,
    allSigners[5].address,
    allSigners[6].address,
    allSigners[7].address,
  ];
  const MultiSigTreasury = await ethers.getContractFactory("MultiSigTreasury");
  const multiSig = await MultiSigTreasury.deploy(multisigSigners, 3);
  await multiSig.waitForDeployment();
  const multiSigAddress = await multiSig.getAddress();
  console.log(`✓ MultiSigTreasury deployed to: ${multiSigAddress}`);

  // 4. Deploy MilestoneEscrow
  console.log("\nDeploying MilestoneEscrow...");
  const MilestoneEscrow = await ethers.getContractFactory("MilestoneEscrow");
  const escrow = await MilestoneEscrow.deploy(deployer.address, treasuryAddress, multiSigAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`✓ MilestoneEscrow deployed to: ${escrowAddress}`);

  // Configure Treasury to authorize Escrow
  await treasury.setMilestoneEscrow(escrowAddress);
  console.log("✓ Treasury milestone escrow permissions configured.");

  // 5. Deploy Mock Tokens for Testing if on local network
  let usdcAddress = "0x41e94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582";
  let usdtAddress = "0x1205f31718499dBf1fCa446663B532Ef87481fe1";

  if (network.chainId === 31337n) {
    console.log("\nDeploying local MockERC20 tokens...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUsdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUsdc.waitForDeployment();
    usdcAddress = await mockUsdc.getAddress();

    const mockUsdt = await MockERC20.deploy("Tether USD", "USDT", 6);
    await mockUsdt.waitForDeployment();
    usdtAddress = await mockUsdt.getAddress();

    console.log(`✓ Local Mock USDC deployed to: ${usdcAddress}`);
    console.log(`✓ Local Mock USDT deployed to: ${usdtAddress}`);

    await treasury.setAllowedToken(usdcAddress, true, 6, "USDC");
    await treasury.setAllowedToken(usdtAddress, true, 6, "USDT");
    console.log("✓ Mock tokens added to Treasury allowlist.");
  }

  // 6. Write address registry file
  const registryData = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      NgoRegistry: ngoRegistryAddress,
      TrustDonateTreasury: treasuryAddress,
      MilestoneEscrow: escrowAddress,
      MultiSigTreasury: multiSigAddress,
      USDC: usdcAddress,
      USDT: usdtAddress,
    },
  };

  const exportPath = path.join(__dirname, "../src/contracts/address-registry.json");
  fs.mkdirSync(path.dirname(exportPath), { recursive: true });
  fs.writeFileSync(exportPath, JSON.stringify(registryData, null, 2));
  console.log(`\n✓ Address registry exported to ${exportPath}`);

  return registryData;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
