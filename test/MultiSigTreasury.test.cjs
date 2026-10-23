const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigTreasury", function () {
  let multiSig;
  let signer1, signer2, signer3, signer4, signer5, nonSigner, recipient;

  beforeEach(async function () {
    [signer1, signer2, signer3, signer4, signer5, nonSigner, recipient] =
      await ethers.getSigners();

    const signers = [
      signer1.address,
      signer2.address,
      signer3.address,
      signer4.address,
      signer5.address,
    ];

    const MultiSigTreasury = await ethers.getContractFactory("MultiSigTreasury");
    multiSig = await MultiSigTreasury.deploy(signers, 3); // 3-of-5 threshold
    await multiSig.waitForDeployment();

    // Fund multisig with 10 POL
    await signer1.sendTransaction({
      to: await multiSig.getAddress(),
      value: ethers.parseEther("10.0"),
    });
  });

  describe("Initialization", function () {
    it("should initialize with 5 signers and threshold of 3", async function () {
      expect(await multiSig.threshold()).to.equal(3n);
      const signersList = await multiSig.getSigners();
      expect(signersList.length).to.equal(5);
      expect(await multiSig.isSigner(signer1.address)).to.be.true;
      expect(await multiSig.isSigner(nonSigner.address)).to.be.false;
    });

    it("should reject threshold of 0 or greater than signers count", async function () {
      const MultiSigTreasury = await ethers.getContractFactory("MultiSigTreasury");
      await expect(
        MultiSigTreasury.deploy([signer1.address, signer2.address], 0)
      ).to.be.revertedWithCustomError(multiSig, "InvalidThreshold");

      await expect(
        MultiSigTreasury.deploy([signer1.address, signer2.address], 3)
      ).to.be.revertedWithCustomError(multiSig, "InvalidThreshold");
    });
  });

  describe("Transaction Lifecycle", function () {
    it("should propose transaction and execute once 3 confirmations arrive", async function () {
      const sendValue = ethers.parseEther("2.0");

      // Signer 1 proposes (counts as 1st confirmation)
      const tx = await multiSig
        .connect(signer1)
        .proposeTransaction(recipient.address, sendValue, "0x");

      await expect(tx)
        .to.emit(multiSig, "TransactionProposed")
        .withArgs(0n, signer1.address, recipient.address, sendValue, "0x");

      expect((await multiSig.getTransaction(0)).confirmations).to.equal(1n);

      // Signer 2 confirms (2nd confirmation)
      await multiSig.connect(signer2).confirmTransaction(0);
      expect((await multiSig.getTransaction(0)).confirmations).to.equal(2n);

      const recipientBalBefore = await ethers.provider.getBalance(recipient.address);

      // Signer 3 confirms (3rd confirmation -> triggers automatic execution)
      const confirmTx = await multiSig.connect(signer3).confirmTransaction(0);

      await expect(confirmTx)
        .to.emit(multiSig, "TransactionExecuted")
        .withArgs(0n, signer3.address);

      const recipientBalAfter = await ethers.provider.getBalance(recipient.address);
      expect(recipientBalAfter - recipientBalBefore).to.equal(sendValue);

      const txnData = await multiSig.getTransaction(0);
      expect(txnData.executed).to.be.true;
    });

    it("should prevent duplicate confirmations and non-signer proposals", async function () {
      await expect(
        multiSig
          .connect(nonSigner)
          .proposeTransaction(recipient.address, ethers.parseEther("1.0"), "0x")
      ).to.be.revertedWithCustomError(multiSig, "NotSigner");

      await multiSig
        .connect(signer1)
        .proposeTransaction(recipient.address, ethers.parseEther("1.0"), "0x");

      // Signer 1 already confirmed upon proposal
      await expect(
        multiSig.connect(signer1).confirmTransaction(0)
      ).to.be.revertedWithCustomError(multiSig, "TxAlreadyConfirmed");
    });

    it("should allow revoking a confirmation before execution", async function () {
      await multiSig
        .connect(signer1)
        .proposeTransaction(recipient.address, ethers.parseEther("1.0"), "0x");

      await multiSig.connect(signer2).confirmTransaction(0);
      expect((await multiSig.getTransaction(0)).confirmations).to.equal(2n);

      // Signer 2 revokes
      await expect(multiSig.connect(signer2).revokeConfirmation(0))
        .to.emit(multiSig, "ConfirmationRevoked")
        .withArgs(0n, signer2.address);

      expect((await multiSig.getTransaction(0)).confirmations).to.equal(1n);
    });
  });
});
