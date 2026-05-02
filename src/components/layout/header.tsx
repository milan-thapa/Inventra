// src/components/layout/header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu, Search, Bell, Sun, Moon, Monitor, LogOut,
  User, ChevronDown, Plus, ArrowDownLeft, ArrowUpRight, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsPanel } from "@/components/layout/notifications-panel";
import { useUIStore } from "@/stores/profile-store";
import { useProfileStore } from "@/stores/profile-store";
import { cn, getInitials } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { BarChart3 } from "lucide-react";

const THEMES = [
  { value: "dark",    label: "Dark Theme",     icon: Moon },
  { value: "light",   label: "Light Theme",    icon: Sun },
  { value: "classic", label: "Classic Theme",  icon: Monitor },
  { value: "system",  label: "System Default", icon: Monitor },
];

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
];

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    toggleSidebar, sidebarOpen,
    setCommandPaletteOpen, setNotificationsOpen, notificationsOpen,
    setAddExpenseOpen, setAddIncomeOpen, setAddPaymentInOpen, setAddPaymentOutOpen,
  } = useUIStore();
  const { getActiveProfile } = useProfileStore();

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("en");

  const activeProfile = getActiveProfile();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Close menus on outside click
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
        setLangMenuOpen(false);
        setUserMenuOpen(false);
        setAddMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setCommandPaletteOpen]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <header className="h-14 bg-background border-b border-border/50 flex items-center px-3 gap-2 flex-shrink-0 sticky top-0 z-10">

      {/* ── Logo + Hamburger ────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-1.5 mr-1">
          <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm hidden lg:block">{APP_NAME}</span>
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* ── Search Bar ──────────────────────────────────── */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex-1 max-w-sm flex items-center gap-2 px-3 py-1.5 bg-muted/50 hover:bg-muted rounded-lg text-sm text-muted-foreground transition-colors border border-border/50"
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Search or create anything...</span>
        <kbd className="hidden sm:flex items-center gap-1 text-xs bg-background/50 px-1.5 py-0.5 rounded border border-border/50">
          Ctrl K
        </kbd>
      </button>

      {/* ── Spacer ──────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Right Actions ───────────────────────────────── */}
      <div className="flex items-center gap-1" ref={menuRef}>

        {/* Add Expense Button */}
        <Button
          size="sm"
          onClick={() => setAddExpenseOpen(true)}
          className="hidden sm:flex btn-expense h-8 px-3 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Expense
        </Button>

        {/* Add Income Button */}
        <Button
          size="sm"
          onClick={() => setAddIncomeOpen(true)}
          className="hidden sm:flex btn-income h-8 px-3 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Income
        </Button>

        {/* Add More dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddMoreOpen(!addMoreOpen)}
            className="h-8 px-2.5 text-xs gap-1 border-border/50"
          >
            <span className="hidden sm:block">Add More</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
          {addMoreOpen && (
            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 w-44">
              <button
                onClick={() => { setAddPaymentInOpen(true); setAddMoreOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                Payment In
              </button>
              <button
                onClick={() => { setAddPaymentOutOpen(true); setAddMoreOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                Payment Out
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />

        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => { setLangMenuOpen(!langMenuOpen); setThemeMenuOpen(false); setUserMenuOpen(false); }}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-sm"
            title="Language"
          >
            {currentLang.flag}
          </button>
          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 w-36">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  {lang === l.code && <span className="text-emerald-500">✓</span>}
                  <span>{l.flag}</span>
                  <span className="text-foreground">{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); setThemeMenuOpen(false); }}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>
          <NotificationsPanel />
        </div>

        {/* Theme toggle */}
        <div className="relative">
          <button
            onClick={() => { setThemeMenuOpen(!themeMenuOpen); setLangMenuOpen(false); setUserMenuOpen(false); }}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Theme"
          >
            {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          {themeMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 w-44">
              {THEMES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => { setTheme(t.value); setThemeMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-left text-foreground">{t.label}</span>
                    {theme === t.value && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setThemeMenuOpen(false); setLangMenuOpen(false); }}
            className="flex items-center gap-1.5 p-1 rounded-md hover:bg-accent transition-colors"
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={session?.user?.image ?? ""} />
              <AvatarFallback className="text-xs bg-emerald-600 text-white">
                {getInitials(session?.user?.name ?? "U")}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden md:block max-w-[100px] truncate">
              {session?.user?.name?.split(" ")[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 w-44">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
              <button
                onClick={() => { router.push("/settings/my-account"); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                My Profile
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-rose-500"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
