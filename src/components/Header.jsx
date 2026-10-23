import React, { useState, useRef, useEffect } from "react";
import {
  Wallet,
  Menu,
  X,
  Shield,
  ExternalLink,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  UserPlus,
  User,
  Building2,
  ChevronDown,
  LayoutDashboard,
  Settings,
  Heart,
  Receipt,
} from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { useAuth } from "../context/AuthContext.jsx";
import { useRouter } from "../context/RouterContext.jsx";
import { ROLES, ROLE_LABELS } from "../config/roles.js";
import { RoleSwitcherPill } from "./common/RoleSwitcherPill.jsx";
import { shortenAddress } from "../services/utils/tokenMath.js";

export const Header = ({ onOpenDonate, onNavigateToNgoPortal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    account,
    formattedAccount,
    isConnecting,
    isDemo,
    isWrongNetwork,
    connectWallet,
    disconnectWallet,
    switchOrAddAmoyNetwork,
  } = useWeb3();

  const {
    currentUser,
    isAuthenticated,
    activeRole,
    activeOrganization,
    organizations,
    switchOrganization,
    logout,
  } = useAuth();

  const { navigate, currentPath } = useRouter();

  const getPortalInfo = () => {
    switch (activeRole) {
      case ROLES.SUPER_ADMIN:
        return { label: "Super Admin Console", path: "/admin", tab: "Super Admin" };
      case ROLES.AUDITOR:
        return { label: "Auditor Portal", path: "/auditor", tab: "Auditor" };
      case ROLES.DONOR:
        return { label: "Donor Portal", path: "/donor/dashboard", tab: "Donor Portal" };
      case ROLES.FINANCE_OFFICER:
        return { label: "Finance Workspace", path: "/finance", tab: "Finance" };
      case ROLES.PROJECT_MANAGER:
        return { label: "Project Workspace", path: "/projects", tab: "Projects" };
      default:
        return { label: "NGO Dashboard", path: "/ngo/dashboard", tab: "Dashboard" };
    }
  };

  const portalInfo = getPortalInfo();

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleDashboardClick = () => {
    if (onNavigateToNgoPortal) {
      onNavigateToNgoPortal(portalInfo.tab);
    } else {
      navigate(portalInfo.path);
    }
  };

  const navLinks = [
    { label: "Home", href: "#home", path: "/" },
    { label: "NGOs", href: "#ngos", path: "/#ngos" },
    { label: "How It Works", href: "#how-it-works", path: "/#how-it-works" },
    { label: "Transparency", href: "#transparency", path: "/#transparency" },
    { label: "About", href: "#about", path: "/#about" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-9 h-8 bg-[#1E3A8A] rounded-md flex items-center justify-center shadow-sm group-hover:bg-[#2563EB] transition-colors">
            <div className="w-[18px] h-[18px] border-2 border-white rounded-[2px] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          <span className="text-[#1E3A8A] text-2xl font-outfit font-extrabold tracking-tight">
            TrustDonate
          </span>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = currentPath === "/" && link.path === "/";
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if (currentPath !== "/") {
                    e.preventDefault();
                    navigate(link.path);
                  }
                }}
                className={`flex flex-col items-start gap-1 text-[15px] font-inter font-medium transition-colors ${
                  isActive
                    ? "text-[#1E3A8A] font-semibold"
                    : "text-[#64748B] hover:text-[#1E3A8A]"
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <div className="w-4 h-[2px] bg-[#1E3A8A] rounded-full"></div>
                )}
              </a>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="hidden sm:flex items-center gap-3" ref={dropdownRef}>
          {/* Network Badge or Wrong Network Alert */}
          {isWrongNetwork ? (
            <button
              onClick={switchOrAddAmoyNetwork}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-full flex items-center gap-1.5 border border-amber-300 text-xs font-inter font-semibold transition-colors cursor-pointer"
              title="Click to switch wallet to Polygon Amoy Testnet"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              <span>Switch to Amoy</span>
            </button>
          ) : (
            <div className="px-2.5 py-1.5 bg-[#D1FAE5] rounded-full flex items-center gap-1.5 border border-[#A7F3D0]">
              <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
              <span className="text-[#0F172A] text-xs font-inter font-semibold tracking-wide">
                Polygon Amoy
              </span>
            </div>
          )}

          {/* Unauthenticated Visitor Entry Points */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Quick Explore NGOs */}
              <button
                onClick={() => {
                  if (currentPath !== "/") {
                    navigate("/#ngos");
                  } else {
                    document.getElementById("ngos")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="hidden lg:inline-flex px-3 py-2 text-xs font-inter font-medium text-[#475569] hover:text-[#071B3B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Explore NGOs
              </button>

              {/* Guest Donation CTA */}
              <button
                onClick={onOpenDonate}
                className="px-3.5 py-2 text-xs font-inter font-bold bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.98] text-white rounded-lg flex items-center gap-1.5 shadow-sm shadow-[#00C9A7]/20 transition-all cursor-pointer"
                title="Make an immediate on-chain donation without account creation"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>Donate Now</span>
              </button>

              <button
                onClick={() => navigate("/login")}
                className="px-3.5 py-2 text-xs font-inter font-semibold text-[#1E3A8A] hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>

              <button
                onClick={() => navigate("/signup")}
                className="px-3.5 py-2 text-xs font-inter font-semibold bg-[#1D5FD0] hover:bg-[#1D5FD0]/90 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>

              {/* Connect Wallet for Donor Contributions */}
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-3.5 py-2 bg-[#071B3B] hover:bg-[#071B3B]/90 text-white rounded-lg flex items-center gap-1.5 text-xs font-inter font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>
                  {isConnecting
                    ? "Connecting..."
                    : account
                    ? formattedAccount
                    : "Connect Wallet"}
                </span>
              </button>
            </div>
          ) : (
            /* Authenticated User Workspace & Account Dropdown */
            <div className="flex items-center gap-2.5">
              {/* Workspace / Dashboard Shortcut Button */}
              <button
                onClick={handleDashboardClick}
                className="flex items-center gap-1.5 text-xs font-inter font-semibold text-[#1D5FD0] bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors cursor-pointer border border-blue-100"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{portalInfo.label}</span>
              </button>

              {/* Account Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  aria-expanded={accountDropdownOpen}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-[#CBD5E1] rounded-xl flex items-center gap-2 text-xs font-inter font-medium text-[#071B3B] transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser?.name?.charAt(0) || "U"}
                  </div>
                  <div className="text-left hidden lg:block leading-tight">
                    <div className="font-bold text-[#071B3B] truncate max-w-[110px]">
                      {currentUser?.name || "Member"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {ROLE_LABELS[activeRole] || activeRole}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Account Details Dropdown */}
                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                    {/* User Info Header */}
                    <div className="pb-3 border-b border-slate-100 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#071B3B] truncate">
                          {currentUser?.name}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 text-[#1D5FD0] rounded">
                          {ROLE_LABELS[activeRole] || activeRole}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {currentUser?.email}
                      </div>
                      {account && (
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {shortenAddress(account)}
                        </div>
                      )}
                      {activeOrganization && (
                        <div className="mt-1 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-[11px] font-semibold">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{activeOrganization.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="py-2 flex flex-col gap-1 border-b border-slate-100">
                      <button
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          handleDashboardClick();
                        }}
                        className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded-lg text-left text-[#071B3B] transition-colors cursor-pointer font-medium"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                        <span>Go to {portalInfo.label}</span>
                      </button>

                      {/* Direct Donor Workspace Shortcuts */}
                      {activeRole === ROLES.DONOR && (
                        <>
                          <button
                            onClick={() => {
                              setAccountDropdownOpen(false);
                              navigate("/donor/donations");
                            }}
                            className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded-lg text-left text-[#071B3B] transition-colors cursor-pointer font-medium"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-500" />
                            <span>My Verified Donations</span>
                          </button>
                          <button
                            onClick={() => {
                              setAccountDropdownOpen(false);
                              navigate("/donor/profile");
                            }}
                            className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded-lg text-left text-[#071B3B] transition-colors cursor-pointer font-medium"
                          >
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>Donor Profile &amp; Wallet</span>
                          </button>
                          <button
                            onClick={() => {
                              setAccountDropdownOpen(false);
                              navigate("/donor/settings");
                            }}
                            className="flex items-center gap-2 w-full p-2 hover:bg-slate-50 rounded-lg text-left text-[#071B3B] transition-colors cursor-pointer font-medium"
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-500" />
                            <span>Tax &amp; Notification Settings</span>
                          </button>
                        </>
                      )}

                      {/* Organization switcher if user belongs to multiple NGOs */}
                      {organizations.length > 1 && (
                        <div className="pt-1 flex flex-col gap-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                            Switch Organization:
                          </span>
                          {organizations.map((org) => (
                            <button
                              key={org.id}
                              onClick={() => {
                                switchOrganization(org.id);
                                setAccountDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between w-full p-2 rounded-lg text-left text-[11px] transition-colors cursor-pointer ${
                                activeOrganization?.id === org.id
                                  ? "bg-blue-50 text-[#1D5FD0] font-bold"
                                  : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <span className="truncate">{org.name}</span>
                              {activeOrganization?.id === org.id && (
                                <CheckCircle2 className="w-3 h-3 text-[#1D5FD0]" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Role Switcher Pill for Demo / Testing */}
                    <div className="py-2 border-b border-slate-100">
                      <RoleSwitcherPill />
                    </div>

                    {/* Logout */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          disconnectWallet();
                          logout();
                          setAccountDropdownOpen(false);
                          navigate("/");
                        }}
                        className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer font-semibold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] p-4 flex flex-col gap-3 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (currentPath !== "/") {
                  e.preventDefault();
                  navigate(link.path);
                }
              }}
              className="text-sm font-inter text-[#0F172A] py-1.5"
            >
              {link.label}
            </a>
          ))}

          {/* Authenticated vs Unauthenticated Mobile Actions */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDonate();
                  }}
                  className="w-full py-2.5 bg-[#00C9A7] hover:bg-[#00B796] text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Donate Now (Guest)</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (currentPath !== "/") {
                      navigate("/#ngos");
                    } else {
                      document.getElementById("ngos")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-[#071B3B] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Explore NGOs</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full py-2.5 bg-white border border-slate-200 text-[#1E3A8A] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/signup");
                    }}
                    className="w-full py-2.5 bg-[#1D5FD0] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    connectWallet();
                  }}
                  className="w-full py-2.5 bg-[#071B3B] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{account ? formattedAccount : "Connect Wallet"}</span>
                </button>
              </>
            ) : (
              <>
                <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#071B3B]">{currentUser?.name}</div>
                    <div className="text-slate-500 text-[11px]">{ROLE_LABELS[activeRole] || activeRole}</div>
                  </div>
                  {activeOrganization && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      {activeOrganization.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleDashboardClick();
                  }}
                  className="w-full py-2.5 bg-[#1D5FD0] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to {portalInfo.label}</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate("/");
                  }}
                  className="w-full py-2.5 text-xs text-red-600 bg-red-50 rounded-lg font-semibold flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
