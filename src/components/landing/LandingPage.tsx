"use client";

import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { CTASection } from "./CTASection";
import { Footer } from "./Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-brand-100 selection:text-brand-700 scroll-smooth">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
