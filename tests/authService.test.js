import { describe, it } from "node:test";
import assert from "node:assert";
import { authService } from "../src/services/authService.js";

describe("AuthService EIP-4361 wallet challenge-response", () => {
  const testWallet = "0x71F39082Bc45199201aDeF80B91244019aA2C81B";

  it("requests unique challenge with nonce, wallet, and timestamp", async () => {
    const challenge = await authService.requestChallenge(testWallet);
    assert.ok(challenge.nonce, "Nonce must be generated");
    assert.ok(challenge.nonce.startsWith("td_nonce_"));
    assert.ok(challenge.message.includes(testWallet));
    assert.ok(challenge.message.includes("TrustDonate NGO Portal Sign-In"));
  });

  it("fails challenge request if wallet is omitted", async () => {
    await assert.rejects(
      async () => {
        await authService.requestChallenge("");
      },
      /Wallet address is required/
    );
  });

  it("signs and verifies session issuance", async () => {
    const challenge = await authService.requestChallenge(testWallet);
    const signature = await authService.signChallenge(challenge.message, testWallet, true);
    assert.ok(signature.startsWith("0x"), "Signature should be hex");

    const session = await authService.verifySession({
      wallet: testWallet,
      signature,
      nonce: challenge.nonce,
      isDemo: true,
    });

    assert.ok(session.token, "Token should be issued");
    assert.strictEqual(session.wallet, testWallet);
    assert.strictEqual(session.role, "Admin");
    assert.strictEqual(authService.isAuthenticated(), true);

    // Verify session retrieval
    const current = authService.getSession();
    assert.strictEqual(current.wallet, testWallet);
  });

  it("clears session on logout", () => {
    authService.clearSession();
    assert.strictEqual(authService.getSession(), null);
    assert.strictEqual(authService.isAuthenticated(), false);
  });
});
