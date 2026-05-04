// src/components/parties/party-card.tsx
"use client";

import { cn, getInitials, getAvatarColor, formatCurrency } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface Party {
  id: string;
  name: string;
  address: string | null;
  openingBalance: number | string;
  balanceType: string;
}

export function PartyCard({
  party,
  isSelected,
  onClick,
}: {
  party: Party;
  isSelected: boolean;
  onClick: () => void;
}) {
  const balance = Number(party.openingBalance);
  const isReceivable = party.balanceType === "TO_RECEIVE";

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl p-3.5 flex items-center gap-3 transition-all cursor-pointer border border-transparent",
        isSelected 
          ? "bg-secondary shadow-sm" 
          : "hover:bg-secondary/50"
      )}
    >
      <div 
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 border border-border/10 shadow-sm"
        style={{ backgroundColor: getAvatarColor(party.name) }}
      >
        {getInitials(party.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate transition-colors">
          {party.name}
        </p>
        {party.address && (
          <p className="text-[10px] text-muted-foreground truncate opacity-80">{party.address}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn(
          "text-xs font-semibold",
          isReceivable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
        )}>
          {formatCurrency(balance)}
        </p>
        <p className={cn(
          "text-[10px]",
          isReceivable ? "text-emerald-600/70 dark:text-emerald-500/70" : "text-rose-600/70 dark:text-rose-500/70"
        )}>
          {isReceivable ? "To Receive" : "To Give"}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}