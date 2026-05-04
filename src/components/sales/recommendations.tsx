// src/components/sales/recommendations.tsx
"use client";

import { useEffect, useState } from "react";
import { Sparkles, Plus, ShoppingCart } from "lucide-react";
import { getRecommendations } from "@/lib/actions/intelligence";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RecommendationsProps {
  profileId: string;
  cartItemIds: string[];
  onAdd: (item: any) => void;
  currency?: string;
}

export function Recommendations({ profileId, cartItemIds, onAdd, currency = "Rs." }: RecommendationsProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cartItemIds.length === 0) {
      setItems([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getRecommendations(profileId, cartItemIds);
      if (res.data) setItems(res.data);
      setLoading(false);
    }, 500); // Debounce to avoid too many queries

    return () => clearTimeout(timer);
  }, [profileId, cartItemIds]);

  if (items.length === 0 && !loading) return null;

  return (
    <div className="mt-6 pt-6 border-t border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-indigo-500/10 p-1.5 rounded-lg">
          <Sparkles className="w-4 h-4 text-indigo-500" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Frequently Bought Together
        </h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-shrink-0 w-40 bg-card border border-border/50 rounded-xl p-3 hover:border-indigo-500/50 transition-all shadow-sm group"
            >
              <div className="mb-2">
                <p className="text-[10px] font-bold truncate line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {item.name}
                </p>
                <p className="text-xs font-black mt-0.5">
                  {formatCurrency(item.sellingPrice, currency)}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onAdd(item)}
                className="w-full h-7 text-[10px] font-bold uppercase tracking-tighter border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all gap-1"
              >
                <Plus className="w-3 h-3" /> Add to cart
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <div className="flex gap-3">
            {[1, 2].map(i => (
              <div key={i} className="w-40 h-24 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
