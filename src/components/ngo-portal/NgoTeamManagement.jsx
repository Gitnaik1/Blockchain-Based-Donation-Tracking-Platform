import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Mail,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Check,
  X,
  FileText,
  Building2,
  Trash2,
  Search,
} from "lucide-react";
import { ROLES, ROLE_LABELS } from "../../config/roles.js";
import { shortenAddress } from "../../services/utils/tokenMath.js";

const INITIAL_MEMBERS = [
  {
    id: "mem-1",
    name: "Dr. Alok Verma",
    email: "alok.verma@ashafoundation.org",
    wallet: "0x7a3B19D412bF249f7b189Ec24A00518774f2E",
    role: ROLES.NGO_ADMIN,
    isSigner: true,
    status: "Active",
    joinedDate: "12 Jan 2024",
  },
  {
    id: "mem-2",
    name: "Ramesh Kothari",
    email: "ramesh.cfo@ashafoundation.org",
    wallet: "0x51E2b43538446c761eA8196AfC88Fe0a91Da304B",
    role: ROLES.FINANCE_OFFICER,
    isSigner: true,
    status: "Active",
    joinedDate: "04 Mar 2024",
  },
  {
    id: "mem-3",
    name: "Dr. Sunita Menon",
    email: "sunita.pm@ashafoundation.org",
    wallet: "0x3A2190B74dE865103AbF992E3c467B1028919a3B",
    role: ROLES.PROJECT_MANAGER,
    isSigner: true,
    status: "Active",
    joinedDate: "15 Apr 2024",
  },
  {
    id: "mem-4",
    name: "Karan Johar (Field Evaluator)",
    email: "karan.audit@evaluations.org",
    wallet: "0x91F5B612E0987c320dE51A186B1095d315682C89",
    role: ROLES.AUDITOR,
    isSigner: false,
    status: "Invited",
    joinedDate: "21 Oct 2026 (Pending Signature)",
  },
  {
    id: "mem-5",
    name: "Vikram Batra",
    email: "vikram.former@ashafoundation.org",
    wallet: "0x7C04f42E64A5F43e49e29aD348E2801F6E2c659B",
    role: ROLES.PROJECT_MANAGER,
    isSigner: false,
    status: "Revoked",
    joinedDate: "Terminated Aug 2026",
  },
];

