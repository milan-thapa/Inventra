// src/components/reports/category-report.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";

interface CategoryData {
  id: string;
  name: string;
  totalTransactions: number;
  totalAmount: number;
}

export function CategoryReportView({
  title,
  data,
  grandTotal,
  type,
  profileId: _,
}: {
  title: string;
  data: CategoryData[];
  grandTotal: number;
  type: "expense" | "income";
  profileId: string;
}) {
  const router = useRouter();
  const isExpense = type === "expense";

  const handleDownloadExcel = async () => {
    const { utils, writeFile } = await import("xlsx");
    const sheetData = data.map((r) => ({
      Category: r.name,
      "Total Transactions": r.totalTransactions,
      "Total Amount": r.totalAmount,
    }));
    const ws = utils.json_to_sheet(sheetData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, title);
    writeFile(wb, `${type}-category-report.xlsx`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
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

      {/* Filters bar */}
      <div className="flex items-center gap-2 mb-4 no-print">
        <div className="flex items-center gap-1.5 h-8 px-3 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground cursor-pointer hover:border-emerald-500 transition-colors">
          <span>This Month</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className={cn(
        "rounded-xl border p-4 mb-4",
        isExpense
          ? "bg-rose-500/10 border-rose-500/20"
          : "bg-emerald-500/10 border-emerald-500/20"
      )}>
        <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
        <p className={cn("text-2xl font-bold", isExpense ? "text-rose-400" : "text-emerald-400")}>
          {formatCurrency(grandTotal)}
        </p>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left">Category</th>
                <th className="text-center">Total Transactions</th>
                <th className="text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-muted-foreground text-sm">
                    No data for this period
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-foreground">{row.name}</td>
                    <td className="text-center text-muted-foreground">{row.totalTransactions}</td>
                    <td className="text-right">
                      <span className={cn(
                        "font-semibold",
                        row.totalAmount > 0
                          ? (isExpense ? "text-rose-400" : "text-emerald-400")
                          : "text-muted-foreground"
                      )}>
                        {formatCurrency(row.totalAmount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
