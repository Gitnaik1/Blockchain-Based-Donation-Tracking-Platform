import React from "react";
import { ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer id="about" className="bg-[#0F172A] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        {/* Top Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
          {/* Brand Info */}
          <div className="max-w-sm flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-8 bg-[#2563EB] rounded-md flex items-center justify-center shadow-sm">
                <div className="w-[18px] h-[18px] border-2 border-white rounded-[2px] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <span className="text-white text-2xl font-outfit font-extrabold tracking-tight">
                TrustDonate
              </span>
            </div>

            <p className="text-[#94A3B8] font-inter text-[15px] leading-relaxed">
              Bridging the gap between global donors and local NGOs through public, immutable, and cryptographic ledger verification on the Polygon Amoy Network.
            </p>

            <div className="flex items-center gap-4 text-slate-400 pt-2">
              <a
                href="https://github.com/Gitnaik1/Blockchain-Based-Donation-Tracking-Platform"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label="GitHub Repository"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
              <a
                href="https://amoy.polygonscan.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1 text-xs"
              >
                <span>PolygonScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-12 sm:gap-20">
            {/* Column 1: Platform */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-outfit font-bold text-base">
                Platform
              </h4>
              <ul className="flex flex-col gap-3 font-inter text-sm text-[#94A3B8]">
                <li><a href="#ngos" className="hover:text-white transition-colors">Find NGOs</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#transparency" className="hover:text-white transition-colors">Transparency Ledger</a></li>
                <li><a href="#transparency" className="hover:text-white transition-colors">Gas Fees Plan</a></li>
              </ul>
            </div>

            {/* Column 2: Resources */}
            <div className="flex flex-col gap-4">
              <h4 className="text-white font-outfit font-bold text-base">
                Resources
              </h4>
              <ul className="flex flex-col gap-3 font-inter text-sm text-[#94A3B8]">
                <li>
                  <a
                    href="https://github.com/Gitnaik1/Blockchain-Based-Donation-Tracking-Platform"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Developer Docs
                  </a>
                </li>
                <li>
                  <a
                    href="https://amoy.polygonscan.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    API Registry
                  </a>
                </li>
                <li>
                  <a href="#home" className="hover:text-white transition-colors">
                    Security Audits
                  </a>
                </li>
                <li>
                  <a
                    href="https://faucet.polygon.technology/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>Amoy Faucet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-6 border-t border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#94A3B8] font-inter">
          <div>
            &copy; 2026 TrustDonate Foundation. Blockchain-verified philanthropy.
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            <span className="text-xs text-[#94A3B8]">
              Connected to Polygon Amoy Testnet (Public Block Explorer Live)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
