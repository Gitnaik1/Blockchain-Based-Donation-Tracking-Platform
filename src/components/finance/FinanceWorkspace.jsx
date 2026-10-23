import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Filter,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { formatInr, formatCrypto } from "../../services/utils/tokenMath.js";
import { donationService } from "../../services/donationService.js";

const TREASURY_BALANCES = {
  POL: { onChain: "14,250.00", inEscrow: "4,500.00", available: "9,750.00", inrEst: 975000 },
  USDC: { onChain: "32,500.00", inEscrow: "12,000.00", available: "20,500.00", inrEst: 1742500 },
  USDT: { onChain: "18,200.00", inEscrow: "5,000.00", available: "13,200.00", inrEst: 1122000 },
};

const INITIAL_FINANCIAL_RECORDS = [
  {
    id: "fin-101",
    type: "Disbursement",
    category: "Vendor Payment",
    project: "Clean Water Initiative",
    milestone: "Phase 1 Drilling Rig Procurement",
    token: "POL",
    amountCrypto: "1,250.00 POL",
    amountInr: 125000,
    status: "Executed On-Chain",
    txHash: "0x3f5c2901a812b4e72d93e114f6b21908a812",
    accountingStatus: "Reconciled with Lab Invoice",
    date: "23 Oct 2026",
  },
  {
    id: "fin-102",
    type: "Escrow Lock",
    category: "Milestone Allocation",
    project: "Education for All",
    milestone: "50 Rugged Tablets Shipment",
    token: "USDC",
    amountCrypto: "4,500.00 USDC",
    amountInr: 382500,
    status: "Approved (Pending Vendor Delivery)",
    txHash: "0x8a1b490d1f349c218731b992147ac324e924",
    accountingStatus: "Quotation Verified",
    date: "22 Oct 2026",
  },
  {
    id: "fin-103",
    type: "Proposed Allocation",
    category: "Operational Advance",
    project: "Healthcare Access",
    milestone: "Mobile Clinic Cold Chain Battery",
    token: "USDT",
    amountCrypto: "2,000.00 USDT",
    amountInr: 170000,
    status: "Awaiting 3-of-5 Signatures",
    txHash: "Unexecuted Proposal",
    accountingStatus: "Pending Board Clearance",
    date: "21 Oct 2026",
  },
];

