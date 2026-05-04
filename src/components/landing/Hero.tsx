"use client";

import { motion } from "framer-motion";
import { MotionButton } from "./ui/MotionButton";
import Link from "next/link";
import { APP_TAGLINE, APP_DESCRIPTION } from "@/lib/constants";
import { ChevronRight, Play, ShieldCheck } from "lucide-react";

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

          {/* Dashboard Mockup Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 w-full relative"
          >
            <div className="relative bg-white border border-gray-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden aspect-[16/10] md:aspect-[21/9] lg:aspect-[21/8]">
              {/* Fake UI Header */}
              <div className="h-10 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="ml-4 h-5 w-1/3 bg-gray-200 rounded-md animate-pulse" />
              </div>

              {/* Fake UI Content */}
              <div className="p-6 grid grid-cols-12 gap-6 h-full bg-gray-50/50">
                <div className="col-span-3 space-y-4">
                  <div className="h-8 bg-brand-100 rounded-lg w-full" />
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded-md w-full" />
                    ))}
                  </div>
                </div>
                <div className="col-span-9 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
                        <div className="h-8 w-3/4 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                  <div className="h-64 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 w-1/4 bg-gray-100 rounded" />
                      <div className="h-6 w-20 bg-gray-100 rounded" />
                    </div>
                    <div className="space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="h-10 w-10 bg-gray-100 rounded-full shrink-0" />
                          <div className="h-10 bg-gray-50 rounded w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-6 top-1/4 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">↑</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">New Payment</p>
                  <p className="text-sm font-bold">Rs. 12,500.00</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-6 bottom-1/4 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden lg:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">!</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Low Stock Alert</p>
                  <p className="text-sm font-bold">iPhone 15 Pro</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
