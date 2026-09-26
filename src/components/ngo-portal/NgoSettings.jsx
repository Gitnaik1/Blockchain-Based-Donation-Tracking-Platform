import React, { useState } from "react";
import {
  Settings,
  Building2,
  KeyRound,
  ShieldCheck,
  Globe,
  Save,
  CheckCircle2,
  Copy,
  Check,
  Cpu,
} from "lucide-react";

export const NgoSettings = () => {
  const [activeSubTab, setActiveSubTab] = useState("profile");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Form states
  const [orgProfile, setOrgProfile] = useState({
    name: "Asha Foundation for Rural Empowerment",
    regNo: "TRUST-MH-PUNE-2018-0914",
    tax80g: "CIT-EXEMP/80G/2023-24/A-1102",
    fcraNo: "FCRA-083780192-2022",
    website: "https://ashafoundation.org",
    email: "contact@ashafoundation.org",
    description: "Dedicated to scalable rural infrastructure, sustainable groundwater replenishment, and equitable digital schooling.",
  });

  const signers = [
    {
      name: "Dr. Alok Verma",
      role: "Director of Operations (Active Account)",
      address: "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
      status: "Active Signer",
    },
    {
      name: "Justice R. S. Nariman",
      role: "Independent Trustee Auditor",
      address: "0x91F5B612E0987c320dE51A186B1095d315682C89",
      status: "Active Signer",
    },
    {
      name: "Dr. Sunita Menon",
      role: "Field Project Head",
      address: "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
      status: "Active Signer",
    },
    {
      name: "Ramesh Kothari",
      role: "Chief Financial Officer",
      address: "0x51E2b43538446c761eA8196AfC88Fe0a91Da304B",
      status: "Active Signer",
    },
    {
      name: "Prof. Anita Deshmukh",
      role: "Ethics Board Chairperson",
      address: "0x7C04f42E64A5F43e49e29aD348E2801F6E2c659B",
      status: "Active Signer",
    },
  ];

  const handleCopy = (key) => {
    navigator.clipboard?.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 font-inter text-[#1E293B]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
          Organization &amp; Multi-Sig Governance
        </h2>
        <p className="text-xs sm:text-[13px] text-[#66738A]">
          Configure legal compliance, multi-signature threshold requirements, and Polygon Amoy RPC nodes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab("profile")}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeSubTab === "profile"
              ? "bg-[#071B3B] text-white"
              : "text-[#64748B] hover:text-[#071B3B]"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Organization Profile</span>
        </button>

        <button
          onClick={() => setActiveSubTab("multisig")}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeSubTab === "multisig"
              ? "bg-[#071B3B] text-white"
              : "text-[#64748B] hover:text-[#071B3B]"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Multi-Sig Signers (3-of-5)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("network")}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
            activeSubTab === "network"
              ? "bg-[#071B3B] text-white"
              : "text-[#64748B] hover:text-[#071B3B]"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Network &amp; RPC Parameters</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeSubTab === "profile" && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-4 max-w-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold font-outfit text-[#071B3B]">
                Legal Entity &amp; 80G Tax Exemption
              </h3>
              <p className="text-xs text-[#64748B]">
                Verified on Ministry of Corporate Affairs (MCA) &amp; Income Tax Portal.
              </p>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified NGO</span>
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#64748B]">Organization Name</label>
            <input
              type="text"
              value={orgProfile.name}
              onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
              className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#64748B]">80G Tax Exemption ID</label>
              <input
                type="text"
                value={orgProfile.tax80g}
                onChange={(e) => setOrgProfile({ ...orgProfile, tax80g: e.target.value })}
                className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono text-[#071B3B] outline-none focus:border-[#00C9A7]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#64748B]">FCRA Registration</label>
              <input
                type="text"
                value={orgProfile.fcraNo}
                onChange={(e) => setOrgProfile({ ...orgProfile, fcraNo: e.target.value })}
                className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono text-[#071B3B] outline-none focus:border-[#00C9A7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#64748B]">Official Website</label>
              <input
                type="text"
                value={orgProfile.website}
                onChange={(e) => setOrgProfile({ ...orgProfile, website: e.target.value })}
                className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#64748B]">Contact Email</label>
              <input
                type="email"
                value={orgProfile.email}
                onChange={(e) => setOrgProfile({ ...orgProfile, email: e.target.value })}
                className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#64748B]">Mission Statement</label>
            <textarea
              rows={3}
              value={orgProfile.description}
              onChange={(e) => setOrgProfile({ ...orgProfile, description: e.target.value })}
              className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7] resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile Settings Saved Successfully!</span>
              </span>
            ) : (
              <span></span>
            )}

            <button
              type="submit"
              className="px-5 py-2 bg-[#00C9A7] hover:bg-[#00B796] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-[#00C9A7]/20 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Multi-Sig Tab */}
      {activeSubTab === "multisig" && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-5 max-w-3xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold font-outfit text-[#071B3B]">
                Multi-Signature Threshold Policy
              </h3>
              <p className="text-xs text-[#64748B]">
                Releasing treasury funds requires approval from at least 3 of 5 registered signers.
              </p>
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold font-mono">
              3-of-5 REQUIRED
            </span>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {signers.map((s, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#071B3B]">{s.name}</span>
                  <span className="text-[11px] text-[#64748B]">{s.role}</span>
                  <span className="font-mono text-[10px] text-slate-500 pt-0.5">{s.address}</span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(s.address)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Copy wallet"
                  >
                    {copiedKey === s.address ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Tab */}
      {activeSubTab === "network" && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-4 max-w-3xl">
          <div className="pb-3 border-b border-[#E2E8F0]">
            <h3 className="text-base font-bold font-outfit text-[#071B3B]">
              Polygon Amoy Blockchain Parameters
            </h3>
            <p className="text-xs text-[#64748B]">
              Live smart contract connection properties and RPC endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex flex-col gap-1">
              <span className="text-[#64748B]">Network Name</span>
              <span className="font-bold text-[#071B3B]">Polygon Amoy Testnet</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex flex-col gap-1">
              <span className="text-[#64748B]">Chain ID</span>
              <span className="font-bold font-mono text-[#071B3B]">80002 (Hex: 0x13882)</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex flex-col gap-1 sm:col-span-2">
              <span className="text-[#64748B]">RPC Gateway</span>
              <span className="font-mono text-[#071B3B]">https://rpc-amoy.polygon.technology/</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-slate-100 flex flex-col gap-1 sm:col-span-2">
              <span className="text-[#64748B]">Asha Foundation Treasury Escrow Vault</span>
              <span className="font-mono text-[#00C9A7] font-bold truncate">
                0x71F39082Bc45199201aDeF80B91244019aA2C81B
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
