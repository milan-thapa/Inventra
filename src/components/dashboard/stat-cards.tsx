// src/components/dashboard/stat-cards.tsx
"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useProfileStore } from "@/stores/profile-store";

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
    iconClass: "text-emerald-600 dark:text-emerald-400",
    valueClass: "text-emerald-700 dark:text-emerald-300",
    arrowUp: true,
  },
  {
    key:   "expense" as keyof Stats,
    label: (month: string) => `Expense (${month})`,
    icon:  TrendingDown,
    cardClass: "stat-card-expense",
    iconClass: "text-rose-600 dark:text-rose-400",
    valueClass: "text-rose-700 dark:text-rose-300",
    arrowUp: false,
  },
  {
    key:   "toReceive" as keyof Stats,
    label: () => "To Receive",
    icon:  ArrowDownLeft,
    cardClass: "stat-card-receive",
    iconClass: "text-teal-600 dark:text-teal-400",
    valueClass: "text-teal-700 dark:text-teal-300",
    arrowUp: false,
  },
  {
    key:   "toGive" as keyof Stats,
    label: () => "To Give",
    icon:  ArrowUpRight,
    cardClass: "stat-card-give",
    iconClass: "text-rose-600 dark:text-rose-400",
    valueClass: "text-rose-700 dark:text-rose-300",
    arrowUp: true,
  },
];

export function StatCards({ stats }: { stats: Stats }) {
  const { getActiveProfile } = useProfileStore();
  const profile = getActiveProfile();
  
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
              "rounded-xl p-4 border border-border relative overflow-hidden group transition-all duration-300 shadow-sm",
              card.cardClass,
              "hover:shadow-md hover:border-border/80"
            )}
          >
            {/* Subtle light streak on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-center justify-between mb-2 relative z-10">
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center bg-background/50 backdrop-blur-sm group-hover:scale-110 transition-transform",
                card.iconClass
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center bg-background/50 backdrop-blur-sm",
                card.iconClass
              )}>
                {card.arrowUp
                  ? <ArrowUpRight className="w-3.5 h-3.5" />
                  : <ArrowDownLeft className="w-3.5 h-3.5" />
                }
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 dark:text-muted-foreground mb-1 truncate relative z-10">
              {card.label(stats.currentMonth)}
            </p>
            <p className={cn("text-xl font-bold tracking-tight relative z-10", card.valueClass)}>
              {formatCurrency(value, profile?.currency, profile?.currencyPos as any)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
