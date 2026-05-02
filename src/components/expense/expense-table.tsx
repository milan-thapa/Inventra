// src/components/expense/expense-table.tsx
"use client";

import { useState } from "react";
import { Plus, Search, SortAsc, Pencil, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddExpenseModal } from "@/components/expense/add-expense-modal";
import { deleteExpense } from "@/lib/actions/expense";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";

interface Expense {
  id: string;
  expenseNo: number;
  category: { id: string; name: string };
  date: Date | string;
  paymentMethod: string;
  totalAmount: number | string;
  remarks: string | null;
}

interface Category { id: string; name: string }

export function ExpenseTable({
  initialExpenses,
  initialTotal,
  categories,
  profileId,
}: {
  initialExpenses: Expense[];
  initialTotal: number;
  categories: Category[];
  profileId: string;
}) {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [total, setTotal] = useState(initialTotal);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = expenses.filter((e) => {
    const matchSearch = !search ||
      e.category.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.remarks ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "ALL" || e.category.id === categoryFilter;
    const matchPayment = paymentFilter === "ALL" || e.paymentMethod === paymentFilter;
    return matchSearch && matchCategory && matchPayment;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    setDeleting(id);
    const res = await deleteExpense(profileId, id);
    setDeleting(null);
    if (res.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setTotal((prev) => prev - 1);
      toast({ title: "Expense deleted" });
    } else {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  const handleSuccess = () => {
    window.location.reload();
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">
          Expenses ({total})
        </h1>
        <Button
          size="sm"
          onClick={() => setAddOpen(true)}
          className="btn-income h-8 px-3 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search Expense..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-muted/30 border-border/50"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none"
        >
          <option value="ALL">All Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Payment mode filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none"
        >
          <option value="ALL">All Payment Modes</option>
          <option value="CASH">Cash</option>
          <option value="BANK">Bank</option>
        </select>

        {/* Date filter */}
        <div className="flex items-center gap-1.5 h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-muted-foreground cursor-pointer hover:border-emerald-500 transition-colors">
          <Filter className="w-3 h-3" />
          <span>All Date</span>
        </div>

        {/* Sort */}
        <button className="flex items-center gap-1.5 h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-muted-foreground hover:border-emerald-500 transition-colors ml-auto">
          <SortAsc className="w-3 h-3" />
          Sort By
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description={search ? "Try adjusting your search or filters" : "Click 'Add New Expense' to record your first expense"}
            action={!search ? {
              label: "Add New Expense",
              onClick: () => setAddOpen(true),
            } : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left">Exp No.</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">Date</th>
                  <th className="text-left">Payment Mode</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-left">Remarks</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-muted-foreground font-mono text-xs">
                      {expense.expenseNo}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-rose-500/10 text-rose-400">
                        {expense.category.name}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {formatDate(new Date(expense.date))}
                    </td>
                    <td className="text-muted-foreground text-xs">
                      {expense.paymentMethod === "CASH" ? "Cash" : "Bank"}
                    </td>
                    <td className="text-right font-semibold text-rose-400">
                      {formatCurrency(Number(expense.totalAmount))}
                    </td>
                    <td className="text-muted-foreground text-xs max-w-[160px] truncate">
                      {expense.remarks ?? "—"}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deleting === expense.id}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddExpenseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
