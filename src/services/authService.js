/**
 * NGO Authentication Service
 * Implements EIP-4361 / personal_sign challenge-response authentication.
 * Distinguishes production backend authentication from explicitly marked development mock auth.
 */

import { APP_CONFIG } from "../config/index.js";

const SESSION_STORAGE_KEY = "trustdonate_ngo_session";

class AuthService {
  constructor() {
    this.session = this._loadSession();
  }

  _loadSession() {
    try {
      const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      // Check expiration
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        this.clearSession();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  getSession() {
    if (this.session && this.session.expiresAt && Date.now() > this.session.expiresAt) {
      this.clearSession();
      return null;
    }
    return this.session;
  }

  isAuthenticated() {
    return Boolean(this.getSession()?.token);
  }

  clearSession() {
    this.session = null;
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Generates or requests a cryptographically unique authentication challenge/nonce.
   * @param {string} walletAddress
   * @returns {Promise<{nonce: string, message: string, timestamp: number}>}
   */
  async requestChallenge(walletAddress) {
    if (!walletAddress) {
      throw new Error("Wallet address is required to request authentication challenge.");
    }

    // Try backend API if not in forced mock mode
    if (!APP_CONFIG.useMockBackend) {
      try {
        const res = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/challenge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: walletAddress }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn("Backend challenge endpoint unreachable, falling back to local challenge adapter:", err);
      }
    }

    // Local challenge generator (Mock / Development Mode)
    const nonce = `td_nonce_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const timestamp = Date.now();
    const message = [
      "TrustDonate NGO Portal Sign-In",
      "Please sign this message to verify ownership of your administrative wallet.",
      "",
      `Wallet: ${walletAddress}`,
      `Nonce: ${nonce}`,
      `Timestamp: ${new Date(timestamp).toISOString()}`,
      "",
      "Notice: This signature does not authorize any fund transfer or contract modification.",
    ].join("\n");

    return { nonce, message, timestamp, isMock: true };
  }

  /**
   * Requests wallet signature for the challenge message via EIP-1193 personal_sign.
   * @param {string} message
   * @param {string} walletAddress
   * @param {boolean} isDemo
   * @returns {Promise<string>} signature hex
   */
  async signChallenge(message, walletAddress, isDemo = false) {
    if (isDemo || typeof window === "undefined" || !window.ethereum) {
      // Demo / simulated signature with delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      return `0xsimulated_sig_${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;
    }

    try {
      // Convert message to hex for personal_sign
      const msgHex = `0x${Array.from(new TextEncoder().encode(message))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;

      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [msgHex, walletAddress],
      });
      return signature;
    } catch (err) {
      if (err.code === 4001) {
        throw new Error("Signature request was cancelled by the user.");
      }
      throw new Error(err.message || "Failed to sign authentication challenge.");
    }
  }

  /**
   * Verifies the signature and issues an authenticated NGO session.
   * @param {Object} params
   * @param {string} params.wallet
   * @param {string} params.signature
   * @param {string} params.nonce
   * @param {boolean} params.isDemo
   * @returns {Promise<Object>} Session object
   */
  async verifySession({ wallet, signature, nonce, isDemo = false }) {
    if (!wallet || !signature) {
      throw new Error("Missing wallet address or signature for authentication.");
    }

    // Try backend verification if not forced mock
    if (!APP_CONFIG.useMockBackend && !isDemo) {
      try {
        const res = await fetch(`${APP_CONFIG.apiBaseUrl}/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet, signature, nonce }),
        });
        if (res.ok) {
          const data = await res.json();
          this.session = {
            token: data.token,
            wallet,
            ngoName: data.ngoName || "Asha Foundation",
            role: data.role || "Admin",
            authMode: "production",
            expiresAt: data.expiresAt || Date.now() + 60 * 60 * 1000,
          };
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.session));
          return this.session;
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Backend rejected wallet authentication signature.");
        }
      } catch (err) {
        if (!APP_CONFIG.useMockBackend) {
          throw err;
        }
      }
    }

    // Development / Mock Session
    const session = {
      token: `dev_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      wallet,
      ngoName: "Asha Foundation",
      role: "Admin",
      authMode: isDemo ? "demo" : "mock_local",
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    };

    this.session = session;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }
    return session;
  }
}

export const authService = new AuthService();
