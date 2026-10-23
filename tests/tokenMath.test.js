import { describe, it } from "node:test";
import assert from "node:assert";
import {
  toBaseUnits,
  fromBaseUnits,
  formatCrypto,
  formatInr,
  shortenAddress,
  shortenTxHash,
  isValidAddress,
  isValidTxHash,
  isValidCid,
  stripHexPrefix,
  addHexPrefix,
  padTo32Bytes,
} from "../src/services/utils/tokenMath.js";

describe("tokenMath utilities", () => {
  it("converts decimal tokens to base units (wei / mwei) without floating point loss", () => {
    // 18 decimals (POL)
    assert.strictEqual(toBaseUnits("1", 18), "1000000000000000000");
    assert.strictEqual(toBaseUnits("0.5", 18), "500000000000000000");
    assert.strictEqual(toBaseUnits("100.123456", 18), "100123456000000000000");

    // 6 decimals (USDC / USDT)
    assert.strictEqual(toBaseUnits("100", 6), "100000000");
    assert.strictEqual(toBaseUnits("25.5", 6), "25500000");
    assert.strictEqual(toBaseUnits("0.000001", 6), "1");
  });

  it("converts base units to decimal strings", () => {
    assert.strictEqual(fromBaseUnits("1000000000000000000", 18), "1");
    assert.strictEqual(fromBaseUnits("500000000000000000", 18), "0.5");
    assert.strictEqual(fromBaseUnits("100000000", 6), "100");
    assert.strictEqual(fromBaseUnits("25500000", 6), "25.5");
  });

  it("formats crypto amounts with proper symbols", () => {
    assert.strictEqual(formatCrypto(25.5, "POL"), "25.50 POL");
    assert.strictEqual(formatCrypto("1200.00", "USDC"), "1,200.00 USDC");
    assert.strictEqual(formatCrypto(0, "USDT"), "0.00 USDT");
  });

  it("formats INR currency in Indian numbering system", () => {
    assert.strictEqual(formatInr(25000), "₹25,000");
    assert.strictEqual(formatInr(150000), "₹1,50,000");
    assert.strictEqual(formatInr(4872450), "₹48,72,450");
  });

  it("shortens addresses and tx hashes correctly", () => {
    const addr = "0x71F39082Bc45199201aDeF80B91244019aA2C81B";
    assert.strictEqual(shortenAddress(addr, 4), "0x71F3...C81B");

    const hash = "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8a1b2c3d4e5f60718293a4b5c";
    assert.strictEqual(shortenTxHash(hash, 6), "0x8f1c99...3a4b5c");
  });

  it("validates Ethereum addresses", () => {
    assert.strictEqual(isValidAddress("0x71F39082Bc45199201aDeF80B91244019aA2C81B"), true);
    assert.strictEqual(isValidAddress("0xinvalid"), false);
    assert.strictEqual(isValidAddress(""), false);
    assert.strictEqual(isValidAddress("71F39082Bc45199201aDeF80B91244019aA2C81B"), false); // missing 0x
  });

  it("validates 32-byte transaction hashes", () => {
    const validHash = "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8a1b2c3d4e5f60718293a4b5c";
    assert.strictEqual(isValidTxHash(validHash), true);
    assert.strictEqual(isValidTxHash("0x123"), false);
  });

  it("validates IPFS CIDs (v0 and v1)", () => {
    assert.strictEqual(isValidCid("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"), true);
    assert.strictEqual(isValidCid("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"), true);
    assert.strictEqual(isValidCid("invalid-cid"), false);
  });

  it("pads and formats hex data for ABI calldata", () => {
    assert.strictEqual(stripHexPrefix("0xabcd"), "abcd");
    assert.strictEqual(addHexPrefix("abcd"), "0xabcd");
    assert.strictEqual(padTo32Bytes("1"), "0000000000000000000000000000000000000000000000000000000000000001");
  });
});
