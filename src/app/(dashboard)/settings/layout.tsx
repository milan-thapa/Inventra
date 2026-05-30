// src/app/(dashboard)/settings/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, User, Building, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const SETTINGS_NAV = [
  { label: "General",          href: "/settings/general",          icon: Settings },
  { label: "My Account",       href: "/settings/my-account",       icon: User },
  { label: "Personal Profile", href: "/settings/personal-profile", icon: Building },
];

const FEATURE_NAV = [
  { label: "Parties",      href: "/settings/feature-settings/parties" },
  { label: "Transactions", href: "/settings/feature-settings/transactions" },
  { label: "Inventory",    href: "/settings/feature-settings/inventory" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [featureOpen, setFeatureOpen] = useState(
    pathname.includes("feature-settings")
  );

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)]">
      {/* Settings sidebar */}
      <div className="w-52 flex-shrink-0 bg-card rounded-xl border border-border/50 p-2 h-fit">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <button onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <span className="text-sm font-semibold text-foreground">Settings</span>
        </div>

        <div className="space-y-0.5">
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}>
                <Icon className={cn("w-4 h-4", active && "text-foreground")} />
                {item.label}
              </Link>
            );
          })}

          {/* Feature Settings (collapsible) */}
          <button
            onClick={() => setFeatureOpen(!featureOpen)}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors",
              featureOpen || pathname.includes("feature-settings")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}>
            <Settings className="w-4 h-4" />
            <span className="flex-1 text-left">Feature Settings</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", featureOpen && "rotate-180")} />
          </button>

          {featureOpen && (
            <div className="pl-6 space-y-0.5">
              {FEATURE_NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                      active
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
