import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  getDefaultDashboardForRole,
  resolveFallbackRoute,
} from "../src/config/roles.js";
import { reportsService } from "../src/services/reportsService.js";
import { verifierService } from "../src/services/verifierService.js";
import { donationService } from "../src/services/donationService.js";
import { isValidAddress, isValidTxHash } from "../src/services/utils/tokenMath.js";

describe("TrustDonate Donor Authentication, Registration & Guest Donation Verification", () => {
  it("resolves context-aware fallback routes for all donor-specific pages", () => {
    assert.equal(resolveFallbackRoute("/donor/dashboard"), "/donor/dashboard");
    assert.equal(resolveFallbackRoute("/donor/donations"), "/donor/dashboard");
    assert.equal(resolveFallbackRoute("/donor/profile"), "/donor/dashboard");
    assert.equal(resolveFallbackRoute("/donor/settings"), "/donor/dashboard");
    assert.equal(resolveFallbackRoute("/receipt"), "/");
    assert.equal(resolveFallbackRoute("/receipts"), "/");
    assert.equal(resolveFallbackRoute("/receipt/0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8"), "/");
  });

  it("enforces that donors have personal data access but strictly no governance or treasury execution", () => {
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.DONOR_VIEW_PERSONAL), true);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.DONOR_MANAGE_SUBSCRIPTIONS), true);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.DATA_EXPORT_CSV), true);

    // Strictly forbidden for donor role
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.TREASURY_PROPOSE), false);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.TREASURY_APPROVE), false);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.TREASURY_EXECUTE), false);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.PROJECT_CREATE), false);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.PLATFORM_ADMIN), false);
    assert.equal(hasPermission(ROLES.DONOR, PERMISSIONS.AUDIT_REVIEW), false);
  });

  it("generates authoritative Section 80G compliant donation receipt HTML with verification hashes", () => {
    const mockDonation = {
      id: "don-guest-101",
      ngoName: "Asha Foundation",
      project: "Clean Water Initiative",
      amountCrypto: "100.00 POL",
      amountInr: 10000,
      token: "POL",
      date: "23 Oct 2026, 11:30 AM",
      hash: "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8",
      status: "Confirmed on Amoy",
      taxReceiptNo: "REC-AMOY-2026-9999",
      donor: "Anonymous Guest Contributor",
      wallet: "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1",
    };

    const receiptHtml = reportsService.generateReceiptHtml(mockDonation);
    assert.ok(typeof receiptHtml === "string" && receiptHtml.length > 200);
    assert.ok(receiptHtml.includes("Cryptographic Blockchain Donation Receipt"));
    assert.ok(receiptHtml.includes("REC-AMOY-2026-9999"));
    assert.ok(receiptHtml.includes("Clean Water Initiative"));
    assert.ok(receiptHtml.includes("0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8"));
    assert.ok(receiptHtml.includes("Polygon Amoy"));
  });

  it("verifies and extracts guest donation evidence across multiple query formats", async () => {
    // 1. Transaction Hash
    const sampleTxHash = "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8000000000000000000000000";
    assert.ok(isValidTxHash(sampleTxHash));
    const txProof = await verifierService.verify(sampleTxHash);
    assert.equal(txProof.queryType, "tx_hash");
    assert.equal(txProof.isValidFormat, true);
    assert.ok(txProof.network.includes("Polygon Amoy"));

    // 2. NGO Wallet Address
    const knownNgoWallet = "0x71F39082Bc45199201aDeF80B91244019aA2C81B";
    assert.ok(isValidAddress(knownNgoWallet));
    const walletProof = await verifierService.verify(knownNgoWallet);
    assert.equal(walletProof.queryType, "wallet_address");
    assert.equal(walletProof.isValidFormat, true);

    // 3. Receipt identifier query detection
    assert.equal(verifierService.detectQueryType("80G-2026-4819"), "receipt_id");
  });

  it("enables guest donation submission into live ledger without requiring donor authentication", () => {
    const guestTxHash = "0x" + "a".repeat(40);
    const initialCount = donationService.getDonations().length;

    donationService.addDonation({
      txHash: guestTxHash,
      amount: "50",
      token: "POL",
      ngoId: "ngo-1",
      donorWallet: "0x" + "b".repeat(40),
      donorName: "Guest Contributor",
      status: "Confirmed",
      isSimulated: false,
    });

    const currentDonations = donationService.getDonations();
    assert.equal(currentDonations.length, initialCount + 1);
    const added = currentDonations[0];
    assert.equal(added.donor, "Guest Contributor");
    assert.equal(added.token, "POL");
    assert.ok(added.taxReceiptNo.startsWith("REC-AMOY-2026-"));
  });
});
