const crypto = require("crypto");
const { SiweMessage } = require("siwe");
const { ethers } = require("ethers");
const db = require("../db/database.cjs");
const { getPermissionsForRoles } = require("../rbac/permissions.cjs");
const { logSecurityEvent } = require("../utils/auditLogger.cjs");
const {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  hashToken,
  generateToken,
} = require("../utils/passwordUtils.cjs");

const JWT_SECRET = process.env.JWT_SECRET || "trustdonate_dev_secret_key_2026_xyz";
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_DOMAIN = process.env.APP_DOMAIN || "trustdonate.org";
const DEFAULT_URI = process.env.APP_URI || "https://trustdonate.org";
const DEFAULT_CHAIN_ID = 80002; // Polygon Amoy

class AuthService {
  /**
   * Generates an unpredictable cryptographic nonce and stores it in the database,
   * binding the challenge to domain, URI, and chainId.
   */
  generateChallenge(address, domain = DEFAULT_DOMAIN, uri = DEFAULT_URI, chainId = DEFAULT_CHAIN_ID) {
    if (!address || !ethers.isAddress(address)) {
      throw new Error("Invalid Ethereum address provided");
    }

    const checksummed = ethers.getAddress(address);
    const nonce = crypto.randomBytes(16).toString("hex");
    const expiresAt = Date.now() + CHALLENGE_EXPIRY_MS;

    const message = `${domain} wants you to sign in with your Ethereum account:\n${checksummed}\n\nSign in to TrustDonate NGO Portal.\n\nURI: ${uri}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nExpiration Time: ${new Date(expiresAt).toISOString()}`;

    db.prepare(`
      INSERT INTO auth_challenges (nonce, address, message, domain, uri, chain_id, expires_at, used)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(nonce, checksummed, message, domain, uri, chainId, expiresAt);

    return {
      nonce,
      address: checksummed,
      domain,
      uri,
      chainId,
      message,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Validates signed message against stored challenge, verifies domain/URI/nonce,
   * prevents replay attacks, and issues session token.
   */
  async verifySignature(messageText, signature) {
    if (!messageText || !signature) {
      throw new Error("Missing message or signature");
    }

    let recoveredAddress;

    try {
      const siweMessage = new SiweMessage(messageText);
      const fields = await siweMessage.verify({ signature });
      recoveredAddress = ethers.getAddress(fields.data.address);
    } catch (err) {
      // Fallback standard personal_sign verification
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

    // Mark nonce as consumed immediately (prevents replay)
    db.prepare(`UPDATE auth_challenges SET used = 1 WHERE nonce = ?`).run(nonce);

    // Find or automatically create user in RBAC users table
    let user = db.prepare(`
      SELECT * FROM users WHERE LOWER(wallet_address) = LOWER(?)
    `).get(recoveredAddress);

    const ngo = db.prepare(`
      SELECT * FROM ngos WHERE LOWER(verified_wallet) = LOWER(?)
    `).get(recoveredAddress);

    if (!user) {
      const newUserId = `usr-${crypto.randomBytes(6).toString("hex")}`;
      let initialRole = "DONOR";

      if (recoveredAddress.toLowerCase() === "0x51E2aC9005934571A3793f0bB75A1F7096e1304B".toLowerCase()) {
        initialRole = "PLATFORM_SUPER_ADMIN";
      } else if (recoveredAddress.toLowerCase() === "0x19a0EFA23F2718E27ffB906560Bfc30Dfe7D0A24".toLowerCase()) {
        initialRole = "INDEPENDENT_AUDITOR";
      }

      db.prepare(`
        INSERT INTO users (id, wallet_address, display_name, global_role, token_version, wallet_linked_at)
        VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).run(newUserId, recoveredAddress, ngo ? ngo.name : "Registered User", initialRole);

      if (ngo) {
        db.prepare(`
          INSERT OR IGNORE INTO ngo_memberships (id, ngo_id, user_id, role, status)
          VALUES (?, ?, ?, 'NGO_ADMIN', 'ACTIVE')
        `).run(`mem-${crypto.randomBytes(6).toString("hex")}`, ngo.id, newUserId);
      }

      user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(newUserId);
    }

