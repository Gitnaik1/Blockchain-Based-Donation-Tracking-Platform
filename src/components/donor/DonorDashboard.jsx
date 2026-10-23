import React, { useState, useEffect } from "react";
import {
  Heart,
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Repeat,
  Bell,
  Search,
  ShieldCheck,
  Building2,
  Info,
  User,
  Settings,
  Plus,
  Link,
  Check,
  Wallet,
  Lock,
  ArrowRight,
} from "lucide-react";
import { formatInr, shortenAddress, shortenTxHash } from "../../services/utils/tokenMath.js";
import { reportsService } from "../../services/reportsService.js";
import { donationService } from "../../services/donationService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useWeb3 } from "../../context/Web3Context";

const MY_DONATIONS = [
  {
    id: "don-self-1",
    ngoName: "Asha Foundation",
    project: "Clean Water Initiative",
    amountCrypto: "250.00 POL",
    amountInr: 25000,
    token: "POL",
    date: "23 Oct 2026, 10:24 AM",
    hash: "0x8f1c9902bc297f2b773b06bb22c4b1842a4d11d8",
    status: "Confirmed on Amoy",
    taxReceiptNo: "REC-AMOY-2026-4819",
  },
  {
    id: "don-self-2",
    ngoName: "Hope Horizon Schools",
    project: "Education for All",
    amountCrypto: "1,500.00 USDC",
    amountInr: 127500,
    token: "USDC",
    date: "12 Oct 2026, 04:15 PM",
    hash: "0x3f5c2901a812b4e72d93e114f6b21908a812b4e7",
    status: "Confirmed on Amoy",
    taxReceiptNo: "REC-AMOY-2026-3190",
  },
];

const IMPACT_MILESTONES = [
  {
    id: "imp-1",
    ngo: "Asha Foundation",
    title: "Vidarbha Borewell Phase 1 Yielding Clean Water",
    impactStatement: "Your 250 POL directly contributed to pump procurement for 350 families.",
    date: "20 Oct 2026",
    ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
  },
  {
    id: "imp-2",
    ngo: "Hope Horizon Schools",
    title: "50 Educational Android Tablets Delivered & Active",
    impactStatement: "Your 1,500 USDC enabled digital textbooks in 3 mountain classrooms.",
    date: "16 Oct 2026",
    ipfsCid: "QmZtmD2qt8STTujv7L9t7NnNV6K8L5YjP7Jv8gKz2f9T1R",
  },
];

