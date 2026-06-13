// src/components/shared/transaction-table-filters.tsx
"use client";

import { Search, SortAsc, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
}

interface TransactionTableFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  categories: Category[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
}

export function TransactionTableFilters({
  search,
  onSearchChange,
  searchPlaceholder,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  paymentFilter,
  onPaymentFilterChange,
}: TransactionTableFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-48 max-w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm bg-muted/30 border-border/50"
        />
      </div>
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value)}
        className="h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none"
      >
        <option value="ALL">All Category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <select
        value={paymentFilter}
        onChange={(e) => onPaymentFilterChange(e.target.value)}
        className="h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none"
      >
        <option value="ALL">All Payment Modes</option>
        <option value="CASH">Cash</option>
        <option value="BANK">Bank</option>
      </select>
      <div className="flex items-center gap-1.5 h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-muted-foreground cursor-pointer hover:border-emerald-500 transition-colors">
        <Filter className="w-3 h-3" />
        <span>All Date</span>
      </div>
      <button className="flex items-center gap-1.5 h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-muted-foreground hover:border-emerald-500 transition-colors ml-auto">
        <SortAsc className="w-3 h-3" />
        Sort By
      </button>
    </div>
  );
}
