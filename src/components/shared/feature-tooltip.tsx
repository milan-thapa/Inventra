// src/components/shared/feature-tooltip.tsx
"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface FeatureTooltipProps {
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  showByDefault?: boolean;
}

export function FeatureTooltip({
  title,
  description,
  position = "top",
  children,
  showByDefault = false,
}: FeatureTooltipProps) {
  const [isOpen, setIsOpen] = useState(showByDefault);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="inline-block"
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute z-50 w-72 bg-card border border-border/50 rounded-xl shadow-xl p-4 ${getPositionClasses()}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Predefined tooltips for common features
export const TOOLTIPS = {
  parties: {
    title: "Parties Management",
    description: "Add customers and suppliers to track who owes you money and who you owe. Keep your ledger organized and up-to-date.",
  },
  inventory: {
    title: "Inventory Management",
    description: "Add products with SKU, purchase price, selling price, and stock quantity. Track stock levels and get low stock alerts.",
  },
  sales: {
    title: "Sales Invoices",
    description: "Create professional sales invoices, track payments, and manage customer accounts. Support for multiple payment methods.",
  },
  purchase: {
    title: "Purchase Bills",
    description: "Record purchase bills from suppliers, track inventory additions, and manage supplier payments.",
  },
  expense: {
    title: "Expense Tracking",
    description: "Record daily expenses with categories. Track where your money goes and generate expense reports.",
  },
  income: {
    title: "Income Tracking",
    description: "Record all income sources with categories. Monitor your revenue streams and generate income reports.",
  },
  reports: {
    title: "Reports & Analytics",
    description: "Generate detailed reports including cash flow, party statements, category-wise analysis, and transaction history.",
  },
  quickPos: {
    title: "Quick POS",
    description: "Fast point-of-sale system for retail businesses. Create sales quickly with barcode scanning and product search.",
  },
  reminders: {
    title: "Reminders",
    description: "Set payment reminders and task reminders. Never miss important dates or follow-ups with customers.",
  },
};
