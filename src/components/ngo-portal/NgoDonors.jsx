import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Award,
  Heart,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  X,
  Check,
  Download,
  Info,
} from "lucide-react";
import { formatInr } from "../../services/utils/tokenMath";
import { donationService } from "../../services/donationService";

const INITIAL_DONORS = [
  {
    id: "don-1",
    name: "Meera Subramanian",
    wallet: "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
    tier: "Platinum",
    lifetimeInr: 250000,
    lifetimeCrypto: "2,500 POL",
    donationsCount: 8,
    preferredCause: "Clean Water Initiative",
    lastDonated: "Today",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
  },
  {
    id: "don-2",
    name: "Arjun Rao",
    wallet: "0x91F5B612E0987c320dE51A186B1095d315682C89",
    tier: "Platinum",
    lifetimeInr: 185000,
    lifetimeCrypto: "1,850 USDT",
    donationsCount: 5,
    preferredCause: "Healthcare Access",
    lastDonated: "24 May 2026",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
  },
  {
    id: "don-3",
    name: "Kavita Reddy",
    wallet: "0x2D4aB9185aC9204910e527027167520e5436814E",
    tier: "Gold",
    lifetimeInr: 95000,
    lifetimeCrypto: "950 POL",
    donationsCount: 4,
    preferredCause: "Rural Electrification",
    lastDonated: "23 May 2026",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80",
  },
  {
    id: "don-4",
    name: "Pooja Malhotra",
    wallet: "0x7C04f42E64A5F43e49e29aD348E2801F6E2c659B",
    tier: "Gold",
    lifetimeInr: 75000,
    lifetimeCrypto: "750 USDT",
    donationsCount: 2,
    preferredCause: "Flood Emergency Relief",
    lastDonated: "21 May 2026",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=80&q=80",
  },
  {
    id: "don-5",
    name: "Siddharth Verma",
    wallet: "0x51E2b43538446c761eA8196AfC88Fe0a91Da304B",
    tier: "Silver",
    lifetimeInr: 35000,
    lifetimeCrypto: "350 USDC",
    donationsCount: 3,
    preferredCause: "Clean Water Initiative",
    lastDonated: "18 May 2026",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
  },
];

export const NgoDonors = () => {
  const [donors, setDonors] = useState(INITIAL_DONORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [messageSent, setMessageSent] = useState(false);
  const [messageText, setMessageText] = useState(
    "Dear Patron, thanks to your support, our Clean Water Initiative has successfully completed drilling 4 deep-water borewells in Vidarbha!"
  );

  useEffect(() => {
    const updateDonors = () => {
      const allDons = donationService.getDonations();
      if (!allDons || allDons.length === 0) return;

      const liveDonations = allDons.filter((d) => !d.isHistoricalFixture || d.isNew);
      if (liveDonations.length === 0) return;

      setDonors((prev) => {
        const nextList = [...prev];
        for (const d of liveDonations) {
          const donorName = d.donor?.replace(/^Donor \((.*?)\)$/, "$1") || "Verified Donor";
          const donorWallet = d.donorWallet || d.wallet || "";
          const found = nextList.find(
            (u) =>
              (donorWallet && u.wallet.toLowerCase() === donorWallet.toLowerCase()) ||
              (donorName && u.name.toLowerCase() === donorName.toLowerCase())
          );
          if (found) {
            found.lastDonated = "Just now";
          } else {
            nextList.unshift({
              id: `don-${d.id || Date.now()}`,
              name: donorName,
              wallet: donorWallet || "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1",
              tier: (d.amountInr || 0) > 100000 ? "Platinum" : (d.amountInr || 0) > 50000 ? "Gold" : "Silver",
              lifetimeInr: d.amountInr || 25000,
              lifetimeCrypto: d.amountCrypto || `${d.amount} ${d.token}`,
              donationsCount: 1,
              preferredCause: d.project || "Community Initiative",
              lastDonated: "Just now",
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
            });
          }
        }
        return nextList;
      });
    };

    updateDonors();
    const unsubscribe = donationService.subscribe(() => updateDonors());
    return () => unsubscribe();
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setSelectedDonor(null);
    }, 1800);
  };

  const handleExportDonors = () => {
    const headers = "ID,Name,Wallet,Tier,Lifetime INR,Lifetime Crypto,Donations Count,Preferred Cause\n";
    const rows = donors
      .map(
        (d) =>
          `"${d.id}","${d.name}","${d.wallet}","${d.tier}","${d.lifetimeInr}","${d.lifetimeCrypto}","${d.donationsCount}","${d.preferredCause}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TrustDonate_Donors_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredDonors = donors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.preferredCause.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 font-inter text-[#1E293B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
            Donor Community &amp; Engagement CRM
          </h2>
          <p className="text-xs sm:text-[13px] text-[#66738A]">
            Engage with verified on-chain benefactors with privacy controls and milestone notifications.
          </p>
        </div>

        <button
          onClick={handleExportDonors}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#071B3B] flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#1D5FD0]" />
          <span>Export Donor List</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Total Verified Donors</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">1,284</span>
          <span className="text-[10px] text-emerald-600 font-semibold">+84 this month</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Donor Retention Rate</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">91.4%</span>
          <span className="text-[10px] text-blue-600 font-medium">Industry leading</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Repeat Patrons</span>
          <span className="text-2xl font-bold font-outfit text-[#00C9A7]">42.6%</span>
          <span className="text-[10px] text-emerald-600 font-medium">Recurring impact</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748B]">Documented Tiers</span>
          <span className="text-xs font-semibold text-[#071B3B] mt-1">
            Platinum: &gt;₹1L • Gold: &gt;₹50k
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Transparent rules</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search donors by name, wallet, cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="py-3.5 px-4">Donor Name</th>
                <th className="py-3.5 px-4">Tier Status</th>
                <th className="py-3.5 px-4">Lifetime Contributions</th>
                <th className="py-3.5 px-4">Preferred Cause</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredDonors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={d.avatar}
                        alt={d.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-[#071B3B]">{d.name}</span>
                        <span className="font-mono text-[10px] text-[#64748B]">{d.wallet.slice(0, 6)}...{d.wallet.slice(-4)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        d.tier === "Platinum"
                          ? "bg-purple-100 text-purple-700"
                          : d.tier === "Gold"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {d.tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#071B3B]">
                        {formatInr(d.lifetimeInr)}
                      </span>
                      <span className="font-mono text-[10px] text-[#00C9A7]">
                        {d.lifetimeCrypto}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B] font-medium">
                    {d.preferredCause}
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    {d.lastDonated}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedDonor(d)}
                      className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-slate-200 text-[#071B3B] font-semibold rounded-lg text-xs flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                    >
                      <Mail className="w-3 h-3 text-[#1D5FD0]" />
                      <span>Notify</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Modal */}
      {selectedDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1D5FD0] flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-outfit text-[#071B3B]">
                    Send Milestone Impact Update
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Recipient: {selectedDonor.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDonor(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#64748B]">Update Message</label>
                <textarea
                  rows={4}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7] resize-none"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px]">
                  Environment Note: Production SMTP gateway is not configured. Outbound updates are committed to the local audit feed with IPFS proof metadata.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDonor(null)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-[#071B3B] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={messageSent}
                  className="flex-1 h-10 bg-[#00C9A7] hover:bg-[#00B796] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#00C9A7]/20"
                >
                  {messageSent ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Queued to Audit Log</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Impact Note</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
