// src/components/dashboard/total-balance.tsx
"use client";

import { ArrowUpDown, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function TotalBalance({ balance, profileId: _ }: { balance: number; profileId: string }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">Total Balance (Cash &amp; Bank)</span>
        <ArrowUpDown className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      </div>
      <p className="text-2xl font-bold text-foreground">
        {formatCurrency(balance)}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Cash + Bank accounts</span>
      </div>
    </div>
  );
}
