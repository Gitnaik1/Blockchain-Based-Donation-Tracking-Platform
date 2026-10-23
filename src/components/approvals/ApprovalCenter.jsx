import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  AlertTriangle,
  UserCheck,
  KeyRound,
  FileText,
  ArrowRight,
  Loader2,
  Check,
  X,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatInr, shortenAddress } from "../../services/utils/tokenMath.js";

const INITIAL_PROPOSALS = [
  {
    id: "prop-401",
    title: "Borewell Phase 2 Drilling Contractor Payout",
    project: "Clean Water Initiative",
    ngoName: "Asha Foundation",
    recipient: "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
    amountCrypto: "1.25 POL",
    amountInr: 125000,
    token: "POL",
    threshold: 3,
    signatures: [
      { name: "Dr. Alok Verma", role: "NGO Administrator", timestamp: "23 Oct, 10:15 AM", signed: true },
      { name: "Ramesh Kothari", role: "Finance Officer", timestamp: "23 Oct, 11:30 AM", signed: true },
      { name: "Dr. Sunita Menon", role: "Project Manager", signed: false },
    ],
    status: "Partially Signed (2/3)",
    proposalHash: "0x7d81a9c2b4e8f0a3b1d9e2f1a2e9a3c8d5e7f2b9a0c4e6d1b3f8a0c2e4f9f4b0",
    createdDate: "23 Oct 2026",
    invoiceDoc: "Vidarbha_Drilling_Contractor_V4.pdf",
  },
  {
    id: "prop-402",
    title: "Android Tablets & Solar Inverters Hardware Procurement",
    project: "Education for All",
    ngoName: "Asha Foundation",
    recipient: "0x2D4aB9185aC9204910e527027167520e5436814E",
    amountCrypto: "4,500.00 USDC",
    amountInr: 382500,
    token: "USDC",
    threshold: 3,
    signatures: [
      { name: "Dr. Alok Verma", role: "NGO Administrator", timestamp: "22 Oct, 09:00 AM", signed: true },
      { name: "Ramesh Kothari", role: "Finance Officer", timestamp: "22 Oct, 10:15 AM", signed: true },
      { name: "Dr. Sunita Menon", role: "Project Manager", timestamp: "22 Oct, 02:40 PM", signed: true },
    ],
    status: "Threshold Met (Ready for Execution)",
    proposalHash: "0x3f5c2901a812b4e72d93e114f6b21908a812b4e7a1b2c3d4e5f60718293a4b5c",
    createdDate: "22 Oct 2026",
    invoiceDoc: "Ruggedized_Classroom_Tablets_PO_89.pdf",
  },
  {
    id: "prop-403",
    title: "Mobile Clinic Diagnostic Equipment Batch",
    project: "Healthcare Access",
    ngoName: "Asha Foundation",
    recipient: "0x91F5B612E0987c320dE51A186B1095d315682C89",
    amountCrypto: "2,000.00 USDT",
    amountInr: 170000,
    token: "USDT",
    threshold: 3,
    signatures: [
      { name: "Dr. Alok Verma", role: "NGO Administrator", timestamp: "20 Oct, 02:00 PM", signed: true },
    ],
    status: "Partially Signed (1/3)",
    proposalHash: "0x1a3c8d5e7f2b9a0c4e6d1b3f8a0c2e4f9f4b0000000000000000000000000000",
    createdDate: "20 Oct 2026",
    invoiceDoc: "Cold_Storage_Vaccine_Units.pdf",
  },
];

