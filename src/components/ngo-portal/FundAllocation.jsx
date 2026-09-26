import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UploadCloud,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  X,
  Search,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";

const PROJECT_OPTIONS = [
  {
    id: "proj-1",
    name: "Clean Water Initiative",
    wallet: "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
    defaultAmountInr: "4,50,000",
    defaultAmountEth: "1.25",
    defaultPurpose: "Borewell installation in drought-hit village cluster.",
  },
  {
    id: "proj-2",
    name: "Education for All",
    wallet: "0x2D4aB9185aC9204910e527027167520e5436814E",
    defaultAmountInr: "8,00,000",
    defaultAmountEth: "2.22",
    defaultPurpose: "Digital lab equipment & high-speed satellite connectivity.",
  },
  {
    id: "proj-3",
    name: "Healthcare Access Program",
    wallet: "0x91F5B612E0987c320dE51A186B1095d315682C89",
    defaultAmountInr: "12,00,000",
    defaultAmountEth: "3.33",
    defaultPurpose: "Mobile health dispensary & vaccination cold-chain storage.",
  },
  {
    id: "proj-4",
    name: "Rural Electrification",
    wallet: "0x51E2b43538446c761eA8196AfC88Fe0a91Da304B",
    defaultAmountInr: "5,00,000",
    defaultAmountEth: "1.38",
    defaultPurpose: "Off-grid micro-solar panels for 45 rural households.",
  },
  {
    id: "proj-5",
    name: "Emergency Flood Relief",
    wallet: "0x7C04f42E64A5F43e49e29aD348E2801F6E2c659B",
    defaultAmountInr: "3,00,000",
    defaultAmountEth: "0.83",
    defaultPurpose: "Immediate emergency ration kits and potable drinking water.",
  },
];

