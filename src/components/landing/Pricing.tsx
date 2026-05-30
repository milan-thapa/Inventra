"use client";

import { motion } from "framer-motion";
import { Check, Zap, Crown } from "lucide-react";
import { MotionButton } from "./ui/MotionButton";
import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    price: 0,
    description: "Perfect for small businesses getting started",
    icon: Zap,
    features: [
      "1 Business Profile",
      "Up to 100 transactions/month",
      "Basic inventory management",
      "Standard reports",
      "Email support",
      "Mobile app access",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Professional",
    price: 29,
    description: "Ideal for growing businesses with more needs",
    icon: Crown,
    features: [
      "5 Business Profiles",
      "Unlimited transactions",
      "Advanced inventory with barcode",
      "Advanced analytics & reports",
      "Priority support",
      "API access",
      "Multi-user collaboration",
      "Custom branding",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: 99,
    description: "For large organizations with complex needs",
    icon: Crown,
    features: [
      "Unlimited Business Profiles",
      "Unlimited everything",
      "Custom reports & dashboards",
      "Dedicated account manager",
      "24/7 phone support",
      "Advanced API & integrations",
      "White-label solution",
      "On-premise deployment option",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            Choose the perfect plan for your business. No hidden fees, cancel anytime.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-3xl border-2 ${
                plan.popular
                  ? "border-brand-600 bg-brand-50/50 scale-105 shadow-2xl shadow-brand-500/20"
                  : "border-gray-200 bg-white hover:border-brand-300 hover:shadow-xl transition-all"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-sm font-bold px-4 py-1.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  plan.popular ? "bg-brand-600" : "bg-gray-100"
                }`}>
                  <plan.icon className={`w-6 h-6 ${plan.popular ? "text-white" : "text-gray-600"}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-gray-900">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-600">/month</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      plan.popular ? "text-brand-600" : "text-green-600"
                    }`} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full">
                <MotionButton
                  size="lg"
                  className={`w-full ${
                    plan.popular
                      ? "bg-brand-600 hover:bg-brand-700"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </MotionButton>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 mb-4">
            Not sure which plan is right for you?
          </p>
          <Link href="/contact" className="text-brand-600 font-semibold hover:underline">
            Contact our sales team →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
