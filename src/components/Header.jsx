import React, { useState } from "react";
import { Wallet, Menu, X, Shield, ExternalLink, LogOut, CheckCircle2 } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";

export const Header = ({ onOpenDonate, onNavigateToNgoPortal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const { account, formattedAccount, isConnecting, isDemo, connectWallet, disconnectWallet } = useWeb3();

  const handleWalletClick = () => {
    if (account) {
      setWalletDropdownOpen(!walletDropdownOpen);
    } else {
      connectWallet();
    }
  };

  const navLinks = [
    { label: "Home", href: "#home", active: true },
    { label: "NGOs", href: "#ngos" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Transparency", href: "#transparency" },
    { label: "About", href: "#about" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2.5 group">
          <div className="w-9 h-8 bg-[#1E3A8A] rounded-md flex items-center justify-center shadow-sm group-hover:bg-[#2563EB] transition-colors">
            <div className="w-[18px] h-[18px] border-2 border-white rounded-[2px] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          <span className="text-[#1E3A8A] text-2xl font-outfit font-extrabold tracking-tight">
            TrustDonate
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`flex flex-col items-start gap-1 text-[15px] font-inter font-medium transition-colors ${
                link.active
                  ? "text-[#1E3A8A] font-semibold"
                  : "text-[#64748B] hover:text-[#1E3A8A]"
              }`}
            >
              <span>{link.label}</span>
              {link.active && (
                <div className="w-4 h-[2px] bg-[#1E3A8A] rounded-full"></div>
              )}
            </a>
          ))}
          <button
            onClick={onNavigateToNgoPortal}
            className="flex items-center gap-1.5 text-[14px] font-inter font-semibold text-[#1D5FD0] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>NGO Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Network Badge */}
          <div className="px-3 py-1.5 bg-[#D1FAE5] rounded-full flex items-center gap-1.5 border border-[#A7F3D0]">
            <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse"></div>
            <span className="text-[#0F172A] text-xs font-inter font-semibold tracking-wide">
              Polygon Amoy
            </span>
          </div>

          {/* Wallet Button / Dropdown */}
          <div className="relative">
            <button
              onClick={handleWalletClick}
              disabled={isConnecting}
              className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 active:scale-[0.98] text-white rounded-lg flex items-center gap-2 text-sm font-inter font-semibold shadow-sm transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>
                {isConnecting
                  ? "Connecting..."
                  : account
                  ? formattedAccount
                  : "Connect Wallet"}
              </span>
            </button>

            {/* Wallet details dropdown */}
            {walletDropdownOpen && account && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E2E8F0] p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {isDemo ? "Demo Testnet Wallet" : "MetaMask Connected"}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-[#DBEAFE] text-[#2563EB] rounded">
                    Amoy
                  </span>
                </div>

                <div className="py-2.5 text-xs text-[#64748B] break-all font-mono">
                  {account}
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href={`https://amoy.polygonscan.com/address/${account}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between text-xs text-[#2563EB] hover:underline"
                  >
                    <span>View on PolygonScan</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => {
                      disconnectWallet();
                      setWalletDropdownOpen(false);
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#0F172A] hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-base font-inter font-medium text-[#64748B] hover:text-[#1E3A8A] hover:bg-slate-50 rounded-md"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToNgoPortal();
              }}
              className="text-left px-3 py-2 text-base font-inter font-semibold text-[#1D5FD0] bg-blue-50 hover:bg-blue-100 rounded-md flex items-center justify-between"
            >
              <span>NGO Management Portal</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </nav>
          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748B]">Active Network:</span>
              <div className="px-3 py-1 bg-[#D1FAE5] rounded-full flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#10B981] rounded-full"></div>
                <span className="text-[#0F172A] text-xs font-semibold">Polygon Amoy</span>
              </div>
            </div>
            <button
              onClick={() => {
                handleWalletClick();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-[#1E3A8A] text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Wallet className="w-4 h-4" />
              <span>{account ? formattedAccount : "Connect Wallet"}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
