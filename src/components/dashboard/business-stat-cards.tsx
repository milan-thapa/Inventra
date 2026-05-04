"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, CreditCard, Package } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useProfileStore } from "@/stores/profile-store";

interface BusinessStatCardsProps {
  stats: {
    sales: number;
    purchases: number;
    expense: number;
    toReceive: number;
    toGive: number;
    inventoryValuation: number;
    currentMonth: string;
  };
}

export function BusinessStatCards({ stats }: BusinessStatCardsProps) {
  const { profiles, activeProfileId } = useProfileStore();
  const profile = profiles.find((p) => p.id === activeProfileId);
  const currency = profile?.currency || "Rs.";

  const cards = [
    {
      title: "To Receive",
      amount: stats.toReceive,
      icon: TrendingDown,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
      iconBg: "bg-emerald-500/20 dark:bg-emerald-500/20",
    },
    {
      title: "To Give",
      amount: stats.toGive,
      icon: TrendingUp,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10 dark:bg-rose-500/10",
      iconBg: "bg-rose-500/20 dark:bg-rose-500/20",
    },
    {
      title: `Sales (${stats.currentMonth})`,
      amount: stats.sales,
      icon: Wallet,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/10",
      iconBg: "bg-emerald-500/20 dark:bg-emerald-500/20",
    },
    {
      title: `Purchase (${stats.currentMonth})`,
      amount: stats.purchases,
      icon: CreditCard,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/10",
      iconBg: "bg-blue-500/20 dark:bg-blue-500/20",
    },
    {
      title: "Inventory Value",
      amount: stats.inventoryValuation,
      icon: Package,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 dark:bg-indigo-500/10",
      iconBg: "bg-indigo-500/20 dark:bg-indigo-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "rounded-xl p-5 border border-border/50 relative overflow-hidden group transition-all duration-300",
            card.bg,
            "hover:shadow-lg hover:shadow-black/5 hover:border-border"
          )}
        >
          {/* Subtle light streak on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", card.iconBg)}>
              <card.icon className={cn("w-5 h-5", card.color)} />
            </div>
          </div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 dark:text-muted-foreground/60 mb-1 relative z-10">
            {card.title}
          </h3>
          <p className={cn("text-2xl font-bold tracking-tight relative z-10", card.color)}>
            {formatCurrency(card.amount, currency, profile?.currencyPos as any)}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
