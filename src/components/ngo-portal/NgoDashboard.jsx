import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Heart,
  FolderKanban,
  PieChart,
  ArrowLeftRight,
  BarChart3,
  Users,
  Settings,
  Search,
  Bell,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  Plus,
  ExternalLink,
  LogOut,
  Globe,
  Menu,
  X,
  ArrowUpRight,
  Filter,
  ShieldCheck,
  ShieldAlert,
  FileText,
  KeyRound,
  Landmark,
  Sparkles,
} from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import { useAuth } from "../../context/AuthContext.jsx";
import { useRouter } from "../../context/RouterContext.jsx";
import { ROLES, ROLE_LABELS, PERMISSIONS } from "../../config/roles.js";
import { authService } from "../../services/authService";
import { RoleSwitcherPill } from "../common/RoleSwitcherPill.jsx";
import { ForbiddenView } from "../common/ForbiddenView.jsx";
import { GlobalSearchModal } from "../common/GlobalSearchModal.jsx";
import { BackButton } from "../common/BackButton.jsx";
import { Breadcrumbs } from "../common/Breadcrumbs.jsx";
import { FundAllocation } from "./FundAllocation";
import { NgoProjects } from "./NgoProjects";
import { NgoDonations } from "./NgoDonations";
import { NgoTransactions } from "./NgoTransactions";
import { NgoImpactReports } from "./NgoImpactReports";
import { NgoDonors } from "./NgoDonors";
import { NgoSettings } from "./NgoSettings";
import { NgoTeamManagement } from "./NgoTeamManagement.jsx";
import { FinanceWorkspace } from "../finance/FinanceWorkspace.jsx";
import { ApprovalCenter } from "../approvals/ApprovalCenter.jsx";
import { ProjectManagerWorkspace } from "../projects/ProjectManagerWorkspace.jsx";
import { AuditorPortal } from "../auditor/AuditorPortal.jsx";
import { DonorDashboard } from "../donor/DonorDashboard.jsx";
import { SuperAdminDashboard } from "../super-admin/SuperAdminDashboard.jsx";
import { NotificationCenter } from "../notifications/NotificationCenter.jsx";
import { AnalyticsDashboard } from "../analytics/AnalyticsDashboard.jsx";
import { RiskAlertsWorkspace } from "../risk/RiskAlertsWorkspace.jsx";
import { DocumentComplianceWorkspace } from "../documents/DocumentComplianceWorkspace.jsx";

