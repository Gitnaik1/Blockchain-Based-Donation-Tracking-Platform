import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "../../context/RouterContext.jsx";
import { resolveFallbackRoute } from "../../config/roles.js";

/**
 * Reusable BackButton component with context-aware fallbacks.
 * Prevents external navigation and safely routes to relevant internal dashboards
 * when opened directly in a new tab without history.
 */
export const BackButton = ({
  fallback = null,
  label = "Go Back",
  className = "",
  variant = "default", // 'default' | 'subtle' | 'ghost' | 'pill'
}) => {
  const { currentPath, hasHistory, goBack, navigate } = useRouter();

  // If on public home, do not display a misleading back button
  if (currentPath === "/" || currentPath === "/home") {
    return null;
  }

  // Derive context-aware fallback route if not explicitly provided
  const getContextFallback = () => {
    if (fallback) return fallback;
    return resolveFallbackRoute(currentPath);
  };

  const handleBackClick = (e) => {
    e.preventDefault();
    const resolvedFallback = getContextFallback();
    if (hasHistory) {
      goBack(resolvedFallback);
    } else {
      navigate(resolvedFallback, { replace: true });
    }
  };

  const variantStyles = {
    default:
      "bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#071B3B] shadow-sm hover:border-slate-300",
    subtle:
      "bg-slate-100 hover:bg-slate-200 text-[#071B3B]",
    ghost:
      "bg-transparent hover:bg-slate-100/80 text-[#64748B] hover:text-[#071B3B]",
    pill:
      "bg-blue-50 hover:bg-blue-100 text-[#1D5FD0] border border-blue-200 font-semibold rounded-full",
  };

  return (
    <button
      type="button"
      onClick={handleBackClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-inter font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
      aria-label={label}
      title={`Navigate back to ${getContextFallback()}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
      <span>{label}</span>
    </button>
  );
};
