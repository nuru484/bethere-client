// src/pages/LandingPage.jsx
//
// Marketing / portfolio landing page. Self-contained under
// components/landing/ and deliberately detached from the app's dashboard
// theme: near-monochrome paper surfaces, halftone texture, huge display
// type, mono micro-labels and a mint pixel accent. Lenis drives the smooth
// scroll that the sticky card stack leans on.
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLenis } from "@/hooks/useLenis";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { FeatureStack } from "@/components/landing/FeatureStack";
import { SeeForYourself } from "@/components/landing/SeeForYourself";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TechBoard } from "@/components/landing/TechBoard";
import { LandingFooter } from "@/components/landing/LandingFooter";

const LandingPage = () => {
  usePageTitle("Verified live presence");

  // Momentum scroll (mirrors the mhp website-frontend Lenis setup).
  useLenis();

  return (
    <div className="min-h-screen bg-[var(--lp-bg)] font-body text-[var(--lp-ink)] antialiased">
      <LandingNav />
      <main>
        <LandingHero />
        <FeatureStack />
        <SeeForYourself />
        <HowItWorks />
        <TechBoard />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
