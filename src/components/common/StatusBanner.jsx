import React from "react";
import { Info, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

export const StatusBanner = ({
  type = "info", // "info" | "warning" | "error" | "mock"
  title,
  message,
  action,
  className = "",
}) => {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    mock: "bg-indigo-50 border-indigo-200 text-indigo-900",
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
    error: <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />,
    mock: <Info className="w-4 h-4 text-indigo-600 flex-shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={`p-3 rounded-xl border flex items-start gap-3 text-xs font-inter transition-all ${styles[type] || styles.info} ${className}`}
    >
      {icons[type]}
      <div className="flex-1">
        {title && <span className="font-bold block mb-0.5">{title}</span>}
        <span className="leading-relaxed">{message}</span>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};
