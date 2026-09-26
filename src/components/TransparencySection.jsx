import React, { useState } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  FileCode2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";

const SAMPLE_SEARCHES = [
  {
    label: "Clean Water Allocation",
    hash: "0x3f5c2901a812b4e72d93e114f6b21908a812",
    type: "Tx Hash",
  },
  {
    label: "Asha Foundation Vault",
    hash: "0x71F39082Bc45199201aDeF80B91244019aA2C81B",
    type: "Contract",
  },
  {
    label: "Borewell Milestone IPFS Proof",
    hash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    type: "IPFS CID",
  },
];

export const TransparencySection = () => {
  const [searchQuery, setSearchQuery] = useState(
    "0x3f5c2901a812b4e72d93e114f6b21908a812"
  );
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="transparency" className="py-20 bg-[#F8FAFC] border-t border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F8F5] border border-[#A7F3D0] text-[#00C9A7] text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Black Box • 100% Public Verifiability</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold text-[#071B3B] tracking-tight">
            On-Chain Transparency &amp; Receipt Verifier
          </h2>
          <p className="mt-3 text-[#64748B] text-sm sm:text-base leading-relaxed">
            Every donation, project allocation, and vendor milestone release is recorded on Polygon Amoy. 
            Enter any transaction hash, wallet address, or IPFS CID to inspect cryptographic proofs in real-time.
          </p>
        </div>

        {/* Search & Verification Console */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E2E8F0] shadow-[0px_10px_35px_rgba(10,22,40,0.06)] p-6 sm:p-8 flex flex-col gap-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Paste Tx Hash (0x...), Wallet Address, or IPFS CID..."
                className="w-full h-12 pl-11 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#00C9A7] focus:bg-white rounded-xl text-xs sm:text-sm font-mono text-[#071B3B] outline-none transition-all"
              />
              <Search className="w-4 h-4 text-[#94A0B4] absolute left-4 top-4" />
            </div>
            <button
              onClick={() => {}}
              className="h-12 px-6 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center justify-center gap-2 transition-all flex-shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Verify Cryptographic Proof</span>
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#64748B] font-medium">Try Sample Proofs:</span>
            {SAMPLE_SEARCHES.map((item) => (
              <button
                key={item.label}
                onClick={() => setSearchQuery(item.hash)}
                className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-slate-200 border border-[#E2E8F0] rounded-lg text-[#071B3B] font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Cryptographic Verification Pipeline Card */}
          <div className="p-5 sm:p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#071B3B] font-outfit">
                      Cryptographic Verification Passed
                    </span>
                    <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] rounded-full text-[10px] font-bold">
                      Polygon Amoy Testnet
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Block 12,489,321 • Finality: 2.1s • 100% Immutable
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(searchQuery)}
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#00C9A7] rounded-lg text-xs font-semibold text-[#071B3B] flex items-center gap-1.5 shadow-sm transition-all"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? "Copied" : "Copy Hash"}</span>
                </button>
                <a
                  href={`https://amoy.polygonscan.com/tx/${searchQuery}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>PolygonScan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Visual Blockchain Flowchart */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span>Initiator</span>
                  <Database className="w-3.5 h-3.5 text-[#00C9A7]" />
                </div>
                <span className="text-xs font-bold font-mono text-[#071B3B]">
                  0x7a3B...4f2E
                </span>
                <span className="text-[10px] text-[#15803D] font-semibold">
                  Asha Foundation
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span>Polygon Validator</span>
                  <Cpu className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="text-xs font-bold font-mono text-[#071B3B]">
                  Validator #42
                </span>
                <span className="text-[10px] text-[#64748B]">
                  Gas: 0.00042 POL
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span>Smart Vault</span>
                  <Lock className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <span className="text-xs font-bold font-mono text-[#071B3B]">
                  0x8F1C...2A4D
                </span>
                <span className="text-[10px] text-purple-600 font-semibold">
                  Escrow Locked
                </span>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-[#64748B]">
                  <span>IPFS Document</span>
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-xs font-bold font-mono text-[#071B3B] truncate">
                  QmXoyp...6uco
                </span>
                <span className="text-[10px] text-[#15803D] font-semibold">
                  Audit Verified
                </span>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex flex-col">
                <span className="text-[11px] text-[#64748B]">Action Type</span>
                <span className="text-xs sm:text-sm font-bold text-[#071B3B]">
                  Milestone Fund Allocation
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#64748B]">Released Amount</span>
                <span className="text-xs sm:text-sm font-bold text-[#00C9A7]">
                  1.25 ETH (₹4,50,000)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#64748B]">Recipient Project</span>
                <span className="text-xs sm:text-sm font-bold text-[#071B3B]">
                  Clean Water Initiative
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#64748B]">Contract Auditor</span>
                <span className="text-xs sm:text-sm font-bold text-[#15803D]">
                  OpenZeppelin Standard
                </span>
              </div>
            </div>

            {/* Toggle Raw JSON Calldata */}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs font-semibold text-[#1D5FD0] hover:underline flex items-center gap-1.5"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>{showRawJson ? "Hide Raw Calldata" : "View Raw Calldata & Solidity Event Logs"}</span>
              </button>

              {showRawJson && (
                <div className="mt-3 p-3.5 bg-[#071B3B] text-[#A9B7D0] rounded-xl font-mono text-[11px] overflow-x-auto">
                  <pre>
{`{
  "contract": "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
  "chainId": 80002,
  "method": "allocateMilestoneFunds(bytes32 milestoneId, uint256 amount)",
  "args": {
    "milestoneId": "0x77617465725f626f726577656c6c5f76696c6c61676500000000000000000000",
    "amountWei": "1250000000000000000",
    "ipfsInvoiceHash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    "multiSigSignatures": [
      "0x9a8f...21c4",
      "0x1b4e...77d9"
    ]
  },
  "blockNumber": 12489321,
  "status": "CONFIRMED_FINALIZED"
}`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
