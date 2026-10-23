import React, { useState } from "react";
import {
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  FileText,
  Search,
  Filter,
  Check,
  X,
  FileSignature,
  Info,
} from "lucide-react";
import { shortenAddress } from "../../services/utils/tokenMath.js";
import { useAuth } from "../../context/AuthContext.jsx";

const INITIAL_AUDIT_ENGAGEMENTS = [
  {
    id: "eng-1",
    ngoName: "Asha Foundation",
    project: "Clean Water Initiative",
    cycle: "Q2/Q3 2026 Milestone Audit",
    evidenceCount: 14,
    status: "In Progress (Field Review)",
    disbursedTotalInr: 450000,
    findingsCount: 1,
    assignedAuditor: "Justice R. S. Nariman (Social Audit Board)",
    evidenceItems: [
      {
        id: "ev-1",
        title: "Potable Water Purity Laboratory Report (Vidarbha Basin)",
        cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        status: "Hash Verified & Passed",
        type: "Independent Lab Attestation",
        date: "15 May 2026",
      },
      {
        id: "ev-2",
        title: "Heavy Borewell Drilling Rig Invoices & Transport E-Way Bill",
        cid: "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R",
        status: "Hash Verified & Passed",
        type: "Vendor Supporting Voucher",
        date: "20 May 2026",
      },
      {
        id: "ev-3",
        title: "GPS-Tagged Solar Pump Installation Photos (4 Hamlets)",
        cid: "QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
        status: "Flagged: Missing Timestamp Metadata",
        type: "Photographic Evidence",
        date: "10 Jun 2026",
      },
    ],
    findings: [
      {
        id: "find-1",
        severity: "Medium",
        title: "EXIF Timestamp Omission on 2 Photographed Units",
        description: "Two solar inverter photo files lacked cryptographic geotag headers. NGO submitted supplementary contractor sign-off sheet.",
        ngoResponse: "Contractor re-submitted original camera raw files with verified GPS coordinates.",
        status: "Corrective Action Verified",
      },
    ],
  },
  {
    id: "eng-2",
    ngoName: "Green Canopy Initiative",
    project: "Amazon Drone Reforestation",
    cycle: "Annual Satellite Telemetry Audit",
    evidenceCount: 28,
    status: "Completed & Certified",
    disbursedTotalInr: 800000,
    findingsCount: 0,
    assignedAuditor: "Justice R. S. Nariman (Social Audit Board)",
    evidenceItems: [
      {
        id: "ev-201",
        title: "Sentinel-2 Multi-Spectral Tree Canopy Density Analysis",
        cid: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukUicRFiWrtMtU",
        status: "Hash Verified & Passed",
        type: "Satellite Telemetry",
        date: "12 Mar 2026",
      },
    ],
    findings: [],
  },
];

