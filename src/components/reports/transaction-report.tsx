// src/components/reports/transaction-report.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  description: string | null;
  amount: number | string;
  date: Date | string;
}

export function TransactionReportView({
  transactions,
  profileId: _,
}: {
  transactions: Transaction[];
  profileId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    INCOME:      { label: "Income",      color: "text-emerald-400" },
    EXPENSE:     { label: "Expense",     color: "text-rose-400" },
    PAYMENT_IN:  { label: "Payment In",  color: "text-emerald-400" },
    PAYMENT_OUT: { label: "Payment Out", color: "text-rose-400" },
  };

  const filtered = transactions.filter((tx) => {
    const matchSearch = !search ||
      (tx.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "ALL" || tx.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalIn = filtered
    .filter((t) => t.type === "INCOME" || t.type === "PAYMENT_IN")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOut = filtered
    .filter((t) => t.type === "EXPENSE" || t.type === "PAYMENT_OUT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleDownloadExcel = async () => {
    const { utils, writeFile } = await import("xlsx");
    const data = filtered.map((t) => ({
      Date: formatDate(new Date(t.date)),
      Type: TYPE_LABELS[t.type]?.label ?? t.type,
      Description: t.description ?? "—",
      Amount: Number(t.amount),
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Transactions");
    writeFile(wb, "transaction-report.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Print-only header */}
      <div className="print-only mb-10 border-b pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-black mb-1">Inventra Report</h1>
            <p className="text-gray-500 text-sm">Transaction Statement</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">Generated on</p>
            <p className="text-sm text-gray-500">{formatDate(new Date(), "PPpp")}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Transaction Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border/50"
            onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" /> Print PDF
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleDownloadExcel}>
            <Download className="w-3.5 h-3.5" /> Download Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 no-print">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-muted/30 border-border/50 w-48" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none">
          <option value="ALL">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
          <option value="PAYMENT_IN">Payment In</option>
          <option value="PAYMENT_OUT">Payment Out</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total In</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalIn)}</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Out</p>
          <p className="text-xl font-bold text-rose-400">{formatCurrency(totalOut)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left">Date</th>
                <th className="text-left">Type</th>
                <th className="text-left">Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-muted-foreground text-sm">No transactions found</td></tr>
              ) : (
                filtered.map((tx) => {
                  const cfg = TYPE_LABELS[tx.type] ?? { label: tx.type, color: "text-foreground" };
                  const isIn = tx.type === "INCOME" || tx.type === "PAYMENT_IN";
                  return (
                    <tr key={tx.id}>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(new Date(tx.date))}
                      </td>
                      <td><span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span></td>
                      <td className="text-sm text-foreground max-w-[200px] truncate">{tx.description ?? "—"}</td>
                      <td className={cn("text-right text-sm font-semibold", isIn ? "text-emerald-400" : "text-rose-400")}>
                        {isIn ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
