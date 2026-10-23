import React from "react";
import { Clock, ShieldCheck, FileCheck, ArrowLeft, Home, ExternalLink } from "lucide-react";
import { useRouter } from "../../context/RouterContext.jsx";
import { BackButton } from "../common/BackButton.jsx";

export const PendingApprovalView = ({ application = null }) => {
  const { navigate } = useRouter();

  const appId = application?.id || "app-2026-pending";
  const orgName = application?.legalName || application?.legal_name || "Your Organization";
  const regNo = application?.registrationNumber || application?.registration_number || "REG-VERIF-PENDING";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-inter text-[#071B3B]">
      {/* Top Bar */}
      <header className="w-full bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-[#1E3A8A] font-extrabold font-outfit text-xl cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-md flex items-center justify-center text-white font-bold">
            T
          </div>
          <span>TrustDonate</span>
        </button>
        <BackButton fallback="/" label="Back to Home" />
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-lg bg-white border border-[#E2E8F0] shadow-sm rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-10 h-10 stroke-[2.2] animate-pulse" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 font-mono bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
              Verification In Progress • Pending Super Admin Review
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B]">
              Application Submitted
            </h1>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Thank you for registering <strong>{orgName}</strong> on TrustDonate. To maintain absolute transparency and trust for donors, all NGO onboarding submissions undergo independent compliance review.
            </p>
          </div>

          {/* Reference Card */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs font-mono text-[#334155] flex flex-col gap-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[#64748B]">Application ID:</span>
              <span className="font-bold text-[#0F172A]">{appId}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-[#64748B]">Registration No:</span>
              <span className="font-bold text-[#0F172A]">{regNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Verification Status:</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded">SUBMITTED</span>
            </div>
          </div>

          {/* Checklist Status */}
          <div className="w-full text-left flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#071B3B]">Verification Checklist:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#475569]">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Certificate of Incorporation</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>80G Tax Exemption Filing</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Bank Details & Cheque Proof</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>PAN / Identity Verification</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              onClick={() => navigate("/")}
              className="w-full sm:flex-1 py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Public Home</span>
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto py-3 px-5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#071B3B] font-semibold text-sm rounded-xl transition-all cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-[#94A3B8]">
        TrustDonate • Independent Verification Standards
      </footer>
    </div>
  );
};
