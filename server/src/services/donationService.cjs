const { ethers } = require("ethers");
const db = require("../db/database.cjs");
const addressRegistry = require("../contractsConfig.cjs");

class DonationService {
  /**
   * Prepares on-chain transaction metadata for client-side signing.
   */
  prepareDonation({ ngoId, tokenSymbol, amount, donorAddress }) {
    if (!ngoId) throw new Error("Missing ngoId");
    if (!amount || parseFloat(amount) <= 0) throw new Error("Invalid donation amount");

    const ngo = db.prepare("SELECT * FROM ngos WHERE id = ?").get(ngoId);
    if (!ngo) throw new Error("NGO not found");
    if (ngo.status !== "ACTIVE") throw new Error("NGO is not active or verified");

    const symbol = (tokenSymbol || "POL").toUpperCase();
    const contracts = addressRegistry.contracts || {};

    let targetContract = contracts.TrustDonateTreasury || "0x71F39082Bc45199201aDeF80B91244019aA2C81B";
    let tokenAddress = ethers.ZeroAddress;
    let decimals = 18;
    let requiresApproval = false;

    if (symbol === "USDC") {
      tokenAddress = contracts.USDC || "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582";
      decimals = 6;
      requiresApproval = true;
    } else if (symbol === "USDT") {
      tokenAddress = contracts.USDT || "0x1205f31718499dBf1fCa446663B532Ef87481fe1";
      decimals = 6;
      requiresApproval = true;
    }

    const rawUnits = ethers.parseUnits(amount.toString(), decimals).toString();

    return {
      ngoId: ngo.id,
      onChainNgoId: ngo.on_chain_id || 1,
      ngoName: ngo.name,
      targetContract,
      tokenSymbol: symbol,
      tokenAddress,
      decimals,
      amountFormatted: `${amount} ${symbol}`,
      amountRaw: rawUnits,
      requiresApproval,
      spenderAddress: requiresApproval ? targetContract : null,
      chainId: addressRegistry.chainId || 80002,
      estimatedGas: "~0.0008 POL",
    };
  }

  /**
   * Records a confirmed donation, assigns an 80G tax receipt, and updates ledger totals.
   */
  recordDonation({
    txHash,
    blockNumber = 12489325,
    ngoId,
    donorAddress,
    donorName = "Patron",
    tokenSymbol = "POL",
    amount,
  }) {
    if (!txHash || !txHash.startsWith("0x")) {
      throw new Error("Invalid transaction hash format");
    }

    const existing = db.prepare("SELECT * FROM donations WHERE tx_hash = ?").get(txHash);
    if (existing) {
      return existing;
    }

    const ngo = db.prepare("SELECT * FROM ngos WHERE id = ?").get(ngoId || "ngo-1");
    if (!ngo) throw new Error("Target NGO not found");

    const numAmount = parseFloat(amount || "100.0");
    const symbol = (tokenSymbol || "POL").toUpperCase();

    // Exchange rate logic matching specification (POL ≈ ₹100, USDC/USDT ≈ ₹85)
    const inrValue = symbol === "POL" ? Math.round(numAmount * 100) : Math.round(numAmount * 85);
    const taxReceiptNo = `80G-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const donationId = `don-${Date.now()}`;

    const decimals = symbol === "POL" ? 18 : 6;
    const amountRaw = ethers.parseUnits(numAmount.toFixed(decimals > 6 ? 4 : 2), decimals).toString();

    db.prepare(`
      INSERT INTO donations (
        id, tx_hash, block_number, chain_id, ngo_id, donor_address, donor_name,
        token_symbol, token_address, amount_raw, amount_formatted, inr_equivalent,
        tax_receipt_no, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)
    `).run(
      donationId,
      txHash,
      blockNumber,
      80002,
      ngo.id,
      donorAddress || "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1",
      donorName,
      symbol,
      symbol === "POL" ? ethers.ZeroAddress : "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
      amountRaw,
      `${numAmount} ${symbol}`,
      inrValue,
      taxReceiptNo
    );

    // Update NGO stats
    db.prepare(`
      UPDATE ngos
      SET raised_inr = raised_inr + ?, donors_count = donors_count + 1
      WHERE id = ?
    `).run(inrValue, ngo.id);

    return db.prepare("SELECT * FROM donations WHERE id = ?").get(donationId);
  }

  /**
   * Retrieves paginated donations with optional token or NGO filtering.
   */
  getDonations({ token, ngoId, donorAddress, limit = 50, page = 1 }) {
    let query = "SELECT d.*, n.name AS ngo_name FROM donations d JOIN ngos n ON d.ngo_id = n.id WHERE 1=1";
    const params = [];

    if (token && token !== "All") {
      query += " AND d.token_symbol = ?";
      params.push(token);
    }

    if (ngoId) {
      query += " AND d.ngo_id = ?";
      params.push(ngoId);
    }

    if (donorAddress) {
      query += " AND LOWER(d.donor_address) = LOWER(?)";
      params.push(donorAddress);
    }

    query += " ORDER BY d.created_at DESC LIMIT ? OFFSET ?";
    const offset = (page - 1) * limit;
    params.push(Number(limit), Number(offset));

    const records = db.prepare(query).all(...params);

    // Summary calculation
    const summary = db.prepare(`
      SELECT 
        COUNT(*) AS total_count,
        COALESCE(SUM(inr_equivalent), 0) AS total_inr_volume
      FROM donations
    `).get();

    return {
      donations: records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: summary.total_count,
      },
      summary: {
        totalVolumeInr: summary.total_inr_volume,
        averageDonationInr: summary.total_count > 0 ? Math.round(summary.total_inr_volume / summary.total_count) : 0,
        confirmedTransactions: summary.total_count,
        taxCertificatesIssued: summary.total_count,
      },
    };
  }

  getDonationByTx(txHash) {
    const item = db.prepare("SELECT d.*, n.name AS ngo_name FROM donations d JOIN ngos n ON d.ngo_id = n.id WHERE LOWER(d.tx_hash) = LOWER(?)").get(txHash);
    return item || null;
  }
}

module.exports = new DonationService();
