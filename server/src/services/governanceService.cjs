const crypto = require("crypto");
const db = require("../db/database.cjs");
const { logSecurityEvent } = require("../utils/auditLogger.cjs");

class GovernanceService {
  /**
   * Generates a deterministic SHA-256 payload hash binding all financial parameters.
   */
  computePayloadHash({ ngoId, projectId, tokenSymbol, tokenAddress, amountRaw, recipientWallet }) {
    const canonical = JSON.stringify({
      ngoId,
      projectId,
      tokenSymbol,
      tokenAddress: tokenAddress.toLowerCase(),
      amountRaw: amountRaw.toString(),
      recipientWallet: recipientWallet.toLowerCase(),
    });
    return crypto.createHash("sha256").update(canonical).digest("hex");
  }

  /**
   * Retrieves active approval policy for an NGO.
   */
  getPolicy(ngoId) {
    let policy = db.prepare("SELECT * FROM approval_policies WHERE ngo_id = ? AND is_active = 1").get(ngoId);
    if (!policy) {
      // Return default organization policy
      policy = {
        id: `pol-${ngoId}`,
        ngo_id: ngoId,
        name: "Default Conservative Policy",
        per_tx_limit_inr: 100000,
        daily_limit_inr: 500000,
        required_approvals: 2,
        allowed_tokens_json: '["POL","USDC","USDT"]',
        is_active: 1,
      };
    }
    return {
      ...policy,
      allowedTokens: JSON.parse(policy.allowed_tokens_json),
    };
  }

  /**
   * Updates organization governance policy.
   */
  updatePolicy(ngoId, { perTxLimitInr, dailyLimitInr, requiredApprovals, allowedTokens, actorAddress }) {
    const policy = this.getPolicy(ngoId);
    const updatedPerTx = perTxLimitInr || policy.per_tx_limit_inr;
    const updatedDaily = dailyLimitInr || policy.daily_limit_inr;
    const updatedApprovals = requiredApprovals || policy.required_approvals;
    const updatedTokens = allowedTokens ? JSON.stringify(allowedTokens) : policy.allowed_tokens_json;

    db.prepare(`
      INSERT INTO approval_policies (id, ngo_id, name, per_tx_limit_inr, daily_limit_inr, required_approvals, allowed_tokens_json, is_active)
      VALUES (?, ?, 'Updated Policy', ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        per_tx_limit_inr = excluded.per_tx_limit_inr,
        daily_limit_inr = excluded.daily_limit_inr,
        required_approvals = excluded.required_approvals,
        allowed_tokens_json = excluded.allowed_tokens_json
    `).run(policy.id, ngoId, updatedPerTx, updatedDaily, updatedApprovals, updatedTokens);

    logSecurityEvent({
      actorAddress,
      action: "GOVERNANCE_POLICY_UPDATED",
      resourceType: "APPROVAL_POLICY",
      resourceId: policy.id,
      ngoId,
      status: "SUCCESS",
      details: { perTxLimitInr: updatedPerTx, dailyLimitInr: updatedDaily, requiredApprovals: updatedApprovals },
    });

    return this.getPolicy(ngoId);
  }

