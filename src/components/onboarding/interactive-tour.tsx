// src/components/onboarding/interactive-tour.tsx
"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center" | "over";
}

interface InteractiveTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function InteractiveTour({ steps, isOpen, onClose, onComplete }: InteractiveTourProps) {
  const driverObj = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      driverObj.current = driver({
        showProgress: true,
        smoothScroll: true,
        allowClose: true,
        overlayColor: "rgba(0, 0, 0, 0.6)",
        onDestroyStarted: () => {
          if (driverObj.current) {
            driverObj.current.destroy();
          }
          onClose();
        },
        steps: steps.map((step, index) => ({
          element: step.target,
          popover: {
            title: step.title,
            description: step.description,
            side: step.position === "center" ? "over" : (step.position || "bottom"),
            align: "start",
            onNextClick: () => {
              if (index === steps.length - 1) {
                if (onComplete) onComplete();
                driverObj.current.destroy();
                onClose();
              } else {
                driverObj.current.moveNext();
              }
            }
          }
        }))
      });

      // Add a slight delay to ensure the DOM is fully ready (especially on first load)
      setTimeout(() => {
        if (driverObj.current) {
          driverObj.current.drive();
        }
      }, 100);
    } else {
      if (driverObj.current) {
        driverObj.current.destroy();
        driverObj.current = null;
      }
    }

    return () => {
      if (driverObj.current) {
        driverObj.current.destroy();
        driverObj.current = null;
      }
    };
  }, [isOpen, steps, onClose, onComplete]);

  return null;
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
