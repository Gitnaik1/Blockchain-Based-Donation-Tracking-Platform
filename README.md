# TrustDonate: Blockchain-Based Transparent Donation Tracking Platform for NGOs

An end-to-end, decentralized, and transparent donation platform built on **Ethereum/Polygon (Amoy Testnet)**. TrustDonate eliminates intermediary leakage and ensures cryptographic accountability by tracking every donor contribution, fund allocation, milestone release, and receipt on-chain.

Repository: [https://github.com/Gitnaik1/Blockchain-Based-Donation-Tracking-Platform](https://github.com/Gitnaik1/Blockchain-Based-Donation-Tracking-Platform)

---

## 🌟 Key Features

### 1. 🌐 Public Donor Platform
* **Hardened Web3 Wallet Integration**: Connect with MetaMask on Polygon Amoy testnet (80002 / 0x13882) with automatic chain detection, one-click network switching, and graceful interactive demo fallback mode.
* **Direct Smart Contract Transfers**: Make verified contributions in **USDC**, **USDT**, or native **POL** with integer-safe token mathematics, EVM calldata generation, and pre-sign review modals.
* **Live Cryptographic Stream**: Real-time mempool stream of transactions with one-click hash copying and direct links to **PolygonScan**.
* **Cryptographic Evidence Verifier**: Search any transaction hash, wallet address, or IPFS CID to inspect block height, sender/recipient addresses, and differentiated proof criteria.
* **Instant Cryptographic Receipts**: Downloadable HTML/PDF receipts linked directly to on-chain Polygon Amoy transaction hashes.

### 2. 🏛️ NGO Management Portal
* **EIP-4361 Wallet Challenge-Response Sign-In**: Secure wallet-based authentication with one-time nonce challenges, `personal_sign` signature generation, and session expiration management.
* **Authoritative Executive Overview**: Dynamic KPI cards (Total Volume, Available Funds, Utilized Funds, Donor Counts), interactive trend charts, and transparent fiat conversion baselines (1 POL ≈ ₹100, 1 USDC/USDT ≈ ₹85).
* **Synchronized Donations Ledger**: Authoritative shared ledger tracking incoming donor funds with token filters (`POL`, `USDC`, `USDT`), `NEW` contribution badges, and one-click sanitized CSV export.
* **Fund Allocation & Escrow**: Milestone-based allocation system with multi-sig approval tracking (e.g. 3-of-5 signatures required) and invoice IPFS pinning.
* **Projects & Milestone Portfolio**: Track active initiatives, milestone progress bars, and deploy new project proposals.
* **IPFS Impact Reports**: View and publish verified impact reports with IPFS CID audit trails and clearly marked development test fixtures.
* **Donor CRM**: Transparent donor engagement tiers (Platinum, Gold, Silver) with milestone update dispatch and data export.
* **Multi-Sig Governance Settings**: 3-of-5 threshold multi-sig signer registries, treasury contracts, and organization credentials.

---

## 🛠️ Architecture & Typed Integration Layer

```
src/
├── config/
│   └── index.js             # Central networks, tokens, contracts, and environment flags
├── context/
│   └── Web3Context.jsx      # Hardened EIP-1193 wallet provider and network listener
├── services/
│   ├── abi.js               # Minimal EVM calldata encoders (ERC-20 transfer/approve)
│   ├── authService.js       # EIP-4361 challenge-response authentication service
│   ├── donationService.js   # Authoritative synchronized ledger & CSV generator
│   ├── reportsService.js    # IPFS report retrieval & receipt document generator
│   ├── verifierService.js   # Differentiated cryptographic evidence verification
│   ├── web3Service.js       # Web3 transaction broadcast & receipt query adapter
│   └── utils/
│       └── tokenMath.js     # Integer-safe BigInt token math & formatters
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended; tested on Node v22)
* npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:Gitnaik1/Blockchain-Based-Donation-Tracking-Platform.git
cd Blockchain-Based-Donation-Tracking-Platform

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Running Automated Tests

TrustDonate includes a test suite covering token mathematics, Web3 transaction encoding, challenge-response authentication, authoritative ledger deduplication, and a complete 14-step end-to-end integration workflow:

```bash
npm test
```

### Building for Production

```bash
npm run build
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Backend API base endpoint |
| `VITE_USE_MOCK_BACKEND` | `true` | Use typed local mock adapters if backend is offline |
| `VITE_USE_MOCK_CHAIN` | `false` | Force simulated mining even if MetaMask is connected |
| `VITE_TARGET_CHAIN_ID` | `80002` | Target EVM chain (Polygon Amoy Testnet) |
| `VITE_IPFS_GATEWAY` | `https://ipfs.io/ipfs/` | IPFS gateway URL for document inspection |

---

## 📄 License
MIT License.
