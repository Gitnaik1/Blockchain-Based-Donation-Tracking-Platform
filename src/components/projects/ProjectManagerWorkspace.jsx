import React, { useState } from "react";
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  Layers,
  ArrowRight,
  Sparkles,
  Users,
  Building2,
  ExternalLink,
  Check,
  X,
  Target,
} from "lucide-react";
import { formatInr, shortenAddress } from "../../services/utils/tokenMath.js";

const INITIAL_PROJECT_DETAILS = [
  {
    id: "proj-1",
    name: "Clean Water Initiative",
    category: "Environment & Health",
    budgetInr: 1500000,
    allocatedInr: 1240000,
    spentInr: 450000,
    beneficiaries: "4,200 Villagers across 12 hamlets",
    verifiedBeneficiariesCount: 4200,
    status: "Active Implementation",
    lead: "Dr. Sunita Menon",
    milestones: [
      {
        id: "m-1",
        title: "Hydrological Ground Survey & Soil Core Sampling",
        targetDate: "15 Apr 2026",
        amountInr: 250000,
        status: "Completed & Verified",
        evidenceCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        evidenceDoc: "Groundwater_Survey_Vidarbha_Final.pdf",
      },
      {
        id: "m-2",
        title: "Deep-Borewell Drilling & Heavy Rig Procurement",
        targetDate: "20 May 2026",
        amountInr: 450000,
        status: "In Progress (Funding Disbursed)",
        evidenceCid: "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R",
        evidenceDoc: "Rig_Deployment_Log_Signed.pdf",
      },
      {
        id: "m-3",
        title: "Solar Submersible Pumps & Inverter Array",
        targetDate: "15 Jun 2026",
        amountInr: 540000,
        status: "Awaiting Funding Approval",
        evidenceCid: null,
        evidenceDoc: null,
      },
      {
        id: "m-4",
        title: "Potable Water Purity Laboratory Testing & Handover",
        targetDate: "30 Jul 2026",
        amountInr: 260000,
        status: "Planned",
        evidenceCid: null,
        evidenceDoc: null,
      },
    ],
  },
  {
    id: "proj-2",
    name: "Education for All Digital Hubs",
    category: "Education",
    budgetInr: 1200000,
    allocatedInr: 980000,
    spentInr: 800000,
    beneficiaries: "680 Remote Students",
    verifiedBeneficiariesCount: 680,
    status: "Active Implementation",
    lead: "Dr. Sunita Menon",
    milestones: [
      {
        id: "m-201",
        title: "School Selection & Solar Roof Inspection",
        targetDate: "01 May 2026",
        amountInr: 180000,
        status: "Completed & Verified",
        evidenceCid: "QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
        evidenceDoc: "School_Roof_Structural_Report.pdf",
      },
      {
        id: "m-202",
        title: "Procurement of 50 Ruggedized Tablets",
        targetDate: "22 May 2026",
        amountInr: 800000,
        status: "In Progress (Funding Disbursed)",
        evidenceCid: null,
        evidenceDoc: null,
      },
    ],
  },
];

