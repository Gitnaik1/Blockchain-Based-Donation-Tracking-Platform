/**
 * Central Configuration for TrustDonate Platform
 * Defines networks, tokens, contract addresses, exchange rates, and environment flags.
 */

export const AMOY_CHAIN_ID_DEC = 80002;
export const AMOY_CHAIN_ID_HEX = "0x13882";

export const SUPPORTED_NETWORKS = {
  80002: {
    chainIdHex: AMOY_CHAIN_ID_HEX,
    chainIdDec: AMOY_CHAIN_ID_DEC,
    name: "Polygon Amoy Testnet",
    shortName: "Amoy",
    rpcUrl: "https://polygon-amoy.drpc.org",
    rpcUrls: [
      "https://polygon-amoy.drpc.org",
      "https://polygon-amoy-bor-rpc.publicnode.com",
      "https://rpc-amoy.polygon.technology/",
    ],
    explorerUrl: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "POL",
      symbol: "POL",
      decimals: 18,
    },
  },
  31337: {
    chainIdHex: "0x7a69",
    chainIdDec: 31337,
    name: "Localhost / Hardhat",
    shortName: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    explorerUrl: "http://localhost:8545",
    nativeCurrency: {
      name: "Test POL",
      symbol: "POL",
      decimals: 18,
    },
  },
};

export const DEFAULT_CHAIN_ID = AMOY_CHAIN_ID_DEC;

export const SUPPORTED_TOKENS = {
  POL: {
    symbol: "POL",
    name: "Polygon Ecosystem Token",
    decimals: 18,
    isNative: true,
    address: "0x0000000000000000000000000000000000001010",
    icon: "POL",
    exchangeRateInr: 100, // 1 POL ≈ ₹100 (explicitly labeled estimate)
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin (Amoy Testnet)",
    decimals: 6,
    isNative: false,
    address: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
    icon: "USDC",
    exchangeRateInr: 85, // 1 USDC ≈ ₹85 (explicitly labeled estimate)
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD (Amoy Testnet)",
    decimals: 6,
    isNative: false,
    address: "0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832",
    icon: "USDT",
    exchangeRateInr: 85, // 1 USDT ≈ ₹85 (explicitly labeled estimate)
  },
};

export const CONTRACT_ADDRESSES = {
  TrustDonateTreasury: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
  EscrowMilestones: "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB",
  AshaFoundationVault: "0x71F39082Bc45199201aDeF80B91244019aA2C81B",
};

const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : (typeof process !== "undefined" ? process.env : {});

export const APP_CONFIG = {
  appName: "TrustDonate",
  appVersion: "1.0.0",
  apiBaseUrl: env?.VITE_API_BASE_URL || "http://localhost:4000/api",
  useMockBackend: env?.VITE_USE_MOCK_BACKEND !== "false",
  useMockChain: env?.VITE_USE_MOCK_CHAIN === "true",
  ipfsGateway: "https://ipfs.io/ipfs/",
  exchangeRateDisclaimer: "Fiat values are estimated based on documented baseline: 1 POL ≈ ₹100, 1 USDC/USDT ≈ ₹85.",
};