export const NgoDashboard = ({
  onBackToPublic,
  onLogout,
  ngoDonations = [],
  onOpenDonate,
  initialTab = "Dashboard",
  donorInitialTab = "history",
  onTabChange,
}) => {
  const { account } = useWeb3();
  const { currentUser, activeRole, activeOrganization, hasAccess } = useAuth();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Global keydown listener for ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [currentDonorTab, setCurrentDonorTab] = useState(donorInitialTab || "history");

  useEffect(() => {
    if (donorInitialTab) {
      setCurrentDonorTab(donorInitialTab);
    }
  }, [donorInitialTab]);

  // Default tab based on active role
  const getDefaultTabForRole = (role) => {
    switch (role) {
      case ROLES.DONOR:
        return "Donor Portal";
      case ROLES.SUPER_ADMIN:
        return "Super Admin";
      case ROLES.AUDITOR:
        return "Auditor";
      case ROLES.FINANCE_OFFICER:
        return "Finance";
      case ROLES.PROJECT_MANAGER:
        return "Projects";
      case ROLES.VIEWER:
        return "Transactions";
      case ROLES.NGO_ADMIN:
      default:
        return "Dashboard";
    }
  };

  // Sync if initialTab changes or if activeRole switches
  useEffect(() => {
    if (initialTab && initialTab !== "Dashboard") {
      setActiveTab(initialTab);
    } else if (activeRole && activeRole !== ROLES.NGO_ADMIN) {
      setActiveTab(getDefaultTabForRole(activeRole));
    } else {
      setActiveTab("Dashboard");
    }
  }, [initialTab, activeRole]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
    if (navigate) {
      if (tab === "Super Admin") navigate("/admin");
      else if (tab === "Auditor") navigate("/auditor");
      else if (tab === "Finance") navigate("/finance");
      else if (tab === "Projects") navigate("/projects");
      else if (tab === "Approvals") navigate("/approvals");
      else if (tab === "Risk Alerts") navigate("/risk");
      else if (tab === "Donor Portal") navigate("/donor/dashboard");
      else if (tab === "Dashboard") {
        if (activeRole === ROLES.DONOR) navigate("/donor/dashboard");
        else if (activeRole === ROLES.SUPER_ADMIN) navigate("/admin");
        else if (activeRole === ROLES.AUDITOR) navigate("/auditor");
        else if (activeRole === ROLES.FINANCE_OFFICER) navigate("/finance");
        else if (activeRole === ROLES.PROJECT_MANAGER) navigate("/projects");
        else navigate("/ngo/dashboard");
      }
    }
  };

  // Calculate dynamic metrics from live ngoDonations
  const additionalDonationsInr = ngoDonations.slice(0, Math.max(0, ngoDonations.length - 6)).reduce((sum, d) => sum + (d.amountInr || 0), 0);
  const baseTotalDonations = 4872450;
  const currentTotalDonations = baseTotalDonations + additionalDonationsInr;
  const formattedTotalDonations = `₹${currentTotalDonations.toLocaleString("en-IN")}`;

  const baseAvailableFunds = 1684200;
  const currentAvailableFunds = baseAvailableFunds + additionalDonationsInr;
  const formattedAvailableFunds = `₹${currentAvailableFunds.toLocaleString("en-IN")}`;

  const baseDonorsCount = 1284;
  const newDonorsAdded = Math.max(0, ngoDonations.length - 6);
  const totalDonorsCount = (baseDonorsCount + newDonorsAdded).toLocaleString("en-IN");

  // Interactive pending actions state
  const [pendingActions, setPendingActions] = useState([
    { id: 1, text: "Allocate ₹3.2L to Water Initiative", completed: false },
    { id: 2, text: "Submit June impact report", completed: false },
    { id: 3, text: "Verify 2 project documents", completed: false },
  ]);

  const toggleAction = (id) => {
    setPendingActions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // Role-Specific Navigation Definitions
  const getNavItemsForRole = (role) => {
    switch (role) {
      case ROLES.DONOR:
        return [
          { label: "My Donations", icon: Heart, badge: "80G", targetTab: "Donor Portal", donorSubTab: "history", path: "/donor/dashboard" },
          { label: "Impact Milestones", icon: Sparkles, targetTab: "Donor Portal", donorSubTab: "impact", path: "/donor/dashboard" },
          { label: "Recurring Pledges", icon: ArrowLeftRight, targetTab: "Donor Portal", donorSubTab: "recurring", path: "/donor/dashboard" },
          { label: "Profile & Wallet", icon: Users, targetTab: "Donor Portal", donorSubTab: "profile", path: "/donor/profile" },
          { label: "Tax & Settings", icon: Settings, targetTab: "Donor Portal", donorSubTab: "settings", path: "/donor/settings" },
          { label: "Public Ledger", icon: FileText, badge: "Amoy", targetTab: "Transactions" },
          { label: "Notifications", icon: Bell, targetTab: "Notifications" },
          { label: "Explore Causes", icon: Globe, action: () => navigate && navigate("/") },
        ];

      case ROLES.FINANCE_OFFICER:
        return [
          { label: "Finance Workspace", icon: Landmark, badge: "Treasury", targetTab: "Finance", path: "/finance" },
          { label: "Approvals", icon: KeyRound, badge: "Multi-Sig", targetTab: "Approvals", path: "/approvals" },
          { label: "Fund Allocation", icon: PieChart, targetTab: "Fund Allocation" },
          { label: "Transactions Ledger", icon: ArrowLeftRight, targetTab: "Transactions" },
          { label: "Documents & Vault", icon: FileText, targetTab: "Documents" },
          { label: "Risk Alerts", icon: ShieldAlert, targetTab: "Risk Alerts", path: "/risk" },
          { label: "Treasury Analytics", icon: BarChart3, targetTab: "Analytics" },
          { label: "Notifications", icon: Bell, targetTab: "Notifications" },
        ];

      case ROLES.PROJECT_MANAGER:
        return [
          { label: "Projects & Milestones", icon: FolderKanban, badge: "Field", targetTab: "Projects", path: "/projects" },
          { label: "Deliverables & Proofs", icon: FileText, badge: "IPFS", targetTab: "Documents" },
          { label: "Impact Reports", icon: FileCheck, targetTab: "Impact Reports" },
          { label: "Fund Allocation", icon: PieChart, targetTab: "Fund Allocation" },
          { label: "Notifications", icon: Bell, targetTab: "Notifications" },
        ];

      case ROLES.AUDITOR:
        return [
          { label: "Auditor Portal", icon: ShieldCheck, badge: "Audits", targetTab: "Auditor", path: "/auditor" },
          { label: "Compliance Vault", icon: FileText, badge: "IPFS", targetTab: "Documents" },
          { label: "Impact Reports", icon: FileCheck, targetTab: "Impact Reports" },
          { label: "On-Chain Ledger", icon: ArrowLeftRight, badge: "Ledger", targetTab: "Transactions" },
          { label: "Risk Alerts", icon: ShieldAlert, targetTab: "Risk Alerts", path: "/risk" },
          { label: "Notifications", icon: Bell, targetTab: "Notifications" },
        ];

      case ROLES.SUPER_ADMIN:
        return [
          { label: "Super Admin", icon: ShieldCheck, badge: "Gov", targetTab: "Super Admin", path: "/admin" },
          { label: "Auditor Portal", icon: ShieldCheck, targetTab: "Auditor", path: "/auditor" },
          { label: "Risk Alerts", icon: ShieldAlert, badge: "Alerts", targetTab: "Risk Alerts", path: "/risk" },
          { label: "Platform Analytics", icon: BarChart3, targetTab: "Analytics" },
          { label: "Documents & IPFS", icon: FileText, targetTab: "Documents" },
          { label: "Transactions", icon: ArrowLeftRight, targetTab: "Transactions" },
          { label: "Notifications", icon: Bell, targetTab: "Notifications" },
          { label: "Settings", icon: Settings, targetTab: "Settings" },
        ];

      case ROLES.VIEWER:
        return [
          { label: "Public Ledger", icon: ArrowLeftRight, badge: "Live", targetTab: "Transactions" },
          { label: "Impact Reports", icon: FileCheck, targetTab: "Impact Reports" },
          { label: "Analytics", icon: BarChart3, targetTab: "Analytics" },
          { label: "Explore NGOs", icon: Globe, action: () => navigate && navigate("/") },
        ];

      case ROLES.NGO_ADMIN:
      default:
        return [
          { label: "Dashboard", icon: LayoutDashboard, targetTab: "Dashboard", path: "/ngo/dashboard" },
          { label: "Approvals", icon: KeyRound, badge: "Multi-Sig", targetTab: "Approvals", path: "/approvals" },
          { label: "Finance", icon: Landmark, targetTab: "Finance", path: "/finance" },
          { label: "Projects", icon: FolderKanban, targetTab: "Projects", path: "/projects" },
          { label: "Fund Allocation", icon: PieChart, targetTab: "Fund Allocation" },
          { label: "Team Management", icon: Users, badge: "Staff", targetTab: "Team" },
          { label: "Documents & Vault", icon: FileText, targetTab: "Documents" },
          { label: "Donations Ledger", icon: Heart, targetTab: "Donations" },
          { label: "Donor Directory", icon: Users, targetTab: "Donors" },
          { label: "Transactions", icon: ArrowLeftRight, targetTab: "Transactions" },
          { label: "Impact Reports", icon: FileCheck, targetTab: "Impact Reports" },
          { label: "Analytics", icon: BarChart3, targetTab: "Analytics" },
          { label: "Risk Alerts", icon: ShieldAlert, targetTab: "Risk Alerts", path: "/risk" },
          { label: "Notifications", icon: Bell, targetTab: "Notifications" },
          { label: "NGO Settings", icon: Settings, targetTab: "Settings" },
        ];
    }
  };

  const navItems = getNavItemsForRole(activeRole);

  const handleNavItemClick = (item) => {
    if (item.action) {
      item.action();
      return;
    }
    const target = item.targetTab || item.label;
    if (item.donorSubTab) {
      setCurrentDonorTab(item.donorSubTab);
    }
    handleTabChange(target);
    if (item.path && navigate) {
      navigate(item.path);
    }
  };

  const isItemActive = (item) => {
    if (item.donorSubTab) {
      return activeTab === "Donor Portal" && currentDonorTab === item.donorSubTab;
    }
    const target = item.targetTab || item.label;
    return activeTab === target;
  };

  const displayWallet = account
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : "0x71F3...9A2C";

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex font-inter text-[#10213F]">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#071B3B] text-white p-5 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-7">
          {/* Brand Logo & Close on mobile */}
          <div className="flex flex-col gap-2 px-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-[34px] h-[34px] bg-white rounded-[10px] flex items-center justify-center shadow-md">
                  <div className="w-[19px] h-[19px] border-[1.5px] border-[#123F8C] rounded-[3px] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#123F8C] rounded-full"></div>
                  </div>
                </div>
                <span className="text-white text-xl font-outfit font-bold tracking-tight">
                  TrustDonate
                </span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role-Specific Portal Badge */}
            <div className="flex items-center gap-1.5 pl-0.5">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                activeRole === ROLES.DONOR
                  ? "text-emerald-400 bg-emerald-950/60 border-emerald-800/60"
                  : activeRole === ROLES.SUPER_ADMIN
                  ? "text-purple-400 bg-purple-950/60 border-purple-800/60"
                  : activeRole === ROLES.AUDITOR
                  ? "text-amber-400 bg-amber-950/60 border-amber-800/60"
                  : activeRole === ROLES.FINANCE_OFFICER
                  ? "text-cyan-400 bg-cyan-950/60 border-cyan-800/60"
                  : activeRole === ROLES.PROJECT_MANAGER
                  ? "text-blue-400 bg-blue-950/60 border-blue-800/60"
                  : "text-slate-300 bg-slate-800/60 border-slate-700/60"
              }`}>
                {activeRole === ROLES.DONOR
                  ? "Donor Engagement Hub"
                  : activeRole === ROLES.SUPER_ADMIN
                  ? "Platform Admin Console"
                  : activeRole === ROLES.AUDITOR
                  ? "Auditor Evidence Portal"
                  : activeRole === ROLES.FINANCE_OFFICER
                  ? "Finance & MultiSig Hub"
                  : activeRole === ROLES.PROJECT_MANAGER
                  ? "Field Project Workspace"
                  : (activeOrganization?.name || "NGO Governance")}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);
              const isHighlight = item.label === "Fund Allocation" || item.badge === "80G";
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    handleNavItemClick(item);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full h-10 px-3 rounded-xl flex items-center justify-between text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? isHighlight
                        ? "bg-[#00C9A7]/20 text-[#00C9A7] font-bold border border-[#00C9A7]/30 shadow-sm"
                        : "bg-white/10 text-white font-semibold shadow-sm"
                      : "text-[#A9B7D0] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive
                          ? isHighlight
                            ? "text-[#00C9A7]"
                            : "text-white"
                          : "text-[#A9B7D0]"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      item.badge === "80G"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/10 text-[#00C9A7]"
                    }`}>
                      {item.badge}
                    </span>
                  ) : isHighlight && item.label === "Fund Allocation" ? (
                    <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Network Status */}
        <div className="flex flex-col gap-4">
          <div className="p-3.5 bg-white/[0.05] border border-white/10 rounded-2xl flex flex-col gap-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#17875D] animate-pulse"></span>
              <span className="text-white text-xs font-semibold">Polygon Amoy</span>
            </div>
            <span className="text-[#A9B7D0] font-mono text-[11px]">{displayWallet}</span>
            <span className="text-[#7487A9] text-[10px] tracking-wider uppercase font-mono">
              TESTNET • BLOCK 12,489,321
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-[#A9B7D0]">
            <button
              onClick={onBackToPublic}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>
            <button
              onClick={() => {
                authService.clearSession();
                onLogout();
              }}
              className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-[72px] px-6 sm:px-8 bg-white border-b border-[#E2E7F0] flex items-center justify-between gap-4 sticky top-0 z-30">
          {/* Mobile hamburger & Search bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-[#071B3B] hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full h-10 px-3.5 bg-[#F5F7FB] border border-transparent hover:border-[#1D5FD0] focus-within:border-[#1D5FD0] rounded-xl flex items-center gap-2 text-xs sm:text-[13px] text-[#94A0B4] transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 flex-shrink-0 text-[#94A0B4]" />
              <input
                type="text"
                readOnly
                placeholder="Search workspaces, NGOs, projects (⌘K)..."
                className="bg-transparent border-none outline-none w-full text-[#10213F] placeholder-[#94A0B4] text-xs sm:text-[13px] cursor-pointer"
              />
              <span className="hidden sm:inline px-1.5 py-0.5 bg-white border border-[#E2E7F0] rounded text-[10px] font-mono text-[#94A0B4]">
                ⌘ K
              </span>
            </div>
          </div>

          {/* Account Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {/* Role Switcher Pill */}
            <RoleSwitcherPill />

            {/* Notification Bell */}
            <div
              onClick={() => handleTabChange("Notifications")}
              className="relative w-9 h-9 bg-[#F5F7FB] rounded-xl flex items-center justify-center text-[#10213F] hover:bg-slate-200 transition-colors cursor-pointer"
              title="Open Notifications & Task Center"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#C13C4A] rounded-full animate-ping"></span>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#C13C4A] rounded-full"></span>
            </div>

            {/* Wallet Pill */}
            <div className="hidden lg:flex px-3 py-1.5 bg-[#E8F7F0] border border-[#C6EFE0] rounded-full items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#17875D]"></div>
              <span className="text-[#17875D] font-mono text-[11px] font-medium">
                {displayWallet}
              </span>
            </div>

            {/* NGO Avatar & Organization Profile */}
            <div className="flex items-center gap-2.5 pl-2 sm:border-l border-slate-200">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                alt={currentUser?.name || "User"}
                className="w-9 h-9 rounded-full object-cover border border-[#00C9A7]"
              />
              <div className="hidden md:flex flex-col">
                <span className="text-[#10213F] text-xs font-semibold font-inter leading-tight">
                  {currentUser?.name || "Dr. Alok Verma"}
                </span>
                <span className="text-[#66738A] text-[10px] leading-tight">
                  {ROLE_LABELS[activeRole]} • {activeRole === ROLES.DONOR ? "Verified Patron" : (activeOrganization?.name || "Platform")}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 sm:p-8 flex flex-col gap-6">
          {/* Breadcrumbs and Back Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <BackButton fallback={activeRole === ROLES.DONOR ? "/donor/dashboard" : activeRole === ROLES.SUPER_ADMIN ? "/admin" : activeRole === ROLES.AUDITOR ? "/auditor" : activeRole === ROLES.FINANCE_OFFICER ? "/finance" : activeRole === ROLES.PROJECT_MANAGER ? "/projects" : "/ngo/dashboard"} />
              <Breadcrumbs
                items={[
                  {
                    label:
                      activeRole === ROLES.DONOR
                        ? "Donor Hub"
                        : activeRole === ROLES.SUPER_ADMIN
                        ? "Super Admin"
                        : activeRole === ROLES.AUDITOR
                        ? "Auditor Portal"
                        : activeRole === ROLES.FINANCE_OFFICER
                        ? "Finance Workspace"
                        : activeRole === ROLES.PROJECT_MANAGER
                        ? "Project Workspace"
                        : "NGO Workspace",
                    path:
                      activeRole === ROLES.DONOR
                        ? "/donor/dashboard"
                        : activeRole === ROLES.SUPER_ADMIN
                        ? "/admin"
                        : activeRole === ROLES.AUDITOR
                        ? "/auditor"
                        : activeRole === ROLES.FINANCE_OFFICER
                        ? "/finance"
                        : activeRole === ROLES.PROJECT_MANAGER
                        ? "/projects"
                        : "/ngo/dashboard",
                  },
                  ...(activeTab !== "Dashboard" && activeTab !== "Donor Portal"
                    ? [{ label: activeTab, active: true }]
                    : [{ label: activeRole === ROLES.DONOR ? "My Contributions" : "Overview", active: true }]),
                ]}
              />
            </div>
            <button
              onClick={onBackToPublic}
              className="text-xs font-semibold text-[#1D5FD0] hover:text-[#1E3A8A] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Public Site</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeTab === "Super Admin" ? (
            activeRole === ROLES.SUPER_ADMIN ? (
              <SuperAdminDashboard />
            ) : (
              <ForbiddenView
                requiredRole="Platform Super Admin"
                currentRole={ROLE_LABELS[activeRole]}
                onBack={() => handleTabChange("Dashboard")}
              />
            )
          ) : activeTab === "Approvals" ? (
            hasAccess(PERMISSIONS.TREASURY_APPROVE) ? (
              <ApprovalCenter />
            ) : (
              <ForbiddenView
                requiredPermission="Multi-Sig Treasury Approval Signer"
                currentRole={ROLE_LABELS[activeRole]}
                onBack={() => handleTabChange("Dashboard")}
              />
            )
          ) : activeTab === "Finance" ? (
            hasAccess(PERMISSIONS.TREASURY_PROPOSE) || hasAccess(PERMISSIONS.TREASURY_APPROVE) ? (
              <FinanceWorkspace />
            ) : (
              <ForbiddenView
                requiredPermission="Treasury Controls & Balancing"
                currentRole={ROLE_LABELS[activeRole]}
                onBack={() => handleTabChange("Dashboard")}
              />
            )
          ) : activeTab === "Team" ? (
            hasAccess(PERMISSIONS.NGO_MANAGE_TEAM) ? (
              <NgoTeamManagement />
            ) : (
              <ForbiddenView
                requiredPermission="NGO Team Management"
                currentRole={ROLE_LABELS[activeRole]}
                onBack={() => handleTabChange("Dashboard")}
              />
            )
          ) : activeTab === "Auditor" ? (
            hasAccess(PERMISSIONS.AUDIT_REVIEW) ? (
              <AuditorPortal />
            ) : (
              <ForbiddenView
                requiredPermission="Independent Audit Verification"
                currentRole={ROLE_LABELS[activeRole]}
                onBack={() => handleTabChange("Dashboard")}
              />
            )
          ) : activeTab === "Risk Alerts" ? (
            hasAccess(PERMISSIONS.RISK_VIEW_ALERTS) ? (
              <RiskAlertsWorkspace />
            ) : (
              <ForbiddenView
                requiredPermission="Risk Alerts & Anomaly Monitor"
                currentRole={ROLE_LABELS[activeRole]}
                onBack={() => handleTabChange("Dashboard")}
              />
            )
          ) : activeTab === "Documents" ? (
            <DocumentComplianceWorkspace />
          ) : activeTab === "Analytics" ? (
            <AnalyticsDashboard />
          ) : activeTab === "Notifications" ? (
            <NotificationCenter onNavigateTab={handleTabChange} />
          ) : activeTab === "Donor Portal" ? (
            <DonorDashboard onOpenDonate={onOpenDonate} initialTab={currentDonorTab} />
          ) : activeTab === "Fund Allocation" ? (
            <FundAllocation onBackToDashboard={() => handleTabChange("Dashboard")} />
          ) : activeTab === "Projects" ? (
            activeRole === ROLES.PROJECT_MANAGER ? (
              <ProjectManagerWorkspace onNavigateToAllocation={() => handleTabChange("Fund Allocation")} />
            ) : (
              <NgoProjects onNavigateToAllocation={() => handleTabChange("Fund Allocation")} />
            )
          ) : activeTab === "Donations" ? (
            <NgoDonations donations={ngoDonations} onOpenDonate={onOpenDonate} />
          ) : activeTab === "Transactions" ? (
            <NgoTransactions />
          ) : activeTab === "Impact Reports" ? (
            <NgoImpactReports />
          ) : activeTab === "Donors" ? (
            <NgoDonors />
          ) : activeTab === "Settings" ? (
            <NgoSettings />
          ) : (
            activeRole === ROLES.DONOR ? (
              <DonorDashboard onOpenDonate={onOpenDonate} initialTab={currentDonorTab} />
            ) : activeRole === ROLES.SUPER_ADMIN ? (
              <SuperAdminDashboard />
            ) : activeRole === ROLES.AUDITOR ? (
              <AuditorPortal />
            ) : activeRole === ROLES.FINANCE_OFFICER ? (
              <FinanceWorkspace />
            ) : activeRole === ROLES.PROJECT_MANAGER ? (
              <ProjectManagerWorkspace onNavigateToAllocation={() => handleTabChange("Fund Allocation")} />
            ) : (
              <>
                {/* Header Greeting */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-2xl sm:text-[28px] font-outfit font-bold text-[#071B3B]">
                      Good morning, {currentUser?.name?.split(" ")[0] || "Director"}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs sm:text-[13px] text-[#66738A]">
                        Here’s how {activeOrganization?.name || "your organization"} is creating impact today.
                      </p>
                      <span className="text-[10px] bg-slate-100 text-[#64748B] px-2 py-0.5 rounded border border-slate-200">
                        Documented baseline: 1 POL ≈ ₹100, 1 USDC/USDT ≈ ₹85
                      </span>
                    </div>
                  </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleTabChange("Projects")}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#E2E7F0] rounded-xl text-xs font-semibold text-[#10213F] shadow-sm transition-all"
              >
                View Projects
              </button>
              <button
                onClick={() => handleTabChange("Fund Allocation")}
                className="px-4 py-2 bg-[#1D5FD0] hover:bg-[#1D5FD0]/90 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Allocate Funds</span>
              </button>
            </div>
          </div>

          {/* 5 Statistics Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Stat 1 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#66738A] text-[11px] font-medium">
                <span>Total Donations</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#1D5FD0]" />
              </div>
              <span className="text-lg sm:text-[21px] font-outfit font-extrabold text-[#071B3B]">
                {formattedTotalDonations}
              </span>
              <span className="text-[#17875D] text-[10px] font-bold">+12.6% this month</span>
            </div>

            {/* Stat 2 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#66738A] text-[11px] font-medium">
                <span>Available Funds</span>
                <PieChart className="w-3.5 h-3.5 text-[#17875D]" />
              </div>
              <span className="text-lg sm:text-[21px] font-outfit font-extrabold text-[#071B3B]">
                {formattedAvailableFunds}
              </span>
              <span className="text-[#17875D] text-[10px] font-bold">Ready to allocate</span>
            </div>

            {/* Stat 3 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#66738A] text-[11px] font-medium">
                <span>Funds Utilized</span>
                <BarChart3 className="w-3.5 h-3.5 text-[#1D5FD0]" />
              </div>
              <span className="text-lg sm:text-[21px] font-outfit font-extrabold text-[#071B3B]">
                ₹27,31,750
              </span>
              <span className="text-[#66738A] text-[10px] font-semibold">56.1% deployed</span>
            </div>

            {/* Stat 4 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#66738A] text-[11px] font-medium">
                <span>Active Projects</span>
                <FolderKanban className="w-3.5 h-3.5 text-[#1D5FD0]" />
              </div>
              <span className="text-lg sm:text-[21px] font-outfit font-extrabold text-[#071B3B]">
                8
              </span>
              <span className="text-[#66738A] text-[10px]">2 ending soon</span>
            </div>

            {/* Stat 5 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col gap-2 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-[#66738A] text-[11px] font-medium">
                <span>Total Donors</span>
                <Users className="w-3.5 h-3.5 text-[#1D5FD0]" />
              </div>
              <span className="text-lg sm:text-[21px] font-outfit font-extrabold text-[#071B3B]">
                {totalDonorsCount}
              </span>
              <span className="text-[#66738A] text-[10px]">+84 this month</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Donation Trends */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-outfit font-bold text-[#10213F]">
                  Donation trends
                </span>
                <span className="text-[10px] font-medium text-[#66738A] uppercase tracking-wider">
                  JAN — JUL 2026 • ₹ LAKH
                </span>
              </div>

              {/* Responsive SVG Spline Chart */}
              <div className="h-32 w-full pt-2 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 320 100">
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1D5FD0" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1D5FD0" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Subtle Gridlines */}
                  <line x1="0" y1="20" x2="320" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="50" x2="320" y2="50" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="80" x2="320" y2="80" stroke="#F1F5F9" strokeWidth="1" />
                  {/* Area fill */}
                  <path
                    d="M 10 75 Q 60 50 110 65 T 210 35 T 310 15 L 310 95 L 10 95 Z"
                    fill="url(#trendGradient)"
                  />
                  {/* Stroke line */}
                  <path
                    d="M 10 75 Q 60 50 110 65 T 210 35 T 310 15"
                    fill="none"
                    stroke="#1D5FD0"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Data Points */}
                  {[
                    [10, 75],
                    [60, 52],
                    [110, 65],
                    [160, 48],
                    [210, 35],
                    [260, 26],
                    [310, 15],
                  ].map(([cx, cy], i) => (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r="4"
                      className="fill-white stroke-[#1D5FD0] stroke-2 hover:r-6 transition-all cursor-pointer"
                    />
                  ))}
                </svg>
              </div>

              {/* Month Labels */}
              <div className="flex justify-between text-[9px] text-[#94A0B4] px-1 font-medium">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>

            {/* Chart 2: Funds Received vs Utilized (Grouped Bar Chart) */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-outfit font-bold text-[#10213F]">
                  Funds received vs utilized
                </span>
                <span className="text-[10px] font-medium text-[#66738A] uppercase tracking-wider">
                  LAST 6 MONTHS
                </span>
              </div>

              {/* 6 Pairs of Bars */}
              <div className="h-32 flex items-end justify-between gap-2 px-2 pt-2">
                {[
                  { r: 32, u: 21 },
                  { r: 58, u: 38 },
                  { r: 44, u: 29 },
                  { r: 76, u: 49 },
                  { r: 62, u: 40 },
                  { r: 91, u: 59 },
                ].map((pair, idx) => (
                  <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full">
                    <div
                      className="w-full max-w-[12px] bg-[#1D5FD0] rounded-t hover:opacity-85 transition-opacity"
                      style={{ height: `${pair.r}%` }}
                      title={`Received: ${pair.r}%`}
                    ></div>
                    <div
                      className="w-full max-w-[12px] bg-[#17875D] rounded-t hover:opacity-85 transition-opacity"
                      style={{ height: `${pair.u}%` }}
                      title={`Utilized: ${pair.u}%`}
                    ></div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[10px] font-medium pt-1">
                <div className="flex items-center gap-1.5 text-[#1D5FD0]">
                  <span className="w-2 h-2 rounded-full bg-[#1D5FD0]"></span>
                  <span>Received ₹48.7L</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#17875D]">
                  <span className="w-2 h-2 rounded-full bg-[#17875D]"></span>
                  <span>Utilized ₹27.3L</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Project-wise Funding */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-outfit font-bold text-[#10213F]">
                  Project-wise funding
                </span>
                <span className="text-[10px] font-medium text-[#66738A] uppercase tracking-wider">
                  ACTIVE ALLOCATIONS
                </span>
              </div>

              <div className="flex flex-col gap-3 py-1">
                {[
                  { name: "Clean Water Initiative", amount: "₹12.4L", percent: 78 },
                  { name: "Rural Learning Hubs", amount: "₹9.8L", percent: 62 },
                  { name: "Women’s Health Access", amount: "₹7.2L", percent: 45 },
                  { name: "Solar Village Clinics", amount: "₹5.1L", percent: 32 },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#10213F] font-medium text-[11px]">
                        {item.name}
                      </span>
                      <span className="text-[#10213F] font-bold text-[10px]">
                        {item.amount}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#E2E7F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1D5FD0] rounded-full"
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Panels Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Panel 1: Recent Donations */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-outfit font-bold text-[#10213F]">
                  Recent donations
                </span>
                <button
                  onClick={() => handleTabChange("Donations")}
                  className="text-[11px] font-semibold text-[#1D5FD0] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Ledger</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-col divide-y divide-slate-100">
                {ngoDonations.slice(0, 4).map((d) => (
                  <div key={d.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-[#10213F]">
                        {d.donor}
                      </span>
                      <span className="text-[9px] text-[#66738A]">{d.project}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-bold text-[#10213F]">
                          ₹{d.amountInr?.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9px] font-mono text-[#00C9A7]">
                          {d.amountCrypto}
                        </span>
                      </div>
                      <div className="px-2 py-0.5 bg-[#E8F7F0] text-[#17875D] rounded-full text-[10px] font-bold">
                        {d.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 2: Recent Blockchain Transactions */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col gap-3.5">
              <span className="text-sm font-outfit font-bold text-[#10213F]">
                Recent blockchain transactions
              </span>

              <div className="flex flex-col divide-y divide-slate-100">
                {[
                  { hash: "0xa72f...19bc", type: "Allocation", time: "2 min ago" },
                  { hash: "0x19de...f208", type: "Donation", time: "24 min ago" },
                  { hash: "0x4b71...80aa", type: "Utilization", time: "1 hr ago" },
                ].map((t, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://amoy.polygonscan.com/tx/${t.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1D5FD0] text-[10px] font-mono font-medium hover:underline flex items-center gap-1"
                      >
                        <span>{t.hash}</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <span className="text-[#10213F] text-[10px] font-medium">{t.type}</span>
                    <span className="text-[#66738A] text-[9px]">{t.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 3: Pending Actions */}
            <div className="bg-white p-5 rounded-2xl border border-[#E2E7F0] shadow-[0px_8px_24px_rgba(16,33,63,0.05)] flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-outfit font-bold text-[#10213F]">
                  Pending actions
                </span>
                <div className="px-2 py-0.5 bg-[#FFF4DB] text-[#B86B09] rounded-full text-[10px] font-bold">
                  {pendingActions.filter((a) => !a.completed).length}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {pendingActions.map((action) => (
                  <label
                    key={action.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={action.completed}
                      onChange={() => toggleAction(action.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[#1D5FD0] focus:ring-[#1D5FD0] cursor-pointer"
                    />
                    <span
                      className={`text-[10px] sm:text-[11px] font-medium ${
                        action.completed
                          ? "line-through text-slate-400"
                          : "text-[#10213F]"
                      }`}
                    >
                      {action.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
              </>
            )
          )}
        </main>
      </div>

      {/* Omnibar Global Command Palette */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigateTab={handleTabChange}
      />
    </div>
  );
};
