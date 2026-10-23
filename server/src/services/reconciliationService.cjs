const db = require("../db/database.cjs");
const { logSecurityEvent } = require("../utils/auditLogger.cjs");

class ReconciliationService {
  /**
   * Computes authoritative internal accounting balance from the append-only ledger using BigInt.
   */
  getAccountingBalance(ngoId, tokenSymbol) {
    const entries = db.prepare(`
      SELECT entry_type, amount_raw FROM treasury_ledger
      WHERE ngo_id = ? AND token_symbol = ?
    `).all(ngoId, tokenSymbol);

    let balance = 0n;
    for (const entry of entries) {
      const amount = BigInt(entry.amount_raw || "0");
      if (entry.entry_type === "DONATION_CREDIT" || entry.entry_type === "REFUND_CREDIT") {
        balance += amount;
      } else if (entry.entry_type === "DISBURSEMENT_DEBIT") {
        balance -= amount;
      } else if (entry.entry_type === "ADJUSTMENT") {
        balance += amount; // Adjustments can be positive or negative
      }
    }

    return balance.toString();
  }

  /**
   * Performs an authoritative reconciliation between reported on-chain balance and internal ledger.
   */
  reconcileBalances({ ngoId, tokenSymbol, onChainBalanceRaw, performedBy, notes = null }) {
    if (!ngoId || !tokenSymbol || onChainBalanceRaw === undefined) {
      throw new Error("Missing parameters for treasury balance reconciliation.");
    }

    const accountingBalanceRaw = this.getAccountingBalance(ngoId, tokenSymbol);
    const onChainBig = BigInt(onChainBalanceRaw);
    const accountingBig = BigInt(accountingBalanceRaw);
    const discrepancyBig = onChainBig - accountingBig;

    const hasDiscrepancy = discrepancyBig !== 0n;
    const status = hasDiscrepancy ? "DISCREPANCY_DETECTED" : "RECONCILED";

    const reportId = `recon-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    db.prepare(`
      INSERT INTO reconciliation_reports (
        id, ngo_id, token_symbol, on_chain_balance_raw, accounting_balance_raw,
        discrepancy_raw, status, performed_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId,
      ngoId,
      tokenSymbol,
      onChainBalanceRaw.toString(),
      accountingBalanceRaw,
      discrepancyBig.toString(),
      status,
      performedBy,
      notes
    );

    // If a discrepancy is detected, generate an automatic risk alert
    if (hasDiscrepancy) {
      const alertId = `risk-recon-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      db.prepare(`
        INSERT INTO risk_alerts (id, ngo_id, rule_code, severity, title, description, evidence_json, status)
        VALUES (?, ?, 'BALANCE_DISCREPANCY', 'HIGH', ?, ?, ?, 'NEW')
      `).run(
        alertId,
        ngoId,
        `Treasury Discrepancy Detected for ${tokenSymbol}`,
        `On-chain balance (${onChainBalanceRaw}) does not reconcile with ledger balance (${accountingBalanceRaw}). Difference: ${discrepancyBig.toString()}.`,
        JSON.stringify({ onChainBalanceRaw, accountingBalanceRaw, discrepancy: discrepancyBig.toString(), reportId })
      );
    }

    logSecurityEvent({
      actorAddress: performedBy,
      action: "TREASURY_RECONCILIATION_PERFORMED",
      resourceType: "RECONCILIATION_REPORT",
      resourceId: reportId,
      ngoId,
      status: hasDiscrepancy ? "FAILED" : "SUCCESS",
      details: { tokenSymbol, status, discrepancy: discrepancyBig.toString() },
    });

    return {
      reportId,
      ngoId,
      tokenSymbol,
      onChainBalanceRaw: onChainBalanceRaw.toString(),
      accountingBalanceRaw,
      discrepancyRaw: discrepancyBig.toString(),
      status,
      performedAt: new Date().toISOString(),
    };
  }

  /**
   * Records an auditable ledger adjustment with an explicit actor and justification.
   */
  recordAdjustment({ ngoId, tokenSymbol, tokenAddress, amountRaw, inrEquivalent, reason, actorAddress }) {
    if (!reason || !actorAddress || !amountRaw) {
      throw new Error("Ledger adjustments require an explicit justification, actor address, and raw amount.");
    }

    db.prepare(`
      INSERT INTO treasury_ledger (
        ngo_id, entry_type, token_symbol, token_address, amount_raw, inr_equivalent,
        actor_address, adjustment_reason
      ) VALUES (?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?)
    `).run(
      ngoId,
      tokenSymbol,
      tokenAddress || "0x0000000000000000000000000000000000000000",
      amountRaw.toString(),
      inrEquivalent || 0,
      actorAddress,
      reason
    );

    logSecurityEvent({
      actorAddress,
      action: "TREASURY_LEDGER_ADJUSTMENT",
      resourceType: "TREASURY_LEDGER",
      resourceId: ngoId,
      ngoId,
      status: "SUCCESS",
      details: { tokenSymbol, amountRaw: amountRaw.toString(), reason },
    });

    return {
      success: true,
      newAccountingBalance: this.getAccountingBalance(ngoId, tokenSymbol),
    };
  }

  getLedger(ngoId, limit = 50) {
    let query = "SELECT * FROM treasury_ledger";
    const params = [];
    if (ngoId) {
      query += " WHERE ngo_id = ?";
      params.push(ngoId);
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    return db.prepare(query).all(...params);
  }
}

module.exports = new ReconciliationService();