  /**
   * Submits a disbursement proposal bound to an immutable cryptographic payload hash.
   */
  proposeDisbursement({
    ngoId,
    projectId,
    milestoneId = null,
    title,
    tokenSymbol = "POL",
    tokenAddress,
    amountRaw,
    amountFormatted,
    inrEquivalent,
    recipientWallet,
    proposerId,
    proposerAddress,
  }) {
    if (!title || !recipientWallet || !amountRaw || !inrEquivalent) {
      throw new Error("Missing required disbursement proposal fields.");
    }

    const policy = this.getPolicy(ngoId);

    // Validate token allowlist
    if (!policy.allowedTokens.includes(tokenSymbol)) {
      throw new Error(`Token '${tokenSymbol}' is not authorized by the organization's governance policy.`);
    }

    // Check spending limit thresholds
    if (inrEquivalent > policy.per_tx_limit_inr * 2) {
      throw new Error(`Proposal amount (₹${inrEquivalent.toLocaleString()}) exceeds the maximum permissible threshold (₹${(policy.per_tx_limit_inr * 2).toLocaleString()}).`);
    }

    const payloadHash = this.computePayloadHash({
      ngoId,
      projectId,
      tokenSymbol,
      tokenAddress: tokenAddress || "0x0000000000000000000000000000000000000000",
      amountRaw,
      recipientWallet,
    });

    const proposalId = `prop-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    db.prepare(`
      INSERT INTO disbursement_proposals (
        id, ngo_id, project_id, milestone_id, title, token_symbol, token_address,
        amount_raw, amount_formatted, inr_equivalent, recipient_wallet, proposer_id,
        proposer_address, payload_hash, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL')
    `).run(
      proposalId,
      ngoId,
      projectId,
      milestoneId,
      title,
      tokenSymbol,
      tokenAddress || "0x0000000000000000000000000000000000000000",
      amountRaw.toString(),
      amountFormatted || `${amountRaw} ${tokenSymbol}`,
      inrEquivalent,
      recipientWallet,
      proposerId,
      proposerAddress,
      payloadHash
    );

    logSecurityEvent({
      actorAddress: proposerAddress,
      action: "DISBURSEMENT_PROPOSAL_CREATED",
      resourceType: "DISBURSEMENT_PROPOSAL",
      resourceId: proposalId,
      ngoId,
      status: "SUCCESS",
      details: { title, inrEquivalent, payloadHash },
    });

    return this.getProposal(proposalId);
  }

  /**
   * Reviews and votes on a disbursement proposal.
   * Enforces Separation of Duties: Proposer cannot approve their own proposal!
   */
  reviewProposal({ proposalId, approverId, approverAddress, decision, reason = null }) {
    const proposal = this.getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Disbursement proposal '${proposalId}' not found.`);
    }

    if (proposal.status !== "PENDING_APPROVAL") {
      throw new Error(`Proposal is not in PENDING_APPROVAL status (current: ${proposal.status}).`);
    }

    // Material change & payload integrity check
    const currentHash = this.computePayloadHash({
      ngoId: proposal.ngo_id,
      projectId: proposal.project_id,
      tokenSymbol: proposal.token_symbol,
      tokenAddress: proposal.token_address,
      amountRaw: proposal.amount_raw,
      recipientWallet: proposal.recipient_wallet,
    });

    if (currentHash !== proposal.payload_hash) {
      db.prepare("UPDATE disbursement_proposals SET status = 'INVALIDATED' WHERE id = ?").run(proposalId);
      throw new Error("Security Alert: Proposal payload parameters have changed! Proposal has been invalidated.");
    }

    // Separation of Duties:
    if (proposal.proposer_id === approverId || proposal.proposer_address.toLowerCase() === approverAddress.toLowerCase()) {
      logSecurityEvent({
        actorAddress: approverAddress,
        action: "SEPARATION_OF_DUTIES_VIOLATION_BLOCKED",
        resourceType: "DISBURSEMENT_PROPOSAL",
        resourceId: proposalId,
        ngoId: proposal.ngo_id,
        status: "DENIED",
        details: { message: "Proposer attempted to self-approve proposal." },
      });
      throw new Error("Separation of Duties Violation: You cannot approve a disbursement proposal that you authored.");
    }

    // Check duplicate vote
    const existingVote = db.prepare("SELECT * FROM proposal_approvals WHERE proposal_id = ? AND approver_id = ?").get(proposalId, approverId);
    if (existingVote) {
      throw new Error("You have already cast a decision on this disbursement proposal.");
    }

