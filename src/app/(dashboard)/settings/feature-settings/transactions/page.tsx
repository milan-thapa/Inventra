// src/app/(dashboard)/settings/feature-settings/transactions/page.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Transaction Settings" };

export default async function TransactionSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-bold text-foreground mb-6">Transaction Settings</h2>
      <div className="space-y-2">
        {[
          { label: "Manage Income Categories",  href: "/settings/feature-settings/transactions/manage-income-categories" },
          { label: "Manage Expense Categories", href: "/settings/feature-settings/transactions/manage-expense-categories" },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group">
            <span className="text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors">
              {item.label}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
