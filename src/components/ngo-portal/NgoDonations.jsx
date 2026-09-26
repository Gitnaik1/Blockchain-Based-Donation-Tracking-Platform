import React, { useState } from "react";
import {
  Heart,
  Search,
  Filter,
  Download,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
} from "lucide-react";

import { initialNgoDonations } from "../../data/donationsData";

export const NgoDonations = ({ donations = initialNgoDonations, onOpenDonate }) => {
  const [tokenFilter, setTokenFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);

  const handleCopy = (hash) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCsv = () => {
    const headers = "ID,Donor,Wallet,Amount INR,Token,Amount Crypto,Project,Date,TxHash,TaxReceipt\n";
    const rows = donations
      .map(
        (d) =>
          `"${d.id}","${d.donor}","${d.wallet}","${d.amountInr}","${d.token}","${d.amountCrypto}","${d.project}","${d.date}","${d.hash}","${d.taxReceiptNo}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TrustDonate_AshaFoundation_Donations_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredDonations = donations.filter((d) => {
    const matchesToken = tokenFilter === "All" || d.token === tokenFilter;
    const matchesSearch =
      d.donor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesToken && matchesSearch;
  });

  const totalInr = donations.reduce((acc, curr) => acc + curr.amountInr, 0);

  return (
    <div className="flex flex-col gap-6 font-inter text-[#1E293B]">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
            Donations Ledger
          </h2>
          <p className="text-xs sm:text-[13px] text-[#66738A]">
            Complete record of on-chain donor contributions, 80G tax exemptions, and token transfers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onOpenDonate && (
            <button
              onClick={onOpenDonate}
              className="px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Make Contribution</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#071B3B] rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#1D5FD0]" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Total Ledger Volume</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            ₹{totalInr.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-[#15803D] font-bold">+14.2% vs last month</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Average Donation</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            ₹{Math.round(totalInr / donations.length).toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">High donor intent</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Confirmed Transactions</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {donations.length}
          </span>
          <span className="text-[10px] text-[#15803D] font-medium">100% Polygon Amoy Mined</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">80G Tax Certificates</span>
          <span className="text-2xl font-bold font-outfit text-[#00C9A7]">
            {donations.length} Issued
          </span>
          <span className="text-[10px] text-[#64748B]">Instant donor generation</span>
        </div>
      </div>

      {/* Table Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {["All", "POL", "USDC", "USDT"].map((token) => (
            <button
              key={token}
              onClick={() => setTokenFilter(token)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tokenFilter === token
                  ? "bg-[#071B3B] text-white shadow-sm"
                  : "bg-slate-100 text-[#64748B] hover:text-[#071B3B] hover:bg-slate-200"
              }`}
            >
              {token}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search donor, wallet, hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(10,22,40,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="py-3.5 px-4">Donor / Wallet</th>
                <th className="py-3.5 px-4">Target Initiative</th>
                <th className="py-3.5 px-4">Amount (INR & Crypto)</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Tx Hash &amp; 80G</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredDonations.map((item, index) => {
                const isNew = item.date === "Just now" || item.isNew || (index === 0 && item.date.includes("Just now"));
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isNew
                        ? "bg-emerald-50/70 hover:bg-emerald-100/60 border-l-4 border-l-[#00C9A7]"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#071B3B]">{item.donor}</span>
                          {isNew && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#00C9A7] text-white tracking-wider animate-pulse shadow-sm">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-[#64748B]">
                          {item.wallet.length > 12
                            ? `${item.wallet.substring(0, 6)}...${item.wallet.substring(item.wallet.length - 4)}`
                            : item.wallet}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {item.project}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#071B3B]">
                          ₹{item.amountInr.toLocaleString("en-IN")}
                        </span>
                        <span className="font-mono text-[10px] text-[#00C9A7] font-semibold">
                          {item.amountCrypto}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">
                      {isNew ? (
                        <span className="text-[#00C9A7] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-ping inline-block"></span>
                          Just now
                        </span>
                      ) : (
                        item.date
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://amoy.polygonscan.com/tx/${item.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[#1D5FD0] hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>{item.hash.substring(0, 8)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[10px] text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.taxReceiptNo}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]"></span>
                        <span>Mined</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
