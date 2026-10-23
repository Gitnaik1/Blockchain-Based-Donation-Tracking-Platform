import React, { useState } from "react";
import {
  BarChart3,
  FileCheck2,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Sparkles,
  Download,
  Users,
  ShieldCheck,
  X,
  UploadCloud,
  AlertTriangle,
  Info,
} from "lucide-react";
import { reportsService, FIXTURE_REPORTS } from "../../services/reportsService";
import { isValidCid } from "../../services/utils/tokenMath";

export const NgoImpactReports = () => {
  const [reports, setReports] = useState(reportsService.getReports());
  const [copiedCid, setCopiedCid] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cidError, setCidError] = useState(null);

  const [newReport, setNewReport] = useState({
    title: "",
    project: "Clean Water Initiative",
    ipfsCid: "",
    beneficiaries: "",
    auditor: "Internal Field Audit (Development Mode)",
    summary: "",
  });

  const handleCopy = (cid) => {
    navigator.clipboard?.writeText(cid);
    setCopiedCid(cid);
    setTimeout(() => setCopiedCid(null), 2000);
  };

  const handlePublishReport = (e) => {
    e.preventDefault();
    setCidError(null);

    const cleanCid = newReport.ipfsCid.trim();
    if (!isValidCid(cleanCid)) {
      setCidError("Invalid IPFS CID format. Must start with Qm (CIDv0) or bafy (CIDv1).");
      return;
    }

    const created = {
      id: `rep-${Date.now()}`,
      title: newReport.title,
      project: newReport.project,
      date: "Today, Just now",
      ipfsCid: cleanCid,
      beneficiaries: newReport.beneficiaries || "Community Members",
      auditor: newReport.auditor,
      isTestFixture: true,
      status: "Pinned to IPFS (Testnet)",
      summary: newReport.summary,
      evidenceCount: "Field Attestation Logs",
    };

    setReports([created, ...reports]);
    setIsCreateOpen(false);
    setNewReport({
      title: "",
      project: "Clean Water Initiative",
      ipfsCid: "",
      beneficiaries: "",
      auditor: "Internal Field Audit (Development Mode)",
      summary: "",
    });
  };

  return (
    <div className="flex flex-col gap-6 font-inter text-[#1E293B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
            IPFS Impact Reports &amp; Field Audits
          </h2>
          <p className="text-xs sm:text-[13px] text-[#66738A]">
            Cryptographically pinned milestone deliverables, lab certifications, and third-party evaluations.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Publish IPFS Report</span>
        </button>
      </div>

      {/* Development Notice */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col">
          <span className="font-bold">Audit Provenance Disclaimer</span>
          <span className="text-[11px] text-blue-800">
            Reports labeled as Development Fixtures contain simulated field evaluations for testing. Real production deployments require multi-sig auditor signatures pinned directly to the on-chain milestone escrow.
          </span>
        </div>
      </div>

      {/* Reports Feed */}
      <div className="flex flex-col gap-4">
        {reports.map((r) => (
          <div
            key={r.id}
            className="p-5 sm:p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0px_4px_20px_rgba(10,22,40,0.03)] flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#1D5FD0] bg-blue-50 px-2.5 py-0.5 rounded-full">
                    {r.project}
                  </span>
                  <span className="text-xs text-[#64748B]">Published {r.date}</span>
                  {r.isTestFixture && (
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                      Test Fixture
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold font-outfit text-[#071B3B]">
                  {r.title}
                </h3>
              </div>

              {/* IPFS CID Box */}
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl text-xs font-mono self-start sm:self-auto">
                <Layers className="w-3.5 h-3.5 text-[#00C9A7]" />
                <span className="text-[#64748B]">
                  IPFS: {r.ipfsCid.substring(0, 8)}...{r.ipfsCid.substring(r.ipfsCid.length - 6)}
                </span>
                <button
                  onClick={() => handleCopy(r.ipfsCid)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Copy IPFS CID"
                >
                  {copiedCid === r.ipfsCid ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              {r.summary}
            </p>

            {/* Proof Metadata Footer */}
            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap text-[11px] text-[#64748B]">
                <span>Beneficiaries: <strong className="text-[#071B3B]">{r.beneficiaries}</strong></span>
                <span>•</span>
                <span>Evaluator: <strong className="text-[#071B3B]">{r.auditor}</strong></span>
                <span>•</span>
                <span className="text-blue-600 font-medium">{r.evidenceCount}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://ipfs.io/ipfs/${r.ipfsCid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-slate-200 text-[#071B3B] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>View on IPFS</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Report Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8F8F5] text-[#00C9A7] flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-outfit text-[#071B3B]">
                  Pin Impact Report to IPFS
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cidError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{cidError}</span>
              </div>
            )}

            <form onSubmit={handlePublishReport} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phase 2 Borewell Construction Completion"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Target Project</label>
                <select
                  value={newReport.project}
                  onChange={(e) => setNewReport({ ...newReport, project: e.target.value })}
                  className="h-10 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                >
                  <option value="Clean Water Initiative">Clean Water Initiative</option>
                  <option value="Education for All">Education for All</option>
                  <option value="Healthcare Access">Healthcare Access</option>
                  <option value="Rural Electrification">Rural Electrification</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">IPFS Content Hash (CID)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                  value={newReport.ipfsCid}
                  onChange={(e) => setNewReport({ ...newReport, ipfsCid: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Beneficiaries Reached</label>
                <input
                  type="text"
                  placeholder="e.g. 1,200 Families"
                  value={newReport.beneficiaries}
                  onChange={(e) => setNewReport({ ...newReport, beneficiaries: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Summary of Field Findings</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe measurable output and verified deliverables..."
                  value={newReport.summary}
                  onChange={(e) => setNewReport({ ...newReport, summary: e.target.value })}
                  className="p-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] text-white font-semibold rounded-lg shadow-sm"
                >
                  Publish &amp; Pin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