    // Record approval vote
    db.prepare(`
      INSERT INTO proposal_approvals (id, proposal_id, approver_id, approver_address, decision, reason, payload_hash_reviewed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      proposalId,
      approverId,
      approverAddress,
      decision,
      reason,
      proposal.payload_hash
    );

    if (decision === "REJECTED") {
      db.prepare(`
        UPDATE disbursement_proposals
        SET status = 'REJECTED', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reason || "Rejected by authorized reviewer.", proposalId);
    } else if (decision === "APPROVED") {
      const policy = this.getPolicy(proposal.ngo_id);
      const approvalsCount = db.prepare(`
        SELECT COUNT(*) AS count FROM proposal_approvals WHERE proposal_id = ? AND decision = 'APPROVED'
      `).get(proposalId).count;

      if (approvalsCount >= policy.required_approvals) {
        db.prepare(`
          UPDATE disbursement_proposals
          SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(proposalId);
      }
    }

    logSecurityEvent({
      actorAddress: approverAddress,
      action: `DISBURSEMENT_PROPOSAL_${decision}`,
      resourceType: "DISBURSEMENT_PROPOSAL",
      resourceId: proposalId,
      ngoId: proposal.ngo_id,
      status: "SUCCESS",
      details: { decision, reason },
    });

    return this.getProposal(proposalId);
  }

  /**
   * Confirms on-chain execution of an approved proposal.
   * Ensures idempotency: cannot execute twice.
   */
  markExecuted({ proposalId, txHash, executorId, executorAddress }) {
    const proposal = this.getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal '${proposalId}' not found.`);
    }

    if (proposal.status === "EXECUTED") {
      throw new Error("Idempotency Safeguard: Proposal has already been executed on-chain.");
    }

    if (proposal.status !== "APPROVED") {
      throw new Error(`Cannot execute proposal in '${proposal.status}' state. Must be APPROVED.`);
    }

    // Record on-chain execution
    db.prepare(`
      UPDATE disbursement_proposals
      SET status = 'EXECUTED', executed_tx_hash = ?, executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(txHash, proposalId);

    // Record debit in treasury ledger
    db.prepare(`
      INSERT INTO treasury_ledger (
        ngo_id, entry_type, token_symbol, token_address, amount_raw, inr_equivalent,
        tx_hash, reference_id, actor_address, adjustment_reason
      ) VALUES (?, 'DISBURSEMENT_DEBIT', ?, ?, ?, ?, ?, ?, ?, 'Approved milestone disbursement execution')
    `).run(
      proposal.ngo_id,
      proposal.token_symbol,
      proposal.token_address,
      proposal.amount_raw,
      proposal.inr_equivalent,
      txHash,
      proposalId,
      executorAddress
    );

    logSecurityEvent({
      actorAddress: executorAddress,
      action: "DISBURSEMENT_EXECUTED",
      resourceType: "DISBURSEMENT_PROPOSAL",
      resourceId: proposalId,
      ngoId: proposal.ngo_id,
      status: "SUCCESS",
      details: { txHash, inrEquivalent: proposal.inr_equivalent },
    });

    return this.getProposal(proposalId);
  }

  getProposal(proposalId) {
    const proposal = db.prepare("SELECT * FROM disbursement_proposals WHERE id = ?").get(proposalId);
    if (!proposal) return null;

    const approvals = db.prepare("SELECT * FROM proposal_approvals WHERE proposal_id = ?").all(proposalId);
    return {
      ...proposal,
      approvals,
    };
  }

  listProposals(ngoId) {
    let query = "SELECT * FROM disbursement_proposals";
    const params = [];
    if (ngoId) {
      query += " WHERE ngo_id = ?";
      params.push(ngoId);
    }
    query += " ORDER BY created_at DESC";

    const proposals = db.prepare(query).all(...params);
    return proposals.map((p) => {
      const approvals = db.prepare("SELECT * FROM proposal_approvals WHERE proposal_id = ?").all(p.id);
      return { ...p, approvals };
    });
  }
}

module.exports = new GovernanceService();
