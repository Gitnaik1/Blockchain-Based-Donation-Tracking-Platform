import React, { useState } from "react";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";

const INITIAL_PROJECTS = [
  {
    id: "p1",
    name: "Clean Water Initiative",
    category: "Environment",
    status: "Active",
    targetInr: 1500000,
    raisedInr: 1240000,
    allocatedInr: 450000,
    wallet: "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
    description: "Deep-borewell drilling, solar filtration pumps, and community tap stands across 12 drought-hit villages.",
    milestones: [
      { name: "Hydrological Survey", status: "completed" },
      { name: "Rig & Pipe Procurement", status: "completed" },
      { name: "Drilling & Solar Pumps", status: "in-progress" },
      { name: "Water Quality Testing & Handover", status: "pending" },
    ],
  },
  {
    id: "p2",
    name: "Education for All & Digital Hubs",
    category: "Education",
    status: "Active",
    targetInr: 1200000,
    raisedInr: 980000,
    allocatedInr: 800000,
    wallet: "0x2D4aB9185aC9204910e527027167520e5436814E",
    description: "Setting up 6 solar-powered digital classrooms with satellite internet and 50 refurbished tablets.",
    milestones: [
      { name: "School Selection & Permissions", status: "completed" },
      { name: "Hardware & Solar Deployment", status: "completed" },
      { name: "Teacher Digital Training", status: "in-progress" },
      { name: "Annual Impact Assessment", status: "pending" },
    ],
  },
  {
    id: "p3",
    name: "Healthcare Access & Mobile Clinics",
    category: "Healthcare",
    status: "Active",
    targetInr: 1800000,
    raisedInr: 1420000,
    allocatedInr: 1200000,
    wallet: "0x91F5B612E0987c320dE51A186B1095d315682C89",
    description: "Equipping two mobile medical vans with diagnostic kits, maternal healthcare staff, and vaccine cold storage.",
    milestones: [
      { name: "Van Customization & Equipment", status: "completed" },
      { name: "Cold-Chain Supply Clearance", status: "in-progress" },
      { name: "Route Rollout & Village Camps", status: "pending" },
      { name: "Beneficiary Health Registries", status: "pending" },
    ],
  },
  {
    id: "p4",
    name: "Rural Micro-Solar Electrification",
    category: "Infrastructure",
    status: "Active",
    targetInr: 800000,
    raisedInr: 720000,
    allocatedInr: 500000,
    wallet: "0x51E2b43538446c761eA8196AfC88Fe0a91Da304B",
    description: "Providing rooftop solar panels and battery storage to 45 off-grid families in the valley belt.",
    milestones: [
      { name: "Household Energy Audits", status: "completed" },
      { name: "Inverter & Panel Shipping", status: "completed" },
      { name: "Roof Mounting & Wiring", status: "in-progress" },
      { name: "Grid Connection Verification", status: "pending" },
    ],
  },
  {
    id: "p5",
    name: "Flood Emergency Relief (Phase 1)",
    category: "Disaster Relief",
    status: "Completed",
    targetInr: 600000,
    raisedInr: 600000,
    allocatedInr: 600000,
    wallet: "0x7C04f42E64A5F43e49e29aD348E2801F6E2c659B",
    description: "Rapid deployment of 1,200 emergency ration packets, water purification tablets, and temporary shelters.",
    milestones: [
      { name: "Emergency Kit Assembly", status: "completed" },
      { name: "Flood Zone Logistics", status: "completed" },
      { name: "Ration Distribution", status: "completed" },
      { name: "Final IPFS Impact Audit", status: "completed" },
    ],
  },
];

