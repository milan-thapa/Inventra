// src/components/dashboard/dashboard-actions.tsx
"use client";

import { Plus, ChevronDown, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/profile-store";
import { AddExpenseModal } from "@/components/expense/add-expense-modal";
import { AddIncomeModal } from "@/components/income/add-income-modal";

export function DashboardActions() {
  const {
    addExpenseOpen, setAddExpenseOpen,
    addIncomeOpen, setAddIncomeOpen,
    addPaymentInOpen, setAddPaymentInOpen,
    addPaymentOutOpen, setAddPaymentOutOpen,
  } = useUIStore();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="btn-expense h-8 px-3 text-xs gap-1.5"
          onClick={() => setAddExpenseOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Expense
        </Button>

        <Button
          size="sm"
          className="btn-income h-8 px-3 text-xs gap-1.5"
          onClick={() => setAddIncomeOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Income
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMoreOpen(!moreOpen)}
            className="h-8 px-2.5 text-xs gap-1 border-border/50"
          >
            Add More
            <ChevronDown className="w-3 h-3" />
          </Button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-20 w-40">
                <button
                  onClick={() => { setAddPaymentInOpen(true); setMoreOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                  Payment In
                </button>
                <button
                  onClick={() => { setAddPaymentOutOpen(true); setMoreOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent"
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-500" />
                  Payment Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <AddExpenseModal open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} />
      <AddIncomeModal  open={addIncomeOpen}  onClose={() => setAddIncomeOpen(false)} />
    </>
  );
}
