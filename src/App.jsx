import React, { useState } from "react";
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
import { initialNgos } from "./data/ngosData";
import { initialTransactions } from "./data/transactionsData";
import { initialNgoDonations } from "./data/donationsData";

export function AppContent() {
  // Navigation view: 'public' | 'ngo-login' | 'ngo-dashboard'
  const [currentView, setCurrentView] = useState("public");
  const [ngoDashboardTab, setNgoDashboardTab] = useState("Dashboard");

  const [ngos, setNgos] = useState(initialNgos);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [ngoDonations, setNgoDonations] = useState(initialNgoDonations);

  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedNgoForDonate, setSelectedNgoForDonate] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedNgoForDetails, setSelectedNgoForDetails] = useState(null);

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
    setCurrentView("ngo-dashboard");
  };

  const handleDonationComplete = (newTx, ngoId, amount) => {
    // 1. Add transaction to the live cryptographic stream
    setTransactions((prev) => [newTx, ...prev]);

    // 2. Update the target NGO's raised sum and donor count
    setNgos((prev) =>
      prev.map((ngo) => {
        if (ngo.id === ngoId) {
          return {
            ...ngo,
            raised: ngo.raised + amount,
            donorsCount: ngo.donorsCount + 1,
          };
        }
        return ngo;
      })
    );

    // 3. Add to the NGO Donations ledger!
    const numAmount = parseFloat(newTx.amount);
    const inrValue =
      newTx.token === "POL"
        ? Math.round(numAmount * 100)
        : Math.round(numAmount * 85);

    const targetNgo = ngos.find((n) => n.id === ngoId);
    const projectName = targetNgo ? targetNgo.name : "Verified Cause";
    const donorWallet =
      newTx.fullWallet ||
      (newTx.donor?.length === 42
        ? newTx.donor
        : "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1");
    const donorName = newTx.donor?.startsWith("0x")
      ? `Donor (${newTx.donor})`
      : newTx.donor || "Recent Patron";

    const newNgoDonation = {
      id: newTx.id,
      donor: donorName,
      wallet: donorWallet,
      amountInr: inrValue,
      amountCrypto: `${newTx.amount} ${newTx.token}`,
      token: newTx.token,
      project: projectName,
      date: "Just now",
      isNew: true,
      hash: newTx.hash,
      status: "Confirmed",
      taxReceiptNo: `80G-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setNgoDonations((prev) => [newNgoDonation, ...prev]);
  };

  const handleExploreClick = () => {
    const el = document.getElementById("ngos");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
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
          onLogout={() => setCurrentView("ngo-login")}
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
            onNavigateToNgoPortal={() => setCurrentView("ngo-login")}
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
