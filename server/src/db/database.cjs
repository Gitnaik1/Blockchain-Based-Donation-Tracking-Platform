const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "../../data/trustdonate.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ngos (
      id TEXT PRIMARY KEY,
      on_chain_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      short_description TEXT,
      full_description TEXT,
      verified_wallet TEXT NOT NULL,
      contract_address TEXT,
      legal_reg_no TEXT NOT NULL,
      ipfs_kyc_cid TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      raised_inr INTEGER DEFAULT 0,
      goal_inr INTEGER DEFAULT 0,
      donors_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      wallet TEXT NOT NULL,
      target_inr INTEGER NOT NULL,
      allocated_inr INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      ngo_id TEXT NOT NULL,
      title TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      token_address TEXT NOT NULL,
      amount_raw TEXT NOT NULL,
      amount_formatted TEXT NOT NULL,
      recipient_wallet TEXT NOT NULL,
      ipfs_invoice_cid TEXT,
      deadline INTEGER NOT NULL,
      approval_count INTEGER DEFAULT 0,
      required_approvals INTEGER DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'PROPOSED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      tx_hash TEXT NOT NULL UNIQUE,
      block_number INTEGER,
      chain_id INTEGER NOT NULL DEFAULT 80002,
      ngo_id TEXT NOT NULL,
      donor_address TEXT NOT NULL,
      donor_name TEXT,
      token_symbol TEXT NOT NULL,
      token_address TEXT NOT NULL,
      amount_raw TEXT NOT NULL,
      amount_formatted TEXT NOT NULL,
      inr_equivalent INTEGER NOT NULL,
      tax_receipt_no TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    CREATE TABLE IF NOT EXISTS auth_challenges (
      nonce TEXT PRIMARY KEY,
      address TEXT NOT NULL,
      message TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      project_id TEXT,
      title TEXT NOT NULL,
      ipfs_cid TEXT NOT NULL,
      beneficiaries TEXT NOT NULL,
      auditor TEXT NOT NULL,
      summary TEXT NOT NULL,
      evidence_count TEXT,
      status TEXT NOT NULL DEFAULT 'VERIFIED_ON_CHAIN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chain_id INTEGER NOT NULL,
      block_number INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      log_index INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      contract_address TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(chain_id, tx_hash, log_index)
    );

    CREATE TABLE IF NOT EXISTS indexed_sync_state (
      chain_id INTEGER PRIMARY KEY,
      last_block_number INTEGER NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default NGOs matching frontend data if empty
  const count = db.prepare("SELECT COUNT(*) AS count FROM ngos").get().count;
  if (count === 0) {
    const insertNgo = db.prepare(`
      INSERT INTO ngos (id, on_chain_id, name, category, short_description, full_description, verified_wallet, contract_address, legal_reg_no, ipfs_kyc_cid, status, raised_inr, goal_inr, donors_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertNgo.run(
      "ngo-1",
      1,
      "Green Canopy Initiative",
      "Environment",
      "Deploying decentralized carbon-offset tracking and real-time reforestation monitoring across Brazil.",
      "Green Canopy Initiative connects global micro-donors with direct reforestation stewards in the Amazon Basin.",
      "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
      "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
      "REG-AMAZON-2026-001",
      "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      "ACTIVE",
      142500,
      200000,
      1240
    );

    insertNgo.run(
      "ngo-2",
      2,
      "Hope Horizon Schools",
      "Education",
      "Providing decentralized digital curriculum and direct micro-scholarship fund payouts for remote students.",
      "Hope Horizon empowers vulnerable and underserved students across 12 countries.",
      "0x2bE48f5C8eB2d8c32A91D65b7A48E4424A3521b7",
      "0x4B0897b0513fdC7C541B6d9D7E929C4e5364D2dB",
      "REG-EDU-2026-002",
      "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R",
      "ACTIVE",
      98300,
      120000,
      912
    );

    insertNgo.run(
      "ngo-3",
      3,
      "CleanWater Labs",
      "Healthcare",
      "Constructing blockchain-audited solar water filtration systems in rural Sub-Saharan areas.",
      "CleanWater Labs deploys IoT-connected solar water purification systems.",
      "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
      "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "REG-WATER-2026-003",
      "QmbWqxBEKC3P8tTXBSFL1ZZBodj125JYf4txJS4UCE2ndC",
      "ACTIVE",
      187000,
      250000,
      2045
    );

    // Seed Initial Donations
    const insertDonation = db.prepare(`
      INSERT INTO donations (id, tx_hash, block_number, chain_id, ngo_id, donor_address, donor_name, token_symbol, token_address, amount_raw, amount_formatted, inr_equivalent, tax_receipt_no, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDonation.run(
      "tx-1",
      "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8",
      12489315,
      80002,
      "ngo-3",
      "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
      "Meera Subramanian",
      "POL",
      "0x0000000000000000000000000000000000000000",
      "250000000000000000000",
      "250 POL",
      25000,
      "80G-2026-0891",
      "CONFIRMED",
      "2026-05-26 10:24:00"
    );

    insertDonation.run(
      "tx-2",
      "0x3f5c2901a812b4e72d93e114f6b21908a812b4e7",
      12489310,
      80002,
      "ngo-2",
      "0x8B2D198AcfE92B1047192801F524Ab902C511F90",
      "Anonymous Patron",
      "USDC",
      "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
      "1500000000",
      "1,500 USDC",
      150000,
      "80G-2026-0890",
      "CONFIRMED",
      "2026-05-25 16:12:00"
    );

    insertDonation.run(
      "tx-3",
      "0x9a8f21c4354b9d3184762c9381665a0b7b1177d9",
      12489300,
      80002,
      "ngo-3",
      "0x91F5B612E0987c320dE51A186B1095d315682C89",
      "Arjun Rao",
      "USDT",
      "0x1205f31718499dBf1fCa446663B532Ef87481fe1",
      "185000000",
      "185 USDT",
      18500,
      "80G-2026-0889",
      "CONFIRMED",
      "2026-05-24 09:45:00"
    );
  }
}

initDatabase();

module.exports = db;
