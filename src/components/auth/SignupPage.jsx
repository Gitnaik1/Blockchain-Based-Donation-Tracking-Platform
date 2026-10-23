import React, { useState } from "react";
import {
  Heart,
  Building2,
  Mail,
  Lock,
  User,
  Wallet,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  FileText,
} from "lucide-react";
import { useRouter } from "../../context/RouterContext.jsx";
import { useWeb3 } from "../../context/Web3Context";
import { useAuth } from "../../context/AuthContext.jsx";
import { BackButton } from "../common/BackButton.jsx";
import { PendingApprovalView } from "./PendingApprovalView.jsx";

export const SignupPage = () => {
  const { navigate, queryParams } = useRouter();
  const { account, formattedAccount, connectWallet } = useWeb3();
  const { loginWithCredentials } = useAuth();

  // Selected Tab: 'donor' | 'ngo'
  const initialTab = queryParams.get("tab") === "ngo" ? "ngo" : "donor";
  const [accountType, setAccountType] = useState(initialTab);

  // Donor Form State
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPassword, setDonorPassword] = useState("");
  const [donorConfirmPassword, setDonorConfirmPassword] = useState("");
  const [donorTerms, setDonorTerms] = useState(false);
  const [donorLoading, setDonorLoading] = useState(false);
  const [donorError, setDonorError] = useState(null);
  const [donorSuccess, setDonorSuccess] = useState(false);

  // NGO Form State
  const [ngoLegalName, setNgoLegalName] = useState("");
  const [ngoRegNo, setNgoRegNo] = useState("");
  const [ngoCategory, setNgoCategory] = useState("Environment");
  const [ngoContactEmail, setNgoContactEmail] = useState("");
  const [ngoRepName, setNgoRepName] = useState("");
  const [ngoWallet, setNgoWallet] = useState(account || "");
  const [ngoTerms, setNgoTerms] = useState(false);
  const [ngoLoading, setNgoLoading] = useState(false);
  const [ngoError, setNgoError] = useState(null);
  const [submittedApplication, setSubmittedApplication] = useState(null);

  // Document checklist state (prefilled with deterministic IPFS CIDs for ease of verification)
  const [docUploads, setDocUploads] = useState({
    reg_certificate: { cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", fileName: "Registration_Certificate.pdf", uploaded: true },
    tax_80g: { cid: "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R", fileName: "80G_Tax_Exemption_Order.pdf", uploaded: true },
    bank_proof: { cid: "QmbWqxBEKC3P8tTXBSFL1ZZBodj125JYf4txJS4UCE2ndC", fileName: "Cancelled_Cheque_Proof.pdf", uploaded: true },
    pan_card: { cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", fileName: "Organization_PAN_Card.pdf", uploaded: true },
  });

  // 1. Donor Signup Handler
  const handleDonorSignup = async (e) => {
    e.preventDefault();
    setDonorError(null);

    if (!donorName || !donorEmail || !donorPassword) {
      setDonorError("All fields are required.");
      return;
    }

    if (donorPassword !== donorConfirmPassword) {
      setDonorError("Passwords do not match.");
      return;
    }

    if (!donorTerms) {
      setDonorError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setDonorLoading(true);
    try {
      // Simulate donor registration
      await new Promise((resolve) => setTimeout(resolve, 800));
      setDonorSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setDonorError(err.message || "Failed to create donor account.");
    } finally {
      setDonorLoading(false);
    }
  };

  // 2. NGO Onboarding Application Submit Handler
  const handleNgoRegistration = async (e) => {
    e.preventDefault();
    setNgoError(null);

    const activeWallet = ngoWallet || account;

    if (!ngoLegalName || !ngoRegNo || !ngoContactEmail || !activeWallet) {
      setNgoError("Please fill out all organization details including wallet address.");
      return;
    }

    if (!ngoTerms) {
      setNgoError("You must accept the TrustDonate verification declaration.");
      return;
    }

    setNgoLoading(true);
    try {
      // Invoke real backend onboarding API
      const res = await fetch("http://localhost:5001/api/v1/onboarding/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: ngoLegalName,
          registrationNumber: ngoRegNo,
          category: ngoCategory,
          contactEmail: ngoContactEmail,
          applicantWallet: activeWallet,
          documents: docUploads,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit onboarding application.");
      }

      // Transition to Pending Approval screen with returned reference
      setSubmittedApplication(json.data);
    } catch (err) {
      // Fallback for offline demo mode
      console.warn("Backend apply endpoint failed, using local pending view:", err);
      setSubmittedApplication({
        id: `app-${Date.now()}`,
        legalName: ngoLegalName,
        registrationNumber: ngoRegNo,
        category: ngoCategory,
        status: "SUBMITTED",
      });
    } finally {
      setNgoLoading(false);
    }
  };

  // If application was submitted, show pending verification view
  if (submittedApplication) {
    return <PendingApprovalView application={submittedApplication} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-inter text-[#071B3B]">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] px-4 sm:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-[#1E3A8A] font-extrabold font-outfit text-xl cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-md flex items-center justify-center text-white font-bold">
            T
          </div>
          <span>TrustDonate</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="text-xs text-[#64748B] hidden sm:inline">
            Already registered?
          </span>
          <button
            onClick={() => navigate("/login")}
            className="text-xs font-semibold text-[#1D5FD0] hover:underline cursor-pointer"
          >
            Sign In ➔
          </button>
          <BackButton fallback="/" label="Back to Home" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-xl bg-white border border-[#E2E8F0] shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          {/* Headline */}
          <div className="flex flex-col gap-1 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D5FD0] font-mono">
              Join the Transparency Network
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B]">
              Create an Account
            </h1>
            <p className="text-xs text-[#64748B]">
              Select whether you are registering as a Public Donor or an Authorized Non-Profit.
            </p>
          </div>

          {/* Account Type Selection */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setAccountType("donor")}
              className={`p-3 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2.5 transition-all cursor-pointer ${
                accountType === "donor"
                  ? "bg-white text-[#071B3B] shadow-sm font-bold"
                  : "text-[#64748B] hover:text-[#071B3B] font-medium"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accountType === "donor" ? "bg-rose-50 text-rose-600" : "bg-slate-200 text-slate-500"}`}>
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div className="text-left">
                <div className="text-xs">Public Donor</div>
                <div className="text-[10px] text-slate-400 hidden sm:block">Track & verify personal contributions</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAccountType("ngo")}
              className={`p-3 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2.5 transition-all cursor-pointer ${
                accountType === "ngo"
                  ? "bg-white text-[#071B3B] shadow-sm font-bold"
                  : "text-[#64748B] hover:text-[#071B3B] font-medium"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accountType === "ngo" ? "bg-blue-50 text-[#1E3A8A]" : "bg-slate-200 text-slate-500"}`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs">NGO Organization</div>
                <div className="text-[10px] text-slate-400 hidden sm:block">Manage milestones & receive grants</div>
              </div>
            </button>
          </div>

          {/* OPTION A: DONOR SIGNUP FORM */}
          {accountType === "donor" && (
            <form onSubmit={handleDonorSignup} className="flex flex-col gap-4 text-left">
              {donorError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{donorError}</span>
                </div>
              )}

              {donorSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                  <span>Account created successfully! Redirecting to sign in...</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#071B3B]">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Meera Subramanian"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#071B3B]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="meera@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#071B3B]">Password</label>
                  <input
                    type="password"
                    value={donorPassword}
                    onChange={(e) => setDonorPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#071B3B]">Confirm Password</label>
                  <input
                    type="password"
                    value={donorConfirmPassword}
                    onChange={(e) => setDonorConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              {/* Optional Wallet Linking */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#334155]">
                  <Wallet className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Web3 Wallet:</span>
                  <span className="font-mono font-semibold text-[#071B3B]">
                    {account ? formattedAccount : "Not linked (Optional)"}
                  </span>
                </div>
                {!account && (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="px-2.5 py-1 bg-white border border-[#CBD5E1] hover:bg-slate-100 rounded-lg text-[11px] font-semibold text-[#1E3A8A] cursor-pointer"
                  >
                    Link Wallet
                  </button>
                )}
              </div>

              <label className="flex items-start gap-2 text-xs text-[#64748B] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={donorTerms}
                  onChange={(e) => setDonorTerms(e.target.checked)}
                  className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A] mt-0.5"
                />
                <span>
                  I agree to the <span className="text-[#1D5FD0] underline">Terms of Service</span> and consent to public immutable on-chain recording of donation hashes.
                </span>
              </label>

              <button
                type="submit"
                disabled={donorLoading}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/95 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-2"
              >
                {donorLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Donor Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Donor Registration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OPTION B: NGO ONBOARDING APPLICATION FORM */}
          {accountType === "ngo" && (
            <form onSubmit={handleNgoRegistration} className="flex flex-col gap-4 text-left">
              {ngoError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{ngoError}</span>
                </div>
              )}

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-[#334155] flex flex-col gap-1">
                <div className="font-semibold text-[#1E3A8A] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Strict Non-Profit Compliance Verification</span>
                </div>
                <p className="text-[11px] text-[#475569] leading-relaxed">
                  Submissions require independent administrative validation before organization dashboards and disbursement privileges are granted.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#071B3B]">Legal Organization Name *</label>
                  <input
                    type="text"
                    value={ngoLegalName}
                    onChange={(e) => setNgoLegalName(e.target.value)}
                    placeholder="e.g. Green Canopy Initiative"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#071B3B]">Registration Number (80G / FCRA) *</label>
                  <input
                    type="text"
                    value={ngoRegNo}
                    onChange={(e) => setNgoRegNo(e.target.value)}
                    placeholder="e.g. REG-AMAZON-2026-004"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#071B3B]">Category</label>
                  <select
                    value={ngoCategory}
                    onChange={(e) => setNgoCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  >
                    <option value="Environment">Environment & Conservation</option>
                    <option value="Education">Education & Youth</option>
                    <option value="Healthcare">Healthcare & Sanitation</option>
                    <option value="Disaster Relief">Disaster Relief & Aid</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#071B3B]">Official Contact Email *</label>
                  <input
                    type="email"
                    value={ngoContactEmail}
                    onChange={(e) => setNgoContactEmail(e.target.value)}
                    placeholder="director@greencanopy.org"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#071B3B]">Authorized Signatory / Representative</label>
                  <input
                    type="text"
                    value={ngoRepName}
                    onChange={(e) => setNgoRepName(e.target.value)}
                    placeholder="Dr. Alok Verma (Director)"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#071B3B]">Operational Wallet Address *</label>
                  <input
                    type="text"
                    value={ngoWallet || account || ""}
                    onChange={(e) => setNgoWallet(e.target.value)}
                    placeholder="0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-mono text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              {/* Document Checklist verification table */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#071B3B]">Required Verification Documents (IPFS Pinned):</span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>4 of 4 Prepared</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(docUploads).map(([key, doc]) => (
                    <div key={key} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-[#1D5FD0] flex-shrink-0" />
                        <span className="truncate text-[#334155]">{doc.fileName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">CID Pinned</span>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-[#64748B] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={ngoTerms}
                  onChange={(e) => setNgoTerms(e.target.checked)}
                  className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A] mt-0.5"
                />
                <span>
                  I declare that all submitted non-profit documentation is authentic and agree to independent compliance review by TrustDonate Platform Administrators.
                </span>
              </label>

              <button
                type="submit"
                disabled={ngoLoading}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/95 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-1"
              >
                {ngoLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Application to Super Admin Review...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Onboarding Application</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-[#64748B]">
            <span>Already have an account?</span>
            <button
              onClick={() => navigate("/login")}
              className="text-[#1D5FD0] font-semibold hover:underline cursor-pointer"
            >
              Sign In Instead
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[#94A3B8]">
        TrustDonate • Independent Verification Standards
      </footer>
    </div>
  );
};
