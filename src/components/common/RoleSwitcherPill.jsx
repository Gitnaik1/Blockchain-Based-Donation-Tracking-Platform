import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Building2,
  ChevronDown,
  UserCheck,
  Check,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { DEMO_PROFILES, ROLE_LABELS } from "../../config/roles.js";

export const RoleSwitcherPill = () => {
  const {
    currentUser,
    activeRole,
    activeOrganization,
    organizations,
    switchProfile,
    switchOrganization,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="relative font-inter" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-all border border-slate-700 cursor-pointer"
        title="Switch enterprise roles or organizations"
      >
        <div className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></div>
        <span className="hidden sm:inline text-slate-400">Role:</span>
        <span className="font-bold text-white">{ROLE_LABELS[activeRole] || activeRole}</span>
        {activeOrganization && (
          <>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 max-w-[120px] truncate hidden md:inline">
              {activeOrganization.name}
            </span>
          </>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl p-4 z-50 text-xs flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-[#071B3B]">
              <Sparkles className="w-4 h-4 text-[#1D5FD0]" />
              <span className="font-bold font-outfit text-sm">Role-Based Identity Switcher</span>
            </div>
            <span className="text-[10px] bg-blue-50 text-[#1D5FD0] font-mono px-2 py-0.5 rounded">
              Phase 2
            </span>
          </div>

          {/* Organization Switcher if user has multiple orgs */}
          {organizations.length > 1 && (
            <div className="flex flex-col gap-1.5 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Switch Organization Context:
              </span>
              <div className="flex flex-col gap-1">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrganization(org.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                      activeOrganization?.id === org.id
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold"
                        : "hover:bg-slate-100 text-[#071B3B]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{org.name}</span>
                    </div>
                    {activeOrganization?.id === org.id && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Select Demo Role */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Switch Test Role (All 7 Roles):
            </span>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {DEMO_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    switchProfile(profile.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    currentUser?.id === profile.id
                      ? "bg-blue-50 border border-blue-200 text-[#1E3A8A] font-bold"
                      : "hover:bg-slate-50 text-[#071B3B]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold">{profile.name}</span>
                      <span className="text-[10px] text-[#64748B]">
                        {ROLE_LABELS[profile.role]}
                      </span>
                    </div>
                  </div>
                  {currentUser?.id === profile.id && (
                    <Check className="w-3.5 h-3.5 text-[#1D5FD0]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
