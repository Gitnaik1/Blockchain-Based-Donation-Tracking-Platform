const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NgoRegistry", function () {
  let ngoRegistry;
  let owner, ngoAdmin, nonOwner, recipient;

  beforeEach(async function () {
    [owner, ngoAdmin, nonOwner, recipient] = await ethers.getSigners();
    const NgoRegistry = await ethers.getContractFactory("NgoRegistry");
    ngoRegistry = await NgoRegistry.deploy(owner.address);
    await ngoRegistry.waitForDeployment();
  });

  describe("Registration", function () {
    it("should allow owner to register a verified NGO", async function () {
      const tx = await ngoRegistry.registerNgo(
        "Green Canopy Initiative",
        "Environment",
        ngoAdmin.address,
        "REG-2026-001",
        "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
      );

      await expect(tx)
        .to.emit(ngoRegistry, "NgoRegistered")
        .withArgs(
          1,
          "Green Canopy Initiative",
          "Environment",
          ngoAdmin.address,
          "REG-2026-001",
          "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
          await ethers.provider.getBlock("latest").then(b => b.timestamp)
        );

      expect(await ngoRegistry.isNgoActive(1)).to.be.true;
      expect(await ngoRegistry.totalNgos()).to.equal(1n);

      const details = await ngoRegistry.getNgoDetails(1);
      expect(details.name).to.equal("Green Canopy Initiative");
      expect(details.verifiedWallet).to.equal(ngoAdmin.address);
    });

    it("should reject registration from unauthorized caller", async function () {
      await expect(
        ngoRegistry.connect(nonOwner).registerNgo(
          "Fake NGO",
          "Scam",
          nonOwner.address,
          "REG-FAKE",
          "QmFake"
        )
      ).to.be.revertedWithCustomError(ngoRegistry, "OwnableUnauthorizedAccount");
    });

    it("should reject address(0) or empty string", async function () {
      await expect(
        ngoRegistry.registerNgo(
          "Invalid NGO",
          "Category",
          ethers.ZeroAddress,
          "REG-002",
          "QmValid"
        )
      ).to.be.revertedWithCustomError(ngoRegistry, "InvalidAddress");

      await expect(
        ngoRegistry.registerNgo(
          "",
          "Category",
          recipient.address,
          "REG-002",
          "QmValid"
        )
      ).to.be.revertedWithCustomError(ngoRegistry, "EmptyString");
    });

    it("should reject duplicate wallet registration", async function () {
      await ngoRegistry.registerNgo(
        "First NGO",
        "Category",
        ngoAdmin.address,
        "REG-001",
        "QmHash1"
      );

      await expect(
        ngoRegistry.registerNgo(
          "Second NGO",
          "Category",
          ngoAdmin.address,
          "REG-002",
          "QmHash2"
        )
      ).to.be.revertedWithCustomError(ngoRegistry, "WalletAlreadyRegistered");
    });
  });

  describe("Status & Wallet Updates", function () {
    beforeEach(async function () {
      await ngoRegistry.registerNgo(
        "Asha Foundation",
        "Education",
        ngoAdmin.address,
        "TRUST-MH-2026",
        "QmKycHash"
      );
    });

    it("should allow owner to suspend and revoke an NGO", async function () {
      // Suspend
      await ngoRegistry.setNgoStatus(1, 2); // 2 = SUSPENDED
      expect(await ngoRegistry.isNgoActive(1)).to.be.false;

      // Reactivate
      await ngoRegistry.setNgoStatus(1, 1); // 1 = ACTIVE
      expect(await ngoRegistry.isNgoActive(1)).to.be.true;

      // Revoke
      await ngoRegistry.setNgoStatus(1, 3); // 3 = REVOKED
      expect(await ngoRegistry.isNgoActive(1)).to.be.false;
    });

    it("should allow updating verified operational wallet", async function () {
      await ngoRegistry.updateNgoWallet(1, recipient.address);
      const details = await ngoRegistry.getNgoDetails(1);
      expect(details.verifiedWallet).to.equal(recipient.address);

      const byWallet = await ngoRegistry.getNgoByWallet(recipient.address);
      expect(byWallet.id).to.equal(1n);
    });

    it("should allow pausing and prevent registrations while paused", async function () {
      await ngoRegistry.pause();
      await expect(
        ngoRegistry.registerNgo(
          "Paused NGO",
          "Cat",
          recipient.address,
          "REG-PAUSED",
          "QmHash"
        )
      ).to.be.revertedWithCustomError(ngoRegistry, "EnforcedPause");

      await ngoRegistry.unpause();
      await expect(
        ngoRegistry.registerNgo(
          "Paused NGO",
          "Cat",
          recipient.address,
          "REG-PAUSED",
          "QmHash"
        )
      ).to.not.be.reverted;
    });
  });
});
