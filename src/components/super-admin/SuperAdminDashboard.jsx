import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Users,
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  Sliders,
  ExternalLink,
  Lock,
  RefreshCw,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { shortenAddress } from "../../services/utils/tokenMath.js";

const INITIAL_ONBOARDING_QUEUE = [
  {
    id: "app-101",
    name: "Seva Health Alliance",
    category: "Healthcare",
    applicant: "Dr. Rajesh Kulkarni",
    wallet: "0x882aB0182C31b992147ac324e9241F5B612E0987",
    regNo: "TRUST-MH-MUM-2021-0812",
    pan: "AAATS8912K",
    status: "Pending Review",
    submittedDate: "22 Oct 2026",
    complianceScore: "94%",
    documents: ["Trust Deed.pdf", "80G Certificate.pdf", "FCRA Return 2025.pdf"],
  },
  {
    id: "app-102",
    name: "Vriksha Carbon Action",
    category: "Environment",
    applicant: "Sunil Hegde",
    wallet: "0x39ef2a01a812b4e72d93e114f6b21908a812b4e7",
    regNo: "SOC-KA-BLR-2019-4411",
    pan: "AABTV4412M",
    status: "Under Review",
    submittedDate: "20 Oct 2026",
    complianceScore: "88%",
    documents: ["Reforestation Pilot.pdf", "Drone Telemetry Methodology.pdf"],
  },
  {
    id: "app-103",
    name: "Gramin Shala Vikas",
    category: "Education",
    applicant: "Ananya Deshmukh",
    wallet: "0x1d9fe27a4b810935824c180927e1f4356a301d9f",
    regNo: "TRUST-MH-NAG-2017-0104",
    pan: "AAATG0104R",
    status: "Suspended",
    submittedDate: "15 Oct 2026",
    complianceScore: "42%",
    suspendReason: "Discrepancy in FCRA registration renewal document. Awaiting amended certificate.",
    documents: ["Trust Deed.pdf"],
  },
];

const INITIAL_RISK_ALERTS = [
  {
    id: "risk-1",
    severity: "High",
    title: "Rapid Milestone Disbursement Attempt",
    ngoName: "CleanWater Labs",
    timestamp: "10 mins ago",
    details: "Disbursement request of ₹12,00,000 submitted within 2 hours of previous milestone execution.",
    status: "Investigating",
    assignedTo: "Security Lead (Auto)",
  },
  {
    id: "risk-2",
    severity: "Medium",
    title: "Unpinned External Milestone Document",
    ngoName: "Hope Horizon Schools",
    timestamp: "2 hours ago",
    details: "Project proposal links to an HTTP URL instead of immutable IPFS CID.",
    status: "Open",
    assignedTo: "Compliance Auditor",
  },
  {
    id: "risk-3",
    severity: "Low",
    title: "Elevated Gas Price Spike on Amoy Testnet",
    ngoName: "Platform Telemetry",
    timestamp: "4 hours ago",
    details: "Gas price increased by 45% during validator maintenance window.",
    status: "Resolved",
    assignedTo: "Infra Monitor",
  },
];

