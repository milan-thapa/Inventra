// src/app/(dashboard)/reports/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Banknote, TrendingDown, TrendingUp, Receipt, UserCheck
} from "lucide-react";
import { REPORTS } from "@/lib/constants";

export const metadata = { title: "Reports" };

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Banknote, TrendingDown, TrendingUp, Receipt, UserCheck
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((report) => {
          const Icon = ICON_MAP[report.icon] ?? Receipt;
          return (
            <Link key={report.id} href={report.href}>
              <div className="bg-card rounded-xl border border-border/50 p-5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/15 flex items-center justify-center group-hover:bg-emerald-600/25 transition-colors">
                    <Icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground mb-1 group-hover:text-emerald-400 transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
