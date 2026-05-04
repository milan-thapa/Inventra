// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Receipt, Wallet, Building2,
  BarChart3, Wrench, HelpCircle, BookOpen, Sparkles,
  Settings, CreditCard, Gift, Bell, Image, ChevronDown,
  ChevronRight, Plus, Check, Menu, X, Package, Tag, ShoppingCart, Store,
} from "lucide-react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { useUIStore } from "@/stores/profile-store";
import { useProfileStore } from "@/stores/profile-store";
import { getProfiles, switchProfile } from "@/lib/actions/profile";
import { APP_NAME } from "@/lib/constants";
import Image from "next/image";

const PERSONAL_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Parties", href: "/parties", icon: Users },
  { label: "Expense", href: "/expense", icon: Receipt },
  { label: "Income", href: "/income", icon: Wallet },
  { label: "Manage Accounts", href: "/manage-account", icon: Building2 },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const BUSINESS_NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Quick POS", href: "/sales/quick-pos", icon: Store },
  { label: "Parties", href: "/parties", icon: Users },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Sales", href: "/sales", icon: Tag },
  { label: "Purchase", href: "/purchase", icon: ShoppingCart },
  { label: "Expense", href: "/expense", icon: Receipt },
  { label: "Other Income", href: "/income", icon: Wallet },
  { label: "Manage Accounts", href: "/manage-account", icon: Building2 },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const TOOLS_ITEMS = [
  { label: "Business Cards", href: "/business-tools/business-cards", icon: CreditCard },
  { label: "Greeting Cards", href: "/business-tools/greeting-cards", icon: Gift },
  { label: "Reminders", href: "/business-tools/reminders", icon: Bell },
  { label: "Bill Gallery", href: "/business-tools/bill-gallery", icon: Image },
  { label: "Notebook", href: "/business-tools/notebook", icon: BookOpen },
];

const BOTTOM_ITEMS = [
  { label: "Help & Support", href: "/help-and-supports", icon: HelpCircle },
  { label: "Tutorials", href: "/tutorials", icon: BookOpen },
  { label: "What's New", href: "/whats-new", icon: Sparkles },
  { label: "Settings", href: "/settings/general", icon: Settings },
];

interface Profile {
  id: string;
  name: string;
  type: string;
  category?: string | null;
  logo?: string | null;
  isDefault?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { activeProfileId, profiles, setActiveProfileId, setProfiles } = useProfileStore();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchProfiles() {
      const res = await getProfiles();
      if (res.data) {
        setProfiles(res.data);
        const active = res.data.find((p) => p.isDefault);
        if (active) {
          setActiveProfileId(active.id);
        }
      }
    }
    fetchProfiles();
  }, [activeProfileId, setActiveProfileId, setProfiles]);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const handleSwitchProfile = async (profileId: string) => {
    await switchProfile(profileId);
    setActiveProfileId(profileId);
    setProfileMenuOpen(false);
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    if (href === "/sales" && pathname.startsWith("/sales/quick-pos")) return false;
    return pathname.startsWith(href);
  };

  const isToolsActive = TOOLS_ITEMS.some((item) => pathname.startsWith(item.href));

  if (!sidebarOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-20 md:hidden"
        onClick={() => useUIStore.getState().setSidebarOpen(false)}
      />

      <aside className="sidebar fixed md:relative z-30 md:z-auto flex flex-col h-full overflow-y-auto border-r border-border/50 select-none">

        {/* ── Top bar: Logo only (hamburger lives in header) ── */}
        <div className="h-14 flex items-center px-4 border-b border-border/50 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-900/20"
              style={{ backgroundColor: '#059669' }}
            >
              <BarChart3 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-foreground">{APP_NAME}</span>
          </Link>
        </div>

        {/* ── Profile Switcher ─────────────────────────────── */}
        <div className="p-3 border-b border-border/50">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {activeProfile ? (
              <>
                {activeProfile.logo ? (
                  <Image src={activeProfile.logo} alt={activeProfile.name} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-border/20 shadow-sm flex-shrink-0" />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 border border-border/10 shadow-sm"
                    style={{ backgroundColor: getAvatarColor(activeProfile.name) }}
                  >
                    {getInitials(activeProfile.name)}
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activeProfile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activeProfile.type === "BUSINESS" ? "Business" : "Personal"} · Admin
                  </p>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
                  profileMenuOpen && "rotate-180"
                )} />
              </>
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            )}
          </button>

          {/* Profile dropdown */}
          <AnimatePresence>
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-1 space-y-0.5">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => handleSwitchProfile(profile.id)}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm"
                    >
                      {profile.logo ? (
                        <Image src={profile.logo} alt={profile.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover border border-border/20 shadow-sm flex-shrink-0" />
                      ) : (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-border/10 shadow-sm"
                          style={{ backgroundColor: getAvatarColor(profile.name) }}
                        >
                          {getInitials(profile.name)}
                        </div>
                      )}
                      <span className="flex-1 text-left text-foreground truncate">
                        {profile.name}
                      </span>
                      {profile.id === activeProfileId && (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </button>
                  ))}

                  <Link
                    href="/onboarding"
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm text-emerald-500"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Plus className="w-4 h-4" />
                    Create New Profile
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Main Navigation ──────────────────────────────── */}
        <nav className="flex-1 p-2 space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 py-1 mt-1">
            {activeProfile?.type === "BUSINESS" ? "Business" : "Personal"}
          </p>

          {(activeProfile?.type === "BUSINESS" ? BUSINESS_NAV_ITEMS : PERSONAL_NAV_ITEMS).map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
            />
          ))}

          {/* ── Others section ──────────────────────────── */}
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 py-1 mt-3">
            Others
          </p>

          {/* Useful Tools (collapsible) */}
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className={cn(
              "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
              isToolsActive
                ? "bg-emerald-600/15 text-emerald-500"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Wrench className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-left">Useful Tools</span>
            <ChevronRight className={cn(
              "w-3.5 h-3.5 transition-transform",
              toolsOpen && "rotate-90"
            )} />
          </button>

          <AnimatePresence>
            {toolsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pl-4"
              >
                {TOOLS_ITEMS.map((item) => (
                  <NavItem
                    key={item.href}
                    {...item}
                    active={pathname.startsWith(item.href)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {BOTTOM_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

function NavItem({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
        active
          ? "bg-emerald-600/15 text-emerald-500 font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-emerald-500")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}