export const FundAllocation = ({ onBackToDashboard }) => {
  const { account } = useWeb3();

  // Metrics State
  const [metrics, setMetrics] = useState({
    availableInr: "45,00,000",
    availableEth: "12.5 ETH",
    allocatedInr: "32,50,000",
    allocatedEth: "9.1 ETH",
    utilizedInr: "28,00,000",
    utilizedEth: "7.8 ETH",
    remainingInr: "17,00,000",
    remainingEth: "4.7 ETH",
  });

  // Form State
  const [selectedProject, setSelectedProject] = useState(PROJECT_OPTIONS[0]);
  const [amountInr, setAmountInr] = useState("4,50,000");
  const [amountEth, setAmountEth] = useState("1.25");
  const [purpose, setPurpose] = useState(
    "Borewell installation in drought-hit village cluster."
  );
  const [recipientWallet, setRecipientWallet] = useState(
    "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8"
  );
  const [invoiceFile, setInvoiceFile] = useState({
    name: "borewell_quotation_v2.pdf",
    size: "1.4 MB",
  });

  // Table Search and Filtering
  const [tableSearch, setTableSearch] = useState("");

  // Recent Allocations
  const [allocations, setAllocations] = useState([
    {
      id: "alloc-1",
      project: "Clean Water Initiative",
      date: "24 May 2025",
      amountInr: "₹4,50,000",
      amountEth: "1.25 ETH",
      status: "Completed",
      txHash: "0x3f5c2901a812b4e72d93e114f6b21908a812",
    },
    {
      id: "alloc-2",
      project: "Education for All",
      date: "22 May 2025",
      amountInr: "₹8,00,000",
      amountEth: "2.22 ETH",
      status: "Completed",
      txHash: "0x8a1b490d1f349c218731b992147ac324e924",
    },
    {
      id: "alloc-3",
      project: "Healthcare Access Program",
      date: "18 May 2025",
      amountInr: "₹12,00,000",
      amountEth: "3.33 ETH",
      status: "Pending",
      txHash: "0x4c2ea710295b9d3184762c9381665a0b7b11",
    },
    {
      id: "alloc-4",
      project: "Rural Electrification",
      date: "15 May 2025",
      amountInr: "₹5,00,000",
      amountEth: "1.38 ETH",
      status: "Completed",
      txHash: "0x1d9fe27a4b810935824c180927e1f4356a30",
    },
    {
      id: "alloc-5",
      project: "Emergency Flood Relief",
      date: "10 May 2025",
      amountInr: "₹3,00,000",
      amountEth: "0.83 ETH",
      status: "Failed",
      txHash: "0x9e3a76201bfa82946280b1548811d0922f81",
    },
  ]);

  // Confirmation banner state
  const [confirmedTx, setConfirmedTx] = useState({
    hash: "0x3f5c2901a812b4e72d93e114f6b21908a812",
    shortHash: "0x3f5c...a812",
  });
  const [copiedHash, setCopiedHash] = useState(false);

  // MetaMask modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  const adminAddress = account || "0x7a3B19D412bF249f7b189Ec24A00518774f2E";
  const displayAdmin = `${adminAddress.substring(0, 6)}...${adminAddress.substring(adminAddress.length - 4)}`;
  const displayRecipient = `${recipientWallet.substring(0, 6)}...${recipientWallet.substring(recipientWallet.length - 4)}`;

  const handleProjectSelect = (e) => {
    const proj = PROJECT_OPTIONS.find((p) => p.name === e.target.value);
    if (proj) {
      setSelectedProject(proj);
      setRecipientWallet(proj.wallet);
      setAmountInr(proj.defaultAmountInr);
      setAmountEth(proj.defaultAmountEth);
      setPurpose(proj.defaultPurpose);
    }
  };

  const handleAmountInrChange = (e) => {
    const val = e.target.value;
    setAmountInr(val);
    const numeric = parseFloat(val.replace(/,/g, ""));
    if (!isNaN(numeric)) {
      // 1 ETH ≈ ₹3,60,000
      setAmountEth((numeric / 360000).toFixed(2));
    }
  };

  const handleAmountEthChange = (e) => {
    const val = e.target.value;
    setAmountEth(val);
    const numeric = parseFloat(val);
    if (!isNaN(numeric)) {
      setAmountInr(Math.round(numeric * 360000).toLocaleString("en-IN"));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
    }
  };

  const handleCopyHash = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleConfirmTransaction = () => {
    setIsSigning(true);
    setTimeout(() => {
      setIsSigning(false);
      setIsModalOpen(false);

      // Generate random mock tx hash
      const randomHex = Math.random().toString(16).substring(2, 10);
      const newHash = `0x3f5c${randomHex}a812`;
      const shortHash = `0x3f5c...a812`;

      setConfirmedTx({
        hash: newHash,
        shortHash: shortHash,
      });

      // Add to allocations list
      const newAllocation = {
        id: `alloc-${Date.now()}`,
        project: selectedProject.name,
        date: "Today, Just now",
        amountInr: `₹${amountInr}`,
        amountEth: `${amountEth} ETH`,
        status: "Completed",
        txHash: newHash,
      };

      setAllocations((prev) => [newAllocation, ...prev]);

      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        availableInr: "40,50,000",
        availableEth: "11.25 ETH",
        allocatedInr: "37,00,000",
        allocatedEth: "10.35 ETH",
      }));
    }, 1500);
  };

  const filteredAllocations = allocations.filter((item) =>
    item.project.toLowerCase().includes(tableSearch.toLowerCase()) ||
    item.amountInr.toLowerCase().includes(tableSearch.toLowerCase()) ||
    item.status.toLowerCase().includes(tableSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 font-inter text-[#1E293B]">
      {/* Breadcrumb Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <button
            onClick={onBackToDashboard}
            className="hover:text-[#1E293B] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <span>&gt;</span>
          <span className="text-[#00C9A7] font-semibold">Fund Allocation</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-xl flex items-center gap-2 shadow-sm text-xs">
            <span className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></span>
            <span className="text-[#1E293B] font-medium font-mono">
              {displayAdmin}
            </span>
            <span className="px-1.5 py-0.5 bg-[#E8F8F5] text-[#00C9A7] text-[10px] font-bold rounded-md uppercase">
              Polygon Amoy
            </span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Available Funds */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(10,22,40,0.04)] flex flex-col gap-3 transition-all hover:border-[#00C9A7]/40">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#E8F8F5] text-[#00C9A7] flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-[#15803D] text-xs font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.2% this week</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#64748B] font-medium">Available Funds</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-outfit text-[#1E293B]">
                ₹{metrics.availableInr}
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                {metrics.availableEth}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Allocated Funds */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(10,22,40,0.04)] flex flex-col gap-3 transition-all hover:border-[#00C9A7]/40">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-[#15803D] text-xs font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+8.3% this week</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#64748B] font-medium">Allocated Funds</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-outfit text-[#1E293B]">
                ₹{metrics.allocatedInr}
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                {metrics.allocatedEth}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Utilized Funds */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(10,22,40,0.04)] flex flex-col gap-3 transition-all hover:border-[#00C9A7]/40">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-[#15803D] text-xs font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.1% this week</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#64748B] font-medium">Utilized Funds</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-outfit text-[#1E293B]">
                ₹{metrics.utilizedInr}
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                {metrics.utilizedEth}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Remaining Balance */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(10,22,40,0.04)] flex flex-col gap-3 transition-all hover:border-[#00C9A7]/40">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1 text-[#DC2626] text-xs font-semibold">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>-2.4% this week</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#64748B] font-medium">Remaining Balance</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-outfit text-[#1E293B]">
                ₹{metrics.remainingInr}
              </span>
              <span className="text-xs text-[#64748B] font-medium">
                {metrics.remainingEth}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two Column Area: Form (Left) & Recent Allocations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Allocate Funds to Project Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-2xl border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(10,22,40,0.04)] flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00C9A7]"></div>
              <h2 className="text-lg font-bold font-outfit text-[#1E293B]">
                Allocate Funds to Project
              </h2>
            </div>
            <span className="text-[11px] font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded text-[#64748B]">
              On-Chain Multi-Sig
            </span>
          </div>

          <form onSubmit={handleSubmitForm} className="flex flex-col gap-4">
            {/* Select Project */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#64748B]">
                Select Project
              </label>
              <div className="relative">
                <select
                  value={selectedProject.name}
                  onChange={handleProjectSelect}
                  className="w-full h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs sm:text-[13px] font-medium text-[#1E293B] appearance-none focus:outline-none focus:border-[#00C9A7] transition-all cursor-pointer"
                >
                  {PROJECT_OPTIONS.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Amount Inputs: ₹ and ETH side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Amount in ₹ */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#64748B]">
                  Amount (₹)
                </label>
                <div className="h-11 px-3.5 bg-white border border-[#E2E8F0] focus-within:border-[#00C9A7] rounded-xl flex items-center gap-2 transition-all">
                  <span className="text-sm font-semibold text-[#1E293B]">₹</span>
                  <input
                    type="text"
                    value={amountInr}
                    onChange={handleAmountInrChange}
                    placeholder="4,50,000"
                    required
                    className="w-full text-xs sm:text-[13px] font-medium text-[#1E293B] bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Amount in ETH */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#64748B]">
                  Amount (ETH Equivalency)
                </label>
                <div className="h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#00C9A7] rounded-xl flex items-center gap-2 transition-all">
                  <input
                    type="text"
                    value={amountEth}
                    onChange={handleAmountEthChange}
                    placeholder="1.25"
                    required
                    className="w-full text-xs sm:text-[13px] font-medium text-[#1E293B] bg-transparent outline-none"
                  />
                  <span className="text-xs font-bold text-[#00C9A7]">ETH</span>
                </div>
              </div>
            </div>

            {/* Allocation Purpose & Milestones */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#64748B]">
                Allocation Purpose & Milestones
              </label>
              <textarea
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="State the verifiable milestones for this fund release..."
                required
                className="w-full p-3 bg-white border border-[#E2E8F0] focus:border-[#00C9A7] rounded-xl text-xs sm:text-[13px] text-[#1E293B] outline-none transition-all resize-none"
              />
            </div>

            {/* Recipient Project Wallet */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#64748B]">
                  Recipient Project Wallet Address (Polygon Amoy Testnet)
                </label>
                <span className="text-[10px] text-[#00C9A7] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Contract
                </span>
              </div>
              <div className="h-11 px-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-[#1E293B] truncate">
                  {recipientWallet}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(recipientWallet)}
                  className="text-[#64748B] hover:text-[#00C9A7] p-1 transition-colors"
                  title="Copy Wallet Address"
                >
                  {copiedHash ? (
                    <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Upload Invoice / Quotation */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#64748B]">
                Upload Invoice / Quotation (Optional for IPFS Proof)
              </label>
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#00C9A7]">
                    <FileText className="w-4 h-4" />
                  </div>
                  {invoiceFile ? (
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[#1E293B]">
                        {invoiceFile.name}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {invoiceFile.size} • Ready for IPFS pin
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#64748B]">
                      PDF, PNG or JPG up to 10MB
                    </span>
                  )}
                </div>

                <label className="cursor-pointer px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#00C9A7] rounded-lg text-xs font-semibold text-[#1E293B] hover:text-[#00C9A7] shadow-sm transition-all flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{invoiceFile ? "Change" : "Upload"}</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="mt-2 w-full h-12 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Submit &amp; Sign with MetaMask</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Recent Project Allocations & Success Banner */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Transaction Confirmed Banner */}
          {confirmedTx && (
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-start gap-3 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15803D]">
                    Transaction Confirmed Successfully
                  </span>
                  <button
                    onClick={() => setConfirmedTx(null)}
                    className="text-[#64748B] hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#1E293B]">
                  <span className="text-[#64748B]">Tx Hash:</span>
                  <span className="font-mono font-bold text-[#1E293B]">
                    {confirmedTx.shortHash}
                  </span>
                  <button
                    onClick={() => handleCopyHash(confirmedTx.hash)}
                    className="p-0.5 text-slate-400 hover:text-slate-700"
                    title="Copy full hash"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="pt-1">
                  <a
                    href={`https://amoy.polygonscan.com/tx/${confirmedTx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] hover:underline"
                  >
                    <span>View on Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Recent Project Allocations Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-[0px_4px_20px_rgba(10,22,40,0.04)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-outfit text-[#1E293B]">
                  Recent Project Allocations
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Immutable ledger on Polygon Amoy
                </p>
              </div>

              {/* Mini Search */}
              <div className="relative w-36">
                <input
                  type="text"
                  placeholder="Filter..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full h-8 pl-6 pr-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[11px] text-[#1E293B] outline-none"
                />
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2.5" />
              </div>
            </div>

            {/* Allocations List */}
            <div className="flex flex-col divide-y divide-[#E2E8F0]">
              {filteredAllocations.map((item) => {
                const isCompleted = item.status === "Completed";
                const isPending = item.status === "Pending";
                const isFailed = item.status === "Failed";

                return (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-1 rounded-lg transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-xs font-semibold text-[#1E293B] truncate">
                        {item.project}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {item.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-[#1E293B]">
                          {item.amountInr}
                        </span>
                        <span className="text-[9px] text-[#64748B] font-mono">
                          {item.amountEth}
                        </span>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? "bg-[#DCFCE7] text-[#15803D]"
                            : isPending
                            ? "bg-[#FEF3C7] text-[#B45309]"
                            : "bg-[#FEE2E2] text-[#DC2626]"
                        }`}
                      >
                        {item.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Blockchain Transaction Modal (MetaMask) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[460px] bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                  🦊
                </div>
                <h3 className="text-base font-bold font-inter text-[#1E293B]">
                  Confirm Blockchain Transaction
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-[#FEE2E2] text-[#EF4444] rounded text-[10px] font-bold uppercase tracking-wider">
                MetaMask
              </span>
            </div>

            {/* Transaction Details Box */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">From Address (NGO Admin):</span>
                <span className="text-[#1E293B] font-bold font-mono">
                  {displayAdmin}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Recipient (Project Wallet):</span>
                <span className="text-[#1E293B] font-bold font-mono">
                  {displayRecipient}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B]">
                  Allocation Amount:
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-base font-bold text-[#00C9A7]">
                    {amountEth} ETH
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    ~ ₹{amountInr}
                  </span>
                </div>
              </div>
            </div>

            {/* Fee & Network Rows */}
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Estimated Gas Fee:</span>
                <span className="text-[#1E293B] font-semibold font-mono">
                  0.00042 ETH (₹151.20)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Network Name:</span>
                <span className="text-[#0EA5E9] font-bold">
                  Polygon Amoy Testnet
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSigning}
                className="flex-1 h-11 bg-[#F1F5F9] hover:bg-slate-200 text-[#1E293B] rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransaction}
                disabled={isSigning}
                className="flex-1 h-11 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing On-Chain...</span>
                  </>
                ) : (
                  <span>Confirm Sign &amp; Send</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
