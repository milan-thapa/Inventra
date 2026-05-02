// src/components/parties/party-card.tsx
"use client";

import { cn, getInitials, getAvatarColor, formatCurrency } from "@/lib/utils";
import Link from "next/link";
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
    <Link
      href={`/parties/${party.id}`}
      className="bg-card rounded-xl border border-border/50 p-3.5 flex items-center gap-3 hover:border-emerald-500/50 transition-colors cursor-pointer"
    >
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
        getAvatarColor(party.name)
      )}>
        {getInitials(party.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{party.name}</p>
        {party.address && (
          <p className="text-xs text-muted-foreground truncate">{party.address}</p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn(
          "text-xs font-semibold",
          isReceivable ? "text-emerald-400" : "text-rose-400"
        )}>
          {formatCurrency(balance)}
        </p>
        <p className={cn(
          "text-[10px]",
          isReceivable ? "text-emerald-500/70" : "text-rose-500/70"
        )}>
          {isReceivable ? "To Receive" : "To Give"}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}
