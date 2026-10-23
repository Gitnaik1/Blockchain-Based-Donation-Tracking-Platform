import { describe, it } from "node:test";
import assert from "node:assert";
import { verifierService } from "../src/services/verifierService.js";

describe("VerifierService cryptographic proof inspection", () => {
  it("detects query types accurately", () => {
    // 64 hex char tx hash
    assert.strictEqual(
      verifierService.detectQueryType("0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8a1b2c3d4e5f60718293a4b5c"),
      "tx_hash"
    );

    // 40 hex char wallet address
    assert.strictEqual(
      verifierService.detectQueryType("0x71F39082Bc45199201aDeF80B91244019aA2C81B"),
      "wallet_address"
    );

    // IPFS CID
    assert.strictEqual(
      verifierService.detectQueryType("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
      "ipfs_cid"
    );

    // Receipt ID
    assert.strictEqual(
      verifierService.detectQueryType("80G-2026-0891"),
      "receipt_id"
    );

    // Invalid format
    assert.strictEqual(
      verifierService.detectQueryType("not-a-valid-hash-or-address"),
      "invalid"
    );
  });

  it("verifies transaction hash and differentiates criteria", async () => {
    const validHash = "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8"; // 40-char partial or 64-char
    // 64-char test hash
    const fullHash = "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8000000000000000000000000";
    const res = await verifierService.verify(fullHash);

    assert.strictEqual(res.isValidFormat, true);
    assert.strictEqual(res.queryType, "tx_hash");
    assert.ok(res.network.includes("Polygon Amoy"));
    assert.ok(res.explorerUrl.includes("polygonscan.com"));
    assert.strictEqual(res.auditorClaimType, "Development Fixture Audit Record");
  });

  it("verifies wallet address and identifies NGO status", async () => {
    const ngoWallet = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
    const res = await verifierService.verify(ngoWallet);

    assert.strictEqual(res.isValidFormat, true);
    assert.strictEqual(res.queryType, "wallet_address");
    assert.strictEqual(res.isNgoEntity, true);
    assert.strictEqual(res.ngoName, "Green Canopy Initiative");
  });

  it("verifies IPFS CID and provides gateway link", async () => {
    const cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    const res = await verifierService.verify(cid);

    assert.strictEqual(res.isValidFormat, true);
    assert.strictEqual(res.queryType, "ipfs_cid");
    assert.strictEqual(res.isContentHashValid, true);
    assert.ok(res.gatewayUrl.includes(cid));
  });

  it("returns meaningful error for malformed inputs", async () => {
    const res = await verifierService.verify("invalid-query-1234");
    assert.strictEqual(res.isValidFormat, false);
    assert.ok(res.error.includes("Unrecognized identifier format"));
  });
});
