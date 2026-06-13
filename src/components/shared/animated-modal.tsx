// src/components/shared/animated-modal.tsx
"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface AnimatedModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function AnimatedModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: AnimatedModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div
              className={`bg-card border border-border rounded-2xl w-full ${maxWidth} shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
                <h2 className="font-bold text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
