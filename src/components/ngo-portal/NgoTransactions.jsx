import React, { useState } from "react";
import {
  ArrowLeftRight,
  Search,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  Layers,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

const INITIAL_TRANSACTIONS = [
  {
    id: "tx-alloc-1",
    type: "Fund Allocation",
    direction: "outbound",
    hash: "0x3f5c2901a812b4e72d93e114f6b21908a812",
    from: "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
    to: "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
    amountCrypto: "1.25 ETH",
    amountInr: "₹4,50,000",
    blockNumber: 12489321,
    gasUsed: "0.00042 POL (₹0.04)",
    timestamp: "Today, 11:20 AM",
    status: "Finalized",
    memo: "Borewell drilling milestone release",
  },
  {
    id: "tx-don-1",
    type: "Donation Received",
    direction: "inbound",
    hash: "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8",
    from: "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
    to: "0x71F39082Bc45199201aDeF80B91244019aA2C81B",
    amountCrypto: "250 POL",
    amountInr: "₹25,000",
    blockNumber: 12489280,
    gasUsed: "0.00021 POL (₹0.02)",
    timestamp: "Today, 10:24 AM",
    status: "Finalized",
    memo: "Clean Water Initiative public donation",
  },
  {
    id: "tx-alloc-2",
    type: "Fund Allocation",
    direction: "outbound",
    hash: "0x8a1b490d1f349c218731b992147ac324e924",
    from: "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
    to: "0x2D4aB9185aC9204910e527027167520e5436814E",
    amountCrypto: "2.22 ETH",
    amountInr: "₹8,00,000",
    blockNumber: 12488914,
    gasUsed: "0.00045 POL (₹0.04)",
    timestamp: "22 May 2026",
    status: "Finalized",
    memo: "Digital hub solar inverters procurement",
  },
  {
    id: "tx-don-2",
    type: "Donation Received",
    direction: "inbound",
    hash: "0x3f5c2901a812b4e72d93e114f6b21908a812b4e7",
    from: "0x8B2D198AcfE92B1047192801F524Ab902C511F90",
    to: "0x71F39082Bc45199201aDeF80B91244019aA2C81B",
    amountCrypto: "1,500 USDC",
    amountInr: "₹1,50,000",
    blockNumber: 12487401,
    gasUsed: "0.00019 POL (₹0.02)",
    timestamp: "21 May 2026",
    status: "Finalized",
    memo: "Education for All direct grant",
  },
  {
    id: "tx-milestone-1",
    type: "Vendor Payment",
    direction: "outbound",
    hash: "0x1d9fe27a4b810935824c180927e1f4356a301d9f",
    from: "0x8F1C9902bC297F2B773b06bB22C4B1842A4D11D8",
    to: "0x44B18029c1E91aA8271B20914cD120409A8F11A4",
    amountCrypto: "0.85 ETH",
    amountInr: "₹3,06,000",
    blockNumber: 12486120,
    gasUsed: "0.00038 POL (₹0.03)",
    timestamp: "19 May 2026",
    status: "Finalized",
    memo: "Solar Pumps India Ltd. Invoice #SP-992",
  },
];

export const NgoTransactions = () => {
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);

  const handleCopy = (hash) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredTxs = transactions.filter((tx) => {
    const matchesType = filterType === "All" || tx.type === filterType;
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.memo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 font-inter text-[#1E293B]">
      {/* Header & Network Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
            On-Chain Audit Trail
          </h2>
          <p className="text-xs sm:text-[13px] text-[#66738A]">
            Verifiable transaction feed on Polygon Amoy Testnet (Chain ID 80002).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#E8F8F5] border border-[#A7F3D0] px-3 py-1.5 rounded-xl text-xs">
          <div className="w-2 h-2 rounded-full bg-[#00C9A7] animate-pulse"></div>
          <span className="font-bold text-[#00C9A7]">Live RPC Connected</span>
          <span className="text-[#64748B] font-mono text-[11px]">• Block #12,489,321</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["All", "Donation Received", "Fund Allocation", "Vendor Payment"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterType === t
                  ? "bg-[#071B3B] text-white shadow-sm"
                  : "bg-slate-100 text-[#64748B] hover:text-[#071B3B] hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search hash, address, memo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Transactions List */}
      <div className="flex flex-col gap-3">
        {filteredTxs.map((tx) => {
          const isInbound = tx.direction === "inbound";

          return (
            <div
              key={tx.id}
              className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#00C9A7]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isInbound
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {isInbound ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#071B3B]">
                      {tx.type}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                      Block #{tx.blockNumber}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {tx.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B]">
                    {tx.memo}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B] pt-0.5">
                    <span>From: {tx.from.substring(0, 6)}...{tx.from.substring(tx.from.length - 4)}</span>
                    <span>➔</span>
                    <span>To: {tx.to.substring(0, 6)}...{tx.to.substring(tx.to.length - 4)}</span>
                  </div>
                </div>
              </div>

              {/* Right Values & Link */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex-shrink-0">
                <div className="flex flex-col sm:items-end">
                  <span
                    className={`text-sm font-bold font-mono ${
                      isInbound ? "text-emerald-600" : "text-[#071B3B]"
                    }`}
                  >
                    {isInbound ? "+" : "-"}
                    {tx.amountCrypto}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    ~ {tx.amountInr}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {tx.gasUsed}
                  </span>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${tx.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-[#1D5FD0] hover:bg-blue-50 rounded-lg transition-colors"
                    title="View on PolygonScan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
