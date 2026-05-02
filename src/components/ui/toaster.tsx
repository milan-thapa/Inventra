// src/components/ui/toaster.tsx
"use client";

import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border shadow-2xl",
              toast.variant === "destructive"
                ? "bg-destructive/15 border-destructive/30 text-destructive"
                : "bg-card border-border text-foreground"
            )}
          >
            {toast.variant === "destructive"
              ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
            }
            <div className="flex-1 min-w-0">
              {toast.title && (
                <p className="text-sm font-semibold leading-tight">{toast.title}</p>
              )}
              {toast.description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button onClick={() => dismiss(toast.id)}
              className="p-0.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
