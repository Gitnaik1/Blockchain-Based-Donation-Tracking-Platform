import React from "react";
import { ArrowRight, Send, Cpu, FileCheck2, BellRing } from "lucide-react";

export const HowItWorks = () => {
  const steps = [
    {
      num: "1",
      icon: Send,
      title: "Donate Directly",
      desc: "Send fiat or stablecoins directly to the verified smart contract of your preferred NGO.",
    },
    {
      num: "2",
      icon: Cpu,
      title: "Blockchain Verification",
      desc: "The transaction is mined on Polygon Amoy. A unique on-chain cryptographic receipt is issued.",
    },
    {
      num: "3",
      icon: FileCheck2,
      title: "Fund Allocation",
      desc: "NGOs can only release funds by uploading verified programmatic utilization proposals.",
    },
    {
      num: "4",
      icon: BellRing,
      title: "Impact Tracking",
      desc: "Donors receive immediate decentralized alerts with proof of execution and real-world outcomes.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-14">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl">
          <span className="text-[#2563EB] text-sm font-outfit font-bold uppercase tracking-wider">
            Guaranteed Accountability
          </span>
          <h2 className="text-3xl sm:text-4xl font-outfit font-extrabold text-[#0F172A] tracking-tight">
            How TrustDonate Secures Your Gift
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-start gap-5 hover:border-blue-300 hover:shadow-sm transition-all group relative"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 bg-[#1E3A8A] group-hover:bg-[#2563EB] rounded-full flex items-center justify-center text-white font-outfit font-extrabold text-lg transition-colors shadow-sm">
                    {step.num}
                  </div>
                  <Icon className="w-5 h-5 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[#0F172A] font-outfit font-bold text-lg">
                    {step.title}
                  </h3>
                  <p className="text-[#64748B] font-inter text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