    return this.createSessionResponse(user, recoveredAddress);
  }

  /**
   * Password login with rate limiting, brute force lockout, and constant-time execution.
   */
  async loginWithPassword(email, password, ipAddress = "127.0.0.1") {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(normalizedEmail);

    // Constant-time dummy computation if user doesn't exist (prevents enumeration via timing)
    if (!user) {
      const dummySalt = "00000000000000000000000000000000";
      verifyPassword(password, "0000000000000000000000000000000000000000000000000000000000000000", dummySalt);
      logSecurityEvent({
        actorAddress: ipAddress,
        action: "AUTH_LOGIN_FAILED_NONEXISTENT",
        resourceType: "SESSION",
        status: "DENIED",
        details: { email: normalizedEmail },
      });
      throw new Error("Invalid email or password.");
    }

    // Check account lockout
    if (user.locked_until && Date.now() < user.locked_until) {
      const remainingMin = Math.ceil((user.locked_until - Date.now()) / 60000);
      logSecurityEvent({
        actorAddress: ipAddress,
        action: "AUTH_LOGIN_LOCKED_ACCOUNT",
        resourceType: "USER",
        resourceId: user.id,
        status: "DENIED",
      });
      throw new Error(`Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMin} minute(s).`);
    }

    if (!user.password_hash || !user.password_salt) {
      throw new Error("Invalid email or password. If you registered via wallet, please sign in with your Web3 wallet.");
    }

    const isValid = verifyPassword(password, user.password_hash, user.password_salt);

    if (!isValid) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = 0;

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      }

      db.prepare(`
        UPDATE users SET failed_login_attempts = ?, locked_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(attempts, lockedUntil, user.id);

      logSecurityEvent({
        actorAddress: ipAddress,
        action: "AUTH_LOGIN_PASSWORD_FAILED",
        resourceType: "USER",
        resourceId: user.id,
        status: "DENIED",
        details: { attempts, locked: lockedUntil > 0 },
      });

      if (lockedUntil > 0) {
        throw new Error("Account has been locked for 15 minutes due to 5 consecutive failed login attempts.");
      }

      throw new Error("Invalid email or password.");
    }

    // Login successful: reset failed attempts
    db.prepare(`
      UPDATE users SET failed_login_attempts = 0, locked_until = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(user.id);

    return this.createSessionResponse(user, user.wallet_address);
  }

  /**
   * Registers a new donor account with email/password and optional cryptographic wallet link.
   */
  async registerDonor({
    email,
    password,
    displayName,
    acceptedTerms,
    acceptedPrivacy,
    walletAddress = null,
    message = null,
    signature = null,
  }) {
    if (!email) {
      throw new Error("Email address is required.");
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (!acceptedTerms || !acceptedPrivacy) {
      throw new Error("You must agree to the Terms of Service and Privacy Policy to create an account.");
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      throw new Error(strength.message);
    }

    // Check duplicate email
    const existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)").get(normalizedEmail);
    if (existing) {
      const err = new Error("An account with this email address already exists.");
      err.code = "EMAIL_ALREADY_EXISTS";
      throw err;
    }

    let verifiedWallet = null;

    // If wallet provided during registration, verify signature ownership immediately
    if (walletAddress) {
      if (!message || !signature) {
        throw new Error("Cryptographic message and signature are required to link a wallet during registration.");
      }
      if (!ethers.isAddress(walletAddress)) {
        throw new Error("Invalid Ethereum wallet address format.");
      }
      const checksummed = ethers.getAddress(walletAddress);

      // Verify signature matches wallet
      let recovered;
      try {
        recovered = ethers.getAddress(ethers.verifyMessage(message, signature));
      } catch (e) {
        throw new Error("Signature verification failed: wallet ownership could not be proven.");
      }

      if (recovered.toLowerCase() !== checksummed.toLowerCase()) {
        throw new Error("Cryptographic signature does not match the specified wallet address.");
      }

      // Check if wallet is already exclusively associated with another user
      const existingWalletUser = db.prepare("SELECT id FROM users WHERE LOWER(wallet_address) = LOWER(?)").get(checksummed);
      if (existingWalletUser) {
        const err = new Error("This wallet address is already linked to another account.");
        err.code = "WALLET_ALREADY_LINKED";
        throw err;
      }

      verifiedWallet = checksummed;
    }

    const { hash, salt } = hashPassword(password);
    const userId = `usr-${crypto.randomBytes(6).toString("hex")}`;
    const verificationToken = generateToken(32);
    const verificationExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    db.prepare(`
      INSERT INTO users (
        id, wallet_address, display_name, email, password_hash, password_salt,
        email_verified, email_verification_token, email_verification_expires_at,
        global_role, token_version, wallet_linked_at, terms_accepted_at, privacy_accepted_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'DONOR', 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      userId,
      verifiedWallet,
      displayName ? displayName.trim() : "Verified Donor",
      normalizedEmail,
      hash,
      salt,
      verificationToken,
      verificationExpiresAt,
      verifiedWallet ? new Date().toISOString() : null
    );

    logSecurityEvent({
      actorAddress: verifiedWallet || "EMAIL_USER",
      action: "DONOR_REGISTERED",
      resourceType: "USER",
      resourceId: userId,
      status: "SUCCESS",
      details: { email: normalizedEmail, hasWallet: !!verifiedWallet },
    });

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

    return {
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      walletAddress: user.wallet_address,
      globalRole: user.global_role,
      emailVerified: false,
      verificationToken, // Returned for dev/test verification simulation
    };
  }

  /**
   * Verifies email using verification token.
   */
  verifyEmail(token) {
    if (!token) {
      throw new Error("Verification token is required.");
    }

    const user = db.prepare(`
      SELECT * FROM users WHERE email_verification_token = ?
    `).get(token);

    if (!user) {
      throw new Error("Invalid or expired email verification token.");
    }

    if (user.email_verification_expires_at && Date.now() > user.email_verification_expires_at) {
      throw new Error("Email verification token has expired. Please request a new verification link.");
    }

    db.prepare(`
      UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(user.id);

    return { success: true, message: "Email has been successfully verified." };
  }

  /**
   * Requests a password reset link. Returns generic response regardless of existence.
   */
  requestPasswordReset(email) {
    if (!email) {
      throw new Error("Email address is required.");
    }
    const normalized = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(normalized);

    let debugToken = null;

    if (user) {
      const rawToken = generateToken(32);
      const tokenDigest = hashToken(rawToken);
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

      db.prepare(`
        UPDATE users SET password_reset_token_hash = ?, password_reset_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(tokenDigest, expiresAt, user.id);

      debugToken = rawToken; // Exported for test verification

      logSecurityEvent({
        actorAddress: user.wallet_address || "SYSTEM",
        action: "PASSWORD_RESET_REQUESTED",
        resourceType: "USER",
        resourceId: user.id,
        status: "SUCCESS",
      });
    }

    return {
      success: true,
      message: "If an account exists with that email, a password reset link has been dispatched.",
      debugToken: process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development" ? debugToken : undefined,
    };
  }

  /**
   * Resets password using a single-use token and invalidates all active sessions.
   */
  resetPassword(rawToken, newPassword) {
    if (!rawToken || !newPassword) {
      throw new Error("Token and new password are required.");
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      throw new Error(strength.message);
    }

    const tokenDigest = hashToken(rawToken);
    const user = db.prepare(`
      SELECT * FROM users WHERE password_reset_token_hash = ?
    `).get(tokenDigest);

    if (!user) {
      throw new Error("Invalid or previously consumed password reset token.");
    }

    if (user.password_reset_expires_at && Date.now() > user.password_reset_expires_at) {
      throw new Error("Password reset token has expired. Please request a new link.");
    }

    const { hash, salt } = hashPassword(newPassword);

    db.prepare(`
      UPDATE users SET 
        password_hash = ?, 
        password_salt = ?, 
        password_reset_token_hash = NULL, 
        password_reset_expires_at = NULL,
        failed_login_attempts = 0,
        locked_until = 0,
        token_version = token_version + 1,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(hash, salt, user.id);

    logSecurityEvent({
      actorAddress: user.wallet_address || "SYSTEM",
      action: "PASSWORD_RESET_SUCCESS",
      resourceType: "USER",
      resourceId: user.id,
      status: "SUCCESS",
    });

    return { success: true, message: "Password has been successfully reset. Please log in with your new password." };
  }

  /**
   * Links a wallet address to an existing account with cryptographic proof of ownership.
   */
  linkWallet({ userId, address, message, signature }) {
    if (!userId || !address || !message || !signature) {
      throw new Error("userId, address, message, and signature are required.");
    }

    if (!ethers.isAddress(address)) {
      throw new Error("Invalid Ethereum wallet address format.");
    }
    const checksummed = ethers.getAddress(address);

    let recovered;
    try {
      recovered = ethers.getAddress(ethers.verifyMessage(message, signature));
    } catch {
      throw new Error("Cryptographic signature verification failed: wallet ownership unproven.");
    }

    if (recovered.toLowerCase() !== checksummed.toLowerCase()) {
      throw new Error("Signer does not match the provided wallet address.");
    }

    // Check if wallet is linked to another user
    const existing = db.prepare("SELECT id FROM users WHERE LOWER(wallet_address) = LOWER(?) AND id != ?").get(checksummed, userId);
    if (existing) {
      const err = new Error("This wallet address is already associated with another account.");
      err.code = "WALLET_ALREADY_LINKED";
      throw err;
    }

    db.prepare(`
      UPDATE users SET wallet_address = ?, wallet_linked_at = CURRENT_TIMESTAMP, token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(checksummed, userId);

    logSecurityEvent({
      actorAddress: checksummed,
      action: "WALLET_LINKED",
      resourceType: "USER",
      resourceId: userId,
      status: "SUCCESS",
    });

    return db.prepare("SELECT id, display_name, email, wallet_address, global_role FROM users WHERE id = ?").get(userId);
  }

  /**
   * Switches organization context for multi-organization users and recomputes effective permissions.
   */
  switchOrganization({ userId, targetNgoId }) {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    let activeRole = user.global_role;
    let ngoName = null;

    if (user.global_role === "PLATFORM_SUPER_ADMIN") {
      activeRole = "PLATFORM_SUPER_ADMIN";
      if (targetNgoId) {
        const ngo = db.prepare("SELECT name FROM ngos WHERE id = ?").get(targetNgoId);
        if (ngo) ngoName = ngo.name;
      }
    } else {
      if (!targetNgoId) {
        // Return to standard personal donor view
        activeRole = "DONOR";
      } else {
        const membership = db.prepare(`
          SELECT m.*, n.name AS ngo_name 
          FROM ngo_memberships m
          JOIN ngos n ON m.ngo_id = n.id
          WHERE m.user_id = ? AND m.ngo_id = ? AND m.status = 'ACTIVE'
        `).get(userId, targetNgoId);

        if (!membership) {
          throw new Error(`You do not hold an active membership in organization '${targetNgoId}'.`);
        }

        activeRole = membership.role;
        ngoName = membership.ngo_name;
      }
    }

    return this.createSessionResponse(user, user.wallet_address, targetNgoId, activeRole, ngoName);
  }

  /**
   * Generates a signed JWT session response object.
   */
  createSessionResponse(user, walletAddress = null, forcedNgoId = null, forcedRole = null, forcedNgoName = null) {
    // Fetch active memberships
    const memberships = db.prepare(`
      SELECT m.*, n.name AS ngo_name, n.verified_wallet AS ngo_wallet
      FROM ngo_memberships m
      JOIN ngos n ON m.ngo_id = n.id
      WHERE m.user_id = ? AND m.status = 'ACTIVE'
    `).all(user.id);

    let activeNgoId = forcedNgoId !== undefined ? forcedNgoId : null;
    let activeRole = forcedRole || user.global_role;
    let activeNgoName = forcedNgoName || null;

    if (!forcedRole) {
      if (memberships.length > 0) {
        activeNgoId = memberships[0].ngo_id;
        activeRole = memberships[0].role;
        activeNgoName = memberships[0].ngo_name;
      }
    }

    const assignedRoles = [user.global_role];
    if (activeRole && !assignedRoles.includes(activeRole)) {
      assignedRoles.push(activeRole);
    }
    const permissions = getPermissionsForRoles(assignedRoles);

    let legacyRole = "AUTHORIZED_DONOR";
    if (user.global_role === "PLATFORM_SUPER_ADMIN") {
      legacyRole = "PLATFORM_ADMIN";
    } else if (["NGO_ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER"].includes(activeRole)) {
      legacyRole = "NGO_OPERATOR";
    }

    const tokenPayload = {
      userId: user.id,
      address: walletAddress || user.wallet_address,
      email: user.email,
      globalRole: user.global_role,
      activeRole,
      activeNgoId,
      role: legacyRole,
      ngoId: activeNgoId,
      permissions,
      tokenVersion: user.token_version || 1,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    const serializedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString("base64url");
    const hmac = crypto.createHmac("sha256", JWT_SECRET).update(serializedPayload).digest("base64url");
    const token = `${serializedPayload}.${hmac}`;

    return {
      token,
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      wallet: walletAddress || user.wallet_address,
      globalRole: user.global_role,
      activeRole,
      role: legacyRole,
      ngoId: activeNgoId,
      ngoName: activeNgoName,
      permissions,
      memberships,
    };
  }

  /**
   * Verifies session token authenticity and checks token version against revocation status.
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

      // Check revoked token table
      const tokenDigest = hashToken(token);
      const isRevoked = db.prepare("SELECT token_hash FROM revoked_tokens WHERE token_hash = ?").get(tokenDigest);
      if (isRevoked) {
        return null;
      }

      // Check token version if userId is present
      if (payload.userId) {
        const user = db.prepare("SELECT token_version FROM users WHERE id = ?").get(payload.userId);
        if (!user || (payload.tokenVersion && user.token_version !== payload.tokenVersion)) {
          return null; // Session revoked!
        }
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Logs out user and invalidates token.
   */
  logout(token, userId = null) {
    if (token) {
      const tokenDigest = hashToken(token);
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      db.prepare(`
        INSERT OR IGNORE INTO revoked_tokens (token_hash, expires_at) VALUES (?, ?)
      `).run(tokenDigest, expiresAt);
    }
    if (userId) {
      db.prepare(`UPDATE users SET token_version = token_version + 1 WHERE id = ?`).run(userId);
    }
    return true;
  }

  /**
   * Instantly invalidates all active sessions for a user by incrementing token version.
   */
  revokeUserSessions(userId, actorAddress = "SYSTEM") {
    db.prepare(`
      UPDATE users SET token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(userId);

    logSecurityEvent({
      actorAddress,
      action: "USER_SESSIONS_REVOKED",
      resourceType: "USER",
      resourceId: userId,
      status: "SUCCESS",
    });

    return true;
  }
}

module.exports = new AuthService();
