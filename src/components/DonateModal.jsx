import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Loader2,
  AlertTriangle,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3 } from "../context/Web3Context";
import { web3Service } from "../services/web3Service";
import { reportsService } from "../services/reportsService";
import { SUPPORTED_TOKENS, SUPPORTED_NETWORKS, AMOY_CHAIN_ID_DEC } from "../config";
import { formatInr, shortenAddress, shortenTxHash } from "../services/utils/tokenMath";

export const DonateModal = ({
  isOpen,
  onClose,
  ngos = [],
  selectedNgo = null,
  onDonationComplete,
  onViewInLedger,
}) => {
  const {
    account,
    isDemo,
    isWrongNetwork,
    connectWallet,
    switchOrAddAmoyNetwork,
  } = useWeb3();

  const [activeNgoId, setActiveNgoId] = useState(selectedNgo?.id || ngos[0]?.id);
  const [token, setToken] = useState("USDC");
  const [amount, setAmount] = useState("100");

  // Step state: 'input' | 'review' | 'signing' | 'pending' | 'success' | 'error'
  const [modalStep, setModalStep] = useState("input");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successTx, setSuccessTx] = useState(null);

  // Sync selected NGO when opened or changed
  useEffect(() => {
    if (selectedNgo) {
      setActiveNgoId(selectedNgo.id);
    } else if (ngos.length > 0 && !activeNgoId) {
      setActiveNgoId(ngos[0].id);
    }
  }, [selectedNgo, ngos, activeNgoId]);

  if (!isOpen) return null;

  const currentNgo = ngos.find((n) => n.id === activeNgoId) || ngos[0];
  const selectedTokenMeta = SUPPORTED_TOKENS[token] || SUPPORTED_TOKENS.POL;

  const quickAmounts = ["25", "50", "100", "250", "500"];

  // Estimated INR conversion
  const numAmount = parseFloat(amount) || 0;
  const estimatedInr = Math.round(numAmount * (selectedTokenMeta.exchangeRateInr || 85));

  const handleProceedToReview = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid donation amount greater than 0.");
      return;
    }
    setModalStep("review");
  };

  const handleConfirmAndSign = async () => {
    setErrorMessage(null);

    // If wallet not connected, connect first
    let activeAccount = account;
    if (!activeAccount) {
      const connRes = await connectWallet();
      if (!connRes.success) {
        setErrorMessage("Wallet connection is required to sign the on-chain donation.");
        return;
      }
      activeAccount = connRes.account;
    }

    if (isWrongNetwork) {
      const switched = await switchOrAddAmoyNetwork();
      if (!switched) {
        setErrorMessage("Please switch to Polygon Amoy Testnet to proceed.");
        return;
      }
    }

    setModalStep("signing");

    try {
      // Execute transaction via Web3 service
      const txResult = await web3Service.submitDonation({
        from: activeAccount,
        to: currentNgo.contractAddress,
        amount: amount,
        token: token,
        isDemo,
      });

      setModalStep("pending");

      // Short delay for on-chain block mining simulation / confirmation
      setTimeout(() => {
        const newTx = {
          id: `tx-${Date.now()}`,
          ngoId: currentNgo.id,
          ngoName: currentNgo.name,
          recipient: `Donation to ${currentNgo.name}`,
          hash: txResult.hash,
          shortHash: shortenTxHash(txResult.hash),
          amount: parseFloat(amount).toFixed(2),
          token: token,
          timeAgo: "Just now",
          timestamp: Date.now(),
          status: "Confirmed",
          donor: activeAccount ? shortenAddress(activeAccount) : "0x7a8c...89F1",
          fullWallet: activeAccount || "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1",
          isSimulated: txResult.isSimulated,
        };

        if (onDonationComplete) {
          onDonationComplete(newTx, currentNgo.id, parseFloat(amount));
        }

        setSuccessTx(newTx);
        setModalStep("success");

        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // Ignore confetti errors
        }
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred during transaction execution.");
      setModalStep("error");
    }
  };

  const handleDownloadReceipt = () => {
    if (!successTx) return;
    const donationData = {
      ...successTx,
      project: currentNgo.name,
      amountInr: estimatedInr,
      amountCrypto: `${successTx.amount} ${successTx.token}`,
      date: new Date().toLocaleString("en-IN"),
      taxReceiptNo: `REC-AMOY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    const html = reportsService.generateReceiptHtml(donationData);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `TrustDonate_Receipt_${successTx.hash.slice(0, 10)}.html`;
      a.click();
    }
  };

  const handleResetAndClose = () => {
    setSuccessTx(null);
    setErrorMessage(null);
    setModalStep("input");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="donate-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          aria-label="Close Donation Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: SUCCESS CONFIRMATION */}
        {modalStep === "success" && successTx ? (
          <div className="flex flex-col items-center text-center gap-5 py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center text-[#10B981] shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[#10B981] text-xs font-inter font-bold uppercase tracking-wider">
                Cryptographic Evidence Verified
              </span>
              <h3 id="donate-modal-title" className="text-2xl font-outfit font-extrabold text-[#0F172A]">
                Donation Confirmed!
              </h3>
              <p className="text-sm text-[#64748B] font-inter">
                Your transaction has been successfully written to the Polygon Amoy blockchain ledger.
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
                  ${successTx.amount} {successTx.token} ({formatInr(estimatedInr)})
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
                onClick={handleDownloadReceipt}
                className="w-full sm:flex-1 py-3 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-inter font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Receipt</span>
              </button>

              {onViewInLedger ? (
                <button
                  onClick={() => {
                    handleResetAndClose();
                    onViewInLedger();
                  }}
                  className="w-full sm:flex-1 py-3 bg-[#00C9A7] hover:bg-[#00B796] text-white font-inter font-bold rounded-lg text-xs shadow-md shadow-[#00C9A7]/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View in Ledger</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleResetAndClose}
                  className="w-full sm:flex-1 py-3 bg-[#F1F5F9] hover:bg-slate-200 text-[#0F172A] font-inter font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        ) : modalStep === "review" ? (
          /* STEP 2: REVIEW BEFORE SIGNING */
          <div className="flex flex-col gap-5 animate-in fade-in">
            <div className="flex items-center gap-2 text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-outfit font-bold text-sm uppercase tracking-wide">
                Review Contribution
              </span>
            </div>

            <h3 id="donate-modal-title" className="text-2xl font-outfit font-black text-[#0F172A]">
              Confirm Donation Details
            </h3>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-3 text-xs font-inter">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Beneficiary NGO:</span>
                <span className="font-bold text-[#0F172A]">{currentNgo.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Target Contract:</span>
                <span className="font-mono text-[#0F172A]">{shortenAddress(currentNgo.contractAddress, 6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Asset &amp; Amount:</span>
                <span className="font-bold text-[#1E3A8A] text-sm">
                  {amount} {token}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Estimated Fiat Equivalent:</span>
                <span className="font-semibold text-[#10B981]">{formatInr(estimatedInr)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-[#64748B]">Network:</span>
                <span className="font-semibold text-[#0F172A]">Polygon Amoy (Testnet)</span>
              </div>
            </div>

            {isWrongNetwork && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                <span>Wallet is on an unsupported chain.</span>
                <button
                  type="button"
                  onClick={switchOrAddAmoyNetwork}
                  className="font-bold underline text-amber-900 cursor-pointer"
                >
                  Switch to Amoy
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalStep("input")}
                className="flex-1 py-3 bg-[#F1F5F9] hover:bg-slate-200 text-[#0F172A] font-inter font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSign}
                className="flex-1 py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-inter font-semibold rounded-lg text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Authorize &amp; Sign</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : modalStep === "signing" || modalStep === "pending" ? (
          /* STEP 3: SIGNING & BROADCASTING SPINNER */
          <div className="flex flex-col items-center justify-center py-10 gap-5 text-center animate-in fade-in">
            <Loader2 className="w-12 h-12 text-[#1E3A8A] animate-spin" />
            <div className="flex flex-col gap-1.5">
              <h4 className="text-xl font-outfit font-bold text-[#0F172A]">
                {modalStep === "signing" ? "Awaiting Signature..." : "Broadcasting to Polygon Amoy..."}
              </h4>
              <p className="text-xs text-[#64748B] max-w-xs">
                {modalStep === "signing"
                  ? "Please confirm the transaction in your connected wallet."
                  : "Transaction sent to Amoy mempool. Waiting for block confirmation..."}
              </p>
            </div>
          </div>
        ) : modalStep === "error" ? (
          /* STEP 4: ERROR VIEW */
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-in fade-in">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-outfit font-bold text-[#0F172A]">
              Transaction Failed
            </h4>
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 max-w-sm text-left font-mono">
              {errorMessage || "Transaction could not be completed."}
            </p>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="flex-1 py-3 bg-[#F1F5F9] hover:bg-slate-200 text-[#0F172A] font-inter font-semibold rounded-lg text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setModalStep("review")}
                className="flex-1 py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-inter font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 0: DONATION INPUT FORM */
          <form onSubmit={handleProceedToReview} className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-outfit font-bold text-sm uppercase tracking-wide">
                Direct Smart Contract Transfer
              </span>
            </div>

            <h3 id="donate-modal-title" className="text-2xl font-outfit font-black text-[#0F172A]">
              Make a Verified Contribution
            </h3>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Select NGO */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="beneficiary-select" className="text-xs font-inter font-semibold text-[#64748B]">
                Select Beneficiary NGO
              </label>
              <select
                id="beneficiary-select"
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
                    className={`py-2 px-3 rounded-lg text-xs font-inter font-semibold border transition-all cursor-pointer ${
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
              <label htmlFor="donation-amount" className="text-xs font-inter font-semibold text-[#64748B]">
                Contribution Amount ({token})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#64748B] font-inter font-bold">
                  $
                </span>
                <input
                  id="donation-amount"
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
                    className={`flex-1 py-1 rounded text-xs font-inter font-medium border transition-colors cursor-pointer ${
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
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-1.5 text-xs text-[#64748B] font-inter">
              <div className="flex justify-between">
                <span>Target Contract:</span>
                <span className="font-mono text-[#0F172A]">
                  {shortenAddress(currentNgo.contractAddress, 5)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Fiat:</span>
                <span className="text-[#0F172A] font-semibold">
                  {formatInr(estimatedInr)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Gas:</span>
                <span className="text-[#10B981] font-semibold">
                  ~0.0008 POL (Amoy Testnet Faucet)
                </span>
              </div>
            </div>

            {/* Review Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-inter font-semibold rounded-lg flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <span>Review Contribution</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