export const DonorDashboard = ({ onOpenDonate, initialTab = "history" }) => {
  const { currentUser } = useAuth();
  const { account, connectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState(initialTab || "history");
  const [donations, setDonations] = useState(MY_DONATIONS);
  const [searchQuery, setSearchQuery] = useState("");

  // Claim Guest Donation state
  const [claimInput, setClaimInput] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [claimError, setClaimError] = useState(null);

  // Settings State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [taxSummaryAnnual, setTaxSummaryAnnual] = useState(true);
  const [anonymousLedger, setAnonymousLedger] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const totalInr = donations.reduce((sum, d) => sum + (d.amountInr || 0), 0);

  const handleDownloadReceipt = (d) => {
    const html = reportsService.generateReceiptHtml({
      ...d,
      donor: currentUser?.name || "Verified Donor",
      wallet: currentUser?.wallet || d.donorWallet || "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1",
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TrustDonate_Receipt_${d.hash.slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClaimGuestDonation = (e) => {
    e.preventDefault();
    setClaimError(null);
    setClaimSuccess(null);

    const query = claimInput.trim();
    if (!query) return;

    // Check if already in list
    if (donations.some((d) => d.hash.toLowerCase() === query.toLowerCase() || d.taxReceiptNo.toLowerCase() === query.toLowerCase())) {
      setClaimError("This donation is already linked to your donor profile.");
      return;
    }

    // Search existing transactions in donationService
    const liveTxs = donationService.getTransactions();
    const match = liveTxs.find(
      (t) => t.hash.toLowerCase() === query.toLowerCase() || (t.id && t.id.toLowerCase() === query.toLowerCase())
    );

    const newLinked = {
      id: `don-claimed-${Date.now()}`,
      ngoName: match?.recipient?.replace("Donation to ", "") || "Asha Foundation",
      project: "General Community Grant",
      amountCrypto: match ? `${match.amount} ${match.token}` : "100.00 USDC",
      amountInr: match?.amountInr || 8500,
      token: match?.token || "USDC",
      date: "Recently Linked",
      hash: match?.hash || query,
      status: "Confirmed on Amoy",
      taxReceiptNo: `REC-AMOY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setDonations([newLinked, ...donations]);
    setClaimSuccess(`Successfully linked donation (${shortenTxHash(newLinked.hash)}) to your 80G tax summary!`);
    setClaimInput("");
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  const filtered = donations.filter(
    (d) =>
      d.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 font-inter text-[#071B3B]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Donor Engagement Hub
            </span>
            <span className="text-xs text-[#64748B]">Personal Contributions &amp; 80G Tax Certificates</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[#071B3B] mt-1">
            Welcome, {currentUser?.name || "Verified Donor"}
          </h2>
        </div>

        {onOpenDonate && (
          <button
            onClick={onOpenDonate}
            className="px-4 py-2 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Make New Contribution</span>
          </button>
        )}
      </div>

      {/* Donor Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Lifetime Contributions</span>
          <span className="text-2xl font-bold font-outfit text-[#1E3A8A]">
            {formatInr(totalInr)}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold">Platinum Donor Tier</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Completed Transactions</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {donations.length} Verified
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Polygon Amoy Mined</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">Milestones Completed</span>
          <span className="text-2xl font-bold font-outfit text-[#00C9A7]">
            2 Initiatives
          </span>
          <span className="text-[10px] text-purple-700 font-medium">100% IPFS Evidence Validated</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-[#64748B]">80G Tax Certificates</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">
            {donations.length} Receipts
          </span>
          <span className="text-[10px] text-blue-600 font-semibold">Ready for Tax Filing</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { key: "history", label: "My Verified Donations" },
          { key: "impact", label: "Impact Milestones" },
          { key: "recurring", label: "Recurring Pledges" },
          { key: "profile", label: "Donor Profile & Wallet" },
          { key: "settings", label: "Tax & Preferences" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-[#071B3B] text-white shadow-sm"
                : "text-[#64748B] hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MY DONATIONS */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4">
          {/* Claim Guest Donation Tool Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[#1E3A8A]">Donated as a guest recently?</span>
              <span className="text-[#64748B]">
                Enter your transaction hash or 80G receipt number to link it to your personal donor profile.
              </span>
            </div>
            <form onSubmit={handleClaimGuestDonation} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="0x... or REC-..."
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value)}
                className="h-8 px-3 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono text-[#071B3B] outline-none focus:border-[#1E3A8A] flex-1 sm:w-56"
              />
              <button
                type="submit"
                className="h-8 px-3.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                Link Receipt
              </button>
            </form>
          </div>

          {claimSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{claimSuccess}</span>
            </div>
          )}

          {claimError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <Info className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{claimError}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Search by NGO, cause, transaction hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <th className="py-3.5 px-4">Beneficiary NGO &amp; Cause</th>
                    <th className="py-3.5 px-4">Contribution Amount</th>
                    <th className="py-3.5 px-4">Date &amp; Time</th>
                    <th className="py-3.5 px-4">PolygonScan Hash</th>
                    <th className="py-3.5 px-4 text-right">Receipt Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#071B3B]">{item.ngoName}</span>
                          <span className="text-[11px] text-[#1D5FD0]">{item.project}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#071B3B]">{formatInr(item.amountInr)}</span>
                          <span className="font-mono text-[10px] text-emerald-600 font-semibold">{item.amountCrypto}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B]">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`https://amoy.polygonscan.com/tx/${item.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-[#1D5FD0] hover:underline flex items-center gap-1"
                        >
                          <span>{shortenTxHash(item.hash, 6)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(item)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt ({item.taxReceiptNo})</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMPACT MILESTONES */}
      {activeTab === "impact" && (
        <div className="flex flex-col gap-4">
          {IMPACT_MILESTONES.map((m) => (
            <div
              key={m.id}
              className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#071B3B]">{m.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-[#1D5FD0] font-semibold">{m.ngo}</span>
                  </div>
                  <p className="text-[#64748B] text-xs">{m.impactStatement}</p>
                  <span className="text-[10px] text-slate-400">Milestone Completed: {m.date}</span>
                </div>
              </div>

              <a
                href={`https://ipfs.io/ipfs/${m.ipfsCid}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] rounded-lg text-xs font-semibold flex items-center gap-1.5 self-end sm:self-center transition-colors"
              >
                <span>View IPFS Evidence</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#1D5FD0]" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RECURRING PLEDGES */}
      {activeTab === "recurring" && (
        <div className="p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex flex-col gap-4 text-xs">
          <div className="flex items-center gap-2 text-[#071B3B]">
            <Repeat className="w-5 h-5 text-[#1D5FD0]" />
            <h3 className="text-base font-bold font-outfit">Recurring Contribution Model</h3>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 flex flex-col gap-2 leading-relaxed">
            <span className="font-bold">Transparent Non-Custodial Policy:</span>
            <span>
              TrustDonate operates with complete non-custodial integrity. We never store donor private keys or seed phrases. 
              Recurring contributions operate via scheduled monthly reminders that dispatch an on-chain transaction request directly to your MetaMask wallet for explicit one-click confirmation.
            </span>
          </div>

          <div className="p-4 border border-dashed border-slate-200 rounded-xl flex items-center justify-between text-[#64748B]">
            <span>Active Recurring Pledge: <strong>100 USDC / Month to Asha Foundation</strong></span>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
              Next Reminder: 01 Nov 2026
            </span>
          </div>
        </div>
      )}

      {/* TAB 4: DONOR PROFILE & WALLET */}
      {activeTab === "profile" && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col gap-6 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-lg">
              {currentUser?.name?.charAt(0) || "D"}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-[#071B3B]">{currentUser?.name || "Verified Donor"}</span>
              <span className="text-slate-500">{currentUser?.email || "donor@trustdonate.org"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="p-4 bg-slate-50 rounded-xl flex flex-col gap-1.5">
              <span className="text-[#64748B] font-semibold">Authentication Account Type</span>
              <span className="text-sm font-bold text-[#071B3B]">Individual Public Patron</span>
              <span className="text-[11px] text-emerald-600 font-semibold">Tier: Verified Tax Exempt Patron</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl flex flex-col gap-1.5">
              <span className="text-[#64748B] font-semibold">Linked Web3 Wallet</span>
              <span className="font-mono text-xs text-[#071B3B] truncate">
                {currentUser?.wallet || account || "No wallet linked yet"}
              </span>
              {!currentUser?.wallet && !account && (
                <button
                  onClick={connectWallet}
                  className="mt-1 px-3 py-1 bg-[#1E3A8A] text-white font-semibold rounded-lg text-xs self-start cursor-pointer"
                >
                  Connect MetaMask
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS & PREFERENCES */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-xs">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold font-outfit text-[#071B3B]">Donor Notification &amp; Tax Preferences</h3>
            <p className="text-[#64748B]">Manage your email updates and public ledger privacy options.</p>
          </div>

          {savedSettings && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Your preferences have been saved successfully.</span>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <div className="flex flex-col">
                <span className="font-semibold text-[#071B3B]">Milestone Evidence Email Alerts</span>
                <span className="text-slate-500 text-[11px]">Receive an email when projects you fund submit verified IPFS proofs.</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E3A8A]"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <div className="flex flex-col">
                <span className="font-semibold text-[#071B3B]">Annual 80G Tax Summary Package</span>
                <span className="text-slate-500 text-[11px]">Automatically compile all annual receipts into a single downloadable PDF package.</span>
              </div>
              <input
                type="checkbox"
                checked={taxSummaryAnnual}
                onChange={(e) => setTaxSummaryAnnual(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E3A8A]"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer">
              <div className="flex flex-col">
                <span className="font-semibold text-[#071B3B]">Public Stream Pseudonymity</span>
                <span className="text-slate-500 text-[11px]">Display your name as initials on the public live stream while keeping on-chain tax validity.</span>
              </div>
              <input
                type="checkbox"
                checked={anonymousLedger}
                onChange={(e) => setAnonymousLedger(e.target.checked)}
                className="w-4 h-4 rounded text-[#1E3A8A]"
              />
            </label>
          </div>

          <button
            type="submit"
            className="self-start px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            Save Preferences
          </button>
        </form>
      )}
    </div>
  );
};
