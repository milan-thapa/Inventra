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
        {/* Placeholder for other sections like Testimonials or Pricing if needed later */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
