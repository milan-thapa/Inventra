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

const DEFAULT_PAGES = ALL_PAGES.filter(p =>
  ["Dashboard", "Parties", "Reports", "Expense", "Income"].includes(p.label)
);

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

  const q = query.toLowerCase().trim();

  const filteredPages = q
    ? ALL_PAGES.filter(p =>
      p.label.toLowerCase().includes(q) ||
      p.group.toLowerCase().includes(q)
    )
    : DEFAULT_PAGES;

  const filteredActions = q
    ? ALL_ACTIONS.filter(a => a.label.toLowerCase().includes(q))
    : ALL_ACTIONS;

  const totalResults = filteredPages.length + filteredActions.length;

  const runAction = useCallback((action: string) => {
    setCommandPaletteOpen(false);

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
        router.push("/parties");
        break;
    }
  }, [
    setCommandPaletteOpen,
    setAddPaymentInOpen,
    setAddPaymentOutOpen,
    setAddExpenseOpen,
    router
  ]);

  // ── Open/close shortcut ─────────────────────────────
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

  // ── Arrow navigation ────────────────────────────────
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

        if (selectedIndex < filteredActions.length) {
          runAction(filteredActions[selectedIndex].action);
        } else {
          const page =
            filteredPages[selectedIndex - filteredActions.length];

          if (page) {
            router.push(page.href);
            setCommandPaletteOpen(false);
          }
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    commandPaletteOpen,
    selectedIndex,
    filteredActions,
    filteredPages,
    totalResults,
    router,
    runAction,
    setCommandPaletteOpen
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [commandPaletteOpen]);

  const pageGroups = filteredPages.reduce<Record<string, typeof filteredPages>>(
    (acc, page) => {
      if (!acc[page.group]) acc[page.group] = [];
      acc[page.group].push(page);
      return acc;
    },
    {}
  );

  let globalIndex = 0;

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setCommandPaletteOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[10%] sm:top-[15%] inset-x-0 mx-auto w-[calc(100%-2rem)] sm:w-full max-w-lg bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground" />

              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, tools, actions..."
                className="flex-1 bg-transparent text-sm outline-none"
              />

              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto p-2">

              {totalResults === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-sm">
                    No results for{" "}
                    <span className="text-foreground font-medium">
                      &ldquo;{query}&rdquo;
                    </span>
                  </p>
                </div>
              )}

              {filteredActions.map((action) => {
                const Icon = action.icon;
                const isSelected = selectedIndex === globalIndex++;

                return (
                  <button
                    key={action.action}
                    onClick={() => runAction(action.action)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded",
                      isSelected ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm">{action.label}</span>
                  </button>
                );
              })}

              {Object.entries(pageGroups).map(([group, pages]) => (
                <div key={group}>
                  <p className="text-xs px-2 py-1 text-muted-foreground">
                    {group}
                  </p>

                  {pages.map((page) => {
                    const Icon = page.icon;
                    const isSelected =
                      selectedIndex ===
                      filteredActions.length +
                      filteredPages.indexOf(page);

                    return (
                      <button
                        key={page.href}
                        onClick={() => {
                          router.push(page.href);
                          setCommandPaletteOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded w-full",
                          isSelected ? "bg-accent" : "hover:bg-accent/60"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{page.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}