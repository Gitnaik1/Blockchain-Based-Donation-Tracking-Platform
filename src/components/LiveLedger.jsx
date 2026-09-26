import React, { useState } from "react";
import { Check, ExternalLink, Copy, CheckCheck, Radio } from "lucide-react";

export const LiveLedger = ({ transactions }) => {
  const [copiedHash, setCopiedHash] = useState(null);

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <section id="transparency" className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
              </span>
              <span className="text-[#10B981] text-sm font-outfit font-bold uppercase tracking-wider">
                Live Cryptographic Stream
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-[30px] font-outfit font-extrabold text-[#0F172A] tracking-tight">
              Recent Verified On-Chain Transactions
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-inter text-[#64748B]">
            <Radio className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
            <span>Syncing with Polygon Amoy Mempool</span>
          </div>
        </div>

        {/* Ledger Table Container */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5 shadow-sm">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-200 transition-colors group"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5">
                <div className="w-6 h-6 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[#0F172A] text-sm font-inter font-semibold">
                    {tx.recipient}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#94A3B8] text-xs font-inter font-mono">
                      Hash: {tx.shortHash}
                    </span>
                    <button
                      onClick={() => handleCopy(tx.hash)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy full transaction hash"
                    >
                      {copiedHash === tx.hash ? (
                        <CheckCheck className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-[#2563EB] transition-colors"
                      title="View on PolygonScan"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Details */}
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-9 sm:pl-0">
                <span className="text-[#1E3A8A] text-sm font-inter font-bold">
                  ${tx.amount} {tx.token}
                </span>

                <span className="text-[#64748B] text-xs sm:text-[13px] font-inter">
                  {tx.timeAgo}
                </span>

                <div className="px-2.5 py-1 bg-[#D1FAE5] rounded flex items-center justify-center">
                  <span className="text-[#10B981] text-[11px] font-inter font-bold tracking-wider">
                    {tx.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
