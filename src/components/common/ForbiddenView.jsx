import React from "react";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { ROLE_LABELS } from "../../config/roles.js";

export const ForbiddenView = ({
  requiredPermission,
  requiredRole,
  onBack,
}) => {
  const { activeRole, switchProfile } = useAuth();

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6 text-center font-inter">
      <div className="max-w-md bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-8 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 font-mono">
            HTTP 403 • Access Restricted
          </span>
          <h2 className="text-2xl font-bold font-outfit text-[#071B3B]">
            Permission Required
          </h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Your active role (<strong>{ROLE_LABELS[activeRole] || activeRole}</strong>) does not have authorization to view this module.
          </p>
        </div>

        {(requiredPermission || requiredRole) && (
          <div className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] font-mono text-[#475569] flex flex-col gap-1">
            {requiredRole && <div>Required Role: <span className="font-bold text-[#0F172A]">{requiredRole}</span></div>}
            {requiredPermission && <div>Required Permission: <span className="font-bold text-[#0F172A]">{requiredPermission}</span></div>}
          </div>
        )}

        <div className="flex items-center gap-3 w-full pt-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