export const FinanceWorkspace = () => {
  const [records, setRecords] = useState(INITIAL_FINANCIAL_RECORDS);
  const [tokenFilter, setTokenFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const totalLiquidInr = Object.values(TREASURY_BALANCES).reduce((sum, b) => sum + b.inrEst, 0);

  const handleExportFinancialLedger = () => {
    const headers = "ID,Type,Category,Project,Milestone,Amount Crypto,Amount INR,Status,Accounting Status,Date,TxHash\n";
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.id}","${r.type}","${r.category}","${r.project}","${r.milestone}","${r.amountCrypto}","${r.amountInr}","${r.status}","${r.accountingStatus}","${r.date}","${r.txHash}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TrustDonate_Finance_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredRecords = records.filter((r) => {
    const matchesToken = tokenFilter === "All" || r.token === tokenFilter;
    const matchesProject = projectFilter === "All" || r.project === projectFilter;
    const matchesSearch =
      r.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.milestone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.txHash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesToken && matchesProject && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 font-inter text-[#071B3B]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B]">
            Finance &amp; Treasury Operations
          </h1>
          <p className="text-xs sm:text-[13px] text-[#66738A]">
            Cryptographic treasury ledger, multi-sig allocations, and real-world expenditure reconciliation.
          </p>
        </div>

        <button
          onClick={handleExportFinancialLedger}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#071B3B] rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#1D5FD0]" />
          <span>Export Reconciled CSV</span>
        </button>
      </div>

      {/* Conversion Basis Clarity Box */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#475569] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>
          <strong>Documented Conversion Basis:</strong> 1 POL ≈ ₹100, 1 USDC/USDT ≈ ₹85 (Documented testnet valuation baseline).
        </span>
        <span className="font-mono text-[11px] text-[#1E3A8A]">Polygon Amoy Contract 0x8920...43e7</span>
      </div>

      {/* Multi-Token Available Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* POL Card */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#071B3B]">Native POL Treasury</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">Amoy Gas + Native</span>
          </div>
          <div>
            <span className="text-2xl font-bold font-outfit text-[#071B3B]">{TREASURY_BALANCES.POL.available} POL</span>
            <span className="block text-xs text-[#64748B]">Est. {formatInr(TREASURY_BALANCES.POL.inrEst)} liquid</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>On-Chain: {TREASURY_BALANCES.POL.onChain} POL</span>
            <span className="text-amber-600">Locked: {TREASURY_BALANCES.POL.inEscrow} POL</span>
          </div>
        </div>

        {/* USDC Card */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#071B3B]">USDC Stablecoin Vault</span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">ERC-20 (6 Dec)</span>
          </div>
          <div>
            <span className="text-2xl font-bold font-outfit text-[#071B3B]">${TREASURY_BALANCES.USDC.available} USDC</span>
            <span className="block text-xs text-[#64748B]">Est. {formatInr(TREASURY_BALANCES.USDC.inrEst)} liquid</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>On-Chain: ${TREASURY_BALANCES.USDC.onChain}</span>
            <span className="text-amber-600">Locked: ${TREASURY_BALANCES.USDC.inEscrow}</span>
          </div>
        </div>

        {/* USDT Card */}
        <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-[#071B3B]">USDT Reserve Vault</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">ERC-20 (6 Dec)</span>
          </div>
          <div>
            <span className="text-2xl font-bold font-outfit text-[#071B3B]">${TREASURY_BALANCES.USDT.available} USDT</span>
            <span className="block text-xs text-[#64748B]">Est. {formatInr(TREASURY_BALANCES.USDT.inrEst)} liquid</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>On-Chain: ${TREASURY_BALANCES.USDT.onChain}</span>
            <span className="text-amber-600">Locked: ${TREASURY_BALANCES.USDT.inEscrow}</span>
          </div>
        </div>
      </div>

      {/* Spending Limits Progress */}
      <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col gap-3 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-sm text-[#071B3B]">Monthly Treasury Spending Cap</span>
            <span className="block text-[#64748B] text-[11px]">Approved budget ceiling set by Board of Trustees</span>
          </div>
          <span className="font-bold font-mono text-emerald-700 text-sm">₹28,50,000 / ₹45,00,000 Utilized (63.3%)</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-[#00C9A7] h-full" style={{ width: "63.3%" }}></div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <span className="text-[#64748B] font-semibold">Tokens:</span>
          {["All", "POL", "USDC", "USDT"].map((tok) => (
            <button
              key={tok}
              onClick={() => setTokenFilter(tok)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                tokenFilter === tok
                  ? "bg-[#071B3B] text-white shadow-sm"
                  : "bg-slate-100 text-[#64748B] hover:text-[#071B3B]"
              }`}
            >
              {tok}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search disbursements, hashes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Financial Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="py-3.5 px-4">Transaction Details</th>
                <th className="py-3.5 px-4">Initiative &amp; Milestone</th>
                <th className="py-3.5 px-4">Disbursed Amount</th>
                <th className="py-3.5 px-4">Reconciliation Status</th>
                <th className="py-3.5 px-4 text-right">Blockchain Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#071B3B]">{item.category}</span>
                      <span className="text-[10px] text-[#64748B]">{item.id} • {item.date}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-blue-700">{item.project}</span>
                      <span className="text-[11px] text-[#64748B]">{item.milestone}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#071B3B]">{formatInr(item.amountInr)}</span>
                      <span className="font-mono text-[10px] text-emerald-600 font-semibold">{item.amountCrypto}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F172A] bg-slate-100 px-2.5 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.accountingStatus}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status.includes("Executed")
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