export const NgoTeamManagement = () => {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    wallet: "",
    role: ROLES.PROJECT_MANAGER,
    isSigner: false,
  });

  // Modal for changing role or revoking
  const [selectedMember, setSelectedMember] = useState(null);
  const [actionType, setActionType] = useState(null); // 'change_role' | 'revoke'
  const [newRole, setNewRole] = useState(ROLES.PROJECT_MANAGER);
  const [notification, setNotification] = useState(null);

  const activeSignerCount = members.filter((m) => m.isSigner && m.status === "Active").length;

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    const newMember = {
      id: `mem-${Date.now()}`,
      name: inviteForm.name,
      email: inviteForm.email,
      wallet: inviteForm.wallet,
      role: inviteForm.role,
      isSigner: inviteForm.isSigner,
      status: "Invited",
      joinedDate: "Just invited",
    };

    setMembers([newMember, ...members]);
    setIsInviteOpen(false);
    setInviteForm({
      name: "",
      email: "",
      wallet: "",
      role: ROLES.PROJECT_MANAGER,
      isSigner: false,
    });
    setNotification(`Invitation dispatched to ${newMember.email}. Member status set to Invited.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExecuteMemberAction = () => {
    if (!selectedMember) return;

    if (actionType === "change_role") {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id ? { ...m, role: newRole } : m
        )
      );
      setNotification(`Role updated to ${ROLE_LABELS[newRole]} for ${selectedMember.name}.`);
    } else if (actionType === "revoke") {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id
            ? { ...m, status: "Revoked", isSigner: false }
            : m
        )
      );
      setNotification(`Membership revoked for ${selectedMember.name}. Access terminated.`);
    }

    setSelectedMember(null);
    setActionType(null);
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 font-inter text-[#071B3B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
            Team Governance &amp; Permissions Directory
          </h2>
          <p className="text-xs sm:text-[13px] text-[#66738A]">
            Manage authorized administrative members, project managers, auditors, and multi-sig signers.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#00C9A7]/20 flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Signer Safeguard Card */}
      <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[#071B3B] text-sm font-outfit">
              Multi-Sig Treasury Registry: {activeSignerCount} Active Signers
            </span>
            <span className="text-purple-800 text-[11px]">
              Minimum 3-of-5 threshold required for automated on-chain fund disbursements.
            </span>
          </div>
        </div>
        <span className="px-3 py-1 bg-purple-200/80 text-purple-900 font-mono rounded-lg font-bold text-[11px] self-start sm:self-auto">
          Threshold: 3 Required
        </span>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search team members by name, email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#071B3B] outline-none focus:border-[#00C9A7]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Wallet Key</th>
                <th className="py-3.5 px-4">Treasury Signer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#071B3B]">{m.name}</span>
                      <span className="text-[#64748B] text-[11px]">{m.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1D5FD0]">
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10px] text-[#64748B]">
                      {m.wallet ? shortenAddress(m.wallet, 4) : "Unlinked"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {m.isSigner ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        <KeyRound className="w-3 h-3" />
                        <span>Signer</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Non-Signer</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === "Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : m.status === "Invited"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {m.status !== "Revoked" && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setActionType("change_role");
                            setNewRole(m.role);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[#071B3B] rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(m);
                            setActionType("revoke");
                          }}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#00C9A7]" />
                <h3 className="font-bold font-outfit text-base text-[#071B3B]">
                  Invite Authorized Team Member
                </h3>
              </div>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Sharma"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Corporate / Organization Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@ashafoundation.org"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Ethereum Wallet Address (Polygon Amoy)</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={inviteForm.wallet}
                  onChange={(e) => setInviteForm({ ...inviteForm, wallet: e.target.value })}
                  className="h-10 px-3 border border-[#E2E8F0] rounded-lg font-mono outline-none focus:border-[#00C9A7]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#64748B]">Role Assignment</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="h-10 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                >
                  <option value={ROLES.FINANCE_OFFICER}>Finance Officer</option>
                  <option value={ROLES.PROJECT_MANAGER}>Project Manager</option>
                  <option value={ROLES.AUDITOR}>Independent Auditor</option>
                  <option value={ROLES.NGO_ADMIN}>NGO Administrator</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1">
                <input
                  type="checkbox"
                  id="signer-checkbox"
                  checked={inviteForm.isSigner}
                  onChange={(e) => setInviteForm({ ...inviteForm, isSigner: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="signer-checkbox" className="font-semibold text-[#071B3B] cursor-pointer">
                  Register as Multi-Sig Treasury Signer
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00C9A7] hover:bg-[#00B796] text-white font-semibold rounded-lg shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE / REVOKE MODAL WITH CRITICAL SAFEGUARD WARNING */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold font-outfit text-base text-[#071B3B]">
                {actionType === "change_role" ? "Change Member Role" : "Revoke Organization Membership"}
              </h3>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <p className="text-[#475569]">
                Target Member: <strong>{selectedMember.name}</strong> ({selectedMember.email})
              </p>

              {/* CRITICAL WARNING CHECK */}
              {selectedMember.isSigner && activeSignerCount <= 3 && actionType === "revoke" && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>CRITICAL SAFEGUARD:</strong> Revoking this signer reduces active signers below the 3-of-5 threshold. Treasury multi-sig disbursements will be halted until a replacement signer is designated.
                  </span>
                </div>
              )}

              {actionType === "change_role" && (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[#64748B]">Select New Role:</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="h-10 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg outline-none focus:border-[#00C9A7]"
                  >
                    <option value={ROLES.NGO_ADMIN}>NGO Administrator</option>
                    <option value={ROLES.FINANCE_OFFICER}>Finance Officer</option>
                    <option value={ROLES.PROJECT_MANAGER}>Project Manager</option>
                    <option value={ROLES.AUDITOR}>Independent Auditor</option>
                  </select>
                </div>
              )}

              {actionType === "revoke" && (
                <p className="text-slate-600">
                  Are you sure you want to revoke this user's membership? Their wallet will immediately lose permission to access NGO management routes and sign milestone releases.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteMemberAction}
                className={`flex-1 py-2.5 text-white font-semibold text-xs rounded-xl shadow-sm ${
                  actionType === "change_role" ? "bg-[#1E3A8A] hover:bg-blue-800" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Confirm {actionType === "change_role" ? "Role Change" : "Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
