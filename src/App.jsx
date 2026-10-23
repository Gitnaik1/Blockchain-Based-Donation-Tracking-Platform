import React, { useState, useEffect } from "react";
import { Web3Provider } from "./context/Web3Context";
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
import { NgoLogin } from "./components/ngo-portal/NgoLogin";
import { NgoDashboard } from "./components/ngo-portal/NgoDashboard";
import { donationService } from "./services/donationService";
import { authService } from "./services/authService";

export function AppContent() {
  // Navigation view: 'public' | 'ngo-login' | 'ngo-dashboard'
  const [currentView, setCurrentView] = useState("public");
  const [ngoDashboardTab, setNgoDashboardTab] = useState("Dashboard");

  const [ngos, setNgos] = useState(() => donationService.getNgos());
  const [transactions, setTransactions] = useState(() => donationService.getTransactions());
  const [ngoDonations, setNgoDonations] = useState(() => donationService.getDonations());

  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedNgoForDonate, setSelectedNgoForDonate] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedNgoForDetails, setSelectedNgoForDetails] = useState(null);

  // Subscribe to authoritative donation service updates
  useEffect(() => {
    const unsubscribe = donationService.subscribe((state) => {
      setDonationsState(state);
    });
    return () => unsubscribe();
  }, []);

  const setDonationsState = (state) => {
    if (state.ngos) setNgos(state.ngos);
    if (state.transactions) setTransactions(state.transactions);
    if (state.donations) setNgoDonations(state.donations);
  };

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
    // Verify authentication before opening dashboard
    if (authService.isAuthenticated()) {
      setCurrentView("ngo-dashboard");
    } else {
      setCurrentView("ngo-login");
    }
  };

  const handleDonationComplete = (newTx, ngoId, amount) => {
    // Add via authoritative donationService which handles deduplication, metrics, and persistence
    donationService.addDonation({
      txHash: newTx.hash,
      amount: amount,
      token: newTx.token,
      ngoId: ngoId,
      donorWallet: newTx.fullWallet,
      donorName: newTx.donor,
      status: "Confirmed",
      isSimulated: newTx.isSimulated || false,
    });
  };

  const handleExploreClick = () => {
    const el = document.getElementById("ngos");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavigateToNgoPortal = () => {
    if (authService.isAuthenticated()) {
      setCurrentView("ngo-dashboard");
    } else {
      setCurrentView("ngo-login");
    }
  };

  return (
    <>
      {currentView === "ngo-login" ? (
        <NgoLogin
          onLoginSuccess={() => {
            setNgoDashboardTab("Dashboard");
            setCurrentView("ngo-dashboard");
          }}
          onBackToPublic={() => setCurrentView("public")}
        />
      ) : currentView === "ngo-dashboard" ? (
        <NgoDashboard
          onBackToPublic={() => setCurrentView("public")}
          onLogout={() => {
            authService.clearSession();
            setCurrentView("ngo-login");
          }}
          ngoDonations={ngoDonations}
          onOpenDonate={() => handleOpenDonate()}
          initialTab={ngoDashboardTab}
          onTabChange={setNgoDashboardTab}
        />
      ) : (
        <div className="min-h-screen bg-white text-brand-navy flex flex-col font-inter">
          {/* Navigation Header */}
          <Header
            onOpenDonate={() => handleOpenDonate()}
            onNavigateToNgoPortal={handleNavigateToNgoPortal}
          />

          {/* Main Sections */}
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

          {/* Global Footer */}
          <Footer />
        </div>
      )}

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
      <AppContent />
    </Web3Provider>
  );
}
