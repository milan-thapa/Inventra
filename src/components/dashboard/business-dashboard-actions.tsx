"use client";

import Link from "next/link";
import { Plus, ShoppingCart, Tag, Store } from "lucide-react";

export function BusinessDashboardActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/sales/quick-pos"
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors"
      >
        <Store className="w-4 h-4" />
        <span className="hidden sm:inline">Quick POS</span>
      </Link>
      
      <Link
        href="/sales/new"
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Sales</span>
      </Link>
      
      <Link
        href="/purchase/new"
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Purchase</span>
      </Link>

      <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
      
      <Link
        href="/inventory/new"
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <span className="hidden sm:inline">Add More</span>
      </Link>
    </div>
  );
}
