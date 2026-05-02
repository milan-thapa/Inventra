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
            transition={{ delay: i * 0.07 }}
            className={cn(
              "rounded-xl p-4 border border-white/5",
              card.cardClass
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center bg-black/10",
                card.iconClass
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className={cn(
                "w-5 h-5 rounded flex items-center justify-center bg-black/10",
                card.iconClass
              )}>
                {card.arrowUp
                  ? <ArrowUpRight className="w-3 h-3" />
                  : <ArrowDownLeft className="w-3 h-3" />
                }
              </div>
            </div>
            <p className="text-xs text-white/60 mb-1 truncate">
              {card.label(stats.currentMonth)}
            </p>
            <p className={cn("text-lg font-bold", card.valueClass)}>
              {formatCurrency(value)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
