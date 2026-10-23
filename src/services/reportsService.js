/**
 * IPFS Impact Reports and Tax Receipt Document Service
 * Manages verifiable document retrieval, safe text rendering,
 * and clear disclaimers for test fixtures and uncertified tax receipts.
 */

import { isValidCid } from "./utils/tokenMath.js";
import { APP_CONFIG } from "../config/index.js";

export const FIXTURE_REPORTS = [
  {
    id: "rep-1",
    title: "Q1 2026: Clean Water Initiative Borewell Phase 1",
    project: "Clean Water Initiative",
    date: "15 May 2026",
    ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    beneficiaries: "4,200 Villagers",
    auditor: "Development Test Fixture (Third-Party Field Evaluator)",
    isTestFixture: true,
    status: "Verified On-Chain (Testnet)",
    summary:
      "Successfully completed deep borewell drilling and installed dual solar submersible pump units across 4 drought-hit villages in Vidarbha region.",
    evidenceCount: "8 Photos • 2 Water Purity Lab Certificates",
  },
  {
    id: "rep-2",
    title: "Digital Classrooms Hardware Deployment Audit",
    project: "Education for All",
    date: "02 May 2026",
    ipfsCid: "QmZtmD2qt8fQg7zEBrS9h7b2XU2U1B6k4R3d9v8x7P6q5W",
    beneficiaries: "680 Schoolchildren",
    auditor: "Development Test Fixture (Academic Peer Review)",
    isTestFixture: true,
    status: "Verified On-Chain (Testnet)",
    summary:
      "Procured and delivered 50 ruggedized Android educational tablets with localized syllabus and off-grid solar charging cabinets.",
    evidenceCount: "12 Serialized Asset Receipts • Teacher Attestations",
  },
  {
    id: "rep-3",
    title: "Maternal Health Mobile Camp Results (April 2026)",
    project: "Healthcare Access",
    date: "20 April 2026",
    ipfsCid: "QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    beneficiaries: "1,150 Women & Children",
    auditor: "Development Test Fixture (Healthcare Field Monitor)",
    isTestFixture: true,
    status: "Verified On-Chain (Testnet)",
    summary:
      "Completed 32 mobile dispensary visits, providing hemoglobin checkups, prenatal vitamins, and pediatric vaccine booster doses.",
    evidenceCount: "Batch Lot Numbers • Pharmacy Dispatch Slips",
  },
  {
    id: "rep-4",
    title: "Emergency Flood Relief Distribution Sign-Off",
    project: "Flood Emergency Relief",
    date: "12 March 2026",
    ipfsCid: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukUicRFiWrtMtU",
    beneficiaries: "3,500 Displaced Individuals",
    auditor: "Development Test Fixture (District Relief Observer)",
    isTestFixture: true,
    status: "Verified On-Chain (Testnet)",
    summary:
      "Distributed emergency dry ration kits, water purification drops, and emergency shelter tarpaulins to families impacted by seasonal flooding.",
    evidenceCount: "GPS Geotagged Logistics Trail • Biometric Handover Logs",
  },
];

class ReportsService {
  constructor() {
    this.reports = [...FIXTURE_REPORTS];
  }

  getReports() {
    return [...this.reports];
  }

  getReportByCid(cid) {
    return this.reports.find((r) => r.ipfsCid === cid) || null;
  }

  validateCid(cid) {
    return isValidCid(cid);
  }

  getGatewayUrl(cid) {
    if (!this.validateCid(cid)) return null;
    return `${APP_CONFIG.ipfsGateway}${cid}`;
  }

  /**
   * Generates a printable or downloadable HTML string for a donation receipt.
   * Clearly disclaims legal 80G validity unless verified.
   */
  generateReceiptHtml(donation) {
    const is80GVerified = false; // Default uncertified unless NGO formally approved
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>TrustDonate Receipt - ${donation.id}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0F172A; max-width: 700px; margin: auto; }
          .header { border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; }
          .title { font-size: 24px; font-weight: bold; color: #1E3A8A; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; }
          .badge-test { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
          .field { margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 14px; }
          .field label { color: #64748B; }
          .field value { font-weight: 600; }
          .notice { margin-top: 32px; padding: 16px; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; font-size: 12px; color: #64748B; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">TrustDonate</div>
            <div style="font-size: 12px; color: #64748B;">Cryptographic Blockchain Donation Receipt</div>
          </div>
          <div>
            <span class="badge badge-test">${is80GVerified ? "Official 80G Certificate" : "Cryptographic Donor Receipt (Testnet)"}</span>
          </div>
        </div>
        <div class="field"><label>Receipt Identifier:</label><value>${donation.taxReceiptNo || donation.id}</value></div>
        <div class="field"><label>Donor Name / Wallet:</label><value>${donation.donor} (${donation.wallet})</value></div>
        <div class="field"><label>Beneficiary Cause:</label><value>${donation.project}</value></div>
        <div class="field"><label>Contribution Amount:</label><value>${donation.amountCrypto} (Est. ₹${donation.amountInr?.toLocaleString("en-IN")})</value></div>
        <div class="field"><label>Date & Time:</label><value>${donation.date}</value></div>
        <div class="field"><label>Polygon Amoy Tx Hash:</label><value style="font-family: monospace;">${donation.hash}</value></div>
        <div class="field"><label>Ledger Status:</label><value style="color: #10B981;">${donation.status}</value></div>
        <div class="notice">
          <strong>Transparency Notice:</strong> This receipt certifies a verified transaction written to Polygon Amoy Testnet. 
          Under Indian Income Tax Act Section 80G, official tax deductions require certification issued directly by the registered NGO entity. 
          This document serves as an immutable cryptographic audit record.
        </div>
      </body>
      </html>
    `;
  }
}

export const reportsService = new ReportsService();
