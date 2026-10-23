import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLES, PERMISSIONS } from "../../config/roles.js";

const INITIAL_RISK_ALERTS = [
  {
    id: "ALT-2024-001",
    severity: "Critical",
    category: "Multisig Threshold Modification",
    title: "Unauthorized Signer Addition Attempt",
    description: "An unsigned call attempted to invoke setQuorum on Treasury contract 0xA904...1B2c from unwhitelisted address.",
    targetOrg: "Green Canopy Initiative",
    wallet: "0x82b9e69123891c9d812301923012931209310293",
    timestamp: "18 minutes ago",
    status: "New",
    score: 95,
  },
  {
    id: "ALT-2024-002",
    severity: "High",
    category: "Rapid Inflow Anomaly",
    title: "18 Sequential Small Micro-Transfers Detected",
    description: "18 transactions of 0.05 POL each occurred within 4 minutes targeting Asha Foundation donation contract. Potential dust testing.",
    targetOrg: "Asha Foundation",
    wallet: "0x12aBcDeF43829104820194820194820194820194",
    timestamp: "1 hour ago",
    status: "Investigating",
    score: 78,
  },
  {
    id: "ALT-2024-003",
    severity: "Medium",
    category: "Budget Overrun Warning",
    title: "Milestone 4 Disbursement Exceeds Cap by 14%",
    description: "Funding proposal PROP-2024-091 requests ₹4,10,000 against an approved milestone budget of ₹3,60,000.",
    targetOrg: "CleanWater Labs",
    wallet: "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
    timestamp: "6 hours ago",
    status: "Acknowledged",
    score: 62,
  },
  {
    id: "ALT-2024-004",
    severity: "Low",
    category: "Gas Telemetry Spike",
    title: "Amoy Base Fee Spike During Batch Execution",
    description: "Gas price surged to 75 Gwei during proposal execution. Relayer absorbed ₹18 extra gas fee safely.",
    targetOrg: "Asha Foundation",
    wallet: "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
    timestamp: "1 day ago",
    status: "Resolved",
    score: 30,
  },
];

export const RiskAlertsWorkspace = () => {
  const { hasAccess, activeRole } = useAuth();
  const [alerts, setAlerts] = useState(INITIAL_RISK_ALERTS);
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalAlert, setActiveModalAlert] = useState(null);
  const [triageStatus, setTriageStatus] = useState("Investigating");
  const [triageNotes, setTriageNotes] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const canTriage = hasAccess(PERMISSIONS.RISK_VIEW_ALERTS);

  const filteredAlerts = alerts.filter((a) => {
    if (selectedSeverity !== "All" && a.severity !== selectedSeverity) return false;
    if (selectedStatus !== "All" && a.status !== selectedStatus) return false;
    if (
      searchQuery &&
      !a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.targetOrg.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    if (!activeModalAlert) return;

    setAlerts((prev) =>
      prev.map((item) =>
        item.id === activeModalAlert.id
          ? { ...item, status: triageStatus, notes: triageNotes }
          : item
      )
    );

    setFeedbackMsg(`Alert ${activeModalAlert.id} status updated to '${triageStatus}'.`);
    setTimeout(() => setFeedbackMsg(""), 4000);
    setActiveModalAlert(null);
    setTriageNotes("");
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "Critical":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Critical</span>;
      case "High":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case "Medium":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "New":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">New</span>;
      case "Acknowledged":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Acknowledged</span>;
      case "Investigating":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Investigating</span>;
      case "Resolved":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">Dismissed</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 font-inter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-[28px] font-outfit font-bold text-[#071B3B]">
              Risk Alerts & Anomaly Monitor
            </h1>
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-xs font-semibold">
              Live Relayer Watcher
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#66738A] mt-1">
            Real-time heuristic anomaly detection, smart contract call inspection, and audit escalation.
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Alert ID, Organization, or Keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs text-[#071B3B] placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl font-medium text-[#071B3B]"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl font-medium text-[#071B3B]"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                <th className="py-3.5 px-4">Alert ID & Category</th>
                <th className="py-3.5 px-4">Title & Context</th>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No risk alerts found matching selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#071B3B]">{a.id}</div>
                      <div className="text-[10px] text-slate-500">{a.category}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-[#071B3B]">{a.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{a.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {a.targetOrg}
                    </td>
                    <td className="py-3.5 px-4">{getSeverityBadge(a.severity)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(a.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveModalAlert(a);
                          setTriageStatus(a.status === "New" ? "Investigating" : a.status);
                        }}
                        className="px-3 py-1.5 bg-[#1D5FD0] hover:bg-[#1D5FD0]/90 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Triage Modal */}
      {activeModalAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {activeModalAlert.id}
                  </span>
                  {getSeverityBadge(activeModalAlert.severity)}
                </div>
                <h3 className="text-base font-bold text-[#071B3B] mt-1">
                  {activeModalAlert.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalAlert(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                  Incident Description
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {activeModalAlert.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Target NGO:</span>
                  <div className="font-semibold text-slate-900">{activeModalAlert.targetOrg}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Heuristic Risk Score:</span>
                  <div className="font-bold text-rose-600">{activeModalAlert.score} / 100</div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[11px] text-slate-600 break-all">
                <span className="text-slate-500 font-sans block text-[10px]">Involved Wallet / Target:</span>
                {activeModalAlert.wallet}
              </div>
            </div>

            {/* Triage Form */}
            <form onSubmit={handleUpdateStatus} className="flex flex-col gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#071B3B]">
                  Update Alert Triage Status
                </label>
                <select
                  value={triageStatus}
                  onChange={(e) => setTriageStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl font-medium text-[#071B3B]"
                >
                  <option value="Acknowledged">Acknowledged — Under review</option>
                  <option value="Investigating">Investigating — Logs being inspected</option>
                  <option value="Resolved">Resolved — Safe / False positive resolved</option>
                  <option value="Dismissed">Dismissed — Expected operational traffic</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#071B3B]">
                  Resolution Notes / Audit Log
                </label>
                <textarea
                  rows="2"
                  value={triageNotes}
                  onChange={(e) => setTriageNotes(e.target.value)}
                  placeholder="Record verification findings or reason for status update..."
                  className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-[#071B3B] outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalAlert(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D5FD0] hover:bg-[#1D5FD0]/90 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
