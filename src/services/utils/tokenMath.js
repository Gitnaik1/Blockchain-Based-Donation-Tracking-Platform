/**
 * Token Mathematics and Validation Utilities
 * Integer-safe calculations using native BigInt to eliminate floating-point precision loss.
 */

/**
 * Converts a human-readable decimal string (e.g. "12.345") to base units (e.g. wei) as a BigInt string.
 * @param {string|number} amountStr
 * @param {number} decimals
 * @returns {string} base units representation
 */
export function toBaseUnits(amountStr, decimals = 18) {
  if (amountStr === null || amountStr === undefined) return "0";
  const cleanStr = String(amountStr).trim();
  if (!cleanStr || cleanStr === ".") return "0";

  // Validate numeric format (positive integer or decimal)
  if (!/^\d+(\.\d+)?$/.test(cleanStr)) {
    throw new Error(`Invalid decimal amount format: "${amountStr}"`);
  }

  const [wholePart, fracPart = ""] = cleanStr.split(".");
  const paddedFrac = (fracPart + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${wholePart}${paddedFrac}`.replace(/^0+/, "");
  return combined === "" ? "0" : combined;
}

/**
 * Converts base units string (e.g. wei) to a human-readable decimal string.
 * @param {string|bigint|number} baseUnits
 * @param {number} decimals
 * @param {number} maxDisplayDecimals
 * @returns {string}
 */
export function fromBaseUnits(baseUnits, decimals = 18, maxDisplayDecimals = 4) {
  if (!baseUnits) return "0";
  const str = String(baseUnits).trim();
  if (str === "0") return "0";

  const padded = str.padStart(decimals + 1, "0");
  const wholePart = padded.slice(0, -decimals).replace(/^0+/, "") || "0";
  let fracPart = padded.slice(-decimals);

  if (maxDisplayDecimals !== undefined) {
    fracPart = fracPart.slice(0, maxDisplayDecimals);
  }
  // Trim trailing zeros from fractional part
  fracPart = fracPart.replace(/0+$/, "");
  return fracPart.length > 0 ? `${wholePart}.${fracPart}` : wholePart;
}

/**
 * Formats a cryptocurrency amount with symbol and fixed precision.
 */
export function formatCrypto(amount, symbol = "POL", decimals = 4) {
  const num = typeof amount === "number" ? amount : parseFloat(amount || 0);
  if (isNaN(num)) return `0.00 ${symbol}`;
  return `${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  })} ${symbol}`;
}

/**
 * Formats an INR fiat amount with Indian number system grouping (Lakhs, Crores).
 */
export function formatInr(amount) {
  const num = typeof amount === "number" ? amount : parseFloat(amount || 0);
  if (isNaN(num)) return "₹0";
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
}

/**
 * Truncates an Ethereum address (e.g., 0x71F3...9A2C).
 */
export function shortenAddress(address, chars = 4) {
  if (!address || typeof address !== "string") return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Truncates a transaction hash (e.g., 0x8f1c...11d8).
 */
export function shortenTxHash(hash, chars = 6) {
  if (!hash || typeof hash !== "string") return "";
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Validates an Ethereum hexadecimal address format.
 */
export function isValidAddress(address) {
  return typeof address === "string" && /^0x[0-9a-fA-F]{40}$/.test(address.trim());
}

/**
 * Validates a 32-byte Ethereum transaction hash format.
 */
export function isValidTxHash(hash) {
  return typeof hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(hash.trim());
}

/**
 * Validates an IPFS Content Identifier (CIDv0 or CIDv1 base58/base32).
 */
export function isValidCid(cid) {
  if (typeof cid !== "string") return false;
  const clean = cid.trim();
  // CIDv0 starts with Qm and is 46 chars long base58
  const isCidV0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(clean);
  // CIDv1 typically starts with bafy... or bafk...
  const isCidV1 = /^baf[a-z2-7]{40,100}$/.test(clean);
  return isCidV0 || isCidV1;
}

/**
 * Strips '0x' prefix from hex string if present.
 */
export function stripHexPrefix(hex) {
  if (typeof hex !== "string") return "";
  return hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
}

/**
 * Adds '0x' prefix to hex string if missing.
 */
export function addHexPrefix(hex) {
  if (typeof hex !== "string") return "0x";
  return hex.startsWith("0x") || hex.startsWith("0X") ? hex : `0x${hex}`;
}

/**
 * Pads a hex string to 32 bytes (64 hex characters).
 */
export function padTo32Bytes(hex, left = true) {
  const stripped = stripHexPrefix(hex);
  const padded = left
    ? stripped.padStart(64, "0")
    : stripped.padEnd(64, "0");
  return padded;
}
