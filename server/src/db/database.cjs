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
      domain TEXT DEFAULT 'trustdonate.org',
      uri TEXT DEFAULT 'https://trustdonate.org',
      chain_id INTEGER DEFAULT 80002,
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

    -- RBAC & Enterprise Authentication
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      wallet_address TEXT UNIQUE,
      display_name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      password_salt TEXT,
      email_verified INTEGER DEFAULT 0,
      email_verification_token TEXT,
      email_verification_expires_at INTEGER,
      password_reset_token_hash TEXT,
      password_reset_expires_at INTEGER,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until INTEGER DEFAULT 0,
      global_role TEXT NOT NULL DEFAULT 'DONOR',
      token_version INTEGER NOT NULL DEFAULT 1,
      wallet_linked_at DATETIME,
      terms_accepted_at DATETIME,
      privacy_accepted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS revoked_tokens (
      token_hash TEXT PRIMARY KEY,
      revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ngo_memberships (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(ngo_id, user_id),
      FOREIGN KEY (ngo_id) REFERENCES ngos(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS project_assignments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'PROJECT_MANAGER',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS security_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_address TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      ngo_id TEXT,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      ip_address TEXT,
      details_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- NGO Onboarding & Lifecycle
    CREATE TABLE IF NOT EXISTS ngo_applications (
      id TEXT PRIMARY KEY,
      ngo_id TEXT,
      legal_name TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      category TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      applicant_wallet TEXT NOT NULL,
      pan_number TEXT,
      registered_address TEXT,
      website TEXT,
      established_year INTEGER,
      representative_json TEXT,
      documents_json TEXT NOT NULL,
      legal_reg_verified INTEGER DEFAULT 0,
      bank_verified INTEGER DEFAULT 0,
      tax_80g_verified INTEGER DEFAULT 0,
      fcra_verified INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      assigned_reviewer_id TEXT,
      submitted_at DATETIME,
      reviewed_at DATETIME,
      rejection_reason TEXT,
      resubmission_count INTEGER DEFAULT 0,
      resubmitted_at DATETIME,
      reactivation_reason TEXT,
      verification_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ngo_application_notes (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_role TEXT NOT NULL,
      note TEXT NOT NULL,
      is_internal INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES ngo_applications(id)
    );

    CREATE TABLE IF NOT EXISTS ngo_invitations (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      invite_token TEXT NOT NULL UNIQUE,
      invited_by_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    -- Phase 2 Approval Policies & Financial Governance
    CREATE TABLE IF NOT EXISTS approval_policies (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      name TEXT NOT NULL,
      per_tx_limit_inr INTEGER NOT NULL DEFAULT 100000,
      daily_limit_inr INTEGER NOT NULL DEFAULT 500000,
      required_approvals INTEGER NOT NULL DEFAULT 2,
      allowed_tokens_json TEXT NOT NULL DEFAULT '["POL","USDC","USDT"]',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    CREATE TABLE IF NOT EXISTS disbursement_proposals (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      milestone_id TEXT,
      title TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      token_address TEXT NOT NULL,
      amount_raw TEXT NOT NULL,
      amount_formatted TEXT NOT NULL,
      inr_equivalent INTEGER NOT NULL,
      recipient_wallet TEXT NOT NULL,
      proposer_id TEXT NOT NULL,
      proposer_address TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
      rejection_reason TEXT,
      executed_tx_hash TEXT,
      executed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS proposal_approvals (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      approver_id TEXT NOT NULL,
      approver_address TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT,
      payload_hash_reviewed TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(proposal_id, approver_id),
      FOREIGN KEY (proposal_id) REFERENCES disbursement_proposals(id)
    );

    -- Phase 2 Treasury Accounting & Reconciliation
    CREATE TABLE IF NOT EXISTS treasury_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ngo_id TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      token_address TEXT NOT NULL,
      amount_raw TEXT NOT NULL,
      inr_equivalent INTEGER NOT NULL,
      tx_hash TEXT,
      reference_id TEXT,
      actor_address TEXT,
      adjustment_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    CREATE TABLE IF NOT EXISTS reconciliation_reports (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      on_chain_balance_raw TEXT NOT NULL,
      accounting_balance_raw TEXT NOT NULL,
      discrepancy_raw TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'RECONCILED',
      performed_by TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    -- Phase 2 Fraud & Anomaly Risk Alerts
    CREATE TABLE IF NOT EXISTS risk_alerts (
      id TEXT PRIMARY KEY,
      ngo_id TEXT,
      rule_code TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      assigned_to TEXT,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Phase 2 Auditor & Compliance Workflows
    CREATE TABLE IF NOT EXISTS audit_engagements (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      project_id TEXT,
      auditor_id TEXT NOT NULL,
      auditor_name TEXT NOT NULL,
      scope TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      start_date DATE NOT NULL,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    CREATE TABLE IF NOT EXISTS audit_evidence_requests (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      due_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      submission_cid TEXT,
      submission_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (engagement_id) REFERENCES audit_engagements(id)
    );

    CREATE TABLE IF NOT EXISTS audit_findings (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      auditor_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      management_response TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (engagement_id) REFERENCES audit_engagements(id)
    );

    CREATE TABLE IF NOT EXISTS audit_reports_v2 (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      ngo_id TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      ipfs_cid TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      auditor_signature TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (engagement_id) REFERENCES audit_engagements(id),
      FOREIGN KEY (ngo_id) REFERENCES ngos(id)
    );

    -- Phase 2 Notifications & Background Queue
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      wallet_address TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'INFO',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      wallet_address TEXT PRIMARY KEY,
      email TEXT,
      email_enabled INTEGER DEFAULT 0,
      in_app_enabled INTEGER DEFAULT 1,
      min_severity TEXT NOT NULL DEFAULT 'INFO',
      categories_json TEXT NOT NULL DEFAULT '["ALL"]',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS background_jobs (
      id TEXT PRIMARY KEY,
      queue_name TEXT NOT NULL,
      dedup_key TEXT UNIQUE,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempts INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 5,
      last_error TEXT,
      run_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
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

  // Phase 2 Seed: Users, Memberships & Governance Policies
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, wallet_address, display_name, email, global_role, token_version)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insertUser.run("usr-superadmin", "0x51E2aC9005934571A3793f0bB75A1F7096e1304B", "Platform Super Admin", "superadmin@trustdonate.org", "PLATFORM_SUPER_ADMIN");
    insertUser.run("usr-ngo1-admin", "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE", "Green Canopy Director", "director@greencanopy.org", "DONOR");
    insertUser.run("usr-ngo1-finance", "0x7a3B19D412bF249f7b189Ec24A00518774f2E", "Finance Lead", "finance@greencanopy.org", "DONOR");
    insertUser.run("usr-ngo1-pm", "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8", "Field Project Lead", "pm@greencanopy.org", "DONOR");
    insertUser.run("usr-auditor", "0x19a0EFA23F2718E27ffB906560Bfc30Dfe7D0A24", "Independent Impact Auditor", "auditor@deloitte-impact.org", "INDEPENDENT_AUDITOR");
    insertUser.run("usr-donor-1", "0x3A2190B74dE865103AbF992E3c467B1028919a3B", "Meera Subramanian", "meera@example.com", "DONOR");

    // Seed NGO Memberships
    const insertMembership = db.prepare(`
      INSERT INTO ngo_memberships (id, ngo_id, user_id, role, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `);

    insertMembership.run("mem-1", "ngo-1", "usr-ngo1-admin", "NGO_ADMIN");
    insertMembership.run("mem-2", "ngo-1", "usr-ngo1-finance", "FINANCE_OFFICER");
    insertMembership.run("mem-3", "ngo-1", "usr-ngo1-pm", "PROJECT_MANAGER");

    // Seed Project Assignment
    db.prepare(`
      INSERT INTO project_assignments (id, project_id, user_id, role)
      VALUES ('pa-1', 'proj-1', 'usr-ngo1-pm', 'PROJECT_MANAGER')
    `).run();

    // Seed Default Approval Policies
    const insertPolicy = db.prepare(`
      INSERT INTO approval_policies (id, ngo_id, name, per_tx_limit_inr, daily_limit_inr, required_approvals, allowed_tokens_json, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insertPolicy.run("pol-1", "ngo-1", "Standard Governance Policy", 250000, 1000000, 2, '["POL","USDC","USDT"]');
    insertPolicy.run("pol-2", "ngo-2", "Education Fund Allocation Policy", 200000, 800000, 2, '["POL","USDC","USDT"]');
    insertPolicy.run("pol-3", "ngo-3", "Healthcare Emergency Policy", 300000, 1500000, 2, '["POL","USDC","USDT"]');

    // Seed Treasury Ledger matching initial donations
    const insertLedger = db.prepare(`
      INSERT INTO treasury_ledger (ngo_id, entry_type, token_symbol, token_address, amount_raw, inr_equivalent, tx_hash, reference_id, actor_address, adjustment_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertLedger.run("ngo-3", "DONATION_CREDIT", "POL", "0x0000000000000000000000000000000000000000", "250000000000000000000", 25000, "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8", "tx-1", "0x3A2190B74dE865103AbF992E3c467B1028919a3B", "Initial verified on-chain donation");
    insertLedger.run("ngo-2", "DONATION_CREDIT", "USDC", "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582", "1500000000", 150000, "0x3f5c2901a812b4e72d93e114f6b21908a812b4e7", "tx-2", "0x8B2D198AcfE92B1047192801F524Ab902C511F90", "Initial verified on-chain donation");
    insertLedger.run("ngo-3", "DONATION_CREDIT", "USDT", "0x1205f31718499dBf1fCa446663B532Ef87481fe1", "185000000", 18500, "0x9a8f21c4354b9d3184762c9381665a0b7b1177d9", "tx-3", "0x91F5B612E0987c320dE51A186B1095d315682C89", "Initial verified on-chain donation");

    // Seed Sample Audit Engagement
    db.prepare(`
      INSERT INTO audit_engagements (id, ngo_id, project_id, auditor_id, auditor_name, scope, status, start_date)
      VALUES ('eng-1', 'ngo-1', 'proj-1', 'usr-auditor', 'Deloitte Social Impact Practice', 'Q1 2026 Water Filtration Infrastructure Verification', 'ACTIVE', '2026-05-01')
    `).run();
  }

  runMigrations();
}

function runMigrations() {
  function ensureColumn(table, column, typeDef) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = info.some((c) => c.name.toLowerCase() === column.toLowerCase());
    if (!exists) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`).run();
    }
  }

  // Ensure auth_challenges columns
  ensureColumn("auth_challenges", "domain", "TEXT DEFAULT 'trustdonate.org'");
  ensureColumn("auth_challenges", "uri", "TEXT DEFAULT 'https://trustdonate.org'");
  ensureColumn("auth_challenges", "chain_id", "INTEGER DEFAULT 80002");

  // Migrate users table to make wallet_address nullable if it was created with NOT NULL
  const userInfo = db.prepare("PRAGMA table_info(users)").all();
  const walletCol = userInfo.find((c) => c.name === "wallet_address");
  if (walletCol && walletCol.notnull === 1) {
    db.exec(`
      PRAGMA foreign_keys=off;
      CREATE TABLE users_migrated (
        id TEXT PRIMARY KEY,
        wallet_address TEXT UNIQUE,
        display_name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        password_salt TEXT,
        email_verified INTEGER DEFAULT 0,
        email_verification_token TEXT,
        email_verification_expires_at INTEGER,
        password_reset_token_hash TEXT,
        password_reset_expires_at INTEGER,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until INTEGER DEFAULT 0,
        global_role TEXT NOT NULL DEFAULT 'DONOR',
        token_version INTEGER NOT NULL DEFAULT 1,
        wallet_linked_at DATETIME,
        terms_accepted_at DATETIME,
        privacy_accepted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users_migrated (id, wallet_address, display_name, email, global_role, token_version, created_at, updated_at)
      SELECT id, wallet_address, display_name, email, global_role, token_version, created_at, updated_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_migrated RENAME TO users;
      PRAGMA foreign_keys=on;
    `);
  }

  // Ensure users columns
  ensureColumn("users", "password_hash", "TEXT");
  ensureColumn("users", "password_salt", "TEXT");
  ensureColumn("users", "email_verified", "INTEGER DEFAULT 0");
  ensureColumn("users", "email_verification_token", "TEXT");
  ensureColumn("users", "email_verification_expires_at", "INTEGER");
  ensureColumn("users", "password_reset_token_hash", "TEXT");
  ensureColumn("users", "password_reset_expires_at", "INTEGER");
  ensureColumn("users", "failed_login_attempts", "INTEGER DEFAULT 0");
  ensureColumn("users", "locked_until", "INTEGER DEFAULT 0");
  ensureColumn("users", "wallet_linked_at", "DATETIME");
  ensureColumn("users", "terms_accepted_at", "DATETIME");
  ensureColumn("users", "privacy_accepted_at", "DATETIME");

  // Ensure ngo_applications columns
  ensureColumn("ngo_applications", "pan_number", "TEXT");
  ensureColumn("ngo_applications", "registered_address", "TEXT");
  ensureColumn("ngo_applications", "website", "TEXT");
  ensureColumn("ngo_applications", "established_year", "INTEGER");
  ensureColumn("ngo_applications", "representative_json", "TEXT");
  ensureColumn("ngo_applications", "legal_reg_verified", "INTEGER DEFAULT 0");
  ensureColumn("ngo_applications", "bank_verified", "INTEGER DEFAULT 0");
  ensureColumn("ngo_applications", "tax_80g_verified", "INTEGER DEFAULT 0");
  ensureColumn("ngo_applications", "fcra_verified", "INTEGER DEFAULT 0");
  ensureColumn("ngo_applications", "resubmission_count", "INTEGER DEFAULT 0");
  ensureColumn("ngo_applications", "resubmitted_at", "DATETIME");
  ensureColumn("ngo_applications", "reactivation_reason", "TEXT");
  ensureColumn("ngo_applications", "verification_notes", "TEXT");

  // Seed default password for test users if empty
  const { hashPassword } = require("../utils/passwordUtils.cjs");
  const testUsersWithoutPassword = db.prepare("SELECT id FROM users WHERE password_hash IS NULL").all();
  if (testUsersWithoutPassword.length > 0) {
    const { hash, salt } = hashPassword("TestPass123!");
    const updatePwd = db.prepare("UPDATE users SET password_hash = ?, password_salt = ?, email_verified = 1 WHERE id = ?");
    for (const u of testUsersWithoutPassword) {
      updatePwd.run(hash, salt, u.id);
    }
  }
}

initDatabase();

module.exports = db;
