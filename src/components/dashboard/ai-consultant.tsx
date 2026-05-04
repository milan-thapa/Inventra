// src/components/dashboard/ai-consultant.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Info, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAIInsights, getInventoryForecast } from "@/lib/actions/intelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AIConsultantProps {
  profileId: string;
}

export function AIConsultant({ profileId }: AIConsultantProps) {
  const [insights, setInsights] = useState<any>(null);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [insightsRes, forecastRes] = await Promise.all([
        getAIInsights(profileId),
        getInventoryForecast(profileId),
      ]);
      if (insightsRes.data) setInsights(insightsRes.data);
      if (forecastRes.data) setForecasts(forecastRes.data);
      setLoading(false);
    }
    loadData();
  }, [profileId]);

  if (loading) return <Skeleton className="h-[200px] w-full rounded-2xl" />;

  const hasAlerts = forecasts.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Insights Panel ───────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-32 h-32 rotate-12" />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">AI Business Consultant</h2>
          </div>

          <p className="text-indigo-50 leading-relaxed text-sm md:text-base font-medium mb-6">
            {insights?.summary || "Analyzing your business data to provide custom insights..."}
          </p>

          <div className="mt-auto flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Weekly Growth</span>
              <div className="flex items-center gap-1.5 mt-1">
                {insights?.growth >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                <span className="text-xl font-black">{Math.abs(insights?.growth || 0).toFixed(1)}%</span>
              </div>
            </div>

            <div className="h-10 w-px bg-white/20" />

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Top Item</span>
              <span className="text-lg font-bold mt-1 truncate max-w-[150px]">
                {insights?.topPerformer?.name || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Inventory Alerts ─────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "bg-card rounded-2xl p-6 border-2 border-dashed transition-colors",
          hasAlerts ? "border-rose-500/30 bg-rose-500/[0.02]" : "border-border/50"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <AlertTriangle className={cn("w-4 h-4", hasAlerts ? "text-rose-500" : "text-muted-foreground")} />
            Stock Alerts
          </h2>
          {hasAlerts && (
            <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
              {forecasts.length}
            </span>
          )}
        </div>

        <div className="space-y-4 max-h-[140px] overflow-y-auto custom-scrollbar pr-2">
          {forecasts.length > 0 ? (
            forecasts.map((item, i) => (
              <div key={item.itemId} className="flex items-center justify-between group">
                <div>
                  <p className="text-xs font-bold group-hover:text-rose-500 transition-colors">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">Stock: {item.stockQuantity} {item.unit}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-lg",
                    item.daysRemaining <= 1 ? "bg-rose-500 text-white" : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  )}>
                    {item.daysRemaining <= 0 ? "Out of Stock" : `~${item.daysRemaining} days left`}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="bg-emerald-500/10 p-3 rounded-full mb-3">
                <Info className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Inventory is healthy</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
