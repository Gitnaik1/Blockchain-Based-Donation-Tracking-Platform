import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
  Filter,
  CheckCheck,
  Info,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLES } from "../../config/roles.js";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Multi-Sig Proposal Awaiting Signature",
    message: "Proposal PROP-2024-089 (₹3,20,000 for Solar Water Pump) has 2 of 3 required signatures. Your authorized approval is requested.",
    category: "Approvals",
    urgency: "high",
    timestamp: "12 minutes ago",
    read: false,
    targetRoles: [ROLES.NGO_ADMIN, ROLES.FINANCE_OFFICER, ROLES.SUPER_ADMIN],
    actionLabel: "Review in Approval Center",
    targetTab: "Approvals",
  },
  {
    id: "notif-2",
    title: "Milestone Deliverable Submitted for Verification",
    message: "Project 'Clean Water Initiative' submitted Milestone 3 proof (IPFS CID: bafybeiclk4...7m2). Awaiting independent auditor review.",
    category: "Milestones",
    urgency: "medium",
    timestamp: "45 minutes ago",
    read: false,
    targetRoles: [ROLES.AUDITOR, ROLES.NGO_ADMIN, ROLES.PROJECT_MANAGER],
    actionLabel: "Inspect Deliverables",
    targetTab: "Projects",
  },
  {
    id: "notif-3",
    title: "Document Expiry Notice: FCRA Registration",
    message: "FCRA Compliance Certificate is scheduled to expire in 42 days (Dec 15, 2024). Please upload renewing gazette documentation.",
    category: "Compliance",
    urgency: "medium",
    timestamp: "2 hours ago",
    read: false,
    targetRoles: [ROLES.NGO_ADMIN, ROLES.FINANCE_OFFICER, ROLES.SUPER_ADMIN],
    actionLabel: "Open Compliance Vault",
    targetTab: "Documents",
  },
  {
    id: "notif-4",
    title: "Unusual Inflow Velocity Flagged",
    message: "Automated risk monitor detected 15 consecutive donations under 10 minutes totaling ₹4,50,000. Risk level evaluated as LOW/BENIGN.",
    category: "Risk",
    urgency: "low",
    timestamp: "5 hours ago",
    read: true,
    targetRoles: [ROLES.SUPER_ADMIN, ROLES.FINANCE_OFFICER, ROLES.NGO_ADMIN, ROLES.AUDITOR],
    actionLabel: "View Risk Monitor",
    targetTab: "Risk Alerts",
  },
  {
    id: "notif-5",
    title: "Polygon Amoy RPC Latency Restored",
    message: "Polygon Amoy public RPC endpoint latency normalized back to 34ms after periodic testnet reorg.",
    category: "System",
    urgency: "low",
    timestamp: "1 day ago",
    read: true,
    targetRoles: [ROLES.SUPER_ADMIN, ROLES.NGO_ADMIN, ROLES.FINANCE_OFFICER, ROLES.PROJECT_MANAGER, ROLES.AUDITOR, ROLES.DONOR, ROLES.VIEWER],
    actionLabel: "System Status",
    targetTab: "Dashboard",
  },
  {
    id: "notif-6",
    title: "Donation Receipt #TD-2024-9104 Generated",
    message: "Your donation of 50.0 POL (₹5,000) to Asha Foundation is fully confirmed on Polygon Amoy testnet.",
    category: "System",
    urgency: "low",
    timestamp: "2 days ago",
    read: true,
    targetRoles: [ROLES.DONOR, ROLES.VIEWER],
    actionLabel: "View My Donations",
    targetTab: "Donations",
  },
];

export const NotificationCenter = ({ onNavigateTab }) => {
  const { activeRole } = useAuth();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [onlyUnread, setOnlyUnread] = useState(false);

  // Filter based on active role and UI selections
  const roleFiltered = notifications.filter(
    (n) => !n.targetRoles || n.targetRoles.includes(activeRole)
  );

  const displayNotifications = roleFiltered.filter((n) => {
    if (selectedCategory !== "All" && n.category !== selectedCategory) return false;
    if (onlyUnread && n.read) return false;
    return true;
  });

  const unreadCount = roleFiltered.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        roleFiltered.some((rn) => rn.id === n.id) ? { ...n, read: true } : n
      )
    );
  };

  const handleActionClick = (notif) => {
    markAsRead(notif.id);
    if (onNavigateTab && notif.targetTab) {
      onNavigateTab(notif.targetTab);
    }
  };

  const categories = ["All", "Approvals", "Milestones", "Compliance", "Risk", "System"];

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "high":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Action Required</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Needs Review</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Informational</span>;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Approvals":
        return <CheckCircle2 className="w-5 h-5 text-indigo-600" />;
      case "Milestones":
        return <FileCheck className="w-5 h-5 text-emerald-600" />;
      case "Compliance":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "Risk":
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 font-inter">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-[28px] font-outfit font-bold text-[#071B3B]">
              Operational Notifications & Task Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full text-xs font-bold animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-[13px] text-[#66738A] mt-1">
            Real-time multi-sig proposals, milestone review requests, and compliance alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-[#10213F] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-[#071B3B] text-white font-semibold shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-[#64748B]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-[#64748B] cursor-pointer pr-2">
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
            className="rounded border-slate-300 text-[#1D5FD0] focus:ring-[#1D5FD0]"
          />
          <span>Show unread only</span>
        </label>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3">
        {displayNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <Bell className="w-10 h-10 text-slate-300" />
            <h3 className="text-base font-semibold text-[#071B3B]">All caught up!</h3>
            <p className="text-xs text-[#64748B] max-w-sm">
              No pending notifications or operational tasks found for your current role in this view.
            </p>
          </div>
        ) : (
          displayNotifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                n.read
                  ? "border-slate-200 opacity-80"
                  : "border-blue-200 ring-1 ring-blue-50/50 bg-gradient-to-r from-blue-50/20 to-white"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 mt-0.5">
                  {getCategoryIcon(n.category)}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#071B3B]">
                      {n.title}
                    </h3>
                    {getUrgencyBadge(n.urgency)}
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed max-w-3xl">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {n.timestamp}
                    </span>
                    <span>•</span>
                    <span className="uppercase tracking-wider font-semibold">
                      {n.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  onClick={() => handleActionClick(n)}
                  className="px-3.5 py-1.5 bg-[#1D5FD0] hover:bg-[#1D5FD0]/90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>{n.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="text-[11px] text-[#64748B] hover:text-[#071B3B] underline transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
