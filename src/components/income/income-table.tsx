// src/components/income/income-table.tsx
"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionTableFilters } from "@/components/shared/transaction-table-filters";
import { AddIncomeModal } from "@/components/income/add-income-modal";
import { deleteIncome } from "@/lib/actions/expense";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { Wallet } from "lucide-react";

interface Income {
  id: string;
  incomeNo: number;
  category: { id: string; name: string };
  date: Date | string;
  paymentMethod: string;
  totalAmount: number | string;
  remarks: string | null;
}

interface Category { id: string; name: string }

export function IncomeTable({
  initialIncomes,
  initialTotal,
  categories,
  profileId,
}: {
  initialIncomes: Income[];
  initialTotal: number;
  categories: Category[];
  profileId: string;
}) {
  const { toast } = useToast();
  const [incomes, setIncomes] = useState(initialIncomes);
  const [total, setTotal] = useState(initialTotal);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = incomes.filter((e) => {
    const matchSearch = !search ||
      e.category.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.remarks ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "ALL" || e.category.id === categoryFilter;
    const matchPay = paymentFilter === "ALL" || e.paymentMethod === paymentFilter;
    return matchSearch && matchCat && matchPay;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income?")) return;
    setDeleting(id);
    const res = await deleteIncome(profileId, id);
    setDeleting(null);
    if (res.success) {
      setIncomes((prev) => prev.filter((e) => e.id !== id));
      setTotal((p) => p - 1);
      toast({ title: "Income deleted" });
    } else {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">Income ({total})</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}
          className="btn-income h-8 px-3 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add New Income
        </Button>
      </div>

      <TransactionTableFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search Income..."
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
      />

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Wallet} title="No income records found"
            description={search ? "Try adjusting filters" : "Click 'Add New Income' to record your first income"}
            action={!search ? { label: "Add New Income", onClick: () => setAddOpen(true) } : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left">Inc No.</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">Date</th>
                  <th className="text-left">Payment Mode</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-left">Remarks</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((income) => (
                  <tr key={income.id}>
                    <td className="text-muted-foreground font-mono text-xs">{income.incomeNo}</td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
                        {income.category.name}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-xs">{formatDate(new Date(income.date))}</td>
                    <td className="text-muted-foreground text-xs">{income.paymentMethod === "CASH" ? "Cash" : "Bank"}</td>
                    <td className="text-right font-semibold text-emerald-400">
                      {formatCurrency(Number(income.totalAmount))}
                    </td>
                    <td className="text-muted-foreground text-xs max-w-[160px] truncate">{income.remarks ?? "—"}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(income.id)} disabled={deleting === income.id}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
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

      <AddIncomeModal open={addOpen} onClose={() => setAddOpen(false)} onSuccess={() => window.location.reload()} />
    </div>
  );
}
