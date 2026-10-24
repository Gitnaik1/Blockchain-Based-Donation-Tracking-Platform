const { ethers } = require("ethers");
const db = require("../db/database.cjs");
const addressRegistry = require("../contractsConfig.cjs");
const path = require("path");
const fs = require("fs");

let TreasuryAbi = [];
const abiPath = path.join(__dirname, "../../../src/contracts/abis/TrustDonateTreasury.json");
if (fs.existsSync(abiPath)) {
  try {
    TreasuryAbi = JSON.parse(fs.readFileSync(abiPath, "utf-8")).abi;
  } catch (e) {}
}

class IndexerService {
  constructor() {
    this.rpcUrl = process.env.POLYGON_AMOY_RPC_URL || "https://polygon-amoy.drpc.org";
    this.chainId = addressRegistry.chainId || 80002;
    this.isPolling = false;
  }

  getProvider() {
    return new ethers.JsonRpcProvider(
      this.rpcUrl,
      { name: "amoy", chainId: this.chainId },
      { staticNetwork: true, batchMaxCount: 1 }
    );
  }

  /**
   * Idempotently saves an audit event to the database.
   */
  saveAuditEvent({ chainId, blockNumber, txHash, logIndex, eventName, contractAddress, payload }) {
    try {
      db.prepare(`
        INSERT INTO audit_events (chain_id, block_number, tx_hash, log_index, event_name, contract_address, payload_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        chainId,
        blockNumber,
        txHash,
        logIndex,
        eventName,
        contractAddress,
        JSON.stringify(payload)
      );
      return true;
    } catch (err) {
      if (err.message && err.message.includes("UNIQUE constraint failed")) {
        // Already indexed
        return false;
      }
      throw err;
    }
  }

  /**
   * Processes a single raw event log.
   */
  async processEventLog(log, iface, eventName, contractAddress) {
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if (!parsed) return;

      const payload = {};
      for (const [key, value] of Object.entries(parsed.args)) {
        if (isNaN(Number(key))) {
          payload[key] = typeof value === "bigint" ? value.toString() : value;
        }
      }

      const isNew = this.saveAuditEvent({
        chainId: this.chainId,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash,
        logIndex: log.index || 0,
        eventName: parsed.name,
        contractAddress,
        payload,
      });

      if (isNew && parsed.name === "DonationReceived") {
        // Reconcile into donations table
        const ngoIdNum = parsed.args.ngoId.toString();
        const ngoKey = `ngo-${ngoIdNum}`;
        const amountRaw = parsed.args.amountRaw.toString();
        const tokenAddr = parsed.args.token;
        const isPol = tokenAddr === ethers.ZeroAddress;
        const tokenSymbol = isPol ? "POL" : "USDC";
        const formattedAmount = isPol
          ? ethers.formatEther(amountRaw)
          : ethers.formatUnits(amountRaw, 6);

        const inrEquivalent = isPol
          ? Math.round(parseFloat(formattedAmount) * 100)
          : Math.round(parseFloat(formattedAmount) * 85);

        try {
          db.prepare(`
            INSERT INTO donations (
              id, tx_hash, block_number, chain_id, ngo_id, donor_address, donor_name,
              token_symbol, token_address, amount_raw, amount_formatted, inr_equivalent,
              tax_receipt_no, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
          `).run(
            `don-${parsed.args.donationId.substring(0, 10)}`,
            log.transactionHash,
            log.blockNumber,
            this.chainId,
            ngoKey,
            parsed.args.donor,
            "On-Chain Donor",
            tokenSymbol,
            tokenAddr,
            amountRaw,
            `${formattedAmount} ${tokenSymbol}`,
            inrEquivalent,
            parsed.args.taxReceiptNo || `80G-2026-${Math.floor(1000 + Math.random() * 9000)}`
          );
        } catch (insertErr) {
          // Already in donations table
        }
      }
    } catch (parseErr) {
      console.warn("Failed to parse log:", parseErr.message);
    }
  }

  /**
   * Performs an idempotent historical backfill and check.
   */
  async syncRecentBlocks(fromBlock, toBlock) {
    const contracts = addressRegistry.contracts || {};
    const treasuryAddr = contracts.TrustDonateTreasury;
    if (!treasuryAddr || TreasuryAbi.length === 0) return { status: "NO_CONTRACTS_CONFIGURED" };

    try {
      const provider = this.getProvider();
      const currentBlock = toBlock || (await provider.getBlockNumber());
      const startBlock = fromBlock || Math.max(0, currentBlock - 50);

      const treasuryIface = new ethers.Interface(TreasuryAbi);
      const logs = await provider.getLogs({
        address: treasuryAddr,
        fromBlock: startBlock,
        toBlock: currentBlock,
      });

      for (const log of logs) {
        await this.processEventLog(log, treasuryIface, "TreasuryEvent", treasuryAddr);
      }

      db.prepare(`
        INSERT INTO indexed_sync_state (chain_id, last_block_number, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(chain_id) DO UPDATE SET last_block_number = excluded.last_block_number, updated_at = CURRENT_TIMESTAMP
      `).run(this.chainId, currentBlock);

      return { status: "SYNCED", fromBlock: startBlock, toBlock: currentBlock, logsFound: logs.length };
    } catch (err) {
      return { status: "OFFLINE_FALLBACK", error: err.message };
    }
  }
}

module.exports = new IndexerService();
