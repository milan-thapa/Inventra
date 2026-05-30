// src/components/onboarding/interactive-tour.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface InteractiveTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function InteractiveTour({ steps, isOpen, onClose, onComplete }: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const removeHighlight = useCallback(() => {
    if (highlightedElement) {
      highlightedElement.style.position = "";
      highlightedElement.style.zIndex = "";
      setHighlightedElement(null);
    }
  }, [highlightedElement]);

  const highlightElement = useCallback(() => {
    removeHighlight();
    const step = steps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.style.position = "relative";
        element.style.zIndex = "50";
      }
    }
  }, [removeHighlight, steps, currentStep]);

  useEffect(() => {
    if (isOpen) {
      highlightElement();
    } else {
      removeHighlight();
    }
  }, [isOpen, currentStep, highlightElement, removeHighlight]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    removeHighlight();
    onComplete?.();
    onClose();
  };

  const step = steps[currentStep];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Tour Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed z-50 max-w-sm bg-card border border-border/50 rounded-xl shadow-2xl p-6"
          style={{
            top: step.position === "center" ? "50%" : undefined,
            left: step.position === "center" ? "50%" : undefined,
            transform: step.position === "center" ? "translate(-50%, -50%)" : undefined,
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              size="sm"
              onClick={nextStep}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {currentStep === steps.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentStep
                    ? "w-6 bg-emerald-600"
                    : index < currentStep
                    ? "w-1.5 bg-emerald-600"
                    : "w-1.5 bg-muted"
                )}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// Predefined tour steps for dashboard
export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: "Navigation Sidebar",
    description: "Access all your business features from here. Switch between Dashboard, Parties, Inventory, Sales, and more.",
    position: "right",
  },
  {
    target: '[data-tour="stat-cards"]',
    title: "Quick Stats",
    description: "View your key business metrics at a glance - total sales, purchases, expenses, and more.",
    position: "bottom",
  },
  {
    target: '[data-tour="cashflow-chart"]',
    title: "Cashflow Chart",
    description: "Track your income and expenses over time with this interactive chart.",
    position: "bottom",
  },
  {
    target: '[data-tour="recent-transactions"]',
    title: "Recent Transactions",
    description: "See your latest transactions and quickly access detailed views.",
    position: "left",
  },
  {
    target: '[data-tour="quick-actions"]',
    title: "Quick Actions",
    description: "Create new invoices, add parties, or record expenses with one click.",
    position: "bottom",
  },
];

// Predefined tour steps for parties page
export const PARTIES_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="add-party"]',
    title: "Add New Party",
    description: "Click here to add a new customer or supplier to your ledger.",
    position: "bottom",
  },
  {
    target: '[data-tour="party-filters"]',
    title: "Filter Parties",
    description: "Filter parties by payment status - To Receive, To Give, or Settled.",
    position: "bottom",
  },
  {
    target: '[data-tour="party-list"]',
    title: "Party List",
    description: "View all your parties with their current balance and transaction history.",
    position: "center",
  },
];

// Predefined tour steps for inventory page
export const INVENTORY_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="add-item"]',
    title: "Add New Item",
    description: "Add products to your inventory with details like SKU, price, and stock quantity.",
    position: "bottom",
  },
  {
    target: '[data-tour="stock-filter"]',
    title: "Stock Filter",
    description: "Quickly filter items by stock status - In Stock, Low Stock, or Out of Stock.",
    position: "bottom",
  },
  {
    target: '[data-tour="item-cards"]',
    title: "Item Cards",
    description: "View all your inventory items with quick actions to add/reduce stock or edit details.",
    position: "center",
  },
];
