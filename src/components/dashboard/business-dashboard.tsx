"use client";

import { BusinessStatCards } from "./business-stat-cards";
import { CashflowChart } from "./cashflow-chart";
import { TotalBalance } from "./total-balance";
import { UpcomingReminders } from "./upcoming-reminders";
import { BusinessDashboardActions } from "./business-dashboard-actions";
import { RecentTransactions } from "./recent-transactions";

interface BusinessDashboardProps {
  profile: any;
  profileName: string;
  stats: any;
  cashflow: any;
  recentTx: any[];
  reminders: any[];
}

export function BusinessDashboard({
  profile,
  profileName,
  stats,
  cashflow,
  recentTx,
  reminders,
}: BusinessDashboardProps) {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          Welcome {profileName}
        </h1>
        <BusinessDashboardActions />
      </div>

      {/* Stat cards */}
      <BusinessStatCards stats={stats} />

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Cashflow chart — takes 2 cols */}
        <div className="xl:col-span-2">
          <CashflowChart initialData={cashflow} profileId={profile.id} />
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <TotalBalance balance={stats.totalBalance} profileId={profile.id} />
          


          <UpcomingReminders reminders={reminders} profileId={profile.id} />
        </div>
      </div>

      {/* Recent transactions */}
      <RecentTransactions transactions={recentTx} />
    </div>
  );
}
