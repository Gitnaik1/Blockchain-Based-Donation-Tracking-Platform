const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustDonateTreasury", function () {
  let ngoRegistry, treasury, mockUsdc, mockUsdt;
  let owner, ngoAdmin, donor1, donor2, escrowContract;

  beforeEach(async function () {
    [owner, ngoAdmin, donor1, donor2, escrowContract] = await ethers.getSigners();

    // 1. Deploy Registry
    const NgoRegistry = await ethers.getContractFactory("NgoRegistry");
    ngoRegistry = await NgoRegistry.deploy(owner.address);
    await ngoRegistry.waitForDeployment();

    // Register active NGO with id = 1
    await ngoRegistry.registerNgo(
      "Asha Foundation",
      "Education",
      ngoAdmin.address,
      "REG-001",
      "QmKycHash"
    );

    // 2. Deploy Treasury
    const TrustDonateTreasury = await ethers.getContractFactory("TrustDonateTreasury");
    treasury = await TrustDonateTreasury.deploy(owner.address, await ngoRegistry.getAddress());
    await treasury.waitForDeployment();

    // 3. Deploy Mock Tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUsdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUsdc.waitForDeployment();

    mockUsdt = await MockERC20.deploy("Tether USD", "USDT", 6);
    await mockUsdt.waitForDeployment();

    // Whitelist USDC & USDT on Treasury
    await treasury.setAllowedToken(await mockUsdc.getAddress(), true, 6, "USDC");
    await treasury.setAllowedToken(await mockUsdt.getAddress(), true, 6, "USDT");

    // Configure Escrow
    await treasury.setMilestoneEscrow(escrowContract.address);

    // Fund donors
    await mockUsdc.mint(donor1.address, 10000n * 10n ** 6n);
    await mockUsdc.connect(donor1).approve(await treasury.getAddress(), ethers.MaxUint256);

    await mockUsdt.mint(donor1.address, 5000n * 10n ** 6n);
    await mockUsdt.connect(donor1).approve(await treasury.getAddress(), ethers.MaxUint256);
  });

  describe("Native POL Donations", function () {
    it("should accept valid native POL donation and update accounting", async function () {
      const polAmount = ethers.parseEther("2.5");
      const tx = await treasury.connect(donor1).donatePOL(1, "80G-2026-0001", {
        value: polAmount,
      });

      await expect(tx)
        .to.emit(treasury, "DonationReceived")
        .withArgs(
          (val) => typeof val === "string" && val.startsWith("0x"),
          1n,
          donor1.address,
          ethers.ZeroAddress,
          polAmount,
          "80G-2026-0001",
          (val) => val > 0n
        );

      expect(await treasury.totalRaisedByNgo(1, ethers.ZeroAddress)).to.equal(polAmount);
      expect(await treasury.availableBalanceByNgo(1, ethers.ZeroAddress)).to.equal(polAmount);
      expect(await ethers.provider.getBalance(await treasury.getAddress())).to.equal(polAmount);
    });

    it("should reject 0 value POL donation", async function () {
      await expect(
        treasury.connect(donor1).donatePOL(1, "80G-2026-0002", { value: 0 })
      ).to.be.revertedWithCustomError(treasury, "ZeroAmount");
    });

    it("should reject donation to unverified or suspended NGO", async function () {
      // Suspend NGO 1
      await ngoRegistry.setNgoStatus(1, 2); // SUSPENDED

      await expect(
        treasury.connect(donor1).donatePOL(1, "80G-2026-0003", {
          value: ethers.parseEther("1.0"),
        })
      ).to.be.revertedWithCustomError(treasury, "NgoNotVerified");
    });
  });

  describe("ERC-20 Donations (USDC & USDT)", function () {
    it("should accept USDC donation with 6 decimals", async function () {
      const usdcAmount = 500n * 10n ** 6n; // 500 USDC
      const tx = await treasury
        .connect(donor1)
        .donateERC20(1, await mockUsdc.getAddress(), usdcAmount, "80G-2026-USDC-01");

      await expect(tx)
        .to.emit(treasury, "DonationReceived")
        .withArgs(
          (val) => typeof val === "string" && val.startsWith("0x"),
          1n,
          donor1.address,
          await mockUsdc.getAddress(),
          usdcAmount,
          "80G-2026-USDC-01",
          (val) => val > 0n
        );

      expect(await treasury.totalRaisedByNgo(1, await mockUsdc.getAddress())).to.equal(usdcAmount);
      expect(await mockUsdc.balanceOf(await treasury.getAddress())).to.equal(usdcAmount);
    });

    it("should reject unapproved ERC-20 token", async function () {
      const MockToken = await ethers.getContractFactory("MockERC20");
      const unapprovedToken = await MockToken.deploy("Scam Token", "SCAM", 18);
      await unapprovedToken.waitForDeployment();

      await expect(
        treasury
          .connect(donor1)
          .donateERC20(1, await unapprovedToken.getAddress(), 100n, "80G-SCAM")
      ).to.be.revertedWithCustomError(treasury, "TokenNotAllowed");
    });
  });

  describe("Escrow Integration & Authorization", function () {
    it("should allow only authorized escrow contract to release funds", async function () {
      const polAmount = ethers.parseEther("5.0");
      await treasury.connect(donor1).donatePOL(1, "80G-001", { value: polAmount });

      // Non-escrow caller reverts
      await expect(
        treasury.connect(donor2).releaseToEscrow(1, ethers.ZeroAddress, ethers.parseEther("1.0"), donor2.address)
      ).to.be.revertedWithCustomError(treasury, "UnauthorizedCaller");

      // Authorized escrow caller succeeds
      const releaseAmount = ethers.parseEther("2.0");
      await expect(
        treasury
          .connect(escrowContract)
          .releaseToEscrow(1, ethers.ZeroAddress, releaseAmount, escrowContract.address)
      )
        .to.emit(treasury, "FundsTransferredToEscrow")
        .withArgs(1n, ethers.ZeroAddress, releaseAmount, escrowContract.address);

      expect(await treasury.availableBalanceByNgo(1, ethers.ZeroAddress)).to.equal(
        ethers.parseEther("3.0")
      );
    });

    it("should revert if escrow requests more than available balance", async function () {
      await expect(
        treasury
          .connect(escrowContract)
          .releaseToEscrow(1, ethers.ZeroAddress, ethers.parseEther("100.0"), escrowContract.address)
      ).to.be.revertedWithCustomError(treasury, "InsufficientNgoBalance");
    });
  });
});
