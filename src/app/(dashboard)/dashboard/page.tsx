// src/app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { getDashboardStats, getCashflow, getRecentTransactions } from "@/lib/actions/dashboard";
import { getBusinessDashboardStats, getBusinessCashflow } from "@/lib/actions/business-dashboard";
import { getReminders } from "@/lib/actions/dashboard";
import { StatCards } from "@/components/dashboard/stat-cards";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { TotalBalance } from "@/components/dashboard/total-balance";
import { UpcomingReminders } from "@/components/dashboard/upcoming-reminders";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { BusinessDashboard } from "@/components/dashboard/business-dashboard";
import { TourTrigger } from "@/components/onboarding/tour-trigger";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  if (!profileRes.data) redirect("/onboarding");

  const profile = profileRes.data;
  const profileId = profile.id;
  const profileName = session.user.name?.split(" ")[0] ?? "there";
  const isBusiness = profile.type === "BUSINESS";

  const [statsRes, cashflowRes, txRes, remindersRes] = await Promise.all([
    isBusiness ? getBusinessDashboardStats(profileId) : getDashboardStats(profileId),
    isBusiness ? getBusinessCashflow(profileId) : getCashflow(profileId, "daily"),
    getRecentTransactions(profileId, 5),
    getReminders(profileId, false),
  ]);

  const stats     = statsRes.data     ?? (isBusiness 
    ? { sales: 0, purchases: 0, expense: 0, toReceive: 0, toGive: 0, inventoryValuation: 0, totalBalance: 0, currentMonth: "This Month" }
    : { income: 0, expense: 0, toReceive: 0, toGive: 0, totalBalance: 0, currentMonth: "This Month" });
  
  const cashflow  = cashflowRes.data  ?? { chart: [], totalIn: 0, totalOut: 0 };
  const recentTx  = (txRes.data ?? []).map(tx => ({...tx, amount: Number(tx.amount)}));
  const reminders = remindersRes.data ?? [];

  if (isBusiness) {
    return (
      <BusinessDashboard 
        profile={profile}
        profileName={profileName}
        stats={stats}
        cashflow={cashflow}
        recentTx={recentTx}
        reminders={reminders}
      />
    );
  }

  return (
    <div className="space-y-5">
      <TourTrigger />
      
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          Welcome {profileName}
        </h1>
        <DashboardActions />
      </div>

      {/* Stat cards */}
      <div data-tour="stat-cards">
        <StatCards stats={stats as any} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cashflow chart — takes 2 cols */}
        <div className="lg:col-span-2" data-tour="cashflow-chart">
          <CashflowChart initialData={cashflow} profileId={profileId} />
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <TotalBalance balance={stats.totalBalance} profileId={profileId} />
          <UpcomingReminders reminders={reminders} profileId={profileId} />
        </div>
      </div>

      {/* Recent transactions */}
      <div data-tour="recent-transactions">
        <RecentTransactions transactions={recentTx} />
      </div>
    </div>
  );
}