export const AuditorPortal = () => {
  const { currentUser } = useAuth();
  const [engagements, setEngagements] = useState(INITIAL_AUDIT_ENGAGEMENTS);
  const [selectedEngId, setSelectedEngId] = useState("eng-1");
  const [attestationToast, setAttestationToast] = useState(null);
  const [isSignOpen, setIsSignOpen] = useState(false);

  const activeEngagement = engagements.find((e) => e.id === selectedEngId) || engagements[0];

  const handleIssueAttestation = () => {
    setIsSignOpen(false);
    setEngagements((prev) =>
      prev.map((e) =>
        e.id === activeEngagement.id ? { ...e, status: "Completed & Certified" } : e
      )
    );
    setAttestationToast(`Audit attestation certificate cryptographically signed by ${currentUser.name}!`);
    setTimeout(() => setAttestationToast(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6 font-inter text-[#071B3B]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase tracking-wider">
              Independent Oversight
            </span>
            <span className="text-xs text-[#64748B]">Read-Only Evidence Verification Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B] mt-1">
            Auditor Investigation Portal
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedEngId}
            onChange={(e) => setSelectedEngId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#071B3B] shadow-sm outline-none cursor-pointer"
          >
            {engagements.map((eng) => (
              <option key={eng.id} value={eng.id}>
                {eng.ngoName} — {eng.cycle}
              </option>
            ))}
          </select>

          {activeEngagement.status !== "Completed & Certified" && (
            <button
              onClick={() => setIsSignOpen(true)}
              className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSignature className="w-4 h-4" />
              <span>Issue Audit Attestation</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {attestationToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{attestationToast}</span>
        </div>
      )}

      {/* Read-Only Safeguard Banner */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#1D5FD0] flex-shrink-0 mt-0.5" />
        <div className="flex flex-col">
          <span className="font-bold">Independent Read-Only Role Policy</span>
          <span className="text-[11px] text-slate-500">
            Auditor roles are cryptographically restricted from initiating disbursements, modifying ledger records, or updating multi-sig threshold registries.
          </span>
        </div>
      </div>

      {/* Engagement Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Audited NGO</span>
          <span className="text-xl font-bold font-outfit text-[#071B3B] truncate">
            {activeEngagement.ngoName}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">{activeEngagement.project}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Examined Disbursements</span>
          <span className="text-xl font-bold font-outfit text-[#071B3B]">
            ₹{activeEngagement.disbursedTotalInr.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">100% On-Chain Indexed</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">IPFS Evidence Submissions</span>
          <span className="text-xl font-bold font-outfit text-[#071B3B]">
            {activeEngagement.evidenceCount} Files
          </span>
          <span className="text-[10px] text-purple-700 font-medium">Cryptographic Hashes Verified</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Engagement Status</span>
          <span className="text-sm font-bold font-outfit text-amber-700 mt-1">
            {activeEngagement.status}
          </span>
          <span className="text-[10px] text-slate-400">Assigned: {currentUser.name}</span>
        </div>
      </div>

      {/* Evidence Checklist */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold font-outfit text-base text-[#071B3B]">
              Supporting Field Evidence &amp; IPFS Check
            </h3>
            <p className="text-xs text-[#64748B]">
              Inspect content hashes, surveyor signatures, and geotag integrity for this milestone batch.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {activeEngagement.evidenceItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1D5FD0] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-[#071B3B]">{item.title}</span>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                    <span>Type: <strong>{item.type}</strong></span>
                    <span>•</span>
                    <span>Date: {item.date}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px] text-slate-500">CID: {item.cid.slice(0, 10)}...</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status.includes("Passed")
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {item.status}
                </span>

                <a
                  href={`https://ipfs.io/ipfs/${item.cid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#071B3B] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Inspect IPFS</span>
                  <ExternalLink className="w-3 h-3 text-[#1D5FD0]" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Findings & NGO Responses */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col gap-4">
        <h3 className="font-bold font-outfit text-base text-[#071B3B]">
          Audit Discrepancies &amp; Corrective Action Follow-up
        </h3>

        {activeEngagement.findings.length === 0 ? (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Zero critical findings. All milestone expenditure vouchers reconcile with on-chain disbursements.</span>
          </div>
        ) : (
          activeEngagement.findings.map((f) => (
            <div key={f.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                    {f.severity}
                  </span>
                  <span className="font-bold text-[#071B3B]">{f.title}</span>
                </div>
                <span className="text-emerald-700 font-semibold">{f.status}</span>
              </div>
              <p className="text-[#64748B]">{f.description}</p>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[#071B3B]">
                <strong className="text-[11px] text-blue-700 block">NGO Management Response:</strong>
                <span className="text-[11px]">{f.ngoResponse}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SIGN ATTESTATION MODAL */}
      {isSignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="font-bold font-outfit text-base text-[#071B3B]">
                  Issue Cryptographic Audit Attestation
                </h3>
              </div>
              <button onClick={() => setIsSignOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <p className="text-[#475569]">
                You are issuing an independent audit attestation for <strong>{activeEngagement.ngoName}</strong> covering {activeEngagement.cycle}.
              </p>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex flex-col gap-1 text-[11px]">
                <span>• Certifies {activeEngagement.evidenceCount} verified IPFS deliverables.</span>
                <span>• Confirms ₹{activeEngagement.disbursedTotalInr.toLocaleString("en-IN")} milestone fund release.</span>
                <span>• Attestation digest will be pinned to IPFS and linked on PolygonScan.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSignOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueAttestation}
                className="flex-1 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                Sign with Auditor Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
