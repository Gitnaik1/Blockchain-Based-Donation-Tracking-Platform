import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, ExternalLink, ArrowRight, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3 } from "../context/Web3Context";

export const DonateModal = ({ isOpen, onClose, ngos = [], selectedNgo = null, onDonationComplete, onViewInLedger }) => {
  const { account, connectWallet } = useWeb3();

  const [activeNgoId, setActiveNgoId] = useState(selectedNgo?.id || ngos[0]?.id);
  const [token, setToken] = useState("USDC");
  const [amount, setAmount] = useState("100");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTx, setSuccessTx] = useState(null);

  if (!isOpen) return null;

  const currentNgo = ngos.find((n) => n.id === activeNgoId) || ngos[0];

  const quickAmounts = ["25", "50", "100", "250", "500"];

  const handleDonate = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    if (!account) {
      await connectWallet();
    }

    setIsSubmitting(true);

    // Simulate blockchain mining latency on Polygon Amoy
    setTimeout(() => {
      // Generate realistic cryptographic hash
      const randomHex = Array.from({ length: 36 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
      const generatedHash = `0x${randomHex}`;
      const shortHash = `${generatedHash.substring(0, 8)}...${generatedHash.substring(generatedHash.length - 4)}`;

      const newTx = {
        id: `tx-${Date.now()}`,
        ngoId: currentNgo.id,
        ngoName: currentNgo.name,
        recipient: `Donation to ${currentNgo.name}`,
        hash: generatedHash,
        shortHash: shortHash,
        amount: parseFloat(amount).toFixed(2),
        token: token,
        timeAgo: "Just now",
        timestamp: Date.now(),
        status: "Mined",
        donor: account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "0x7a8c...89F1",
        fullWallet: account || "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1",
      };

      onDonationComplete(newTx, currentNgo.id, parseFloat(amount));
      setSuccessTx(newTx);
      setIsSubmitting(false);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log("Confetti trigger:", err);
      }
    }, 1800);
  };

  const handleResetAndClose = () => {
    setSuccessTx(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successTx ? (
          /* Success Screen */
          <div className="flex flex-col items-center text-center gap-5 py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center text-[#10B981] shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[#10B981] text-xs font-inter font-bold uppercase tracking-wider">
                Cryptographic Receipt Issued
              </span>
              <h3 className="text-2xl font-outfit font-extrabold text-[#0F172A]">
                Donation Mined Successfully!
              </h3>
              <p className="text-sm text-[#64748B] font-inter">
                Your transaction has been written into the Polygon Amoy testnet ledger.
              </p>
            </div>

            <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-2.5 text-left text-xs font-inter">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">NGO Beneficiary:</span>
                <span className="font-semibold text-[#0F172A]">{currentNgo.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Amount Settled:</span>
                <span className="font-bold text-[#1E3A8A] text-sm">
                  ${successTx.amount} {successTx.token}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-[#64748B]">Tx Hash:</span>
                <a
                  href={`https://amoy.polygonscan.com/tx/${successTx.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2563EB] font-mono font-bold hover:underline flex items-center gap-1"
                >
                  <span>{successTx.shortHash}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-2">
              <button
                onClick={handleResetAndClose}
                className="w-full sm:flex-1 py-3 bg-[#F1F5F9] hover:bg-slate-200 text-[#0F172A] font-inter font-semibold rounded-lg text-xs transition-colors"
              >
                Done
              </button>
              {onViewInLedger && (
                <button
                  onClick={() => {
                    handleResetAndClose();
                    onViewInLedger();
                  }}
                  className="w-full sm:flex-1 py-3 bg-[#00C9A7] hover:bg-[#00B796] text-white font-inter font-bold rounded-lg text-xs shadow-md shadow-[#00C9A7]/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View in Donations Ledger</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Donation Input Form */
          <form onSubmit={handleDonate} className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-outfit font-bold text-sm uppercase tracking-wide">
                Direct Smart Contract Transfer
              </span>
            </div>

            <h3 className="text-2xl font-outfit font-black text-[#0F172A]">
              Make a Verified Contribution
            </h3>

            {/* Select NGO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-inter font-semibold text-[#64748B]">
                Select Beneficiary NGO
              </label>
              <select
                value={activeNgoId}
                onChange={(e) => setActiveNgoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] font-inter focus:outline-none focus:border-[#1E3A8A]"
              >
                {ngos.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.name} ({ngo.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Token */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-inter font-semibold text-[#64748B]">
                Asset / Token
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["USDC", "USDT", "POL"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setToken(t)}
                    className={`py-2 px-3 rounded-lg text-xs font-inter font-semibold border transition-all ${
                      token === t
                        ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                        : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-inter font-semibold text-[#64748B]">
                Contribution Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#64748B] font-inter font-bold">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-lg text-[#0F172A] font-inter font-bold focus:outline-none focus:border-[#1E3A8A]"
                  required
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAmount(q)}
                    className={`flex-1 py-1 rounded text-xs font-inter font-medium border transition-colors ${
                      amount === q
                        ? "bg-blue-50 border-[#2563EB] text-[#2563EB] font-bold"
                        : "bg-white border-slate-200 text-[#64748B] hover:bg-slate-50"
                    }`}
                  >
                    ${q}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-1 text-xs text-[#64748B] font-inter">
              <div className="flex justify-between">
                <span>Target Contract:</span>
                <span className="font-mono text-[#0F172A]">
                  {currentNgo.contractAddress.substring(0, 10)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Gas:</span>
                <span className="text-[#10B981] font-semibold">
                  ~0.0008 POL (Free on Amoy Faucet)
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-inter font-semibold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing &amp; Broadcasting to Polygon Amoy...</span>
                </>
              ) : (
                <>
                  <span>
                    {account ? `Confirm $${amount} Donation` : "Connect & Donate"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
