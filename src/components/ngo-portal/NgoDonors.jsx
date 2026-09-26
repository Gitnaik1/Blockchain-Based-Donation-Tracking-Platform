import React, { useState } from "react";
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
} from "lucide-react";

const INITIAL_DONORS = [
  {
    id: "don-1",
    name: "Meera Subramanian",
    wallet: "0x3A21...9a3B",
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
    wallet: "0x91F5...2C89",
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
    wallet: "0x2D4a...814E",
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
    wallet: "0x7C04...659B",
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
    wallet: "0x51E2...304B",
    tier: "Silver",
    lifetimeInr: 45000,
    lifetimeCrypto: "450 USDC",
    donationsCount: 3,
    preferredCause: "Clean Water Initiative",
    lastDonated: "22 May 2026",
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setSelectedDonor(null);
    }, 1500);
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
      <div>
        <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
          Donor Community &amp; CRM
        </h2>
        <p className="text-xs sm:text-[13px] text-[#66738A]">
          Engage with transparent on-chain benefactors and dispatch verified impact updates.
        </p>
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
          <span className="text-[11px] font-medium text-[#64748B]">Platinum Donors (&gt;₹1L)</span>
          <span className="text-2xl font-bold font-outfit text-[#071B3B]">34</span>
          <span className="text-[10px] text-slate-500 font-medium">Key philanthropists</span>
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
                <th className="py-3.5 px-4">Donor Name &amp; Wallet</th>
                <th className="py-3.5 px-4">Tier Status</th>
                <th className="py-3.5 px-4">Lifetime Contribution</th>
                <th className="py-3.5 px-4">Supported Cause</th>
                <th className="py-3.5 px-4">Last Active</th>
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
                        className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-[#071B3B]">{d.name}</span>
                        <span className="font-mono text-[10px] text-[#64748B]">{d.wallet}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        d.tier === "Platinum"
                          ? "bg-purple-100 text-purple-700"
                          : d.tier === "Gold"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {d.tier} Patron
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#071B3B]">
                        ₹{d.lifetimeInr.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-mono text-[#00C9A7]">
                        {d.lifetimeCrypto} • {d.donationsCount} gifts
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px]">
                      {d.preferredCause}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B]">
                    {d.lastDonated}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedDonor(d)}
                      className="px-3 py-1.5 bg-[#071B3B] hover:bg-[#123F8C] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors cursor-pointer"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Send Update</span>
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
                    Send Verified Impact Update
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    To: {selectedDonor.name} ({selectedDonor.wallet})
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedDonor(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#64748B]">Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7] resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Automatically attaches IPFS audit receipt and PolygonScan proof.</span>
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
                      <span>Sent Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch On-Chain Note</span>
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
