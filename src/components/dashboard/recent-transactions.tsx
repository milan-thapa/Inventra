// src/components/dashboard/recent-transactions.tsx
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  description: string | null;
  amount: number | string;
  date: Date | string;
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const typeConfig: Record<string, { label: string; color: string }> = {
    INCOME:      { label: "Income",      color: "text-emerald-400" },
    EXPENSE:     { label: "Expense",     color: "text-rose-400" },
    PAYMENT_IN:  { label: "Payment In",  color: "text-emerald-400" },
    PAYMENT_OUT: { label: "Payment Out", color: "text-rose-400" },
  };

  return (
    <div className="bg-card rounded-xl border border-border/50">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
        <h3 className="font-semibold text-sm text-foreground">Recent Transactions</h3>
        <Link
          href="/reports/transactions"
          className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          View All Transactions
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left">Date</th>
                <th className="text-left">Type</th>
                <th className="text-left">Name</th>
                <th className="text-right">Total</th>
                <th className="text-right">Rec/Paid</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const config = typeConfig[tx.type] ?? { label: tx.type, color: "text-foreground" };
                const amount = Number(tx.amount);
                return (
                  <tr key={tx.id}>
                    <td className="text-muted-foreground">
                      {formatDate(new Date(tx.date), "dd MMM yyyy")}
                    </td>
                    <td>
                      <span className={cn("text-xs font-medium", config.color)}>
                        {config.label}
                      </span>
                    </td>
                    <td className="text-foreground">{tx.description ?? "—"}</td>
                    <td className={cn("text-right font-medium", config.color)}>
                      {formatCurrency(amount)}
                    </td>
                    <td className={cn("text-right", config.color)}>
                      {formatCurrency(amount)}
                    </td>
                    <td className="text-right text-muted-foreground">—</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
