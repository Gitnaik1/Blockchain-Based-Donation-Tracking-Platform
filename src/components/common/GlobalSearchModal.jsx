import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Building2,
  FolderKanban,
  ArrowLeftRight,
  ShieldCheck,
  FileText,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { donationService } from "../../services/donationService.js";

export const GlobalSearchModal = ({ isOpen, onClose, onNavigateTab }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keydown handler for Escape & Arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Search items database
  const ngos = donationService.getNgos();
  const txs = donationService.getTransactions();

  const searchableItems = [
    // Workspaces
    { type: "Workspace", title: "Approval Center (Multi-Sig)", subtitle: "Sign & execute pending treasury proposals", tab: "Approvals", icon: ShieldCheck },
    { type: "Workspace", title: "Finance Workspace & Balances", subtitle: "Reconcile POL/USDC/USDT liquid & escrow balances", tab: "Finance", icon: ArrowLeftRight },
    { type: "Workspace", title: "Team Management", subtitle: "Directory, invites, role assignments & signers", tab: "Team", icon: Building2 },
    { type: "Workspace", title: "Project Manager Workspace", subtitle: "Milestone proofs, IPFS uploads & metrics", tab: "Projects", icon: FolderKanban },
    { type: "Workspace", title: "Independent Auditor Portal", subtitle: "Audit reports, findings & attestation studio", tab: "Auditor", icon: FileText },
    { type: "Workspace", title: "Risk Alerts & Anomaly Monitor", subtitle: "Heuristic alerts, gas spikes & dust watcher", tab: "Risk Alerts", icon: AlertTriangle },
    { type: "Workspace", title: "Compliance Document Vault", subtitle: "80G certificates, 12A orders & FCRA licenses", tab: "Documents", icon: FileText },
    { type: "Workspace", title: "Advanced Analytics", subtitle: "Financial trend curves & escrow release velocity", tab: "Analytics", icon: ArrowLeftRight },

    // NGOs
    ...ngos.map((ngo) => ({
      type: "NGO",
      title: ngo.name,
      subtitle: `${ngo.category} • Verified by ${ngo.auditor || "Social Audit Alliance"}`,
      tab: "Donations",
      icon: Building2,
    })),

    // Projects
    { type: "Project", title: "Solar Well Infrastructure", subtitle: "Clean Water Initiative • Milestone 3 of 4 Active", tab: "Projects", icon: FolderKanban },
    { type: "Project", title: "Mobile Medical Dispensary", subtitle: "Rural Healthcare • 88% verified complete", tab: "Projects", icon: FolderKanban },
    { type: "Project", title: "Reforestation Green Shield", subtitle: "Western Ghats Bio-Corridor • 50,000 Saplings", tab: "Projects", icon: FolderKanban },

    // Transactions
    ...txs.slice(0, 5).map((tx) => ({
      type: "Transaction",
      title: `${tx.hash} (${tx.amount} ${tx.token})`,
      subtitle: `Donor: ${tx.donor} • ${tx.timestamp}`,
      tab: "Transactions",
      icon: ArrowLeftRight,
    })),
  ];

  const filteredItems = query.trim() === ""
    ? searchableItems.slice(0, 8)
    : searchableItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.type.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (item) => {
    if (onNavigateTab && item.tab) {
      onNavigateTab(item.tab);
    }
    onClose();
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 font-inter">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search workspaces, NGOs, projects, transaction hashes..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="w-full text-sm text-[#071B3B] placeholder-slate-400 bg-transparent border-none outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching results found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? "bg-[#F0F5FF] text-[#1D5FD0]" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected ? "bg-white text-[#1D5FD0] shadow-sm" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="text-xs font-semibold text-[#071B3B] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.type}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑</kbd>{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↵</kbd> to select
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
};
