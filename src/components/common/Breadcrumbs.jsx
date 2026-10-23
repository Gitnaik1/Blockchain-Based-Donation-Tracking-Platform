import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { useRouter } from "../../context/RouterContext.jsx";

/**
 * Clickable Breadcrumbs component for deep workspace pages.
 * @param {Array<{ label: string, path?: string, active?: boolean }>} items
 */
export const Breadcrumbs = ({ items = [], className = "" }) => {
  const { navigate } = useRouter();

  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-inter text-[#64748B] ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 hover:text-[#1E3A8A] transition-colors cursor-pointer text-[#64748B]"
            title="Go to Home"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </button>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              {isLast || !item.path ? (
                <span className={`font-semibold ${item.active || isLast ? "text-[#071B3B]" : "text-[#64748B]"}`}>
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={() => navigate(item.path)}
                  className="hover:text-[#1E3A8A] transition-colors cursor-pointer text-[#64748B] hover:underline"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
