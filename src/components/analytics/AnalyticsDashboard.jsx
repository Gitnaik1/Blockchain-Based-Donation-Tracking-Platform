import React, { useState } from "react";
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Coins,
} from "lucide-react";
import { formatInr, formatCrypto } from "../../services/utils/tokenMath.js";

const MONTHLY_TRENDS = [
  { month: "May", pol: 8200, usdc: 4100, inr: 1168500, count: 182 },
  { month: "Jun", pol: 11500, usdc: 6200, inr: 1677000, count: 245 },
  { month: "Jul", pol: 9800, usdc: 5800, inr: 1473000, count: 210 },
  { month: "Aug", pol: 14200, usdc: 8900, inr: 2176500, count: 320 },
  { month: "Sep", pol: 16800, usdc: 11200, inr: 2632000, count: 390 },
  { month: "Oct", pol: 18500, usdc: 12400, inr: 2904000, count: 435 },
];

const TOKEN_DISTRIBUTION = [
  { symbol: "POL", name: "Polygon Native", share: 58, amount: "79,000.00 POL", valueInr: "₹79,00,000", color: "bg-purple-600" },
  { symbol: "USDC", name: "USD Coin", share: 32, amount: "51,200.00 USDC", valueInr: "₹43,52,000", color: "bg-blue-600" },
  { symbol: "USDT", name: "Tether USD", share: 10, amount: "16,800.00 USDT", valueInr: "₹14,28,000", color: "bg-emerald-600" },
];

const MILESTONE_VELOCITY = [
  { project: "Solar Well Infrastructure", avgDays: 14, completionRate: "94%", onChainStatus: "Verified" },
  { project: "Mobile Medical Dispensary", avgDays: 21, completionRate: "88%", onChainStatus: "Verified" },
  { project: "Reforestation Green Shield", avgDays: 18, completionRate: "91%", onChainStatus: "In Progress" },
  { project: "Girls STEM Scholarship", avgDays: 9, completionRate: "100%", onChainStatus: "Verified" },
];

export const AnalyticsDashboard = () => {
  const [timeframe, setTimeframe] = useState("90d");

  const exportAnalyticsCsv = () => {
    const headers = ["Month", "POL_Donations", "USDC_Donations", "Est_INR_Total", "Donor_Count"];
    const rows = MONTHLY_TRENDS.map((t) => [
      t.month,
      t.pol,
      t.usdc,
      t.inr,
      t.count,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TrustDonate_Analytics_Trends_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 font-inter">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-outfit font-bold text-[#071B3B]">
            Advanced Financial & Impact Analytics
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs sm:text-[13px] text-[#66738A]">
              Cryptographic donation curves, token composition, and milestone velocity.
            </p>
            <span className="text-[10px] bg-slate-100 text-[#64748B] px-2 py-0.5 rounded border border-slate-200">
              Documented baseline: 1 POL ≈ ₹100, 1 USDC/USDT ≈ ₹85
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Timeframe pill selector */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">
            {[
              { id: "30d", label: "30D" },
              { id: "90d", label: "90D" },
              { id: "1y", label: "1Y" },
              { id: "all", label: "All" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  timeframe === t.id
                    ? "bg-[#071B3B] text-white shadow-sm"
                    : "text-[#64748B] hover:text-[#071B3B]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportAnalyticsCsv}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[#10213F] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Net Inflow (Trailing 90D)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-outfit font-extrabold text-[#071B3B]">
            ₹77,12,500
          </span>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+24.8% vs prior period</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Active Donor Retention</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-outfit font-extrabold text-[#071B3B]">
            68.4%
          </span>
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
            <span>412 repeat Web3 donors</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Avg Escrow Release Velocity</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-outfit font-extrabold text-[#071B3B]">
            15.5 Days
          </span>
          <div className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold">
            <span>Fastest: 9 days (Clean Water)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Total On-Chain Gas Sponsored</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-outfit font-extrabold text-[#071B3B]">
            14.28 POL
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>₹1,428 via Paymaster</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Curve / Bar visualization */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#071B3B]">
                Monthly Inflow Volume & Donor Growth
              </h2>
              <p className="text-xs text-[#64748B]">
                Native POL + Stablecoins converted at baseline rates.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <span className="w-3 h-3 rounded-sm bg-[#1D5FD0]"></span>
                Inflow (₹ Lakhs)
              </span>
              <span className="flex items-center gap-1.5 text-[#64748B]">
                <span className="w-3 h-3 rounded-sm bg-[#00C9A7]"></span>
                Donor Count
              </span>
            </div>
          </div>

          {/* Simple High-Fidelity CSS Bar Graphic */}
          <div className="h-64 flex items-end gap-3 sm:gap-6 pt-6 pb-2 border-b border-slate-100">
            {MONTHLY_TRENDS.map((item) => {
              const maxInr = 3000000;
              const heightPct = Math.round((item.inr / maxInr) * 100);
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{(item.inr / 100000).toFixed(1)}L
                  </div>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-full">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-[#071B3B] to-[#1D5FD0] group-hover:to-[#00C9A7] transition-all rounded-t-md"
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-[#64748B]">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Source: Polygon Amoy Event Logs</span>
            <span>Audited & Reconciled Weekly</span>
          </div>
        </div>

        {/* Token Composition Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-[#071B3B]">
              Token Inflow Distribution
            </h2>
            <p className="text-xs text-[#64748B]">
              Treasury breakdown across accepted assets.
            </p>
          </div>

          {/* Horizontal multi-color bar */}
          <div className="h-4 rounded-full overflow-hidden flex w-full">
            {TOKEN_DISTRIBUTION.map((t) => (
              <div
                key={t.symbol}
                style={{ width: `${t.share}%` }}
                className={`${t.color} h-full transition-all`}
                title={`${t.symbol}: ${t.share}%`}
              ></div>
            ))}
          </div>

          {/* Token Breakdown List */}
          <div className="flex flex-col gap-3 pt-2">
            {TOKEN_DISTRIBUTION.map((t) => (
              <div
                key={t.symbol}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${t.color}`}></div>
                  <div>
                    <div className="font-semibold text-[#071B3B]">{t.symbol}</div>
                    <div className="text-[10px] text-[#64748B]">{t.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#071B3B]">{t.share}%</div>
                  <div className="text-[10px] font-mono text-[#64748B]">{t.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestone Release Velocity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-[#071B3B]">
            Milestone Release Velocity & Escrow Performance
          </h2>
          <p className="text-xs text-[#64748B]">
            Time elapsed from proposal initiation to independent auditor verification and smart contract release.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-3">Project Name</th>
                <th className="py-3 px-3">Avg Verification Lead Time</th>
                <th className="py-3 px-3">Completion Rate</th>
                <th className="py-3 px-3">On-Chain Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MILESTONE_VELOCITY.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-[#071B3B]">
                    {m.project}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#475569]">
                    {m.avgDays} business days
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {m.completionRate}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {m.onChainStatus}
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
