/**
 * Donation & Live Ledger Service
 * Serves as the single authoritative state manager for donations and live ledger streams.
 * Handles deduplication, live subscriptions, CSV export, and metric aggregation.
 */

import { initialNgoDonations } from "../data/donationsData.js";
import { initialTransactions } from "../data/transactionsData.js";
import { initialNgos } from "../data/ngosData.js";
import { SUPPORTED_TOKENS } from "../config/index.js";
import { shortenTxHash, shortenAddress } from "./utils/tokenMath.js";

const STORAGE_KEY_DONATIONS = "trustdonate_donations_ledger_v1";
const STORAGE_KEY_TRANSACTIONS = "trustdonate_tx_stream_v1";

class DonationService {
  constructor() {
    this.listeners = new Set();
    this.donations = this._loadDonations();
    this.transactions = this._loadTransactions();
    this.ngos = [...initialNgos];
    this.isMockMode = true; // Indicates whether using mock/fixture data
  }

  _loadDonations() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DONATIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parsing errors
    }
    // Return copy of initial records marked as historical (not NEW)
    return initialNgoDonations.map((d) => ({
      ...d,
      isNew: false,
      isHistoricalFixture: true,
    }));
  }

  _loadTransactions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parsing errors
    }
    return initialTransactions.map((tx) => ({
      ...tx,
      isHistoricalFixture: true,
    }));
  }

  _persist() {
    try {
      localStorage.setItem(STORAGE_KEY_DONATIONS, JSON.stringify(this.donations));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(this.transactions));
    } catch {
      // Ignore storage errors
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify() {
    for (const listener of this.listeners) {
      try {
        listener({
          donations: [...this.donations],
          transactions: [...this.transactions],
          ngos: [...this.ngos],
          metrics: this.getMetrics(),
        });
      } catch (err) {
        console.error("Error in donationService listener:", err);
      }
    }
  }

  getDonations() {
    return [...this.donations];
  }

  getTransactions() {
    return [...this.transactions];
  }

  getNgos() {
    return [...this.ngos];
  }

  /**
   * Adds a new donation, ensuring strict deduplication against existing tx hashes.
   */
  addDonation({ txHash, amount, token, ngoId, donorWallet, donorName = "Patron", status = "Confirmed", isSimulated = false }) {
    const cleanHash = txHash.toLowerCase();

    // Check for duplicate in donations
    const existingIndex = this.donations.findIndex(
      (d) => d.hash && d.hash.toLowerCase() === cleanHash
    );

    const tokenMeta = SUPPORTED_TOKENS[token] || SUPPORTED_TOKENS.POL;
    const numAmount = parseFloat(amount) || 0;
    const inrValue = Math.round(numAmount * (tokenMeta.exchangeRateInr || 100));

    const targetNgo = this.ngos.find((n) => n.id === ngoId) || this.ngos[0];
    const projectName = targetNgo ? targetNgo.name : "Verified Cause";

    const formattedDonor = donorWallet
      ? donorWallet.length === 42
        ? shortenAddress(donorWallet)
        : donorWallet
      : "0x7a8c...89F1";

    const donationRecord = {
      id: `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      donor: donorName.startsWith("0x") ? `Donor (${shortenAddress(donorName)})` : donorName,
      wallet: donorWallet || "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1",
      amountInr: inrValue,
      amountCrypto: `${numAmount.toFixed(2)} ${token}`,
      token: token,
      project: projectName,
      date: "Just now",
      isNew: true, // Mark NEW only for freshly detected donations in this session
      isSimulated,
      hash: txHash,
      status: status,
      taxReceiptNo: `REC-AMOY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    if (existingIndex >= 0) {
      // Update existing record (e.g. status change from Pending to Confirmed) without duplicating
      this.donations[existingIndex] = {
        ...this.donations[existingIndex],
        status,
      };
    } else {
      this.donations = [donationRecord, ...this.donations];
    }

    // Update public stream transaction
    const existingTxIndex = this.transactions.findIndex(
      (tx) => tx.hash && tx.hash.toLowerCase() === cleanHash
    );

    const txRecord = {
      id: `tx-${Date.now()}`,
      ngoId: targetNgo.id,
      ngoName: targetNgo.name,
      recipient: `Donation to ${targetNgo.name}`,
      hash: txHash,
      shortHash: shortenTxHash(txHash),
      amount: numAmount.toFixed(2),
      token: token,
      timeAgo: "Just now",
      timestamp: Date.now(),
      status: status === "Confirmed" ? "Mined" : status,
      donor: formattedDonor,
      fullWallet: donorWallet || "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1",
      isSimulated,
    };

    if (existingTxIndex >= 0) {
      this.transactions[existingTxIndex] = {
        ...this.transactions[existingTxIndex],
        status: txRecord.status,
      };
    } else {
      this.transactions = [txRecord, ...this.transactions];
    }

    // Update NGO statistics
    this.ngos = this.ngos.map((ngo) => {
      if (ngo.id === targetNgo.id) {
        return {
          ...ngo,
          raised: ngo.raised + numAmount,
          donorsCount: ngo.donorsCount + 1,
        };
      }
      return ngo;
    });

    this._persist();
    this._notify();

    return donationRecord;
  }

  /**
   * Calculates aggregated dynamic metrics across verified donations.
   */
  getMetrics() {
    const totalInr = this.donations.reduce((sum, d) => sum + (d.amountInr || 0), 0);
    const uniqueWallets = new Set(
      this.donations.map((d) => (d.wallet ? d.wallet.toLowerCase() : ""))
    );
    uniqueWallets.delete("");

    // Token breakdowns
    const polTotal = this.donations
      .filter((d) => d.token === "POL")
      .reduce((sum, d) => sum + parseFloat(d.amountCrypto || 0), 0);

    const usdcTotal = this.donations
      .filter((d) => d.token === "USDC")
      .reduce((sum, d) => sum + parseFloat(d.amountCrypto || 0), 0);

    const usdtTotal = this.donations
      .filter((d) => d.token === "USDT")
      .reduce((sum, d) => sum + parseFloat(d.amountCrypto || 0), 0);

    return {
      totalInr,
      polTotal,
      usdcTotal,
      usdtTotal,
      donorsCount: uniqueWallets.size || this.donations.length,
      donationsCount: this.donations.length,
    };
  }

  /**
   * Generates sanitized CSV string from given donations array.
   */
  exportCsv(items = this.donations) {
    const headers = [
      "Receipt ID",
      "Donor",
      "Wallet Address",
      "Amount INR",
      "Token",
      "Amount Crypto",
      "Project",
      "Date",
      "Transaction Hash",
      "Tax Receipt No",
      "Verification Status",
    ];

    const escapeCsv = (val) => {
      const str = String(val ?? "");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = items.map((d) => [
      escapeCsv(d.id),
      escapeCsv(d.donor),
      escapeCsv(d.wallet),
      escapeCsv(d.amountInr),
      escapeCsv(d.token),
      escapeCsv(d.amountCrypto),
      escapeCsv(d.project),
      escapeCsv(d.date),
      escapeCsv(d.hash),
      escapeCsv(d.taxReceiptNo),
      escapeCsv(d.status),
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }
}

export const donationService = new DonationService();
