// src/components/dashboard/ai-consultant.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, TrendingDown, Info, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAIInsights, getInventoryForecast } from "@/lib/actions/intelligence";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* ── Insights Panel ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-3 bg-card border border-border/50 rounded-xl p-6 shadow-sm"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-sm font-bold text-foreground">AI Business Consultant</h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5">
              Live
            </Badge>
          </div>

          <div className="mb-8">
            <p className="text-sm md:text-base text-foreground/70 leading-relaxed font-medium">
              {insights?.summary || "Analyzing your business data to provide custom insights..."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-border/40 mt-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Growth</span>
              <div className="flex items-center gap-1.5">
                {insights?.growth >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                <span className="text-base font-bold text-foreground">{Math.abs(insights?.growth || 0).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Top Item</span>
              <span className="text-sm font-bold text-foreground">
                {insights?.topPerformer?.name || "None"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Status</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Inventory Alerts ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex flex-col h-full"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Stock Alerts
          </h2>
          {hasAlerts && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {forecasts.length > 0 ? (
            forecasts.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.stockQuantity} {item.unit} left</p>
                </div>
                <Badge variant={item.daysRemaining <= 1 ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0">
                  {item.daysRemaining <= 0 ? "Out" : `${item.daysRemaining}d`}
                </Badge>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Everything in stock</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
