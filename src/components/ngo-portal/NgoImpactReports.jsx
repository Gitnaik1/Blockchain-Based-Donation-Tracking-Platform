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
} from "lucide-react";

const INITIAL_REPORTS = [
  {
    id: "rep-1",
    title: "Q1 2026: Clean Water Initiative Borewell Phase 1",
    project: "Clean Water Initiative",
    date: "15 May 2026",
    ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    beneficiaries: "4,200 Villagers",
    auditor: "Deloitte Social Impact Practice",
    status: "Verified On-Chain",
    summary: "Successfully completed deep borewell drilling and installed dual solar submersible pump units across 4 drought-hit villages in Vidarbha region.",
    evidenceCount: "8 Photos • 2 Water Purity Lab Certificates",
  },
  {
    id: "rep-2",
    title: "Digital Classrooms Hardware Deployment Audit",
    project: "Education for All",
    date: "02 May 2026",
    ipfsCid: "QmZtmD2qt8fQg7zEBrS9h7b2XU2U1B6k4R3d9v8x7P6q5W",
    beneficiaries: "680 Schoolchildren",
    auditor: "EduTrust Independent Observers",
    status: "Verified On-Chain",
    summary: "Procured and delivered 50 ruggedized Android educational tablets with localized syllabus and off-grid solar charging cabinets.",
    evidenceCount: "12 Serialized Asset Receipts • Teacher Attestations",
  },
  {
    id: "rep-3",
    title: "Maternal Health Mobile Camp Results (April 2026)",
    project: "Healthcare Access",
    date: "20 April 2026",
    ipfsCid: "QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    beneficiaries: "1,150 Women & Children",
    auditor: "State Public Health Mission",
    status: "Verified On-Chain",
    summary: "Completed 32 mobile dispensary visits, providing hemoglobin checkups, prenatal vitamins, and pediatric vaccine booster doses.",
    evidenceCount: "Batch Lot Numbers • Pharmacy Dispatch Slips",
  },
  {
    id: "rep-4",
    title: "Emergency Flood Relief Distribution Sign-Off",
    project: "Flood Emergency Relief",
    date: "12 March 2026",
    ipfsCid: "QmPZ9gcCEpqKTo6aq61g2nXGUhM49wbdukUicRFiWrtMtU",
    beneficiaries: "1,200 Families",
    auditor: "District Relief Commissioner",
    status: "Verified On-Chain",
    summary: "Dispatched 1,200 family ration hampers containing non-perishable food grains, emergency tarpaulins, and chlorine purification tablets.",
    evidenceCount: "Geo-tagged Delivery Logs • District Collector Receipt",
  },
];

export const NgoImpactReports = () => {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [copiedCid, setCopiedCid] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPinning, setIsPinning] = useState(false);

  const [newReport, setNewReport] = useState({
    title: "",
    project: "Clean Water Initiative",
    beneficiaries: "",
    auditor: "Internal NGO Audit & Verification",
    summary: "",
  });

  const handleCopy = (cid) => {
    navigator.clipboard?.writeText(cid);
    setCopiedCid(cid);
    setTimeout(() => setCopiedCid(null), 2000);
  };

  const handlePublishReport = (e) => {
    e.preventDefault();
    setIsPinning(true);

    setTimeout(() => {
      setIsPinning(false);
      const randomCid = "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const created = {
        id: `rep-${Date.now()}`,
        title: newReport.title,
        project: newReport.project,
        date: "Today, Just now",
        ipfsCid: randomCid,
        beneficiaries: newReport.beneficiaries || "500+ Community Members",
        auditor: newReport.auditor,
        status: "Verified On-Chain",
        summary: newReport.summary,
        evidenceCount: "Attached Photos & Invoices Pinned to IPFS",
      };

      setReports([created, ...reports]);
      setIsCreateOpen(false);
      setNewReport({
        title: "",
        project: "Clean Water Initiative",
        beneficiaries: "",
        auditor: "Internal NGO Audit & Verification",
        summary: "",
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 font-inter text-[#1E293B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
            Impact Reports &amp; IPFS Audits
          </h2>
          <p className="text-xs sm:text-[13px] text-[#66738A]">
            Immutable, decentralized documentation of real-world beneficiary impact.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Impact Report</span>
        </button>
      </div>

      {/* KPI Band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Published Reports</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {reports.length}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold">100% IPFS Pinned</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Documented Beneficiaries</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            7,230+
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Audited &amp; Geotagged</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Third-Party Auditors</span>
          <span className="text-2xl font-bold font-outfit text-[#00C9A7]">
            3 Certified
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Deloitte, EduTrust, State</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Donor Trust Rating</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            4.9 / 5.0
          </span>
          <span className="text-[10px] text-emerald-600 font-bold">Top 1% on Polygon</span>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex flex-col gap-4">
        {reports.map((r) => (
          <div
            key={r.id}
            className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#00C9A7]/40 transition-all flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold">
                    {r.project}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {r.date}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{r.status}</span>
                  </span>
                </div>
                <h3 className="text-base font-bold font-outfit text-[#071B3B]">
                  {r.title}
                </h3>
              </div>

              {/* IPFS CID Box */}
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl text-xs font-mono self-start sm:self-auto">
                <Layers className="w-3.5 h-3.5 text-[#00C9A7]" />
                <span className="text-[#64748B]">
                  IPFS: {r.ipfsCid.substring(0, 10)}...{r.ipfsCid.substring(r.ipfsCid.length - 6)}
                </span>
                <button
                  onClick={() => handleCopy(r.ipfsCid)}
                  className="text-slate-400 hover:text-slate-700"
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
                <span>Auditor: <strong className="text-[#071B3B]">{r.auditor}</strong></span>
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
                  <span>View IPFS Node</span>
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
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishReport} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#64748B]">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phase 2 Borewell Construction Completion"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#64748B]">Project</label>
                  <select
                    value={newReport.project}
                    onChange={(e) => setNewReport({ ...newReport, project: e.target.value })}
                    className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
                  >
                    <option value="Clean Water Initiative">Clean Water Initiative</option>
                    <option value="Education for All">Education for All</option>
                    <option value="Healthcare Access">Healthcare Access</option>
                    <option value="Rural Electrification">Rural Electrification</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#64748B]">Beneficiaries Impacted</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1,500 Villagers"
                    value={newReport.beneficiaries}
                    onChange={(e) => setNewReport({ ...newReport, beneficiaries: e.target.value })}
                    className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#64748B]">Executive Summary &amp; Outcomes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the tangible results achieved with the allocated funds..."
                  value={newReport.summary}
                  onChange={(e) => setNewReport({ ...newReport, summary: e.target.value })}
                  className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7] resize-none"
                />
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-[#00C9A7]" />
                  <span className="text-xs text-[#64748B]">Upload Geo-tagged Photos / Auditor PDF</span>
                </div>
                <span className="text-[10px] text-[#00C9A7] font-semibold bg-white border border-[#E2E8F0] px-2 py-1 rounded">
                  Ready to Pin
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isPinning}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-[#071B3B] rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPinning}
                  className="flex-1 h-10 bg-[#00C9A7] hover:bg-[#00B796] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#00C9A7]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPinning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Pinning to IPFS...</span>
                    </>
                  ) : (
                    <span>Pin &amp; Publish On-Chain</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
