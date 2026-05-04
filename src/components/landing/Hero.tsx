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
            <div className="relative bg-[#f8fafc] border border-gray-200 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden aspect-[16/10] md:aspect-[21/9] lg:aspect-[21/8] group">
              {/* Fake UI Header */}
              <div className="h-12 bg-white border-b border-gray-100 flex items-center px-6 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/40" />
                  <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/40" />
                </div>
                <div className="ml-8 h-6 w-1/3 bg-gray-100 rounded-lg flex items-center px-3">
                  <div className="w-3 h-3 bg-gray-200 rounded-full mr-2" />
                  <div className="w-20 h-2 bg-gray-200 rounded" />
                </div>
              </div>

              {/* Fake UI Content */}
              <div className="p-8 grid grid-cols-12 gap-8 h-full">
                <div className="col-span-3 space-y-6">
                  <div className="h-10 bg-brand-600 rounded-xl w-full flex items-center px-4 shadow-lg shadow-brand-600/10">
                    <div className="w-4 h-4 bg-white/20 rounded mr-2" />
                    <div className="w-16 h-2 bg-white/40 rounded" />
                  </div>
                  <div className="space-y-4 px-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-200 rounded" />
                        <div className={cn("h-2 bg-gray-200 rounded", i === 0 ? "w-2/3 bg-brand-100" : "w-1/2")} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-9 space-y-8">
                  <div className="grid grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow">
                        <div className="h-3 w-1/3 bg-gray-100 rounded mb-4" />
                        <div className="h-8 w-3/4 bg-gray-200 rounded-lg" />
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-6 w-1/4 bg-gray-100 rounded-lg" />
                      <div className="h-8 w-24 bg-gray-100 rounded-lg" />
                    </div>
                    <div className="space-y-5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gray-100 rounded-2xl shrink-0" />
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-gray-200 rounded" />
                              <div className="h-2 w-20 bg-gray-100 rounded" />
                            </div>
                          </div>
                          <div className="h-6 w-16 bg-brand-50 text-brand-600 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 top-1/4 bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white hidden lg:block z-20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-white text-xl font-bold">+</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment Received</p>
                  <p className="text-lg font-bold text-gray-900">Rs. 12,500.00</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-8 bottom-1/4 bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white hidden lg:block z-20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <span className="text-white text-xl font-bold">!</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Low Stock Alert</p>
                  <p className="text-lg font-bold text-gray-900">iPhone 15 Pro</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
