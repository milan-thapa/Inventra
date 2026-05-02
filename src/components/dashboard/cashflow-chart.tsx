// src/components/dashboard/cashflow-chart.tsx
"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Calendar } from "lucide-react";
import { formatCurrencyShort } from "@/lib/utils";
import { getCashflow } from "@/lib/actions/dashboard";

interface ChartData {
  chart: { date: string; label: string; moneyIn: number; moneyOut: number }[];
  totalIn: number;
  totalOut: number;
}

const PERIODS = [
  { value: "daily",   label: "Daily" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

// Custom tooltip
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-xs">
      <p className="font-medium text-foreground mb-1.5">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrencyShort(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function CashflowChart({
  initialData,
  profileId,
}: {
  initialData: ChartData;
  profileId: string;
}) {
  const [data, setData] = useState(initialData);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = async (newPeriod: "daily" | "weekly" | "monthly") => {
    setPeriod(newPeriod);
    setLoading(true);
    const res = await getCashflow(profileId, newPeriod);
    if (res.data) setData(res.data);
    setLoading(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">
          Cashflow{" "}
          <span className="text-muted-foreground font-normal text-sm">
            (Last {period === "daily" ? "7 Days" : period === "weekly" ? "4 Weeks" : "3 Months"})
          </span>
        </h3>

        {/* Period selector */}
        <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1" />
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                period === p.value
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-52 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm rounded-lg z-10">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chart} barSize={8} barGap={2}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyShort(v, "")}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="moneyIn"
              name="Money In"
              fill="#16a34a"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              dataKey="moneyOut"
              name="Money Out"
              fill="#ef4444"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Totals */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Total Money In</span>
          <span className="text-xs font-semibold text-emerald-400">
            {formatCurrencyShort(data.totalIn)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-xs text-muted-foreground">Total Money Out</span>
          <span className="text-xs font-semibold text-rose-400">
            {formatCurrencyShort(data.totalOut)}
          </span>
        </div>
      </div>
    </div>
  );
}
