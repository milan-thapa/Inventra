// src/components/layout/header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Menu, Search, Bell, Sun, Moon, Monitor,
  LogOut, User, ChevronDown, Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsPanel } from "@/components/layout/notifications-panel";
import { useUIStore, useProfileStore } from "@/stores/profile-store";
import { getInitials } from "@/lib/utils";
import { updateProfileSettings } from "@/lib/actions/profile";

const THEMES = [
  { value: "dark", label: "Dark Theme", icon: Moon },
  { value: "light", label: "Light Theme", icon: Sun },
  { value: "classic", label: "Classic Theme", icon: Monitor },
  { value: "system", label: "System Default", icon: Monitor },
];

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
];

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    toggleSidebar,
    setCommandPaletteOpen,
    setNotificationsOpen,
    notificationsOpen,
  } = useUIStore();

  const { getActiveProfile, updateActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("en");

  // Sync theme from store on mount and when activeProfile changes
  useEffect(() => {
    if (activeProfile?.theme) {
      setTheme(activeProfile.theme);
      document.documentElement.setAttribute("data-theme", activeProfile.theme);
    }
    if (activeProfile?.language) {
      setLang(activeProfile.language);
    }
  }, [activeProfile?.theme, activeProfile?.language]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    updateActiveProfile({ theme: newTheme });
    if (activeProfile?.id) {
      await updateProfileSettings(activeProfile.id, { theme: newTheme as any });
    }
    setThemeMenuOpen(false);
  };

  // Close dropdowns on outside click
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
        setLangMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Ctrl+K / Cmd+K shortcut
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

  const closeAll = () => {
    setThemeMenuOpen(false);
    setLangMenuOpen(false);
    setUserMenuOpen(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <header className="h-14 bg-background border-b border-border/50 flex items-center px-3 flex-shrink-0 sticky top-0 z-10">

      {/* ── LEFT: Hamburger (fixed width so search can truly center) ── */}
      <div className="flex items-center w-10 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* ── CENTER: Search — uses absolute positioning to be truly centered ── */}
      <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-[360px] px-3 hidden sm:block">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg text-sm text-muted-foreground transition-colors border border-border/50 group"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0 group-hover:text-foreground transition-colors" />
          <span className="flex-1 text-left truncate text-xs sm:text-sm">
            Search or create anything...
          </span>
          <kbd className="hidden md:flex items-center gap-0.5 text-[10px] bg-background/80 px-1.5 py-0.5 rounded border border-border/70 flex-shrink-0 text-muted-foreground/70">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── RIGHT: Icons (flex-1 pushes to right edge) ── */}
      <div className="flex-1 flex items-center justify-end" ref={menuRef}>
        <div className="flex items-center gap-0.5">

          {/* Mobile: search icon opens palette directly */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Language — hidden on mobile */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => { setLangMenuOpen(!langMenuOpen); setThemeMenuOpen(false); setUserMenuOpen(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-base"
              title="Language"
            >
              {currentLang.flag}
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50 w-36">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                  >
                    <span>{l.flag}</span>
                    <span className="flex-1 text-left text-foreground">{l.label}</span>
                    {lang === l.code && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotificationsOpen(!notificationsOpen); closeAll(); }}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-1 ring-background" />
            </button>
            <NotificationsPanel />
          </div>

          {/* Theme — hidden on mobile */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => { setThemeMenuOpen(!themeMenuOpen); setLangMenuOpen(false); setUserMenuOpen(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Theme"
            >
              {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {themeMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50 w-44">
                {THEMES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => handleThemeChange(t.value)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
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

          {/* Divider */}
          <div className="w-px h-5 bg-border/70 mx-1.5 hidden sm:block" />

          {/* User */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setThemeMenuOpen(false); setLangMenuOpen(false); }}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-accent transition-colors"
            >
              <Avatar className="w-8 h-8 flex-shrink-0 border border-border/50 shadow-sm">
                <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "User"} />
                <AvatarFallback className="text-xs bg-emerald-600 text-white font-bold">
                  {getInitials(session?.user?.name ?? "U")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block max-w-[80px] truncate text-foreground">
                {session?.user?.name?.split(" ")[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden md:block flex-shrink-0" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50 w-48">
                <div className="px-3 py-3 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {session?.user?.email}
                  </p>
                </div>
                {/* Mobile-only: theme and language inside user menu */}
                <div className="sm:hidden border-b border-border/50">
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 pt-2 pb-1">
                    Appearance
                  </p>
                  <div className="flex items-center gap-1 px-3 pb-2">
                    {THEMES.slice(0, 3).map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          onClick={() => handleThemeChange(t.value)}
                          title={t.label}
                          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${theme === t.value
                              ? "bg-emerald-600/20 text-emerald-500"
                              : "hover:bg-accent text-muted-foreground"
                            }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                    <div className="w-px h-4 bg-border mx-1" />
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => setLang(l.code)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${lang === l.code
                            ? "bg-emerald-600/20"
                            : "hover:bg-accent"
                          }`}
                      >
                        {l.flag}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { router.push("/settings/my-account"); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">My Profile</span>
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors border-t border-border/50"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span className="text-rose-500">Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}