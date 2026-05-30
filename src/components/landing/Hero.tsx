"use client";

import { motion } from "framer-motion";
import { MotionButton } from "./ui/MotionButton";
import Link from "next/link";
import { APP_TAGLINE, APP_DESCRIPTION } from "@/lib/constants";
import { ChevronRight, Play, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-50 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-gray-200 shadow-sm text-gray-700 text-sm font-medium mb-8"
          >
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Trusted by 20+ Businesses</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 tracking-tight mb-8 leading-[1.1]"
          >
            {APP_TAGLINE.split(" ").map((word, i) => (
              <span key={i} className={word === "Business" ? "text-brand-600 bg-gradient-to-br from-brand-500 to-brand-700 bg-clip-text text-transparent" : ""}>
                {word}{" "}
              </span>
            ))}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-2xl text-gray-600 mb-12 max-w-2xl leading-relaxed"
          >
            {APP_DESCRIPTION}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <MotionButton size="lg" className="w-full group">
                Get Started Free
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MotionButton>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <MotionButton variant="secondary" size="lg" className="w-full">
                <Play className="mr-2 w-4 h-4 fill-current" />
                View Demo
              </MotionButton>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