export const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("onboarding");
  const [onboardingQueue, setOnboardingQueue] = useState(INITIAL_ONBOARDING_QUEUE);
  const [riskAlerts, setRiskAlerts] = useState(INITIAL_RISK_ALERTS);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states for sensitive operations
  const [selectedNgoForAction, setSelectedNgoForAction] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'suspend'
  const [actionReason, setActionReason] = useState("");
  const [confirmedMessage, setConfirmedMessage] = useState(null);

  const handleOpenActionModal = (ngo, type) => {
    setSelectedNgoForAction(ngo);
    setActionType(type);
    setActionReason("");
  };

  const handleExecuteNgoAction = (e) => {
    e.preventDefault();
    if (!selectedNgoForAction) return;

    if (actionType === "approve") {
      setOnboardingQueue((prev) =>
        prev.map((n) =>
          n.id === selectedNgoForAction.id
            ? { ...n, status: "Verified & Active" }
            : n
        )
      );
      setConfirmedMessage(`NGO "${selectedNgoForAction.name}" has been verified and registered on-chain.`);
    } else if (actionType === "suspend") {
      setOnboardingQueue((prev) =>
        prev.map((n) =>
          n.id === selectedNgoForAction.id
            ? { ...n, status: "Suspended", suspendReason: actionReason || "Administrative review" }
            : n
        )
      );
      setConfirmedMessage(`NGO "${selectedNgoForAction.name}" access has been suspended. Reason: ${actionReason || "Administrative review"}`);
    }

    setSelectedNgoForAction(null);
    setActionType(null);
    setTimeout(() => setConfirmedMessage(null), 5000);
  };

  const filteredQueue = onboardingQueue.filter(
    (n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.applicant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 font-inter text-[#071B3B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 uppercase tracking-wider">
              Platform Super Admin
            </span>
            <span className="text-xs text-[#64748B]">Root Administrative Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B] mt-1">
            Global Governance &amp; Verification Hub
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800">
          <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Polygon Amoy RPC: <strong>Healthy (38ms)</strong></span>
        </div>
      </div>

      {/* Confirmation Banner */}
      {confirmedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{confirmedMessage}</span>
          </div>
          <button onClick={() => setConfirmedMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Operational KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Pending Onboarding Queue</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {onboardingQueue.filter((n) => n.status !== "Verified & Active").length} NGOs
          </span>
          <span className="text-[10px] text-blue-600 font-bold">2 KYC Ready for Signoff</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Active Verified NGOs</span>
          <span className="text-2xl font-bold font-outfit text-emerald-600">
            18 Organizations
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">100% on-chain registered</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Open Risk Alerts</span>
          <span className="text-2xl font-bold font-outfit text-rose-600">
            {riskAlerts.filter((r) => r.status !== "Resolved").length} Active
          </span>
          <span className="text-[10px] text-rose-700 font-semibold">1 Requires Urgent Review</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Global Platform Volume</span>
          <span className="text-2xl font-bold font-outfit text-[#1E3A8A]">
            ₹1.48 Cr
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Polygon Amoy Testnet</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
        {[
          { key: "onboarding", label: "NGO Onboarding Queue", count: onboardingQueue.length },
          { key: "risk", label: "Risk Alert Queue", count: riskAlerts.length },
          { key: "health", label: "Service Health & Relayers" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.key
                ? "bg-[#071B3B] text-white shadow-sm"
                : "text-[#64748B] hover:bg-slate-100"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-200 text-[#071B3B]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: ONBOARDING QUEUE */}
      {activeTab === "onboarding" && (
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Search by NGO, applicant, registration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <th className="py-3.5 px-4">NGO Applicant</th>
                    <th className="py-3.5 px-4">Category &amp; Wallet</th>
                    <th className="py-3.5 px-4">Legal IDs &amp; Docs</th>
                    <th className="py-3.5 px-4">KYC Compliance</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#071B3B] text-sm">{item.name}</span>
                          <span className="text-[#64748B] text-[11px]">Contact: {item.applicant}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-blue-700">{item.category}</span>
                          <span className="font-mono text-[10px] text-[#64748B]">
                            {shortenAddress(item.wallet, 4)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[10px] text-[#071B3B]">{item.regNo}</span>
                          <span className="text-[10px] text-[#64748B]">PAN: {item.pan}</span>
                          <span className="text-[10px] text-blue-600 underline cursor-pointer">
                            {item.documents.length} verified documents
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                parseInt(item.complianceScore) > 75 ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{ width: item.complianceScore }}
                            ></div>
                          </div>
                          <span className="font-bold text-[11px]">{item.complianceScore}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "Verified & Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.status === "Suspended"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== "Verified & Active" && (
                            <button
                              onClick={() => handleOpenActionModal(item, "approve")}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Verify NGO
                            </button>
                          )}
                          {item.status !== "Suspended" && (
                            <button
                              onClick={() => handleOpenActionModal(item, "suspend")}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RISK ALERT QUEUE */}
      {activeTab === "risk" && (
        <div className="flex flex-col gap-3">
          {riskAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    alert.severity === "High"
                      ? "bg-rose-100 text-rose-600"
                      : alert.severity === "Medium"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#071B3B] text-sm">{alert.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        alert.severity === "High"
                          ? "bg-rose-50 text-rose-700"
                          : alert.severity === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {alert.severity} Risk
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">{alert.details}</p>
                  <span className="text-[10px] text-slate-400">
                    Source: {alert.ngoName} • Reported {alert.timestamp} • Assigned: {alert.assignedTo}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="px-2 py-1 rounded bg-slate-100 text-[#071B3B] text-[10px] font-semibold">
                  Status: {alert.status}
                </span>
                {alert.status !== "Resolved" && (
                  <button
                    onClick={() => {
                      setRiskAlerts((prev) =>
                        prev.map((r) =>
                          r.id === alert.id ? { ...r, status: "Resolved" } : r
                        )
                      );
                    }}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1D5FD0] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SYSTEM HEALTH */}
      {activeTab === "health" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Polygon Amoy RPC Relay</span>
            <span className="text-lg font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Operational (100% Finality)</span>
            </span>
            <span className="text-[11px] text-slate-500">Chain ID: 80002 • Block 12,489,321</span>
          </div>

          <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#64748B]">IPFS Gateway &amp; Pinning Node</span>
            <span className="text-lg font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Connected (Pinata &amp; IPFS.io)</span>
            </span>
            <span className="text-[11px] text-slate-500">2,480 Documents Immutable</span>
          </div>

          <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#64748B]">EIP-4361 Auth Service</span>
            <span className="text-lg font-bold text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>SIWE Nonce Verification Active</span>
            </span>
            <span className="text-[11px] text-slate-500">Anti-replay TTL: 5 Minutes</span>
          </div>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {selectedNgoForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {actionType === "approve" ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="font-bold font-outfit text-base text-[#071B3B]">
                  {actionType === "approve" ? "Verify & Onboard NGO" : "Suspend NGO Organization"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNgoForAction(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs">
              <p className="text-[#475569]">
                Organization: <strong>{selectedNgoForAction.name}</strong> ({selectedNgoForAction.regNo})
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[#64748B]">
                {actionType === "approve" ? (
                  <span>
                    Verifying this NGO registers their verified treasury contract on the Polygon Amoy public registry, allowing donors to contribute with 80G eligibility.
                  </span>
                ) : (
                  <span className="text-rose-700">
                    Suspending this NGO halts public contributions and milestone disbursement execution until administrative clearance is granted.
                  </span>
                )}
              </div>

              {actionType === "suspend" && (
                <div className="flex flex-col gap-1 mt-2">
                  <label className="font-semibold text-[#071B3B]">Required Suspension Reason:</label>
                  <textarea
                    rows={2}
                    required
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Enter compliance finding or audit discrepancy..."
                    className="p-2 border border-[#E2E8F0] rounded-lg outline-none focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedNgoForAction(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteNgoAction}
                className={`flex-1 py-2.5 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-sm ${
                  actionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Confirm {actionType === "approve" ? "Verification" : "Suspension"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