export const ProjectManagerWorkspace = () => {
  const [projects, setProjects] = useState(INITIAL_PROJECT_DETAILS);
  const [selectedProjectId, setSelectedProjectId] = useState("proj-1");
  const [isSubmitRequestOpen, setIsSubmitRequestOpen] = useState(false);
  const [isUploadEvidenceOpen, setIsUploadEvidenceOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Form states
  const [requestForm, setRequestForm] = useState({
    title: "",
    amountInr: "",
    vendorWallet: "",
    justification: "",
  });

  const [evidenceForm, setEvidenceForm] = useState({
    docName: "Water_Purity_Lab_Certificate_Vidarbha.pdf",
    cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    beneficiaryCount: "4,200",
  });

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const handleCreateRequest = (e) => {
    e.preventDefault();
    const newMilestone = {
      id: `m-${Date.now()}`,
      title: requestForm.title,
      targetDate: "Next Month",
      amountInr: parseInt(requestForm.amountInr) || 100000,
      status: "Awaiting Funding Approval",
      evidenceCid: null,
      evidenceDoc: null,
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? { ...p, milestones: [...p.milestones, newMilestone] }
          : p
      )
    );

    setIsSubmitRequestOpen(false);
    setRequestForm({ title: "", amountInr: "", vendorWallet: "", justification: "" });
    setToastMessage("Milestone funding request proposed and routed to Approval Center!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUploadEvidence = (e) => {
    e.preventDefault();
    if (!selectedMilestone) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              milestones: p.milestones.map((m) =>
                m.id === selectedMilestone.id
                  ? {
                      ...m,
                      status: "Evidence Submitted (Pending Audit)",
                      evidenceCid: evidenceForm.cid,
                      evidenceDoc: evidenceForm.docName,
                    }
                  : m
              ),
            }
          : p
      )
    );

    setIsUploadEvidenceOpen(false);
    setSelectedMilestone(null);
    setToastMessage("Milestone deliverable pinned to IPFS and submitted to Independent Auditor!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex flex-col gap-6 font-inter text-[#071B3B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#1E3A8A] uppercase tracking-wider">
              Project Lifecycle Hub
            </span>
            <span className="text-xs text-[#64748B]">Milestones, Deliverables &amp; Beneficiaries</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B] mt-1">
            Project Manager Operations
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Dropdown Selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#071B3B] outline-none shadow-sm cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsSubmitRequestOpen(true)}
            className="px-4 py-2 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-[#00C9A7]/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Request Milestone Funding</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Project Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Approved Total Budget</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {formatInr(activeProject.budgetInr)}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Accounting Ceiling</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">On-Chain Escrowed</span>
          <span className="text-2xl font-bold font-outfit text-purple-700">
            {formatInr(activeProject.allocatedInr)}
          </span>
          <span className="text-[10px] text-purple-800 font-semibold">Polygon Amoy Locked</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Disbursed to Vendors</span>
          <span className="text-2xl font-bold font-outfit text-emerald-600">
            {formatInr(activeProject.spentInr)}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">Executed Transfers</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Verified Beneficiaries</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {activeProject.verifiedBeneficiariesCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Field Survey Grounded</span>
        </div>
      </div>

      {/* Milestones Implementation Timeline */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold font-outfit text-lg text-[#071B3B]">
              Milestones &amp; Evidence Deliverables
            </h3>
            <p className="text-xs text-[#64748B]">
              Every vendor payout requires proof submission and third-party verification before escrow release.
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-[#071B3B] rounded-lg text-xs font-semibold">
            {activeProject.milestones.length} Defined Milestones
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {activeProject.milestones.map((m, idx) => (
            <div
              key={m.id}
              className="p-4 sm:p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sm text-[#071B3B]">{m.title}</span>
                  <div className="flex items-center gap-3 text-xs text-[#64748B] flex-wrap">
                    <span>Target: <strong>{m.targetDate}</strong></span>
                    <span>•</span>
                    <span>Payout: <strong>{formatInr(m.amountInr)}</strong></span>
                    {m.evidenceDoc && (
                      <>
                        <span>•</span>
                        <span className="text-[#1D5FD0] flex items-center gap-1 font-mono text-[11px]">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{m.evidenceDoc}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    m.status.includes("Completed")
                      ? "bg-emerald-100 text-emerald-800"
                      : m.status.includes("In Progress")
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {m.status}
                </span>

                {!m.evidenceCid && (
                  <button
                    onClick={() => {
                      setSelectedMilestone(m);
                      setIsUploadEvidenceOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Proof</span>
                  </button>
                )}

                {m.evidenceCid && (
                  <a
                    href={`https://ipfs.io/ipfs/${m.evidenceCid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#071B3B] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>IPFS Evidence</span>
                    <ExternalLink className="w-3 h-3 text-[#1D5FD0]" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REQUEST FUNDING MODAL */}
      {isSubmitRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold font-outfit text-base text-[#071B3B]">
                Propose Milestone Funding Release
              </h3>
              <button onClick={() => setIsSubmitRequestOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Milestone Name &amp; Deliverable</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep well drilling equipment transport"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Required Amount (INR)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 450000"
                  value={requestForm.amountInr}
                  onChange={(e) => setRequestForm({ ...requestForm, amountInr: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Vendor / Field Receiver Wallet</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={requestForm.vendorWallet}
                  onChange={(e) => setRequestForm({ ...requestForm, vendorWallet: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Operational Justification</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail procurement justification and vendor quotation references..."
                  value={requestForm.justification}
                  onChange={(e) => setRequestForm({ ...requestForm, justification: e.target.value })}
                  className="p-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitRequestOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] text-white font-semibold rounded-lg shadow-sm"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD EVIDENCE MODAL */}
      {isUploadEvidenceOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold font-outfit text-base text-[#071B3B]">
                Upload Milestone Field Evidence
              </h3>
              <button onClick={() => setIsUploadEvidenceOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadEvidence} className="flex flex-col gap-3 text-xs">
              <p className="text-[#64748B]">
                Milestone: <strong>{selectedMilestone.title}</strong>
              </p>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Evidence File Name</label>
                <input
                  type="text"
                  required
                  value={evidenceForm.docName}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, docName: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">IPFS Content Hash (CID)</label>
                <input
                  type="text"
                  required
                  value={evidenceForm.cid}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, cid: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Verified Beneficiary Count</label>
                <input
                  type="text"
                  required
                  value={evidenceForm.beneficiaryCount}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, beneficiaryCount: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadEvidenceOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] text-white font-semibold rounded-lg shadow-sm"
                >
                  Pin &amp; Route to Auditor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
