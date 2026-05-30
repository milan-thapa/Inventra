"use client";

import { motion } from "framer-motion";
import { Target, Users, Lightbulb, Heart } from "lucide-react";

const VALUES = [
  {
    icon: Target,
    title: "Mission",
    description: "Empower small businesses with affordable, powerful tools to compete and thrive in the digital economy.",
  },
  {
    icon: Lightbulb,
    title: "Vision",
    description: "Become the go-to platform for business management across emerging markets, making enterprise-grade tools accessible to everyone.",
  },
  {
    icon: Heart,
    title: "Values",
    description: "Simplicity, reliability, and customer success drive everything we build. We believe technology should serve people, not the other way around.",
  },
];

const STATS = [
  { value: "20K+", label: "Active Users" },
  { value: "50M+", label: "Transactions Processed" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

export function About() {
  return (
    <section id="about" className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              About Inventra
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Founded in 2024, Inventra was born from a simple observation: small businesses deserve the same powerful tools that enterprises use, but at a fraction of the cost.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl mb-16"
          >
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              We started by talking to hundreds of small business owners—retailers, service providers, manufacturers—and heard the same frustrations over and over: expensive software, complicated interfaces, and tools that didn't work together.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              So we built something different. A platform that combines inventory management, accounting, and business analytics in one intuitive interface. No expensive consultants, no steep learning curve—just powerful tools that work from day one.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Today, we're proud to serve thousands of businesses across the globe, helping them save time, reduce errors, and make smarter decisions. Our journey is just beginning, and we're committed to building the tools that small businesses need to succeed.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {VALUES.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-6">
                  <value.icon className="w-7 h-7 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {STATS.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-4xl md:text-5xl font-extrabold text-brand-600 mb-2"
                >
                  {stat.value}
                </motion.div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
