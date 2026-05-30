"use client";

import { BusinessStatCards } from "./business-stat-cards";
import { CashflowChart } from "./cashflow-chart";
import { TotalBalance } from "./total-balance";
import { UpcomingReminders } from "./upcoming-reminders";
import { BusinessDashboardActions } from "./business-dashboard-actions";
import { RecentTransactions } from "./recent-transactions";
import { AIConsultant } from "./ai-consultant";
import { TourTrigger } from "@/components/onboarding/tour-trigger";

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
      <TourTrigger />
      
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          Welcome {profileName}
        </h1>
        <BusinessDashboardActions />
      </div>

      {/* Stat cards */}
      <div data-tour="stat-cards">
        <BusinessStatCards stats={stats} />
      </div>

      {/* AI Consultant & Stock Alerts */}
      {/* <AIConsultant profileId={profile.id} /> */}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Cashflow chart — takes 2 cols */}
        <div className="lg:col-span-2" data-tour="cashflow-chart">
          <CashflowChart initialData={cashflow} profileId={profile.id} />
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <TotalBalance balance={stats.totalBalance} profileId={profile.id} />
          <UpcomingReminders reminders={reminders} profileId={profile.id} />
        </div>
      </div>

      {/* Recent transactions */}
      <div data-tour="recent-transactions">
        <RecentTransactions transactions={recentTx} />
      </div>
    </div>
  );
}
