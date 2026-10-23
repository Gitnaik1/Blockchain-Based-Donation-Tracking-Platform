import React, { useEffect } from "react";
import { X, ExternalLink, ShieldCheck, Heart, FileText, CheckCircle2 } from "lucide-react";
import { shortenAddress } from "../services/utils/tokenMath";

export const NgoDetailsModal = ({ isOpen, onClose, ngo, onDonateClick }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ngo) return null;

  const progressPercent = Math.min(
    100,
    Math.round((ngo.raised / ngo.goal) * 100)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ngo-details-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors z-10 bg-white/80 backdrop-blur-sm cursor-pointer"
          aria-label="Close Details Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner image */}
        <div className="relative -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 h-48 sm:h-56 mb-6 overflow-hidden bg-slate-100">
          <img
            src={ngo.image}
            alt={ngo.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
          <div className="absolute bottom-4 left-6 sm:left-8">
            <span className="px-3 py-1 bg-[#DBEAFE] text-[#2563EB] text-xs font-inter font-semibold rounded-full shadow-sm">
              {ngo.category}
            </span>
            <h3 id="ngo-details-title" className="text-2xl sm:text-3xl font-outfit font-black text-white mt-1">
              {ngo.name}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6">
          {/* Mission Description */}
          <div className="flex flex-col gap-2">
            <h4 className="font-outfit font-bold text-base text-[#0F172A]">
              Mission &amp; Operational Scope
            </h4>
            <p className="text-sm text-[#64748B] font-inter leading-relaxed">
              {ngo.fullDescription}
            </p>
          </div>

          {/* Funding Progress Box */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm font-inter">
              <div>
                <span className="text-[#64748B]">Total Raised: </span>
                <span className="font-bold text-[#1E3A8A]">
                  ${ngo.raised.toLocaleString()}
                </span>
              </div>
              <span className="text-[#64748B]">
                Funding Target: ${ngo.goal.toLocaleString()}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1E3A8A] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#64748B] pt-1">
              <span>{progressPercent}% Funded</span>
              <span>{ngo.donorsCount.toLocaleString()} Donors Contributed</span>
            </div>
          </div>

          {/* Blockchain & On-Chain Verification Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-inter">
            <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex flex-col gap-1">
              <span className="text-[#64748B]">Smart Contract:</span>
              <a
                href={`https://amoy.polygonscan.com/address/${ngo.contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#2563EB] font-mono font-bold hover:underline flex items-center justify-between"
              >
                <span>{shortenAddress(ngo.contractAddress, 6)}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg flex flex-col gap-1">
              <span className="text-[#64748B]">IPFS Audit Report:</span>
              <a
                href={`https://ipfs.io/ipfs/${ngo.ipfsAuditReport}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#2563EB] font-mono font-bold hover:underline flex items-center justify-between"
              >
                <span>{ngo.ipfsAuditReport.substring(0, 14)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Recent Programmatic Utilization */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-bold text-[#0F172A] font-inter">
                Latest Audited Fund Milestone Deployment
              </span>
              <p className="text-[#64748B] font-inter">
                {ngo.recentUtilization}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-inter font-semibold text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onDonateClick(ngo);
              }}
              className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-sm font-inter font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Donate to {ngo.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
