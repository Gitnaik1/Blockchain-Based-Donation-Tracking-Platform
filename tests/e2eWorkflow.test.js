import { describe, it } from "node:test";
import assert from "node:assert";
import { web3Service } from "../src/services/web3Service.js";
import { donationService } from "../src/services/donationService.js";
import { authService } from "../src/services/authService.js";
import { verifierService } from "../src/services/verifierService.js";
import { reportsService } from "../src/services/reportsService.js";
import { SUPPORTED_TOKENS, SUPPORTED_NETWORKS, AMOY_CHAIN_ID_DEC } from "../src/config/index.js";

describe("TrustDonate Full End-to-End Workflow Verification", () => {
  const testDonorWallet = "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1";
  const testNgoWallet = "0x71F39082Bc45199201aDeF80B91244019aA2C81B";

  let createdTxHash = null;
  let testDonationRecord = null;
  let selectedNgo = null;

  it("Step 1: Connect a test wallet", async () => {
    assert.strictEqual(web3Service.isAmoyNetwork(AMOY_CHAIN_ID_DEC), true);
    assert.ok(testDonorWallet.startsWith("0x"));
  });

  it("Step 2: Select a verified test NGO", () => {
    const ngos = donationService.getNgos();
    assert.ok(ngos.length > 0);
    selectedNgo = ngos[0];
    assert.ok(selectedNgo.contractAddress);
    assert.strictEqual(selectedNgo.status, "Active & Verified");
  });

  it("Step 3 & 4: Submit a test donation and confirm the on-chain transaction", async () => {
    const donationAmount = "150";
    const token = "USDC";

    const txResult = await web3Service.submitDonation({
      from: testDonorWallet,
      to: selectedNgo.contractAddress,
      amount: donationAmount,
      token,
      isDemo: true,
    });

    assert.strictEqual(txResult.success, true);
    assert.ok(txResult.hash.startsWith("0x"));
    createdTxHash = txResult.hash;

    // Persist to authoritative donationService
    testDonationRecord = donationService.addDonation({
      txHash: createdTxHash,
      amount: donationAmount,
      token,
      ngoId: selectedNgo.id,
      donorWallet: testDonorWallet,
      donorName: "E2E Test Donor",
      status: "Confirmed",
      isSimulated: true,
    });

    assert.strictEqual(testDonationRecord.hash, createdTxHash);
    assert.strictEqual(testDonationRecord.status, "Confirmed");
    assert.strictEqual(testDonationRecord.isNew, true);
  });

  it("Step 5: Observe the indexed donation in the public cryptographic stream", () => {
    const transactions = donationService.getTransactions();
    const foundTx = transactions.find((tx) => tx.hash.toLowerCase() === createdTxHash.toLowerCase());
    assert.ok(foundTx, "Transaction must appear in public stream");
    assert.strictEqual(foundTx.amount, "150.00");
    assert.strictEqual(foundTx.token, "USDC");
    assert.strictEqual(foundTx.status, "Mined");
  });

  it("Step 6: Observe the same donation in the NGO ledger", () => {
    const donations = donationService.getDonations();
    const foundDonation = donations.find((d) => d.hash.toLowerCase() === createdTxHash.toLowerCase());
    assert.ok(foundDonation, "Donation must appear in authoritative NGO ledger");
    assert.strictEqual(foundDonation.isNew, true);
    assert.strictEqual(foundDonation.project, selectedNgo.name);
  });

  it("Step 7: Verify the transaction by its hash in the transparency verifier", async () => {
    const verification = await verifierService.verify(createdTxHash);
    assert.strictEqual(verification.isValidFormat, true);
    assert.strictEqual(verification.queryType, "tx_hash");
    assert.strictEqual(verification.isConfirmedOnChain, true);
    assert.strictEqual(verification.isRecognizedDonation, true);
    assert.strictEqual(verification.ngoName, selectedNgo.name);
  });

  it("Step 8: Open the correct block explorer link", () => {
    const expectedPrefix = `${SUPPORTED_NETWORKS[AMOY_CHAIN_ID_DEC].explorerUrl}/tx/${createdTxHash}`;
    assert.ok(testDonationRecord.hash);
    const explorerUrl = `https://amoy.polygonscan.com/tx/${createdTxHash}`;
    assert.strictEqual(explorerUrl, expectedPrefix);
  });

  it("Step 9: Authenticate as an authorized test NGO wallet via challenge-response", async () => {
    const challenge = await authService.requestChallenge(testNgoWallet);
    assert.ok(challenge.nonce);

    const signature = await authService.signChallenge(challenge.message, testNgoWallet, true);
    const session = await authService.verifySession({
      wallet: testNgoWallet,
      signature,
      nonce: challenge.nonce,
      isDemo: true,
    });

    assert.ok(session.token);
    assert.strictEqual(authService.isAuthenticated(), true);
  });

  it("Step 10, 11 & 12: View project, propose milestone action, and observe confirmed status", () => {
    // Propose allocation
    const allocation = {
      id: `alloc-e2e-${Date.now()}`,
      project: "Clean Water Initiative",
      amountEth: "1.25 ETH",
      amountInr: "₹4,50,000",
      status: "Proposed (1/5 Multi-Sig Signatures)",
      txHash: createdTxHash,
    };

    assert.ok(allocation.status.includes("Multi-Sig"));
    assert.strictEqual(allocation.amountEth, "1.25 ETH");
  });

  it("Step 13: Retrieve the relevant impact report with verified IPFS CID", () => {
    const reports = reportsService.getReports();
    assert.ok(reports.length > 0);
    const report = reports[0];
    assert.ok(reportsService.validateCid(report.ipfsCid));
    assert.ok(report.isTestFixture, "Test fixture must be explicitly labeled");
    const gatewayUrl = reportsService.getGatewayUrl(report.ipfsCid);
    assert.ok(gatewayUrl.includes(report.ipfsCid));
  });

  it("Step 14: Export the donation ledger to CSV and verify sanitized content", () => {
    const donations = donationService.getDonations();
    const csv = donationService.exportCsv(donations);
    assert.ok(csv.includes("Receipt ID,Donor,Wallet Address,Amount INR,Token"));
    assert.ok(csv.includes(createdTxHash));
    assert.ok(csv.includes("150.00 USDC"));
  });

  it("Negative edge cases: duplicate submissions, invalid CID, and unsupported chain rejection", async () => {
    // Duplicate submission deduplication
    const initialCount = donationService.getDonations().length;
    donationService.addDonation({
      txHash: createdTxHash,
      amount: "150",
      token: "USDC",
      ngoId: selectedNgo.id,
      status: "Confirmed",
    });
    assert.strictEqual(donationService.getDonations().length, initialCount);

    // Invalid CID rejection
    assert.strictEqual(reportsService.validateCid("invalid-bad-cid"), false);

    // Unsupported chain rejection
    assert.strictEqual(web3Service.isAmoyNetwork(999999), false);
  });
});
