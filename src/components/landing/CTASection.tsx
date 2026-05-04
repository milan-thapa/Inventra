"use client";

import { MotionButton } from "./ui/MotionButton";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative bg-brand-600 rounded-[2rem] p-12 md:p-20 overflow-hidden shadow-2xl">
          {/* Subtle clean background highlight */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
              Ready to take your business to the next level?
            </h2>
            
            <p className="text-brand-50 text-xl md:text-2xl mb-12 opacity-90 max-w-2xl mx-auto font-medium">
              Join thousands of businesses that trust Inventra for their daily accounting and inventory needs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/login" className="w-full sm:w-auto">
                <MotionButton size="lg" className="bg-white text-brand-600 hover:bg-brand-50 w-full sm:w-auto px-10">
                  Get Started Free
                  <ChevronRight className="ml-2 w-5 h-5" />
                </MotionButton>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <MotionButton variant="outline" size="lg" className="border-white text-white hover:bg-white/10 w-full sm:w-auto">
                  Request a Demo
                </MotionButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
