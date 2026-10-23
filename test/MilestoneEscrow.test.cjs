const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MilestoneEscrow", function () {
  let ngoRegistry, treasury, escrow;
  let owner, ngoAdmin, vendorRecipient, approver1, approver2, approver3, donor;

  beforeEach(async function () {
    [owner, ngoAdmin, vendorRecipient, approver1, approver2, approver3, donor] =
      await ethers.getSigners();

    // 1. Deploy Registry
    const NgoRegistry = await ethers.getContractFactory("NgoRegistry");
    ngoRegistry = await NgoRegistry.deploy(owner.address);
    await ngoRegistry.waitForDeployment();

    await ngoRegistry.registerNgo(
      "Asha Foundation",
      "Infrastructure",
      ngoAdmin.address,
      "REG-001",
      "QmKycHash"
    );

    // 2. Deploy Treasury
    const TrustDonateTreasury = await ethers.getContractFactory("TrustDonateTreasury");
    treasury = await TrustDonateTreasury.deploy(owner.address, await ngoRegistry.getAddress());
    await treasury.waitForDeployment();

    // 3. Deploy Escrow (3-of-3 required for this unit test)
    const MilestoneEscrow = await ethers.getContractFactory("MilestoneEscrow");
    escrow = await MilestoneEscrow.deploy(
      owner.address,
      await treasury.getAddress(),
      ethers.ZeroAddress
    );
    await escrow.waitForDeployment();

    // Link Treasury to Escrow
    await treasury.setMilestoneEscrow(await escrow.getAddress());

    // Configure 3 Approvers and set threshold to 3
    await escrow.setApprover(approver1.address, true);
    await escrow.setApprover(approver2.address, true);
    await escrow.setApprover(approver3.address, true);
    await escrow.setRequiredApprovals(3);

    // Fund Treasury with 10 POL for NGO 1
    await treasury.connect(donor).donatePOL(1, "80G-INIT", {
      value: ethers.parseEther("10.0"),
    });
  });

  describe("Proposal & Approval Workflow", function () {
    let milestoneId;
    const allocationAmount = ethers.parseEther("2.5");

    beforeEach(async function () {
      const tx = await escrow.proposeMilestone(
        1, // ngoId
        101, // projectId
        "Phase 1 Borewell Installation",
        ethers.ZeroAddress, // POL
        allocationAmount,
        vendorRecipient.address,
        "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        7 * 86400 // 7 days
      );
      const receipt = await tx.wait();
      // Extract milestoneId from emitted event
      const event = receipt.logs.find(
        (l) => l.fragment && l.fragment.name === "MilestoneProposed"
      );
      milestoneId = event.args[0];
    });

    it("should allow verified approvers to approve and reach threshold", async function () {
      // 1st approval
      await expect(escrow.connect(approver1).approveMilestone(milestoneId))
        .to.emit(escrow, "MilestoneApproved")
        .withArgs(milestoneId, approver1.address, 1n, 3n);

      // Re-approval by same signer should revert
      await expect(
        escrow.connect(approver1).approveMilestone(milestoneId)
      ).to.be.revertedWithCustomError(escrow, "AlreadyApproved");

      // 2nd approval
      await escrow.connect(approver2).approveMilestone(milestoneId);

      // Cannot disburse before threshold is reached (currently 2 of 3)
      await expect(
        escrow.disburseMilestoneFunds(milestoneId)
      ).to.be.revertedWithCustomError(escrow, "ThresholdNotReached");

      // 3rd approval
      await escrow.connect(approver3).approveMilestone(milestoneId);

      const m = await escrow.getMilestone(milestoneId);
      expect(m.status).to.equal(1n); // APPROVED
      expect(m.approvalCount).to.equal(3n);
    });

    it("should disburse funds to vendor wallet and update milestone status to DISBURSED", async function () {
      // Approve by 3 signers
      await escrow.connect(approver1).approveMilestone(milestoneId);
      await escrow.connect(approver2).approveMilestone(milestoneId);
      await escrow.connect(approver3).approveMilestone(milestoneId);

      const balanceBefore = await ethers.provider.getBalance(vendorRecipient.address);

      // Disburse
      const tx = await escrow.disburseMilestoneFunds(milestoneId);
      await expect(tx)
        .to.emit(escrow, "MilestoneFundsDisbursed")
        .withArgs(
          milestoneId,
          vendorRecipient.address,
          ethers.ZeroAddress,
          allocationAmount,
          (val) => val > 0n
        );

      const balanceAfter = await ethers.provider.getBalance(vendorRecipient.address);
      expect(balanceAfter - balanceBefore).to.equal(allocationAmount);

      const m = await escrow.getMilestone(milestoneId);
      expect(m.status).to.equal(2n); // DISBURSED
    });

    it("should allow owner to cancel an un-disbursed milestone", async function () {
      await expect(escrow.cancelMilestone(milestoneId, "Vendor quotation revised"))
        .to.emit(escrow, "MilestoneCancelled")
        .withArgs(milestoneId, "Vendor quotation revised", (val) => val > 0n);

      const m = await escrow.getMilestone(milestoneId);
      expect(m.status).to.equal(3n); // CANCELLED
    });
  });
});
