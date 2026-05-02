// src/app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getDashboardStats, getCashflow, getRecentTransactions } from "@/lib/actions/dashboard";
import { getReminders } from "@/lib/actions/dashboard";
import { StatCards } from "@/components/dashboard/stat-cards";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { TotalBalance } from "@/components/dashboard/total-balance";
import { UpcomingReminders } from "@/components/dashboard/upcoming-reminders";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DashboardActions } from "@/components/dashboard/dashboard-actions";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profileId = profileRes.data.id;
  const profileName = session.user.name?.split(" ")[0] ?? "there";

  const [statsRes, cashflowRes, txRes, remindersRes] = await Promise.all([
    getDashboardStats(profileId),
    getCashflow(profileId, "daily"),
    getRecentTransactions(profileId, 5),
    getReminders(profileId, false),
  ]);

  const stats     = statsRes.data     ?? { income: 0, expense: 0, toReceive: 0, toGive: 0, totalBalance: 0, currentMonth: "This Month" };
  const cashflow  = cashflowRes.data  ?? { chart: [], totalIn: 0, totalOut: 0 };
  const recentTx  = txRes.data        ?? [];
  const reminders = remindersRes.data ?? [];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          Welcome {profileName}
        </h1>
        <DashboardActions />
      </div>

      {/* Stat cards */}
      <StatCards stats={stats} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Cashflow chart — takes 2 cols */}
        <div className="xl:col-span-2">
          <CashflowChart initialData={cashflow} profileId={profileId} />
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <TotalBalance balance={stats.totalBalance} profileId={profileId} />
          <UpcomingReminders reminders={reminders} profileId={profileId} />
        </div>
      </div>

      {/* Recent transactions */}
      <RecentTransactions transactions={recentTx.map(tx => ({...tx, amount: tx.amount.toNumber()}))} />
    </div>
  );
}
