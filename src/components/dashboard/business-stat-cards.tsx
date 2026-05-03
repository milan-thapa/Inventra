"use client";

import { TrendingUp, TrendingDown, Users, Package, Wallet, CreditCard, ArrowDownRight, ArrowUpRight } from "lucide-react";
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
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
    },
    {
      title: "To Give",
      amount: stats.toGive,
      icon: TrendingUp,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      iconBg: "bg-rose-500/20",
    },
    {
      title: `Sales (${stats.currentMonth})`,
      amount: stats.sales,
      icon: Wallet,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
    },
    {
      title: `Purchase (${stats.currentMonth})`,
      amount: stats.purchases,
      icon: CreditCard,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      iconBg: "bg-blue-500/20",
    },
    {
      title: "Inventory Value",
      amount: stats.inventoryValuation,
      icon: Package,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      iconBg: "bg-indigo-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className={cn(
            "rounded-xl p-5 border border-border/50",
            card.bg
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <div className={cn("p-2 rounded-lg", card.iconBg)}>
              <card.icon className={cn("w-5 h-5", card.color)} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            {card.title}
          </h3>
          <p className={cn("text-xl font-bold", card.color)}>
            {formatCurrency(card.amount, currency, profile?.currencyPos === "end")}
          </p>
        </div>
      ))}
    </div>
  );
}