export const NgoProjects = ({ onNavigateToAllocation }) => {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedWallet, setCopiedWallet] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New project form state
  const [newProject, setNewProject] = useState({
    name: "",
    category: "Education",
    targetInr: "",
    wallet: "0x" + Math.random().toString(16).substring(2, 42),
    description: "",
  });

  const handleCopy = (wallet) => {
    navigator.clipboard?.writeText(wallet);
    setCopiedWallet(wallet);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    const created = {
      id: `p-${Date.now()}`,
      name: newProject.name,
      category: newProject.category,
      status: "Active",
      targetInr: parseInt(newProject.targetInr) || 1000000,
      raisedInr: 0,
      allocatedInr: 0,
      wallet: newProject.wallet,
      description: newProject.description,
      milestones: [
        { name: "Project Kickoff & Baseline Audit", status: "completed" },
        { name: "Procurement & Materials", status: "in-progress" },
        { name: "Field Execution", status: "pending" },
        { name: "Final Impact Audit", status: "pending" },
      ],
    };

    setProjects([created, ...projects]);
    setIsCreateModalOpen(false);
    setNewProject({
      name: "",
      category: "Education",
      targetInr: "",
      wallet: "0x" + Math.random().toString(16).substring(2, 42),
      description: "",
    });
  };

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalBudget = projects.reduce((acc, p) => acc + p.targetInr, 0);
  const totalRaised = projects.reduce((acc, p) => acc + p.raisedInr, 0);

  return (
    <div className="flex flex-col gap-6 font-inter text-[#1E293B]">
      {/* Header & Metrics Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
            Project Portfolio
          </h2>
          <p className="text-xs sm:text-[13px] text-[#64748B]">
            Manage on-chain charitable initiatives, milestone execution, and escrow vaults.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Proposal</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Active Initiatives</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {projects.filter((p) => p.status === "Active").length}
          </span>
          <span className="text-[10px] text-[#15803D] font-semibold">100% on-schedule</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Completed Projects</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {projects.filter((p) => p.status === "Completed").length}
          </span>
          <span className="text-[10px] text-[#64748B]">IPFS Audited</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Total Portfolio Budget</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            ₹{(totalBudget / 100000).toFixed(1)} Lakh
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Approved by Trustees</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Total Raised On-Chain</span>
          <span className="text-2xl font-bold font-outfit text-[#00C9A7]">
            ₹{(totalRaised / 100000).toFixed(1)} Lakh
          </span>
          <span className="text-[10px] text-[#15803D] font-bold">
            {((totalRaised / totalBudget) * 100).toFixed(1)}% Funded
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["All", "Active", "Completed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === status
                  ? "bg-[#071B3B] text-white shadow-sm"
                  : "bg-slate-100 text-[#64748B] hover:text-[#071B3B] hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredProjects.map((project) => {
          const progressPercent = Math.min(
            100,
            Math.round((project.raisedInr / project.targetInr) * 100)
          );

          return (
            <div
              key={project.id}
              className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(10,22,40,0.03)] hover:border-[#00C9A7]/40 transition-all flex flex-col gap-4"
            >
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {project.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        project.status === "Active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-outfit text-[#071B3B]">
                    {project.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded-lg text-xs font-mono">
                  <span className="text-[#64748B]">
                    {project.wallet.substring(0, 6)}...{project.wallet.substring(project.wallet.length - 4)}
                  </span>
                  <button
                    onClick={() => handleCopy(project.wallet)}
                    className="text-slate-400 hover:text-slate-700"
                    title="Copy contract address"
                  >
                    {copiedWallet === project.wallet ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                {project.description}
              </p>

              {/* Progress Bar & Financials */}
              <div className="flex flex-col gap-1.5 p-3.5 bg-[#F8FAFC] rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Funding Progress:</span>
                  <span className="font-bold text-[#071B3B]">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00C9A7] to-[#1D5FD0] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span>
                    Raised: <strong className="text-[#071B3B]">₹{project.raisedInr.toLocaleString("en-IN")}</strong>
                  </span>
                  <span>
                    Target: <strong className="text-[#64748B]">₹{project.targetInr.toLocaleString("en-IN")}</strong>
                  </span>
                </div>
              </div>

              {/* Milestone Checklist */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Milestone Roadmap
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {project.milestones.map((m, idx) => {
                    const isCompleted = m.status === "completed";
                    const isInProgress = m.status === "in-progress";

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 p-2 bg-white border border-[#E2E8F0] rounded-lg"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        ) : isInProgress ? (
                          <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 animate-pulse" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0"></div>
                        )}
                        <span
                          className={`text-[11px] truncate ${
                            isCompleted
                              ? "text-slate-500 line-through"
                              : isInProgress
                              ? "text-[#071B3B] font-semibold"
                              : "text-slate-400"
                          }`}
                        >
                          {m.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#64748B]">
                  Allocated: <strong className="text-emerald-700">₹{project.allocatedInr.toLocaleString("en-IN")}</strong>
                </span>

                <button
                  onClick={onNavigateToAllocation}
                  className="px-3.5 py-1.5 bg-[#071B3B] hover:bg-[#123F8C] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Allocate Funds</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E8F8F5] text-[#00C9A7] flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold font-outfit text-[#071B3B]">
                  Deploy New On-Chain Project
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#64748B]">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Cold-Chain for Vaccines"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#64748B]">Category</label>
                  <select
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
                  >
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Environment">Environment</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#64748B]">Target Budget (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="1000000"
                    value={newProject.targetInr}
                    onChange={(e) => setNewProject({ ...newProject, targetInr: e.target.value })}
                    className="h-10 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#64748B]">Project Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Provide verifiable objectives and expected field impact..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7] resize-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#64748B]">Smart Vault Address (Polygon Amoy)</label>
                <input
                  type="text"
                  readOnly
                  value={newProject.wallet}
                  className="h-10 px-3 bg-slate-100 border border-[#E2E8F0] rounded-xl text-xs font-mono text-slate-600 outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-[#071B3B] rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-[#00C9A7] hover:bg-[#00B796] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#00C9A7]/20"
                >
                  Deploy Project On-Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
