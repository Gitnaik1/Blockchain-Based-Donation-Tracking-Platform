import React, { useState } from "react";
import {
  Shield,
  Lock,
  FileCheck2,
  Zap,
  ChevronDown,
  ExternalLink,
  Code2,
  CheckCircle,
  HelpCircle,
  Globe2,
} from "lucide-react";

const FAQS = [
  {
    q: "How do I know my donation reaches real beneficiaries?",
    a: "Unlike traditional charities where funds disappear into general bank accounts, TrustDonate locks all contributions into decentralized smart contracts. Funds are only unlocked in stages when the NGO provides verified proof of work and vendor invoices that are permanently pinned to IPFS.",
  },
  {
    q: "What tokens and currencies are supported?",
    a: "We natively support POL (Polygon native gas token), USDT (Tether), and USDC (USD Coin) on Polygon Amoy Testnet. In addition, the platform provides live real-time INR (₹) and USD ($) conversion rates so donors always know the exact fiat purchasing power.",
  },
  {
    q: "Can non-crypto users donate without MetaMask?",
    a: "Yes! Our platform incorporates both a Web3 wallet connect option and a built-in Demo Mode. In the next release, we are integrating Account Abstraction (ERC-4337) and UPI/credit card gateways so non-crypto native donors can donate in fiat while an on-chain receipt is minted behind the scenes.",
  },
  {
    q: "How are project milestones verified before funds are released?",
    a: "Each project is split into verifiable milestones (e.g. Borewell procurement, drilling, solar installation). An NGO administrator must submit an allocation request with attached quotation PDFs and beneficiary contract addresses. Once multi-sig signatures are collected, funds dispatch on-chain.",
  },
  {
    q: "What are the transaction fees on Polygon Amoy?",
    a: "Polygon Amoy is an Ethereum Layer-2 network that reduces transaction costs by over 99.5%. Average transaction fees are less than 0.0005 POL (approx. ₹0.04), allowing 100% of your donation to reach the cause without eating into your contribution.",
  },
];

export const AboutSection = () => {
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section id="about" className="py-20 bg-white border-t border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1D5FD0] text-xs font-semibold uppercase tracking-wider mb-4">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Architecture &amp; Mission</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold text-[#071B3B] tracking-tight">
            Built for Uncompromising Integrity
          </h2>
          <p className="mt-3 text-[#64748B] text-sm sm:text-base leading-relaxed">
            TrustDonate is an open-source, decentralized philanthropic protocol designed to eliminate 
            fraud, reduce administrative overheads, and restore public faith in charitable organizations.
          </p>
        </div>

        {/* 4 Architectural Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1D5FD0] transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1D5FD0] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-outfit text-[#071B3B]">
              Non-Custodial Escrow
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Donations are locked inside decentralized vault contracts. No single administrator or intermediary can withdraw funds unilaterally.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#00C9A7] transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#E8F8F5] text-[#00C9A7] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-outfit text-[#071B3B]">
              Milestone Multi-Sig
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Capital release requires 3-of-5 threshold cryptographic signatures from verified trustees and approved milestone validators.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-purple-500 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-outfit text-[#071B3B]">
              IPFS Impact Proofs
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Invoices, receipts, field photographs, and auditor sign-offs are hashed and permanently anchored onto the InterPlanetary File System.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-amber-500 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-outfit text-[#071B3B]">
              Polygon L2 Speed
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Sub-second block confirmation with near-zero gas costs makes micro-donations economically viable and friction-free.
            </p>
          </div>
        </div>

        {/* Security & Verification Band */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#071B3B] to-[#0A2558] rounded-3xl text-white mb-16 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold font-mono">
                SOLIDITY 0.8.20 AUDITED
              </span>
              <span className="text-xs text-slate-300">Open Source Protocol</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-outfit">
              Secure, Auditable, and Fully Open Source
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              All smart contract source code, tests, and deployment scripts are openly available on GitHub. 
              Protected with OpenZeppelin ReentrancyGuard and SafeERC20 standards.
            </p>
          </div>

          <a
            href="https://github.com/Gitnaik1/Blockchain-Based-Donation-Tracking-Platform"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 bg-[#00C9A7] hover:bg-[#00B796] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#00C9A7]/30 flex items-center gap-2 transition-all flex-shrink-0"
          >
            <Code2 className="w-4 h-4" />
            <span>View Source on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-1">
            <h3 className="text-2xl font-bold font-outfit text-[#071B3B]">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Everything you need to know about transparent on-chain philanthropy.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="border border-[#E2E8F0] rounded-2xl overflow-hidden transition-all bg-white"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-[#071B3B]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#64748B] flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#00C9A7]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
