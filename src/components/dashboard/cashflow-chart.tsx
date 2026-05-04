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

import { motion, AnimatePresence } from "framer-motion";

// Custom tooltip
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e293b]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl text-[11px]">
      <p className="font-bold text-white mb-2 pb-1 border-b border-white/5">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-white/60">{entry.name}</span>
            </div>
            <span className="font-bold text-white">
              {formatCurrencyShort(entry.value)}
            </span>
          </div>
        ))}
      </div>
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1e293b]/50 backdrop-blur-xl rounded-2xl border border-white/5 p-6 shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Cashflow Trends
          </h3>
          <p className="text-xs text-white/40">
            {period === "daily" ? "Last 7 Days" : period === "weekly" ? "Last 4 Weeks" : "Last 3 Months"} overview
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              className={`text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-lg transition-all ${
                period === p.value
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 relative">
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/40 backdrop-blur-[2px] rounded-xl z-10"
            >
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chart} barSize={period === 'daily' ? 12 : 20} barGap={4}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyShort(v, "")}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
            />
            <Bar
              dataKey="moneyIn"
              name="Money In"
              fill="url(#colorIn)"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
            <Bar
              dataKey="moneyOut"
              name="Money Out"
              fill="url(#colorOut)"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Totals */}
      <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Total Inflow</span>
            <span className="text-sm font-bold text-emerald-400">
              {formatCurrencyShort(data.totalIn)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">Total Outflow</span>
            <span className="text-sm font-bold text-rose-400">
              {formatCurrencyShort(data.totalOut)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
