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
  KeyRound,
  FileSignature,
} from "lucide-react";
import { useWeb3 } from "../../context/Web3Context";
import { authService } from "../../services/authService";
import { shortenAddress } from "../../services/utils/tokenMath";

export const NgoLogin = ({ onLoginSuccess, onBackToPublic }) => {
  const {
    account,
    formattedAccount,
    isDemo,
    isWrongNetwork,
    connectWallet,
    switchOrAddAmoyNetwork,
  } = useWeb3();

  // Status: 'idle' | 'connecting' | 'requesting_challenge' | 'awaiting_signature' | 'verifying' | 'success' | 'error'
  const [authStep, setAuthStep] = useState("idle");
  const [errorMessage, setErrorMessage] = useState(null);

  const handleConnectAndVerify = async () => {
    setErrorMessage(null);
    setAuthStep("connecting");

    try {
      let activeAccount = account;
      if (!activeAccount) {
        const conn = await connectWallet();
        if (!conn.success) {
          setErrorMessage("Wallet connection was rejected or cancelled.");
          setAuthStep("idle");
          return;
        }
        activeAccount = conn.account;
      }

      if (isWrongNetwork) {
        const switched = await switchOrAddAmoyNetwork();
        if (!switched) {
          setErrorMessage("Please switch to Polygon Amoy Testnet to proceed with authentication.");
          setAuthStep("idle");
          return;
        }
      }

      // Step 1: Request Challenge
      setAuthStep("requesting_challenge");
      const challenge = await authService.requestChallenge(activeAccount);

      // Step 2: Request Wallet Signature (personal_sign)
      setAuthStep("awaiting_signature");
      const signature = await authService.signChallenge(
        challenge.message,
        activeAccount,
        isDemo
      );

      // Step 3: Verify Session with Backend or Mock Adapter
      setAuthStep("verifying");
      const session = await authService.verifySession({
        wallet: activeAccount,
        signature,
        nonce: challenge.nonce,
        message: challenge.message,
        isDemo,
      });

      setAuthStep("success");

      setTimeout(() => {
        onLoginSuccess({
          name: session.ngoName || "Asha Foundation",
          wallet: session.wallet,
          network: "Polygon Amoy",
          role: session.role,
          authMode: session.authMode,
        });
      }, 900);
    } catch (err) {
      setErrorMessage(err.message || "Failed to authenticate wallet signature.");
      setAuthStep("error");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F7FB] flex flex-col lg:flex-row font-inter">
      {/* Left Brand & Trust Panel */}
      <div className="w-full lg:w-[540px] xl:w-[580px] bg-[#071B3B] p-8 sm:p-12 lg:p-14 flex flex-col justify-between text-white flex-shrink-0 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top: Logo & Back Link */}
        <div className="flex flex-col gap-6">
          <button
            onClick={onBackToPublic}
            className="inline-flex items-center gap-2 text-xs font-inter text-[#B8C7DF] hover:text-white transition-colors group self-start cursor-pointer"
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
            Manage projects, allocate funds, and prove impact with an immutable record on Polygon Amoy.
          </p>

          <div className="flex flex-col gap-3.5 pt-2">
            {[
              "EIP-4361 cryptographic wallet authentication",
              "Milestone-based fund release telemetry",
              "Immutable IPFS impact audit trail",
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
          SECURED BY EIP-1193 • POLYGON AMOY TESTNET
        </div>
      </div>

      {/* Right Login Workspace */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[500px] flex flex-col gap-5">
          {/* Main Login Card */}
          <div className="bg-white rounded-2xl p-7 sm:p-9 shadow-[0px_8px_24px_rgba(16,33,63,0.07)] border border-[#E2E7F0] flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[#1D5FD0] text-[11px] font-inter font-bold uppercase tracking-wider">
                NGO Management Portal
              </span>
              <h2 className="text-2xl sm:text-[28px] font-outfit font-bold text-[#071B3B] leading-tight">
                Sign In with Wallet
              </h2>
              <p className="text-xs text-[#64748B]">
                Cryptographic authentication verifies your authorized signatory keys against the NGO registry.
              </p>
            </div>

            {/* Error Banner */}
            {authStep === "error" && errorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Authentication Failed</span>
                  <span className="font-mono text-[11px]">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Account Status Card */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-2 text-xs font-inter">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Connected Wallet:</span>
                <span className="font-mono font-bold text-[#071B3B]">
                  {account ? shortenAddress(account, 5) : "Not connected"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Required Network:</span>
                <span className="font-semibold text-[#10B981]">Polygon Amoy (80002)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Target Organization:</span>
                <span className="font-semibold text-[#071B3B]">Asha Foundation</span>
              </div>
            </div>

            {/* Progress / Step Feedback */}
            {authStep !== "idle" && authStep !== "error" && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-[#1E3A8A]">
                {authStep === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-[#1E3A8A] animate-spin flex-shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="font-bold">
                    {authStep === "connecting" && "Connecting Wallet..."}
                    {authStep === "requesting_challenge" && "Requesting cryptographic challenge..."}
                    {authStep === "awaiting_signature" && "Please sign the challenge in your wallet..."}
                    {authStep === "verifying" && "Verifying signature against NGO registry..."}
                    {authStep === "success" && "Signature verified! Loading dashboard..."}
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {authStep === "awaiting_signature"
                      ? "A personal_sign request was sent to your browser wallet."
                      : "Ensures tamper-proof role authorization."}
                  </span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleConnectAndVerify}
              disabled={authStep !== "idle" && authStep !== "error"}
              className="w-full py-3.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-inter font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <FileSignature className="w-4 h-4" />
              <span>
                {authStep === "idle" || authStep === "error"
                  ? account
                    ? "Sign Challenge & Enter Portal"
                    : "Connect Wallet & Sign In"
                  : "Authenticating..."}
              </span>
            </button>

            {/* Developer Mode Note */}
            <div className="text-[11px] text-center text-[#64748B] font-inter">
              <span>Notice: If MetaMask is not installed, clicking will activate the </span>
              <span className="font-semibold text-[#1D5FD0]">Polygon Amoy Interactive Demo</span>
              <span> for instant testing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