export const ApprovalCenter = () => {
  const { currentUser } = useAuth();
  const [proposals, setProposals] = useState(INITIAL_PROPOSALS);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'pending_my_action' | 'ready'
  const [signingId, setSigningId] = useState(null);
  const [executingId, setExecutingId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const handleSignProposal = async (proposalId) => {
    setSigningId(proposalId);
    // Simulate cryptographic personal_sign latency
    await new Promise((r) => setTimeout(r, 1200));

    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === proposalId) {
          const updatedSigs = p.signatures.map((s) =>
            s.name === currentUser.name ? { ...s, signed: true, timestamp: "Just now" } : s
          );
          // If current user wasn't in list, add them as signed
          if (!updatedSigs.some((s) => s.name === currentUser.name)) {
            updatedSigs.push({
              name: currentUser.name,
              role: currentUser.role,
              signed: true,
              timestamp: "Just now",
            });
          }
          const signedCount = updatedSigs.filter((s) => s.signed).length;
          const newStatus =
            signedCount >= p.threshold
              ? "Threshold Met (Ready for Execution)"
              : `Partially Signed (${signedCount}/${p.threshold})`;

          return { ...p, signatures: updatedSigs, status: newStatus };
        }
        return p;
      })
    );

    setSigningId(null);
    setSuccessToast(`Signed proposal cryptographically with key ${currentUser.wallet?.slice(0, 8)}...`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleExecuteOnChain = async (proposalId) => {
    setExecutingId(proposalId);
    await new Promise((r) => setTimeout(r, 1600));

    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === proposalId) {
          return {
            ...p,
            status: "Executed On-Chain",
            executionTxHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
          };
        }
        return p;
      })
    );

    setExecutingId(null);
    setSuccessToast("Multi-sig escrow release successfully mined to Polygon Amoy Testnet!");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const filteredProposals = proposals.filter((p) => {
    if (activeFilter === "ready") return p.status.includes("Ready for Execution");
    if (activeFilter === "pending_my_action") {
      const mySig = p.signatures.find((s) => s.name === currentUser.name);
      return !mySig || !mySig.signed;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 font-inter text-[#071B3B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#1E3A8A] uppercase tracking-wider">
              Governance Hub
            </span>
            <span className="text-xs text-[#64748B]">Multi-Sig Escrow Authorization</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B] mt-1">
            Centralized Approval Center
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {["all", "pending_my_action", "ready"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === f
                  ? "bg-[#071B3B] text-white shadow-sm"
                  : "bg-slate-100 text-[#64748B] hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "All Proposals" : f === "pending_my_action" ? "Pending My Signature" : "Ready to Execute"}
            </button>
          ))}
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Proposals Stream */}
      <div className="flex flex-col gap-4">
        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#64748B] bg-white border border-[#E2E8F0] rounded-2xl">
            No proposals found matching the selected filter.
          </div>
        ) : (
          filteredProposals.map((prop) => {
            const signedCount = prop.signatures.filter((s) => s.signed).length;
            const isReady = signedCount >= prop.threshold;
            const hasCurrentUserSigned = prop.signatures.some(
              (s) => s.name === currentUser.name && s.signed
            );

            return (
              <div
                key={prop.id}
                className="p-5 sm:p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col gap-4 hover:border-blue-200 transition-colors"
              >
                {/* Top Title & Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-[#1D5FD0] bg-blue-50 px-2 py-0.5 rounded">
                        {prop.project}
                      </span>
                      <span className="text-xs text-[#64748B]">{prop.id} • Created {prop.createdDate}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold font-outfit text-[#071B3B]">
                      {prop.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        prop.status.includes("Executed")
                          ? "bg-emerald-100 text-emerald-800"
                          : isReady
                          ? "bg-purple-100 text-purple-800 animate-pulse"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>
                </div>

                {/* Amount & Destination Bar */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[#64748B] block">Requested Payout:</span>
                    <span className="font-bold text-sm text-[#1E3A8A]">
                      {prop.amountCrypto} ({formatInr(prop.amountInr)})
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Recipient Address:</span>
                    <span className="font-mono font-semibold text-[#071B3B]">
                      {shortenAddress(prop.recipient, 6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Cryptographic Hash Binding:</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate block" title={prop.proposalHash}>
                      {prop.proposalHash.slice(0, 16)}...
                    </span>
                  </div>
                </div>

                {/* Signers Progress */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#64748B]">Multi-Sig Threshold Verification:</span>
                    <span className="font-bold font-mono text-[#071B3B]">
                      {signedCount} / {prop.threshold} Signatures Collected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {prop.signatures.map((sig, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          sig.signed
                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-[11px]">{sig.name}</span>
                          <span className="text-[10px]">{sig.role}</span>
                        </div>
                        {sig.signed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
                  <span className="text-[11px] text-[#64748B]">
                    Supporting Evidence: <strong>{prop.invoiceDoc}</strong>
                  </span>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {prop.status.includes("Executed") ? (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${prop.executionTxHash || prop.proposalHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#071B3B] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span>View on PolygonScan</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#1D5FD0]" />
                      </a>
                    ) : isReady ? (
                      <button
                        onClick={() => handleExecuteOnChain(prop.id)}
                        disabled={executingId === prop.id}
                        className="px-5 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] text-white rounded-xl text-xs font-bold shadow-md shadow-[#00C9A7]/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                      >
                        {executingId === prop.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Broadcasting Multi-Sig Execution...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Execute On-Chain Transfer</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSignProposal(prop.id)}
                        disabled={signingId === prop.id || hasCurrentUserSigned}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          hasCurrentUserSigned
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                            : "bg-[#1E3A8A] hover:bg-blue-800 text-white cursor-pointer shadow-sm"
                        }`}
                      >
                        {signingId === prop.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Signing...</span>
                          </>
                        ) : hasCurrentUserSigned ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Signed by You</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Sign Proposal</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
