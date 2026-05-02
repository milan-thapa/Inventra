// src/components/layout/command-palette.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowDownLeft, ArrowUpRight, Receipt, Users,
  LayoutDashboard, BarChart3, X,
} from "lucide-react";
import { useUIStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";

const SHORTCUTS = [
  { label: "Payment In",   shortcut: "Alt + I", icon: ArrowDownLeft, color: "text-emerald-500", action: "payment-in" },
  { label: "Payment Out",  shortcut: "Alt + O", icon: ArrowUpRight,  color: "text-rose-500",    action: "payment-out" },
  { label: "Expense",      shortcut: "Alt + E", icon: Receipt,       color: "text-orange-500",  action: "expense" },
  { label: "Party",        shortcut: "Alt + N", icon: Users,         color: "text-blue-500",    action: "party" },
];

const QUICK_LINKS = [
  { label: "Dashboard",    href: "/dashboard",       icon: LayoutDashboard },
  { label: "Parties",      href: "/parties",          icon: Users },
  { label: "Reports",      href: "/reports",          icon: BarChart3 },
];

export function CommandPalette() {
  const router = useRouter();
  const {
    commandPaletteOpen, setCommandPaletteOpen,
    setAddExpenseOpen, setAddIncomeOpen,
    setAddPaymentInOpen, setAddPaymentOutOpen,
  } = useUIStore();
  const [query, setQuery] = useState("");

  // Handle keyboard shortcuts inside palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const handleShortcut = (action: string) => {
    switch (action) {
      case "payment-in":
        setAddPaymentInOpen(true);
        break;
      case "payment-out":
        setAddPaymentOutOpen(true);
        break;
      case "expense":
        setAddExpenseOpen(true);
        break;
      case "party":
        router.push('/parties');
        break;
      default:
        break;
    }
  };

  const runCommand = useCallback((command: () => void) => {
    setCommandPaletteOpen(false);
    command();
  }, [setCommandPaletteOpen]);

  const commands = [
    { label: "Payment In",   shortcut: "Alt + I", icon: ArrowDownLeft, color: "text-emerald-500", action: "payment-in" },
    { label: "Payment Out",  shortcut: "Alt + O", icon: ArrowUpRight,  color: "text-rose-500",    action: "payment-out" },
    { label: "Expense",      shortcut: "Alt + E", icon: Receipt,       color: "text-orange-500",  action: "expense" },
    { label: "Party",        shortcut: "Alt + N", icon: Users,         color: "text-blue-500",    action: "party" },
  ];

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for transactions, parties & inventory..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded hover:bg-accent transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Shortcuts section */}
            <div className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Shortcuts (for adding data)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SHORTCUTS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.action}
                      onClick={() => handleShortcut(s.action)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center bg-muted flex-shrink-0",
                        "group-hover:scale-110 transition-transform"
                      )}>
                        <Icon className={cn("w-4 h-4", s.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.shortcut}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick links */}
              {!query && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Quick Navigate
                  </p>
                  <div className="space-y-0.5">
                    {QUICK_LINKS.map((link) => {
                      const Icon = link.icon;
                      return (
                        <button
                          key={link.href}
                          onClick={() => { router.push(link.href); setCommandPaletteOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm text-left"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{link.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
