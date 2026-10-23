import React from "react";
import { Home, Compass, ArrowLeft } from "lucide-react";
import { useRouter } from "../../context/RouterContext.jsx";
import { BackButton } from "./BackButton.jsx";

export const NotFoundPage = () => {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-inter text-[#071B3B]">
      {/* Header Bar */}
      <header className="w-full bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-[#1E3A8A] font-extrabold font-outfit text-xl cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#1E3A8A] rounded-md flex items-center justify-center text-white font-bold">
            T
          </div>
          <span>TrustDonate</span>
        </button>
        <BackButton fallback="/" label="Back to Safety" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-[#E2E8F0] shadow-sm rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
            <Compass className="w-10 h-10 stroke-[2] animate-pulse" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1D5FD0] font-mono">
              Error 404 • Page Not Found
            </span>
            <h1 className="text-3xl font-extrabold font-outfit text-[#071B3B]">
              Lost in Decentralization?
            </h1>
            <p className="text-sm text-[#64748B] leading-relaxed">
              The page or resource you requested does not exist or may have been moved to another governance partition.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              onClick={() => navigate("/")}
              className="w-full sm:flex-1 py-3 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </button>
            <BackButton fallback="/" label="Go Back" className="w-full sm:w-auto py-3 px-4 justify-center" />
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="text-center py-6 text-xs text-[#94A3B8]">
        TrustDonate Blockchain-Enabled Transparent NGO Platform • Polygon Amoy
      </footer>
    </div>
  );
};
