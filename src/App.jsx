import React, { useState, useEffect } from "react";
import { Web3Provider } from "./context/Web3Context";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { RouterProvider, useRouter } from "./context/RouterContext.jsx";
import { ROLES, PERMISSIONS } from "./config/roles.js";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { StatsBand } from "./components/StatsBand";
import { HowItWorks } from "./components/HowItWorks";
import { FeaturedNgos } from "./components/FeaturedNgos";
import { LiveLedger } from "./components/LiveLedger";
import { TransparencySection } from "./components/TransparencySection";
import { AboutSection } from "./components/AboutSection";
import { Footer } from "./components/Footer";
import { DonateModal } from "./components/DonateModal";
import { NgoDetailsModal } from "./components/NgoDetailsModal";
import { NgoDashboard } from "./components/ngo-portal/NgoDashboard";
import { LoginPage } from "./components/auth/LoginPage.jsx";
import { SignupPage } from "./components/auth/SignupPage.jsx";
import { PublicReceiptView } from "./components/common/PublicReceiptView.jsx";
import { NotFoundPage } from "./components/common/NotFoundPage.jsx";
import { ProtectedRoute } from "./components/common/ProtectedRoute.jsx";
import { donationService } from "./services/donationService";

export function AppContent() {
  const { currentPath, navigate } = useRouter();
  const { logout } = useAuth();

  const [ngoDashboardTab, setNgoDashboardTab] = useState("Dashboard");
  const [ngos, setNgos] = useState(() => donationService.getNgos());
  const [transactions, setTransactions] = useState(() => donationService.getTransactions());
  const [ngoDonations, setNgoDonations] = useState(() => donationService.getDonations());

  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedNgoForDonate, setSelectedNgoForDonate] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedNgoForDetails, setSelectedNgoForDetails] = useState(null);

  // Sync dashboard tab based on route
  useEffect(() => {
    if (currentPath === "/admin") setNgoDashboardTab("Super Admin");
    else if (currentPath === "/auditor") setNgoDashboardTab("Auditor");
    else if (currentPath === "/finance") setNgoDashboardTab("Finance");
    else if (currentPath === "/projects") setNgoDashboardTab("Projects");
    else if (currentPath.startsWith("/donor")) setNgoDashboardTab("Donor Portal");
    else if (currentPath === "/approvals") setNgoDashboardTab("Approvals");
    else if (currentPath === "/risk") setNgoDashboardTab("Risk Alerts");
    else if (currentPath === "/analytics") setNgoDashboardTab("Analytics");
    else if (currentPath === "/documents") setNgoDashboardTab("Documents");
    else if (currentPath === "/ngo/dashboard") setNgoDashboardTab("Dashboard");
  }, [currentPath]);

  // Subscribe to authoritative donation service updates
  useEffect(() => {
    const unsubscribe = donationService.subscribe((state) => {
      if (state.ngos) setNgos(state.ngos);
      if (state.transactions) setTransactions(state.transactions);
      if (state.donations) setNgoDonations(state.donations);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenDonate = (ngo = null) => {
    setSelectedNgoForDonate(ngo || ngos[0]);
    setIsDonateOpen(true);
  };

  const handleOpenDetails = (ngo) => {
    setSelectedNgoForDetails(ngo);
    setIsDetailsOpen(true);
  };

  const handleViewInLedger = () => {
    setNgoDashboardTab("Donations");
    navigate("/ngo/dashboard");
  };

  const handleDonationComplete = (newTx, ngoId, amount) => {
    const finalDonorWallet = (newTx.fullWallet && newTx.fullWallet !== "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1")
      ? newTx.fullWallet
      : (account || currentUser?.wallet || newTx.fullWallet || "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1");

    const finalDonorName = currentUser?.name
      || (newTx.donor && !newTx.donor.startsWith("0x7a8c") ? newTx.donor : (account ? shortenAddress(account) : "Verified Donor"));

    donationService.addDonation({
      txHash: newTx.hash,
      amount: amount,
      token: newTx.token,
      ngoId: ngoId,
      ngoName: newTx.ngoName,
      project: newTx.project || newTx.ngoName,
      taxReceiptNo: newTx.taxReceiptNo,
      donorWallet: finalDonorWallet,
      donorName: finalDonorName,
      status: "Confirmed",
      isSimulated: newTx.isSimulated || false,
    });

    // Also record in backend API if available
    try {
      fetch(`${APP_CONFIG.apiBaseUrl}/donations/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          txHash: newTx.hash,
          ngoId: ngoId,
          donorAddress: newTx.fullWallet,
          donorName: newTx.donor,
          tokenSymbol: newTx.token,
          amount: String(amount),
        }),
      }).catch((err) => {
        console.warn("Could not sync donation to backend API:", err);
      });
    } catch {}
  };

  const handleExploreClick = () => {
    const el = document.getElementById("ngos");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavigateToNgoPortal = (tab = "Dashboard") => {
    if (tab && typeof tab === "string") {
      setNgoDashboardTab(tab);
    }
    if (tab === "Super Admin") navigate("/admin");
    else if (tab === "Auditor") navigate("/auditor");
    else if (tab === "Finance") navigate("/finance");
    else if (tab === "Projects") navigate("/projects");
    else if (tab === "Donor Portal") navigate("/donor/dashboard");
    else navigate("/ngo/dashboard");
  };

  // Route Rendering
  const renderCurrentRoute = () => {
    // 1. Public Homepage
    if (currentPath === "/" || currentPath === "/home" || currentPath === "") {
      return (
        <div className="min-h-screen bg-white text-brand-navy flex flex-col font-inter">
          <Header
            onOpenDonate={() => handleOpenDonate()}
            onNavigateToNgoPortal={handleNavigateToNgoPortal}
          />
          <main className="flex-1">
            <Hero
              onOpenDonate={() => handleOpenDonate()}
              onExploreClick={handleExploreClick}
            />
            <StatsBand />
            <HowItWorks />
            <FeaturedNgos
              ngos={ngos}
              onSelectNgo={handleOpenDetails}
              onDonateToNgo={(ngo) => handleOpenDonate(ngo)}
            />
            <LiveLedger transactions={transactions} />
            <TransparencySection />
            <AboutSection />
          </main>
          <Footer />
        </div>
      );
    }

    // 2. Authentication Pages
    if (
      currentPath === "/login" ||
      currentPath === "/donor/login" ||
      currentPath === "/ngo-login"
    ) {
      return (
        <LoginPage
          onLoginSuccess={(session) => {
            if (session?.role === ROLES.SUPER_ADMIN) navigate("/admin");
            else if (session?.role === ROLES.AUDITOR) navigate("/auditor");
            else if (session?.role === ROLES.FINANCE_OFFICER) navigate("/finance");
            else if (session?.role === ROLES.PROJECT_MANAGER) navigate("/projects");
            else if (session?.role === ROLES.DONOR) navigate("/donor/dashboard");
            else navigate("/ngo/dashboard");
          }}
        />
      );
    }

    if (currentPath === "/signup" || currentPath === "/donor/signup") {
      return <SignupPage />;
    }

    // 3. Public Verification & Receipts
    if (
      currentPath === "/receipts" ||
      currentPath === "/receipt" ||
      currentPath.startsWith("/receipt/")
    ) {
      return <PublicReceiptView onOpenDonate={() => handleOpenDonate()} />;
    }

    // 4. NGO Main Dashboard & Workspaces
    if (currentPath === "/ngo/dashboard" || currentPath.startsWith("/ngo/")) {
      return (
        <ProtectedRoute
          requiredRoles={[
            ROLES.NGO_ADMIN,
            ROLES.FINANCE_OFFICER,
            ROLES.PROJECT_MANAGER,
            ROLES.AUDITOR,
            ROLES.SUPER_ADMIN,
            ROLES.VIEWER,
            ROLES.DONOR,
          ]}
        >
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab={ngoDashboardTab || "Dashboard"}
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    // 4. Role-Specific Direct Routes
    if (currentPath === "/finance") {
      return (
        <ProtectedRoute
          requiredRoles={[ROLES.FINANCE_OFFICER, ROLES.NGO_ADMIN, ROLES.SUPER_ADMIN]}
          requiredPermission={PERMISSIONS.TREASURY_PROPOSE}
        >
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Finance"
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    if (currentPath === "/projects") {
      return (
        <ProtectedRoute
          requiredRoles={[ROLES.PROJECT_MANAGER, ROLES.NGO_ADMIN, ROLES.SUPER_ADMIN]}
          requiredPermission={PERMISSIONS.PROJECT_CREATE}
        >
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Projects"
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    if (currentPath === "/admin") {
      return (
        <ProtectedRoute
          requiredRole={ROLES.SUPER_ADMIN}
          requiredPermission={PERMISSIONS.PLATFORM_ADMIN}
        >
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Super Admin"
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    if (currentPath === "/auditor") {
      return (
        <ProtectedRoute
          requiredRole={ROLES.AUDITOR}
          requiredPermission={PERMISSIONS.AUDIT_REVIEW}
        >
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Auditor"
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    if (
      currentPath === "/donor/dashboard" ||
      currentPath === "/donor/donations" ||
      currentPath === "/donor/profile" ||
      currentPath === "/donor/settings"
    ) {
      const donorTab =
        currentPath === "/donor/profile"
          ? "profile"
          : currentPath === "/donor/settings"
          ? "settings"
          : "history";

      return (
        <ProtectedRoute
          requiredRoles={[ROLES.DONOR, ROLES.NGO_ADMIN, ROLES.SUPER_ADMIN]}
        >
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Donor Portal"
            donorInitialTab={donorTab}
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    if (currentPath === "/approvals") {
      return (
        <ProtectedRoute requiredPermission={PERMISSIONS.TREASURY_APPROVE}>
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Approvals"
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    if (currentPath === "/risk") {
      return (
        <ProtectedRoute requiredPermission={PERMISSIONS.RISK_VIEW_ALERTS}>
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Risk Alerts"
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    if (currentPath === "/analytics") {
      return (
        <ProtectedRoute requiredPermission={PERMISSIONS.DATA_EXPORT_CSV}>
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Analytics"
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    if (currentPath === "/documents") {
      return (
        <ProtectedRoute>
          <NgoDashboard
            onBackToPublic={() => navigate("/")}
            onLogout={() => {
              logout();
              navigate("/login");
            }}
            ngoDonations={ngoDonations}
            onOpenDonate={() => handleOpenDonate()}
            initialTab="Documents"
            onTabChange={setNgoDashboardTab}
          />
        </ProtectedRoute>
      );
    }

    // 5. Unrecognized path fallback
    return <NotFoundPage />;
  };

  return (
    <>
      {renderCurrentRoute()}

      {/* Global Interactive Modals */}
      <DonateModal
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
        ngos={ngos}
        selectedNgo={selectedNgoForDonate}
        onDonationComplete={handleDonationComplete}
        onViewInLedger={handleViewInLedger}
      />

      <NgoDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        ngo={selectedNgoForDetails}
        onDonateClick={(ngo) => handleOpenDonate(ngo)}
      />
    </>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </Web3Provider>
  );
}
