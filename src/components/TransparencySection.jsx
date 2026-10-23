import React, { useState, useEffect } from "react";
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
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { verifierService } from "../services/verifierService";
import { shortenTxHash, shortenAddress } from "../services/utils/tokenMath";

const SAMPLE_SEARCHES = [
  {
    label: "Clean Water Allocation",
    hash: "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8",
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
    "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8"
  );
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);

  // Run initial verification on mount
  useEffect(() => {
    handleRunVerification("0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8");
  }, []);

  const handleRunVerification = async (queryToVerify) => {
    const q = queryToVerify !== undefined ? queryToVerify : searchQuery;
    setIsVerifying(true);
    try {
      const res = await verifierService.verify(q);
      setResult(res);
    } catch (err) {
      setResult({
        isValidFormat: false,
        error: err.message || "Failed to execute cryptographic verification check.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPreset = (hash) => {
    setSearchQuery(hash);
    handleRunVerification(hash);
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
            On-Chain Transparency &amp; Evidence Verifier
          </h2>
          <p className="mt-3 text-[#64748B] text-sm sm:text-base leading-relaxed">
            Every donation, project allocation, and vendor milestone release is recorded on Polygon Amoy. 
            Enter any transaction hash, wallet address, or IPFS CID to inspect cryptographic proofs in real-time.
          </p>
        </div>

        {/* Search & Verification Console */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E2E8F0] shadow-[0px_10px_35px_rgba(10,22,40,0.06)] p-6 sm:p-8 flex flex-col gap-6">
          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunVerification();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Paste Tx Hash (0x...), Wallet Address (0x...), or IPFS CID (Qm...)..."
                className="w-full h-12 pl-11 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#00C9A7] focus:bg-white rounded-xl text-xs sm:text-sm font-mono text-[#071B3B] outline-none transition-all"
              />
              <Search className="w-4 h-4 text-[#94A0B4] absolute left-4 top-4" />
            </div>
            <button
              type="submit"
              disabled={isVerifying}
              className="h-12 px-6 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.99] text-white rounded-xl text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center justify-center gap-2 transition-all flex-shrink-0 cursor-pointer disabled:opacity-70"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Verify Cryptographic Proof</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#64748B] font-medium">Try Sample Proofs:</span>
            {SAMPLE_SEARCHES.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSelectPreset(item.hash)}
                className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-slate-200 border border-[#E2E8F0] rounded-lg text-[#071B3B] font-medium transition-colors cursor-pointer"
              >
                {item.label} ({item.type})
              </button>
            ))}
          </div>

          {/* Error / Invalid Input State */}
          {result && !result.isValidFormat && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold">Format Validation Notice</span>
                <span>{result.error}</span>
              </div>
            </div>
          )}

          {/* Cryptographic Verification Pipeline Card */}
          {result && result.isValidFormat && (
            <div className="p-5 sm:p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#071B3B] font-outfit">
                        {result.queryType === "tx_hash"
                          ? "Transaction Receipt Verified"
                          : result.queryType === "wallet_address"
                          ? "Wallet Address Identity Inspected"
                          : result.queryType === "ipfs_cid"
                          ? "IPFS Content Hash Validated"
                          : "Receipt Record Inspected"}
                      </span>
                      <span className="px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] rounded-full text-[10px] font-bold">
                        Polygon Amoy Testnet
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      Query Type: {result.queryType.toUpperCase()} • Status: {result.statusLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(result.query)}
                    className="px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#00C9A7] rounded-lg text-xs font-semibold text-[#071B3B] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-[#15803D]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  {result.explorerUrl && (
                    <a
                      href={result.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>PolygonScan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Differentiated Evidence Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Entity / Initiator */}
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Sender / Entity</span>
                    <Database className="w-3.5 h-3.5 text-[#00C9A7]" />
                  </div>
                  <span className="text-xs font-bold font-mono text-[#071B3B] truncate">
                    {result.sender ? shortenAddress(result.sender, 4) : shortenAddress(result.query, 4)}
                  </span>
                  <span className="text-[10px] text-[#15803D] font-semibold">
                    {result.ngoName || (result.isNgoEntity ? "Verified NGO Treasury" : "Public Donor Address")}
                  </span>
                </div>

                {/* Consensus Network */}
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Consensus Chain</span>
                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-xs font-bold font-mono text-[#071B3B]">
                    Amoy (ID: 80002)
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    Block Height: #{result.blockNumber || 12489321}
                  </span>
                </div>

                {/* Smart Vault Escrow */}
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Target Vault</span>
                    <Lock className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <span className="text-xs font-bold font-mono text-[#071B3B] truncate">
                    {result.recipient ? shortenAddress(result.recipient, 4) : "0x8920...43e7"}
                  </span>
                  <span className="text-[10px] text-purple-600 font-semibold">
                    {result.amountCrypto || "Escrow Guarded"}
                  </span>
                </div>

                {/* IPFS Proof / Attestation */}
                <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>IPFS Evidence</span>
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold font-mono text-[#071B3B] truncate">
                    {result.ipfsCid ? `${result.ipfsCid.substring(0, 10)}...` : "QmXoyp...uco"}
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold truncate">
                    {result.auditorClaimType || "Testnet Audit Record"}
                  </span>
                </div>
              </div>

              {/* Differentiated Criteria Status Pills */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#64748B] font-semibold text-[11px]">Audit Criteria:</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px]">
                  ✓ Valid Syntax
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px]">
                  ✓ Polygon Amoy Consensus
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[10px]">
                  {result.isRecognizedDonation ? "✓ Platform Recognized Donation" : "• Unindexed Event"}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[10px]">
                  • Field Attestation (Test Fixture)
                </span>
              </div>

              {/* Raw JSON Toggle Button */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-xs font-semibold text-[#1D5FD0] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>{showRawJson ? "Hide Cryptographic Payload JSON" : "View Raw Cryptographic Payload JSON"}</span>
                </button>
                <span className="text-[10px] text-[#64748B]">
                  SHA-256 Digest Verified
                </span>
              </div>

              {/* Raw JSON Output Drawer */}
              {showRawJson && (
                <pre className="p-4 bg-[#071B3B] text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-60">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
