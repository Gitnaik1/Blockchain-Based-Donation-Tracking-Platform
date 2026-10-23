# TrustDonate Deployment Guide

## 1. Prerequisites
- Node.js >= 18.0.0
- Hardhat toolchain (pre-configured)
- An funded deployer wallet on Polygon Amoy (obtain free testnet POL from the official Polygon Faucet: `https://faucet.polygon.technology/`)

---

## 2. Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your deployment private key and RPC in `.env`:
```ini
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
AMOY_CHAIN_ID=80002
PRIVATE_KEY_DEPLOYER=0xYourPrivateKeyHereWithoutQuotes
```

---

## 3. Local Development Deployment (Automated)

Run the local deployment script:
```bash
npm run deploy:local
```

This compiles all Solidity contracts, deploys `NgoRegistry`, `TrustDonateTreasury`, `MultiSigTreasury`, `MilestoneEscrow`, and mock USDC/USDT tokens, registers sample verified NGOs, and exports the address registry to `src/contracts/address-registry.json`.

---

## 4. Polygon Amoy Testnet Deployment

To deploy directly to Polygon Amoy:
```bash
npx hardhat --config hardhat.config.cjs run scripts/deploy.cjs --network amoy
```

Once deployment completes:
1. The script automatically updates `src/contracts/address-registry.json`.
2. Run `npm run export:artifacts` to refresh frontend ABIs.
3. Start the backend server: `npm run server`.
4. Start the frontend: `npm run dev`.

---

## 5. Verification Checklist
- [x] Solidity compiler pinned to `0.8.24` with optimizer enabled (200 runs).
- [x] Checks-Effects-Interactions (CEI) & `ReentrancyGuard` enforced.
- [x] Explicit token allowlist configured for native POL and standard ERC-20s.
- [x] 3-of-5 threshold Multi-Sig governance verified.
- [x] Address registry and ABIs exported directly to frontend directory.
