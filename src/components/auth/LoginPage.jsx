import React, { useState } from "react";
import {
  Wallet,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Home,
  UserCheck,
  Heart,
  Sparkles,
} from "lucide-react";
import { useRouter } from "../../context/RouterContext.jsx";
import { useWeb3 } from "../../context/Web3Context";
import { useAuth } from "../../context/AuthContext.jsx";
import { authService } from "../../services/authService";
import { BackButton } from "../common/BackButton.jsx";
import { DEMO_PROFILES, ROLES } from "../../config/roles.js";

export const LoginPage = ({ onLoginSuccess, isDonorOnly = false }) => {
  const { navigate, queryParams, currentPath } = useRouter();
  const isDonorContext = isDonorOnly || currentPath.includes("/donor") || queryParams.get("role") === "donor";
  const {
    account,
    formattedAccount,
    isDemo,
    isWrongNetwork,
    connectWallet,
    switchOrAddAmoyNetwork,
  } = useWeb3();

  const { loginWithWallet, loginWithCredentials } = useAuth();

  const isSessionExpired = queryParams.get("expired") === "true";
  const returnUrl = queryParams.get("returnUrl") || (isDonorContext ? "/donor/dashboard" : null);

  // Active Login Mode: 'wallet' | 'credentials'
  const [activeTab, setActiveTab] = useState("wallet");

  // Web3 SIWE Flow State: 'idle' | 'connecting' | 'requesting_challenge' | 'awaiting_signature' | 'verifying' | 'success' | 'error'
  const [authStep, setAuthStep] = useState("idle");
  const [walletError, setWalletError] = useState(null);

  // Email/Password Credentials State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingCredentials, setIsSubmittingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState(null);

  // 1. Web3 SIWE Wallet Login Handler
  const handleWalletSignIn = async () => {
    setWalletError(null);
    setAuthStep("connecting");

    try {
      let activeAccount = account;
      if (!activeAccount) {
        const conn = await connectWallet();
        if (!conn.success) {
          setWalletError("Wallet connection was rejected or cancelled.");
          setAuthStep("idle");
          return;
        }
        activeAccount = conn.account;
      }

      if (isWrongNetwork) {
        const switched = await switchOrAddAmoyNetwork();
        if (!switched) {
          setWalletError("Please switch to Polygon Amoy Testnet to proceed with cryptographic sign-in.");
          setAuthStep("idle");
          return;
        }
      }

      // Step 1: Request Challenge Nonce
      setAuthStep("requesting_challenge");
      const challenge = await authService.requestChallenge(activeAccount);

      // Step 2: Request Wallet Signature (personal_sign)
      setAuthStep("awaiting_signature");
      const signature = await authService.signChallenge(challenge.message, activeAccount, isDemo);

      // Step 3: Verify Signature and Issue Authenticated Session
      setAuthStep("verifying");
      const session = await authService.verifySession({
        wallet: activeAccount,
        signature,
        nonce: challenge.nonce,
        message: challenge.message,
        isDemo,
      });

      setAuthStep("success");

      // Update AuthContext
      await loginWithWallet(session);

      setTimeout(() => {
        if (returnUrl) {
          navigate(returnUrl);
        } else if (onLoginSuccess) {
          onLoginSuccess(session);
        } else {
          // Default role-aware routing
          routeByRole(session.activeRole || session.role || session.globalRole);
        }
      }, 700);
    } catch (err) {
      setWalletError(err.message || "Failed to complete wallet sign-in.");
      setAuthStep("error");
    }
  };

  // 2. Email/Password Login Handler
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setCredentialsError(null);

    if (!email || !password) {
      setCredentialsError("Please provide both email address and password.");
      return;
    }

    setIsSubmittingCredentials(true);
    try {
      const user = await loginWithCredentials(email, password);
      if (returnUrl) {
        navigate(returnUrl);
      } else if (onLoginSuccess) {
        onLoginSuccess(user);
      } else {
        routeByRole(user.role);
      }
    } catch (err) {
      setCredentialsError(err.message || "Invalid email or password.");
    } finally {
      setIsSubmittingCredentials(false);
    }
  };

  // Helper to route user based on their authorized role
  const routeByRole = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
      case "PLATFORM_ADMIN":
      case "PLATFORM_SUPER_ADMIN":
        navigate("/admin");
        break;
      case ROLES.AUDITOR:
      case "INDEPENDENT_AUDITOR":
        navigate("/auditor");
        break;
      case ROLES.FINANCE_OFFICER:
        navigate("/finance");
        break;
      case ROLES.PROJECT_MANAGER:
        navigate("/projects");
        break;
      case ROLES.DONOR:
      case "AUTHORIZED_DONOR":
      case "DONOR":
        navigate("/donor/dashboard");
        break;
      default:
        navigate("/ngo/dashboard");
        break;
    }
  };

  // Quick Demo Account Auto-Fill
  const handleQuickDemoSelect = (demoUser) => {
    setEmail(demoUser.email);
    setPassword("DemoPass2026!");
    setCredentialsError(null);
  };

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
            Don't have an account?
          </span>
          <button
            onClick={() => navigate("/signup")}
            className="text-xs font-semibold text-[#1D5FD0] hover:underline cursor-pointer"
          >
            Create Account ➔
          </button>
          <BackButton fallback="/" label="Back to Home" />
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-1 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D5FD0] font-mono">
              {isDonorContext ? "Donor Access Portal" : "Secure Web3 & Enterprise Authentication"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B]">
              {isDonorContext ? "Donor Sign In" : "Welcome Back"}
            </h1>
            <p className="text-xs text-[#64748B]">
              {isDonorContext
                ? "Sign in to access your personal contribution history, 80G tax certificates, and impact milestones."
                : "Sign in to manage donations, verify disbursements, or access NGO governance."}
            </p>
          </div>

          {/* Guest Donation Instant Action Banner */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-left shadow-sm">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                <Heart className="w-3.5 h-3.5 fill-[#00C9A7] text-[#00C9A7]" />
                <span>Donate Without Logging In</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-tight">
                No account or signup required. Complete an ordinary on-chain donation as a guest.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/#ngos")}
              className="flex-shrink-0 px-3 py-1.5 bg-[#00C9A7] hover:bg-[#00B796] active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Donate Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Session Expired Banner if triggered */}
          {isSessionExpired && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Your previous session has expired. Please authenticate again.</span>
            </div>
          )}

          {/* Auth Tab Selector */}
          <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("wallet")}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "wallet"
                  ? "bg-white text-[#071B3B] shadow-sm"
                  : "text-[#64748B] hover:text-[#071B3B]"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Web3 Wallet (SIWE)</span>
            </button>
            <button
              onClick={() => setActiveTab("credentials")}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "credentials"
                  ? "bg-white text-[#071B3B] shadow-sm"
                  : "text-[#64748B] hover:text-[#071B3B]"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>

          {/* TAB A: Web3 Wallet SIWE Flow */}
          {activeTab === "wallet" && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex flex-col gap-2 text-xs text-[#334155]">
                <div className="flex items-center gap-2 font-semibold text-[#1E3A8A]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>EIP-4361 Sign-In with Ethereum</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#475569]">
                  Signs a tamper-proof cryptographic challenge verifying wallet ownership. No private keys or funds are ever requested.
                </p>
              </div>

              {walletError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{walletError}</span>
                </div>
              )}

              <button
                onClick={handleWalletSignIn}
                disabled={authStep !== "idle" && authStep !== "error"}
                className="w-full py-3.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/95 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {authStep === "idle" || authStep === "error" ? (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>{account ? `Sign In with ${formattedAccount}` : "Connect & Sign In with Wallet"}</span>
                  </>
                ) : authStep === "connecting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Wallet...</span>
                  </>
                ) : authStep === "requesting_challenge" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting Challenge...</span>
                  </>
                ) : authStep === "awaiting_signature" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Awaiting Signature in MetaMask...</span>
                  </>
                ) : authStep === "verifying" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Session JWT...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Authenticated!</span>
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-[#94A3B8] font-mono">
                Polygon Amoy Network (Chain ID 80002)
              </div>
            </div>
          )}

          {/* TAB B: Email & Password Credentials Flow */}
          {activeTab === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
              {credentialsError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{credentialsError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[#071B3B]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.org"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#071B3B]">
                    Password
                  </label>
                  <span className="text-[11px] text-[#64748B]">Demo protected</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs text-[#071B3B] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingCredentials}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/95 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mt-1"
              >
                {isSubmittingCredentials ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Demo Profiles Quick Select */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#64748B]">
                    Fast Demo Fill (Phase 2):
                  </span>
                  <span className="text-[10px] text-slate-400">Click to fill credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Prioritize Donor profile first if in donor context */}
                  {[
                    DEMO_PROFILES.find((p) => p.role === ROLES.DONOR) || DEMO_PROFILES[5],
                    DEMO_PROFILES[1], // NGO Admin
                    DEMO_PROFILES[0], // Super Admin
                    DEMO_PROFILES[2], // Finance
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleQuickDemoSelect(p)}
                      className={`p-1.5 border rounded-lg text-left text-[11px] truncate transition-colors cursor-pointer ${
                        p.role === ROLES.DONOR
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 font-bold"
                          : "bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-200 text-[#334155]"
                      }`}
                      title={`${p.name} (${p.role})`}
                    >
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{p.role}</div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="text-center pt-2 border-t border-slate-100 flex flex-col gap-2 text-xs text-[#64748B]">
            <div className="flex items-center justify-center gap-1.5">
              <span>New donor?</span>
              <button
                onClick={() => navigate("/signup?tab=donor")}
                className="text-[#1D5FD0] font-semibold hover:underline cursor-pointer"
              >
                Create Donor Account
              </button>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <span>Are you a non-profit representative?</span>
              <button
                onClick={() => navigate("/signup?tab=ngo")}
                className="text-[#071B3B] font-semibold hover:underline cursor-pointer"
              >
                Register NGO
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-[#94A3B8]">
        TrustDonate • Blockchain-Enabled Transparent NGO Platform
      </footer>
    </div>
  );
};
