import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { donationService } from "../src/services/donationService.js";

describe("DonationService authoritative ledger & reactivity", () => {
  it("loads baseline donations and transactions", () => {
    const donations = donationService.getDonations();
    const transactions = donationService.getTransactions();
    assert.ok(donations.length >= 6, "Should have initial donations");
    assert.ok(transactions.length >= 4, "Should have initial transactions");
  });

  it("adds new donation to top of ledger and stream with isNew: true", () => {
    const testHash = "0x99991111222233334444555566667777888899990000aaaabbbbccccddddeeee";
    const donorWallet = "0x1111222233334444555566667777888899990000";

    const record = donationService.addDonation({
      txHash: testHash,
      amount: "500",
      token: "USDC",
      ngoId: "ngo-1",
      donorWallet,
      donorName: "Test Benefactor",
      status: "Confirmed",
      isSimulated: true,
    });

    assert.strictEqual(record.isNew, true);
    assert.strictEqual(record.token, "USDC");
    assert.strictEqual(record.amountInr, 42500); // 500 * 85
    assert.strictEqual(record.status, "Confirmed");

    // Check top of donations list
    const updated = donationService.getDonations();
    assert.strictEqual(updated[0].hash, testHash);
    assert.strictEqual(updated[0].isNew, true);

    // Check top of transactions stream
    const txStream = donationService.getTransactions();
    assert.strictEqual(txStream[0].hash, testHash);
  });

  it("deduplicates transactions with identical hash", () => {
    const duplicateHash = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    
    // Add first time
    donationService.addDonation({
      txHash: duplicateHash,
      amount: "100",
      token: "POL",
      ngoId: "ngo-1",
      donorWallet: "0x1234567890123456789012345678901234567890",
      status: "Pending",
    });

    const countBefore = donationService.getDonations().length;

    // Add again with Confirmed status
    donationService.addDonation({
      txHash: duplicateHash,
      amount: "100",
      token: "POL",
      ngoId: "ngo-1",
      donorWallet: "0x1234567890123456789012345678901234567890",
      status: "Confirmed",
    });

    const countAfter = donationService.getDonations().length;
    assert.strictEqual(countAfter, countBefore, "Should not duplicate record count");

    const updated = donationService.getDonations().find((d) => d.hash === duplicateHash);
    assert.strictEqual(updated.status, "Confirmed", "Should update existing record status");
  });

  it("exports valid sanitized CSV ledger", () => {
    const donations = donationService.getDonations();
    const csv = donationService.exportCsv(donations.slice(0, 3));
    
    assert.ok(csv.includes("Receipt ID,Donor,Wallet Address,Amount INR,Token"));
    assert.ok(csv.includes("POL") || csv.includes("USDC") || csv.includes("USDT"));
    // Ensure properly quote escaped
    const lines = csv.split("\n");
    assert.ok(lines.length >= 4, "Should have header + 3 rows");
  });

  it("calculates dynamic aggregated metrics", () => {
    const metrics = donationService.getMetrics();
    assert.ok(metrics.totalInr > 0, "Total INR should be positive");
    assert.ok(metrics.donationsCount > 0, "Donations count should be positive");
    assert.ok(typeof metrics.donorsCount === "number");
  });
});
