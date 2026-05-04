"use client";

import { motion } from "framer-motion";
import { 
  Package, 
  Receipt, 
  BarChart3, 
  Smartphone, 
  Users, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";

const FEATURES = [
  {
    icon: Package,
    title: "Inventory Management",
    description: "Keep track of your products, stock levels, and variants in real-time. Never run out of stock again.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Receipt,
    title: "Accounting & Ledger",
    description: "Professional billing, expense tracking, and ledger management for your business. Simplified accounting.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Insightful Reports",
    description: "Generate sales, expense, and profit reports with a single click. Make data-driven decisions.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Smartphone,
    title: "Multi-Device Sync",
    description: "Access your business data from anywhere—mobile, tablet, or desktop. Always in sync.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Users,
    title: "Party Management",
    description: "Maintain a complete record of your customers and suppliers. Track payables and receivables easily.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Reliable",
    description: "Your data is encrypted and backed up daily. Trust Inventra with your business records.",
    color: "bg-indigo-50 text-indigo-600",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Everything you need to run your business
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            Powerful tools designed for small and medium businesses to streamline operations and grow faster.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.2, ease: "easeOut" }
              }}
              className="group relative bg-white/70 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-brand-500/10 hover:border-brand-200 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-transparent to-brand-50/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  {feature.description}
                </p>
                <div className="mt-6 flex items-center gap-2 text-brand-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                  Learn more <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
