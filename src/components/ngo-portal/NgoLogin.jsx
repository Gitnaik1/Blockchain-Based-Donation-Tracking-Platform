import React, { useState } from "react";
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Wallet,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";

export const NgoLogin = ({ onLoginSuccess, onBackToPublic }) => {
  const { account, formattedAccount, connectWallet, switchOrAddAmoyNetwork } = useWeb3();
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorState, setErrorState] = useState(null); // 'network' | 'rejected' | null
  const [isNGOVerified, setIsNGOVerified] = useState(false);

  const handleConnectAndVerify = async () => {
    setErrorState(null);
    setIsVerifying(true);

    try {
      const res = await connectWallet();
      if (!res.success) {
        setErrorState("rejected");
        setIsVerifying(false);
        return;
      }

      // Simulate on-chain contract verification check
      setTimeout(() => {
        setIsVerifying(false);
        setIsNGOVerified(true);
        // Auto transition into the dashboard after brief confirmation
        setTimeout(() => {
          onLoginSuccess({
            name: "Asha Foundation",
            wallet: res.account || "0x71F3f9B08E9aC24859a2C10398F29a289459A2C",
            network: "Polygon Amoy",
          });
        }, 1200);
      }, 1500);
    } catch (err) {
      setErrorState("rejected");
      setIsVerifying(false);
    }
  };

  const handleSimulateNetworkError = () => {
    setErrorState("network");
  };

  const handleSwitchNetwork = async () => {
    setIsVerifying(true);
    await switchOrAddAmoyNetwork();
    setErrorState(null);
    setIsVerifying(false);
  };

  const displayWallet = account
    ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
    : "0x71F3...9A2C";

  return (
    <div className="min-h-screen w-full bg-[#F5F7FB] flex flex-col lg:flex-row font-inter">
      {/* Left Brand & Trust Panel */}
      <div className="w-full lg:w-[540px] xl:w-[580px] bg-[#071B3B] p-8 sm:p-12 lg:p-14 flex flex-col justify-between text-white flex-shrink-0 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top: Logo & Back Link */}
        <div className="flex flex-col gap-6">
          <button
            onClick={onBackToPublic}
            className="inline-flex items-center gap-2 text-xs font-inter text-[#B8C7DF] hover:text-white transition-colors group self-start"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Public Donor Platform</span>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] bg-white rounded-[10px] flex items-center justify-center shadow-md">
              <div className="w-[19px] h-[19px] border-[1.5px] border-[#123F8C] rounded-[3px] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#123F8C] rounded-full"></div>
              </div>
            </div>
            <span className="text-white text-xl font-outfit font-bold tracking-tight">
              TrustDonate
            </span>
          </div>
        </div>

        {/* Middle: Promise & Trust Points */}
        <div className="my-12 flex flex-col gap-6 max-w-lg">
          <div className="self-start px-2.5 py-1 bg-[#E8F7F0] rounded-full">
            <span className="text-[#17875D] text-[10px] font-bold tracking-wider uppercase font-inter">
              Transparency, On-Chain
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-outfit font-bold text-white leading-[1.15] tracking-tight">
            Every donation.
            <br />
            Every milestone.
            <br />
            Verifiably transparent.
          </h1>

          <p className="text-[#B8C7DF] text-sm sm:text-[15px] font-normal leading-relaxed">
            Manage projects, allocate funds, and prove impact with an immutable record on Polygon.
          </p>

          <div className="flex flex-col gap-3.5 pt-2">
            {[
              "Smart-contract secured",
              "Public fund traceability",
              "Real-time donor confidence",
            ].map((point, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-[22px] h-[22px] bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#17875D] stroke-[3]" />
                </div>
                <span className="text-white text-xs sm:text-[13px] font-normal">
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="text-[#7187A9] text-[11px] font-mono tracking-wider pt-6 border-t border-white/10">
          POWERED BY ETHERS.JS • SOLIDITY • POLYGON AMOY
        </div>
      </div>

      {/* Right Login & Authentication Workspace */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[500px] flex flex-col gap-5">
          {/* Main Login Card */}
          <div className="bg-white rounded-2xl p-7 sm:p-9 shadow-[0px_8px_24px_rgba(16,33,63,0.07)] border border-[#E2E7F0] flex flex-col gap-5">
            {/* Header */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[#1D5FD0] text-[11px] font-inter font-bold uppercase tracking-wider">
                NGO Management Portal
              </span>
              <h2 className="text-2xl sm:text-[28px] font-outfit font-bold text-[#071B3B] leading-tight">
                Connect your organization wallet
              </h2>
              <p className="text-[#66738A] text-xs sm:text-[13px] font-inter leading-relaxed">
                Sign in securely with MetaMask. No password required.
              </p>
            </div>

            {/* Primary Action Button */}
            {!isNGOVerified ? (
              <button
                onClick={handleConnectAndVerify}
                disabled={isVerifying}
                className="w-full h-11 bg-[#1D5FD0] hover:bg-[#1D5FD0]/90 active:scale-[0.99] text-white rounded-xl flex items-center justify-center gap-2.5 text-xs sm:text-sm font-inter font-medium shadow-sm transition-all disabled:opacity-75"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting &amp; Verifying On-Chain...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect MetaMask</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() =>
                  onLoginSuccess({
                    name: "Asha Foundation",
                    wallet: account || "0x71F3f9B08E9aC24859a2C10398F29a289459A2C",
                    network: "Polygon Amoy",
                  })
                }
                className="w-full h-11 bg-[#17875D] hover:bg-[#17875D]/90 active:scale-[0.99] text-white rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-inter font-semibold shadow-sm transition-all animate-in fade-in"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified! Proceed to Dashboard</span>
              </button>
            )}

            {/* Verified NGO Card Status Preview */}
            <div className="bg-[#E8F7F0] border border-[#C6EFE0] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#17875D]" />
                  <span className="text-[#17875D] text-sm font-bold font-inter">
                    Verified NGO
                  </span>
                </div>
                <div className="px-2.5 py-1 bg-white/80 rounded-full border border-[#A7F3D0]">
                  <span className="text-[#17875D] text-[10px] font-bold tracking-wider">
                    {account ? "CONNECTED" : "WHITELIST READY"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#A7F3D0]/60">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[#66738A] text-[10px] uppercase font-bold tracking-wider">
                    Wallet Address
                  </span>
                  <span className="text-[#10213F] font-mono font-medium">
                    {displayWallet}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-[#66738A] text-[10px] uppercase font-bold tracking-wider">
                    Network
                  </span>
                  <span className="text-[#10213F] font-semibold">
                    Polygon Amoy
                  </span>
                </div>
              </div>
            </div>

            {/* State Alerts & Diagnostic Examples */}
            <div className="flex flex-col gap-2.5">
              {/* Wrong network detected */}
              {errorState === "network" ? (
                <div className="p-3 bg-[#FFF4DB] border border-[#FDE68A] rounded-xl flex items-start gap-2.5 text-xs text-[#B86B09] animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-[#B86B09] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Wrong network detected. Switch to Polygon Amoy Testnet.</span>
                    <button
                      onClick={handleSwitchNetwork}
                      className="text-[#1D5FD0] font-bold hover:underline ml-2"
                    >
                      Switch
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Wallet connection error */}
              {errorState === "rejected" ? (
                <div className="p-3 bg-[#FFF0F1] border border-[#FECDD3] rounded-xl flex items-start gap-2.5 text-xs text-[#C13C4A] animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-[#C13C4A] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Wallet connection rejected. Please try again.</span>
                    <button
                      onClick={handleConnectAndVerify}
                      className="text-[#C13C4A] font-bold hover:underline ml-2"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Loading Verification State */}
              {isVerifying ? (
                <div className="p-3 bg-[#EAF1FF] border border-[#BFDBFE] rounded-xl flex items-center gap-2.5 text-xs text-[#1D5FD0] animate-in fade-in">
                  <div className="w-4 h-4 rounded-full border-2 border-[#1D5FD0] border-t-transparent animate-spin"></div>
                  <span>Verifying NGO smart-contract registration on-chain...</span>
                </div>
              ) : null}
            </div>

            {/* Quick Demo Helper Controls */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#66738A]">
              <span>Simulate states:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateNetworkError}
                  className="hover:text-amber-700 underline"
                >
                  Network Alert
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setErrorState("rejected")}
                  className="hover:text-red-700 underline"
                >
                  Error Alert
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorState(null);
                    handleConnectAndVerify();
                  }}
                  className="text-[#1D5FD0] font-semibold hover:underline"
                >
                  Instant Login
                </button>
              </div>
            </div>
          </div>

          {/* Footer help link */}
          <div className="text-center text-[#66738A] text-xs">
            Need help?{" "}
            <a href="mailto:support@trustdonate.org" className="hover:underline">
              Contact platform support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
