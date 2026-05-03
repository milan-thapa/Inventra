// src/components/layout/command-palette.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowDownLeft, ArrowUpRight, Receipt, Users,
  LayoutDashboard, BarChart3, X, Building2, Wallet,
  HelpCircle, BookOpen, Sparkles, Settings, CreditCard,
  Gift, Bell, Image, Wrench, ArrowRight,
} from "lucide-react";
import { useUIStore } from "@/stores/profile-store";
import { cn } from "@/lib/utils";

// ── All searchable items ──────────────────────────────────────────
const ALL_PAGES = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Pages" },
  { label: "Parties", href: "/parties", icon: Users, group: "Pages" },
  { label: "Expense", href: "/expense", icon: Receipt, group: "Pages" },
  { label: "Income", href: "/income", icon: Wallet, group: "Pages" },
  { label: "Manage Accounts", href: "/manage-account", icon: Building2, group: "Pages" },
  { label: "Reports", href: "/reports", icon: BarChart3, group: "Pages" },
  { label: "Business Cards", href: "/business-tools/business-cards", icon: CreditCard, group: "Tools" },
  { label: "Greeting Cards", href: "/business-tools/greeting-cards", icon: Gift, group: "Tools" },
  { label: "Reminders", href: "/business-tools/reminders", icon: Bell, group: "Tools" },
  { label: "Bill Gallery", href: "/business-tools/bill-gallery", icon: Image, group: "Tools" },
  { label: "Notebook", href: "/business-tools/notebook", icon: BookOpen, group: "Tools" },
  { label: "Help & Support", href: "/help-and-supports", icon: HelpCircle, group: "Support" },
  { label: "Tutorials", href: "/tutorials", icon: BookOpen, group: "Support" },
  { label: "What's New", href: "/whats-new", icon: Sparkles, group: "Support" },
  { label: "Settings", href: "/settings/general", icon: Settings, group: "Settings" },
];

const ALL_ACTIONS = [
  { label: "Add Payment In", shortcut: "Alt + I", icon: ArrowDownLeft, color: "text-emerald-500", action: "payment-in", group: "Quick Add" },
  { label: "Add Payment Out", shortcut: "Alt + O", icon: ArrowUpRight, color: "text-rose-500", action: "payment-out", group: "Quick Add" },
  { label: "Add Expense", shortcut: "Alt + E", icon: Receipt, color: "text-orange-500", action: "expense", group: "Quick Add" },
  { label: "Add Party", shortcut: "Alt + N", icon: Users, color: "text-blue-500", action: "party", group: "Quick Add" },
];

// Default items shown when query is empty
const DEFAULT_PAGES = ALL_PAGES.filter(p => ["Dashboard", "Parties", "Reports", "Expense", "Income"].includes(p.label));

export function CommandPalette() {
  const router = useRouter();
  const {
    commandPaletteOpen, setCommandPaletteOpen,
    setAddExpenseOpen, setAddIncomeOpen,
    setAddPaymentInOpen, setAddPaymentOutOpen,
  } = useUIStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Filtering ───────────────────────────────────────────────────
  const q = query.toLowerCase().trim();

  const filteredPages = q
    ? ALL_PAGES.filter(p => p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q))
    : DEFAULT_PAGES;

  const filteredActions = q
    ? ALL_ACTIONS.filter(a => a.label.toLowerCase().includes(q))
    : ALL_ACTIONS;

  const totalResults = filteredPages.length + filteredActions.length;

  const runAction = useCallback((action: string) => {
    setCommandPaletteOpen(false);
    switch (action) {
      case "payment-in": setAddPaymentInOpen(true); break;
      case "payment-out": setAddPaymentOutOpen(true); break;
      case "expense": setAddExpenseOpen(true); break;
      case "party": router.push("/parties"); break;
    }
  }, [setCommandPaletteOpen, setAddPaymentInOpen, setAddPaymentOutOpen, setAddExpenseOpen, router]);

  // ── Keyboard shortcut to open/close ─────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") setCommandPaletteOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // ── Arrow key navigation ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, totalResults - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        // actions come first in the list
        if (selectedIndex < filteredActions.length) {
          runAction(filteredActions[selectedIndex].action);
        } else {
          const page = filteredPages[selectedIndex - filteredActions.length];
          if (page) { router.push(page.href); setCommandPaletteOpen(false); }
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [commandPaletteOpen, selectedIndex, filteredActions, filteredPages, totalResults, router, runAction, setCommandPaletteOpen]);

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [commandPaletteOpen]);

  // Group filtered pages by group name
  const pageGroups = filteredPages.reduce<Record<string, typeof filteredPages>>((acc, page) => {
    if (!acc[page.group]) acc[page.group] = [];
    acc[page.group].push(page);
    return acc;
  }, {});

  let globalIndex = 0; // for keyboard navigation tracking

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
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[10%] sm:top-[15%] inset-x-0 mx-auto w-[calc(100%-2rem)] sm:w-full max-w-lg bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, tools, actions..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-0.5 rounded hover:bg-accent transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <kbd
                onClick={() => setCommandPaletteOpen(false)}
                className="hidden sm:flex items-center text-xs bg-muted px-1.5 py-0.5 rounded border border-border cursor-pointer text-muted-foreground"
              >
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto p-2">

              {/* No results */}
              {totalResults === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No results for <span className="text-foreground font-medium">&quot;{query}&quot;</span></p>
                  <p className="text-xs mt-1 opacity-60">Try searching for pages, tools, or actions</p>
                </div>
              )}

              {/* Quick Add Actions */}
              {filteredActions.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 py-1.5">
                    {q ? "Actions" : "Quick Add"}
                  </p>
                  <div className={cn("grid gap-1", !q ? "grid-cols-2" : "grid-cols-1")}>
                    {filteredActions.map((action, i) => {
                      const Icon = action.icon;
                      const isSelected = selectedIndex === globalIndex++;
                      return (
                        <button
                          key={action.action}
                          onClick={() => runAction(action.action)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group",
                            isSelected ? "bg-accent" : "hover:bg-accent/70"
                          )}
                        >
                          <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                            <Icon className={cn("w-3.5 h-3.5", action.color)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{action.label}</p>
                            <p className="text-xs text-muted-foreground">{action.shortcut}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pages grouped */}
              {filteredPages.length > 0 && Object.entries(pageGroups).map(([group, pages]) => (
                <div key={group} className="mb-2">
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 py-1.5">
                    {q ? group : "Quick Navigate"}
                  </p>
                  {pages.map((page) => {
                    const Icon = page.icon;
                    const isSelected = selectedIndex === (filteredActions.length + filteredPages.indexOf(page));
                    return (
                      <button
                        key={page.href}
                        onClick={() => { router.push(page.href); setCommandPaletteOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group",
                          isSelected ? "bg-accent" : "hover:bg-accent/70"
                        )}
                      >
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="flex-1 text-sm text-foreground truncate">{page.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="flex items-center gap-3 px-4 py-2 border-t border-border/50 text-[10px] text-muted-foreground/50">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}