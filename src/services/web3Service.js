/**
 * Web3 Provider Service
 * Handles EIP-1193 standard wallet communication, network verification,
 * transaction broadcasting, receipt tracking, and mock fallback.
 */

import {
  AMOY_CHAIN_ID_HEX,
  AMOY_CHAIN_ID_DEC,
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
  APP_CONFIG,
} from "../config/index.js";
import {
  toBaseUnits,
  isValidAddress,
  isValidTxHash,
} from "./utils/tokenMath.js";
import { encodeErc20Transfer } from "./abi.js";

class Web3Service {
  constructor() {
    this.provider = typeof window !== "undefined" ? window.ethereum : null;
  }

  isWalletAvailable() {
    return typeof window !== "undefined" && Boolean(window.ethereum);
  }

  async getAccounts() {
    if (!this.isWalletAvailable()) return [];
    try {
      return await window.ethereum.request({ method: "eth_accounts" });
    } catch (err) {
      console.warn("Failed to retrieve accounts:", err);
      return [];
    }
  }

  async getChainId() {
    if (!this.isWalletAvailable()) return null;
    try {
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      return parseInt(chainIdHex, 16);
    } catch (err) {
      console.warn("Failed to get chainId:", err);
      return null;
    }
  }

  isAmoyNetwork(chainId) {
    if (!chainId) return false;
    const dec = typeof chainId === "string" ? parseInt(chainId, 16) : chainId;
    return dec === AMOY_CHAIN_ID_DEC;
  }

  async switchOrAddAmoyNetwork() {
    if (!this.isWalletAvailable()) {
      return { success: false, error: "No Ethereum wallet detected." };
    }

    const amoyConfig = SUPPORTED_NETWORKS[AMOY_CHAIN_ID_DEC];

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_CHAIN_ID_HEX }],
      });
      return { success: true };
    } catch (switchError) {
      // 4902 error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: AMOY_CHAIN_ID_HEX,
                chainName: amoyConfig.name,
                nativeCurrency: amoyConfig.nativeCurrency,
                rpcUrls: amoyConfig.rpcUrls || [amoyConfig.rpcUrl],
                blockExplorerUrls: [amoyConfig.explorerUrl],
              },
            ],
          });
          return { success: true };
        } catch (addError) {
          return { success: false, error: addError.message || "Failed to add Amoy network" };
        }
      }
      return { success: false, error: switchError.message || "Failed to switch network" };
    }
  }

  /**
   * Prompts MetaMask to update its active RPC endpoints to high-speed alternatives (DRPC/PublicNode).
   */
  async updateAmoyRpc() {
    if (!this.isWalletAvailable()) {
      return { success: false, error: "No Ethereum wallet detected." };
    }
    const amoyConfig = SUPPORTED_NETWORKS[AMOY_CHAIN_ID_DEC];
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: AMOY_CHAIN_ID_HEX,
            chainName: amoyConfig.name,
            nativeCurrency: amoyConfig.nativeCurrency,
            rpcUrls: amoyConfig.rpcUrls || [amoyConfig.rpcUrl],
            blockExplorerUrls: [amoyConfig.explorerUrl],
          },
        ],
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Failed to update RPC in MetaMask" };
    }
  }

  /**
   * Submits a donation transaction (Real on-chain if live wallet connected, simulated if demo mode).
   * @param {Object} params
   * @param {string} params.from
   * @param {string} params.to
   * @param {string} params.amount
   * @param {string} params.token
   * @param {boolean} params.isDemo
   * @returns {Promise<{success: boolean, hash: string, status: string, isSimulated: boolean, explorerUrl: string}>}
   */
  async submitDonation({ from, to, amount, token, isDemo = false }) {
    if (!to || !isValidAddress(to)) {
      throw new Error(`Invalid destination address: ${to}`);
    }
    const tokenMeta = SUPPORTED_TOKENS[token];
    if (!tokenMeta) {
      throw new Error(`Unsupported token: ${token}`);
    }

    const baseUnits = toBaseUnits(amount, tokenMeta.decimals);
    if (BigInt(baseUnits) <= 0n) {
      throw new Error("Donation amount must be greater than zero.");
    }

    // If Demo mode or wallet is not available, execute simulated transaction with realistic delay
    if (isDemo || !this.isWalletAvailable() || APP_CONFIG.useMockChain) {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const simulatedHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")}`;

      return {
        success: true,
        hash: simulatedHash,
        status: "Mined",
        isSimulated: true,
        explorerUrl: `${SUPPORTED_NETWORKS[AMOY_CHAIN_ID_DEC].explorerUrl}/tx/${simulatedHash}`,
      };
    }

    // Real on-chain transaction execution via MetaMask
    try {
      let txParams = {};

      if (tokenMeta.isNative) {
        // Native POL transaction
        const hexWei = `0x${BigInt(baseUnits).toString(16)}`;
        txParams = {
          from,
          to,
          value: hexWei,
        };
      } else {
        // ERC-20 transfer calldata (USDC or USDT)
        const calldata = encodeErc20Transfer(to, baseUnits);
        txParams = {
          from,
          to: tokenMeta.address,
          data: calldata,
          value: "0x0",
        };
      }

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      return {
        success: true,
        hash: txHash,
        status: "Pending",
        isSimulated: false,
        explorerUrl: `${SUPPORTED_NETWORKS[AMOY_CHAIN_ID_DEC].explorerUrl}/tx/${txHash}`,
      };
    } catch (err) {
      if (err.code === 4001) {
        throw new Error("Transaction rejected by user.");
      }
      throw new Error(err.message || "Failed to broadcast transaction to Polygon Amoy.");
    }
  }

  /**
   * Queries transaction receipt from Polygon Amoy
   */
  async getTransactionReceipt(txHash) {
    if (!this.isWalletAvailable() || !isValidTxHash(txHash)) {
      return null;
    }
    try {
      const receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
      return receipt;
    } catch (err) {
      console.warn("Could not query transaction receipt:", err);
      return null;
    }
  }
}

export const web3Service = new Web3Service();
