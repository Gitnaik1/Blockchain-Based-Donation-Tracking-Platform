# TrustDonate: Blockchain-Based Donation Tracking Platform for NGOs

An end-to-end, decentralized, and transparent donation platform built on **Ethereum/Polygon (Amoy Testnet)**. TrustDonate eliminates intermediary leakage and ensures cryptographic accountability by tracking every donor contribution, fund allocation, milestone release, and 80G tax receipt on-chain.

Repository: [https://github.com/Gitnaik1/Blockchain-Based-Donation-Tracking-Platform](https://github.com/Gitnaik1/Blockchain-Based-Donation-Tracking-Platform)

---

## 🌟 Key Features

### 1. 🌐 Public Donor Platform
* **Web3 Wallet Integration**: Connect with MetaMask on Polygon Amoy testnet with automatic network detection and fallbacks.
* **Direct Smart Contract Transfers**: Make verified contributions in **USDC**, **USDT**, or native **POL** with simulated contract execution.
* **Live Cryptographic Stream**: Real-time mempool stream of transactions with one-click hash copying and direct links to **PolygonScan**.
* **Cryptographic Verification Console**: Search any transaction hash, wallet address, or IPFS CID to inspect block height, validator nodes, and event logs.
* **Instant 80G Tax Certificates**: Automatic generation of compliant 80G receipts for every donor contribution.

### 2. 🏛️ NGO Management Portal
* **Web3 Authenticated Access**: Secure wallet-based login for authorized NGO administrators.
* **Executive Overview Dashboard**: Dynamic KPI cards (Total Volume, Available Funds, Utilized Funds, Donor Counts), interactive SVG trend charts, and pending action checklists.
* **Live Donations Ledger**: Fully reactive ledger tracking incoming donor funds with token filters (`POL`, `USDC`, `USDT`), `NEW` contribution badges, and one-click CSV export.
* **Fund Allocation & Escrow**: Milestone-based allocation system with bidirectional INR/ETH calculation and simulated multi-sig release.
* **Projects & Milestone Portfolio**: Track active initiatives, milestone progress bars, and deploy new project proposals.
* **IPFS Impact Reports**: View and publish verified impact reports with IPFS CID audit trails and third-party auditor signatures.
* **Donor CRM**: Manage donor engagement tiers (Platinum, Gold, Silver) with direct impact notification dispatch.
* **Multi-Sig Governance Settings**: Manage 3-of-5 threshold multi-sig signer registries, treasury contracts, and FCRA/80G registrations.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite 6, Tailwind CSS
* **Icons & Animation**: Lucide React, Canvas Confetti
* **Web3 Integration**: Ethers.js / Web3Context provider for MetaMask & Polygon Amoy
* **Decentralized Storage**: IPFS receipt pinning architecture

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:Gitnaik1/Blockchain-Based-Donation-Tracking-Platform.git

# Navigate to project directory
cd Blockchain-Based-Donation-Tracking-Platform

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Building for Production

```bash
npm run build
```

---

## 📄 License
MIT License.
