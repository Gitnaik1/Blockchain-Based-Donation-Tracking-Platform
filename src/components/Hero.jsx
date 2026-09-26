import React from "react";
import { ShieldCheck, ArrowDown, Check, ExternalLink, Sparkles } from "lucide-react";

export const Hero = ({ onOpenDonate, onExploreClick }) => {
  return (
    <section id="home" className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-white">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Hero Content */}
          <div className="flex-1 flex flex-col items-start gap-6 lg:gap-8 max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#DBEAFE] border border-[#BFDBFE] rounded-full">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#2563EB] text-xs sm:text-[13px] font-inter font-semibold tracking-wide">
                100% On-Chain Tracking &amp; Cryptographic Proofs
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-outfit font-black text-[#0F172A] leading-[1.1] tracking-tight">
              Transparent Donations.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6]">
                Verified Impact.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#64748B] font-inter font-normal leading-relaxed">
              TrustDonate guarantees every dollar sent reaches its target. By recording all donations and utilization records directly on the Polygon network, we eliminate NGO fund leakage and restore genuine global trust.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenDonate}
                className="px-8 py-4 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 active:scale-[0.98] text-white rounded-lg font-inter font-semibold text-base shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 transition-all flex items-center gap-2"
              >
                <span>Donate Now</span>
                <Sparkles className="w-4 h-4 text-blue-200" />
              </button>

              <button
                onClick={onExploreClick}
                className="px-8 py-4 bg-white hover:bg-slate-50 active:scale-[0.98] text-[#1E3A8A] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg font-inter font-semibold text-base transition-all"
              >
                Explore NGOs
              </button>
            </div>
          </div>

          {/* Right Hero Visual (Interactive On-Chain Proof Card) */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none flex justify-center">
            <div className="w-full max-w-[440px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center gap-5 shadow-sm hover:shadow-md transition-shadow">
              {/* Card 1: Verified Tx */}
              <div className="w-full bg-white rounded-2xl p-6 shadow-[0px_8px_24px_rgba(15,23,42,0.06)] border border-slate-100 flex flex-col gap-4 transform hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center justify-between">
                  <span className="font-outfit font-bold text-base text-[#0F172A]">
                    Tx Verified
                  </span>
                  <div className="px-2.5 py-1 bg-[#D1FAE5] rounded flex items-center gap-1">
                    <span className="text-[#10B981] text-[11px] font-inter font-bold tracking-wider">
                      SUCCESS
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 font-inter text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Tx Hash:</span>
                    <a
                      href="https://amoy.polygonscan.com/tx/0x7a8c9e324B022b7Ac7fD2A98013e8a49c9e889F1"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1E3A8A] font-bold font-mono hover:underline flex items-center gap-1"
                    >
                      <span>0x7a8c...9e32</span>
                      <ExternalLink className="w-3 h-3 text-[#2563EB]" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Recipient:</span>
                    <span className="text-[#0F172A] font-semibold">
                      Hope Horizon School
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[#64748B]">Amount Settled:</span>
                    <span className="text-[#1E3A8A] text-xl font-extrabold font-inter">
                      $12,500.00 USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Connecting Down Arrow with subtle pulse */}
              <div className="flex flex-col items-center my-0.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#2563EB] animate-bounce">
                  <ArrowDown className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2: Impact Asset Uploaded */}
              <div className="w-full bg-[#1E3A8A] rounded-xl p-4 flex items-center gap-3.5 text-white shadow-md">
                <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-outfit font-bold text-sm text-white leading-tight">
                    Impact Asset Uploaded
                  </span>
                  <span className="font-inter text-xs text-[#94A3B8] mt-0.5">
                    Receipt #82103 • Verified IPFS Node
                  </span>
                </div>
              </div>

              {/* Verified Polygon Badge footer */}
              <div className="flex items-center gap-2 text-xs text-[#64748B] pt-1">
                <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                <span>Secured by Polygon Amoy Proof-of-Stake</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
