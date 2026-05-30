// src/components/reports/cash-statement.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

interface Row {
  id: string;
  type: string;
  description: string | null;
  moneyIn: number;
  moneyOut: number;
  balance: number;
  date: Date | string;
}

export function CashStatementView({
  rows,
  closingBalance,
  from,
  to,
  profileName,
}: {
  rows: Row[];
  closingBalance: number;
  from: Date;
  to: Date;
  profileName: string;
}) {
  const router = useRouter();

  const handleDownloadExcel = async () => {
    const { exportToExcel } = await import("@/lib/export");
    const data = rows.map((r) => ({
      Date: formatDate(new Date(r.date)),
      Particular: r.type,
      "Notes/Remarks": r.description ?? "—",
      "Money In": r.moneyIn || "",
      "Money Out": r.moneyOut || "",
      Balance: r.balance,
    }));
    await exportToExcel(data, "cash-in-hand-statement", "Cash Statement");
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
          <h1 className="text-xl font-bold text-foreground">Cash In Hand Statement</h1>
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

      {/* Printable Statement */}
      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
        {/* Print header */}
        <div className="p-5 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-foreground text-lg">{profileName}</h2>
              <p className="text-sm text-muted-foreground">Cash In Hand Statement</p>
              <p className="text-xs text-muted-foreground mt-1">
                From: {formatDate(new Date(from))} — To: {formatDate(new Date(to))}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end mb-1">
                <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">I</span>
                </div>
                <span className="font-bold text-foreground">{APP_NAME}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                Closing Balance: {formatCurrency(closingBalance)}
              </p>
              <p className="text-xs text-muted-foreground">
                Total entries: {rows.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Report Generated on {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No transactions in this period
            </div>
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left">Date</th>
                  <th className="text-left">Particular</th>
                  <th className="text-left">Notes/Remarks</th>
                  <th className="text-right">Money In</th>
                  <th className="text-right">Money Out</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(new Date(row.date))}
                    </td>
                    <td className="text-sm text-foreground">{row.type}</td>
                    <td className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {row.description ?? "—"}
                    </td>
                    <td className="text-right text-xs">
                      {row.moneyIn > 0
                        ? <span className="text-emerald-400 font-medium">{formatCurrency(row.moneyIn)}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="text-right text-xs">
                      {row.moneyOut > 0
                        ? <span className="text-rose-400 font-medium">{formatCurrency(row.moneyOut)}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className={cn("text-right text-xs font-semibold",
                      row.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td colSpan={5} className="text-right text-sm font-bold text-foreground py-3 pr-4">
                    Closing Balance:
                  </td>
                  <td className={cn("text-right text-sm font-bold py-3",
                    closingBalance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {formatCurrency(closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
