import { describe, it } from "node:test";
import assert from "node:assert";
import { web3Service } from "../src/services/web3Service.js";
import { encodeErc20Transfer, ERC20_SELECTORS } from "../src/services/abi.js";
import { AMOY_CHAIN_ID_DEC, AMOY_CHAIN_ID_HEX } from "../src/config/index.js";

describe("Web3Service on-chain transaction & validation", () => {
  const validNgoAddress = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
  const testDonor = "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1";

  it("identifies Polygon Amoy network by chain ID decimal and hex", () => {
    assert.strictEqual(web3Service.isAmoyNetwork(AMOY_CHAIN_ID_DEC), true);
    assert.strictEqual(web3Service.isAmoyNetwork(AMOY_CHAIN_ID_HEX), true);
    assert.strictEqual(web3Service.isAmoyNetwork(1), false); // Ethereum Mainnet
    assert.strictEqual(web3Service.isAmoyNetwork(137), false); // Polygon Mainnet
  });

  it("encodes valid ERC-20 transfer calldata with selector 0xa9059cbb", () => {
    const calldata = encodeErc20Transfer(validNgoAddress, "100000000"); // 100 USDC in 6 decimals
    assert.ok(calldata.startsWith(ERC20_SELECTORS.transfer));
    // Must be 4-byte selector + 32-byte address + 32-byte amount = 138 hex chars (or 136 without 0x)
    const stripped = calldata.replace("0x", "");
    assert.strictEqual(stripped.length, 8 + 64 + 64);
  });

  it("rejects donation submission when destination is invalid", async () => {
    await assert.rejects(
      async () => {
        await web3Service.submitDonation({
          from: testDonor,
          to: "0xinvalid-address",
          amount: "100",
          token: "POL",
          isDemo: true,
        });
      },
      /Invalid destination address/
    );
  });

  it("rejects donation submission with unsupported token", async () => {
    await assert.rejects(
      async () => {
        await web3Service.submitDonation({
          from: testDonor,
          to: validNgoAddress,
          amount: "100",
          token: "BITCOIN",
          isDemo: true,
        });
      },
      /Unsupported token/
    );
  });

  it("rejects donation with non-positive amount", async () => {
    await assert.rejects(
      async () => {
        await web3Service.submitDonation({
          from: testDonor,
          to: validNgoAddress,
          amount: "0",
          token: "USDC",
          isDemo: true,
        });
      },
      /greater than zero/
    );
  });

  it("executes simulated donation in Demo mode with realistic transaction hash and explorer link", async () => {
    const result = await web3Service.submitDonation({
      from: testDonor,
      to: validNgoAddress,
      amount: "250",
      token: "POL",
      isDemo: true,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isSimulated, true);
    assert.ok(result.hash.startsWith("0x"));
    assert.strictEqual(result.hash.length, 66); // 0x + 64 hex chars
    assert.ok(result.explorerUrl.includes("polygonscan.com/tx/0x"));
  });
});
