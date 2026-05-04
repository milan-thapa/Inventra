// src/components/dashboard/stat-cards.tsx
"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stats {
  income: number;
  expense: number;
  toReceive: number;
  toGive: number;
  totalBalance: number;
  currentMonth: string;
}

const CARDS = [
  {
    key:   "income" as keyof Stats,
    label: (month: string) => `Income (${month})`,
    icon:  TrendingUp,
    cardClass: "stat-card-income",
    iconClass: "text-emerald-400",
    valueClass: "text-emerald-300",
    arrowUp: true,
  },
  {
    key:   "expense" as keyof Stats,
    label: (month: string) => `Expense (${month})`,
    icon:  TrendingDown,
    cardClass: "stat-card-expense",
    iconClass: "text-rose-400",
    valueClass: "text-rose-300",
    arrowUp: true,
  },
  {
    key:   "toReceive" as keyof Stats,
    label: () => "To Receive",
    icon:  ArrowDownLeft,
    cardClass: "stat-card-receive",
    iconClass: "text-teal-400",
    valueClass: "text-teal-300",
    arrowUp: false,
  },
  {
    key:   "toGive" as keyof Stats,
    label: () => "To Give",
    icon:  ArrowUpRight,
    cardClass: "stat-card-give",
    iconClass: "text-rose-400",
    valueClass: "text-rose-300",
    arrowUp: true,
  },
];

export function StatCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        const value = stats[card.key];
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "rounded-xl p-4 border border-white/5 relative overflow-hidden group transition-all duration-300",
              card.cardClass,
              "hover:shadow-lg hover:shadow-black/20 hover:border-white/10"
            )}
          >
            {/* Subtle light streak on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center bg-black/10 backdrop-blur-sm group-hover:scale-110 transition-transform",
                card.iconClass
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center bg-black/10 backdrop-blur-sm",
                card.iconClass
              )}>
                {card.arrowUp
                  ? <ArrowUpRight className="w-3.5 h-3.5" />
                  : <ArrowDownLeft className="w-3.5 h-3.5" />
                }
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1 truncate relative z-10">
              {card.label(stats.currentMonth)}
            </p>
            <p className={cn("text-xl font-bold tracking-tight relative z-10", card.valueClass)}>
              {formatCurrency(value)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
