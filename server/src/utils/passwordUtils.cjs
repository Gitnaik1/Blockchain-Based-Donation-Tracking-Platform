const crypto = require("crypto");

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

/**
 * Derives a memory-hard scrypt hash from a password string with a random salt.
 */
function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return {
    hash: derivedKey.toString("hex"),
    salt,
  };
}

/**
 * Validates a password against an existing hash and salt in constant time.
 */
function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) {
    return false;
  }
  try {
    const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
    });
    const hashBuffer = Buffer.from(hash, "hex");
    const derivedBuffer = Buffer.from(derivedKey);
    if (hashBuffer.length !== derivedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Validates password strength policy:
 * At least 8 characters, with at least 1 uppercase, 1 lowercase, and 1 number.
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters in length." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter." };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number." };
  }
  return { valid: true };
}

/**
 * Computes a SHA-256 digest of a token for secure one-way storage.
 */
function hashToken(token) {
  if (!token) return "";
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates an unpredictable cryptographic token.
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  hashToken,
  generateToken,
};
