const crypto = require("crypto");
const { SiweMessage } = require("siwe");
const { ethers } = require("ethers");
const db = require("../db/database.cjs");

const JWT_SECRET = process.env.JWT_SECRET || "trustdonate_dev_secret_key_2026_xyz";
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

class AuthService {
  /**
   * Generates an unpredictable cryptographic nonce and stores it in the database.
   */
  generateChallenge(address) {
    if (!address || !ethers.isAddress(address)) {
      throw new Error("Invalid Ethereum address provided");
    }

    const checksummed = ethers.getAddress(address);
    const nonce = crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + CHALLENGE_EXPIRY_MS;

    const message = `trustdonate.org wants you to sign in with your Ethereum account:\n${checksummed}\n\nSign in to TrustDonate NGO Portal.\n\nURI: https://trustdonate.org\nVersion: 1\nChain ID: 80002\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(expiresAt).toISOString()}`;

    db.prepare(`
      INSERT INTO auth_challenges (nonce, address, message, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `).run(nonce, checksummed, message, expiresAt);

    return {
      nonce,
      address: checksummed,
      message,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Validates signed message against stored challenge and issues session token.
   */
  async verifySignature(messageText, signature) {
    if (!messageText || !signature) {
      throw new Error("Missing message or signature");
    }

    let siweMessage;
    let recoveredAddress;

    try {
      siweMessage = new SiweMessage(messageText);
      const fields = await siweMessage.verify({ signature });
      recoveredAddress = ethers.getAddress(fields.data.address);
    } catch (err) {
      // Fallback for simple message format verification
      try {
        recoveredAddress = ethers.getAddress(ethers.verifyMessage(messageText, signature));
      } catch (innerErr) {
        throw new Error("Cryptographic signature verification failed: " + err.message);
      }
    }

    // Extract nonce from message
    const nonceMatch = messageText.match(/Nonce:\s*([a-fA-F0-9]+)/);
    const nonce = nonceMatch ? nonceMatch[1] : null;

    if (!nonce) {
      throw new Error("Invalid message format: missing challenge nonce");
    }

    // Lookup challenge in database
    const challenge = db.prepare(`
      SELECT * FROM auth_challenges WHERE nonce = ? AND used = 0
    `).get(nonce);

    if (!challenge) {
      throw new Error("Invalid or previously consumed challenge nonce");
    }

    if (Date.now() > challenge.expires_at) {
      throw new Error("Challenge has expired. Please request a new login challenge.");
    }

    if (ethers.getAddress(challenge.address) !== recoveredAddress) {
      throw new Error("Signer address does not match challenged address");
    }

    // Mark nonce as consumed (prevents replay)
    db.prepare(`UPDATE auth_challenges SET used = 1 WHERE nonce = ?`).run(nonce);

    // Check if wallet is registered to an NGO
    const ngo = db.prepare(`
      SELECT * FROM ngos WHERE LOWER(verified_wallet) = LOWER(?)
    `).get(recoveredAddress);

    const role = ngo ? "NGO_OPERATOR" : "AUTHORIZED_DONOR";
    const ngoId = ngo ? ngo.id : null;

    // Issue HMAC-signed session token
    const tokenPayload = {
      address: recoveredAddress,
      role,
      ngoId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const serializedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
    const hmac = crypto.createHmac("sha256", JWT_SECRET).update(serializedPayload).digest("base64url");
    const token = `${serializedPayload}.${hmac}`;

    return {
      token,
      wallet: recoveredAddress,
      role,
      ngoId,
      ngoName: ngo ? ngo.name : null,
    };
  }

  /**
   * Verifies session token authenticity and returns session payload.
   */
  verifyToken(token) {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(payloadB64).digest("base64url");

    if (expectedSig !== signature) return null;

    try {
      const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
      if (Date.now() > payload.expiresAt) return null;
      return payload;
    } catch {
      return null;
    }
  }
}

module.exports = new AuthService();
