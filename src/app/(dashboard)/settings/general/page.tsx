// src/app/(dashboard)/settings/general/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProfileStore } from "@/stores/profile-store";
import { updateProfileSettings } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";

// Removed: export const metadata — illegal in "use client" components

const THEMES = [
  {
    value: "light",
    label: "Light Theme",
    preview: "bg-gray-100",
    bars: ["bg-gray-300", "bg-gray-200", "bg-gray-200"],
  },
  {
    value: "classic",
    label: "Classic Theme",
    preview: "bg-gray-700",
    bars: ["bg-emerald-500", "bg-gray-600", "bg-gray-600"],
  },
  {
    value: "dark",
    label: "Dark Theme",
    preview: "bg-gray-900",
    bars: ["bg-emerald-500", "bg-gray-700", "bg-gray-700"],
    default: true,
  },
];

const LANGUAGES   = [{ value: "en", label: "English 🇺🇸" }, { value: "ne", label: "नेपाली 🇳🇵" }];
const CURRENCIES  = [{ value: "Rs.", label: "Rs. — Nepali Rupee" }, { value: "$", label: "$ — US Dollar" }];
const CURRENCY_POS = [{ value: "start", label: "Start" }, { value: "end", label: "End" }];
const DATE_FORMATS = [{ value: "DD MMM YYYY", label: "DD MMM YYYY" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }];
const TIME_FORMATS = [{ value: "12h", label: "7:41 PM" }, { value: "24h", label: "19:41" }];
const NUM_FORMATS  = [{ value: "indian", label: "1,00,000" }, { value: "international", label: "1,000,000" }];

export default function GeneralSettingsPage() {
  const { toast } = useToast();
  const { getActiveProfile, updateActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  const [loading, setLoading] = useState(false);

  // Load initial values from profile store
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("Rs.");
  const [currencyPos, setCurrencyPos] = useState("start");
  const [calendar, setCalendar] = useState("AD");
  const [dateFormat, setDateFormat] = useState("DD MMM YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [numberFormat, setNumberFormat] = useState("indian");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [appLock, setAppLock] = useState(false);

  // Sync state from active profile when it loads
  useEffect(() => {
    if (activeProfile) {
      setTheme(activeProfile.theme ?? 'dark');
      setLanguage(activeProfile.language ?? 'en');
      setCurrency(activeProfile.currency ?? 'Rs.');
      setCurrencyPos(activeProfile.currencyPos ?? 'start');
      setCalendar(activeProfile.calendarType ?? 'AD');
      setNumberFormat(activeProfile.numberFormat ?? 'indian');
      setPrivacyMode(activeProfile.privacyMode ?? false);
      setAppLock(activeProfile.appLock ?? false);
    }
  }, [activeProfile]);

  const handleSave = async () => {
    if (!activeProfile?.id) {
      toast({ variant: "destructive", title: "No active profile found" });
      return;
    }
    setLoading(true);
    try {
      const res = await updateProfileSettings(activeProfile.id, {
        theme: theme as "light" | "dark" | "classic" | "system",
        language: language as "en" | "ne",
        currency,
        currencyPos: currencyPos as "start" | "end",
        calendarType: calendar as "AD" | "BS",
        numberFormat: numberFormat as "indian" | "international",
        privacyMode,
        appLock,
      });
      if (res.error) {
        toast({ variant: "destructive", title: "Error", description: res.error });
      } else {
        // Update local store to sync other components (like Header)
        updateActiveProfile({
          theme: theme as any,
          language: language as any,
          currency,
          currencyPos: currencyPos as any,
          calendarType: calendar as any,
          numberFormat: numberFormat as any,
          privacyMode,
          appLock,
        });
        document.documentElement.setAttribute("data-theme", theme);
        toast({ title: "Settings saved successfully" });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to save settings" });
    } finally {
      setLoading(false);
    }
  };

  const Row = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        checked ? "bg-emerald-600" : "bg-muted"
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
        checked ? "translate-x-6" : "translate-x-1"
      )} />
    </button>
  );

  const Select = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 px-2.5 bg-muted/30 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none min-w-[120px]"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-bold text-foreground mb-6">General Settings</h2>

      {/* Appearance */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-foreground mb-1">Appearance</p>
        <p className="text-xs text-muted-foreground mb-4">
          To adjust website theme, choose from three preset options
        </p>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={cn(
                "relative rounded-xl border-2 overflow-hidden transition-all",
                theme === t.value ? "border-emerald-500" : "border-border/50 hover:border-emerald-500/40"
              )}
            >
              {/* Preview */}
              <div className={cn("p-2 h-16", t.preview)}>
                <div className="flex gap-1 h-full">
                  <div className={cn("w-1/4 rounded-sm", t.bars[0])} />
                  <div className="flex-1 space-y-1">
                    <div className={cn("h-2 rounded-sm", t.bars[1])} />
                    <div className={cn("h-2 rounded-sm w-3/4", t.bars[2])} />
                    <div className={cn("h-2 rounded-sm w-1/2", t.bars[2])} />
                  </div>
                </div>
              </div>
              {theme === t.value && (
                <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <p className="text-xs text-center py-1.5 text-foreground font-medium">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Settings rows */}
      <Row label="Language" description="To adjust language, choose from available options">
        <Select value={language} onChange={setLanguage} options={LANGUAGES} />
      </Row>

      <Row label="Currency" description="To adjust currency type, choose from available options">
        <Select value={currency} onChange={setCurrency} options={CURRENCIES} />
      </Row>

      <Row label="Currency Position">
        <Select value={currencyPos} onChange={setCurrencyPos} options={CURRENCY_POS} />
      </Row>

      <Row label="Calendar" description="To adjust calendar type, choose from available options">
        <div className="flex rounded-lg overflow-hidden border border-border/50">
          {["AD", "BS"].map((c) => (
            <button key={c} onClick={() => setCalendar(c)}
              className={cn("px-3 py-1.5 text-sm font-medium transition-colors",
                calendar === c ? "bg-emerald-600 text-white" : "text-muted-foreground hover:bg-accent")}>
              {c}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Date Format">
        <Select value={dateFormat} onChange={setDateFormat} options={DATE_FORMATS} />
      </Row>

      <Row label="Time Format">
        <Select value={timeFormat} onChange={setTimeFormat} options={TIME_FORMATS} />
      </Row>

      <Row label="Number Format" description="To adjust number format, choose from two preset options">
        <Select value={numberFormat} onChange={setNumberFormat} options={NUM_FORMATS} />
      </Row>

      <Row label="Privacy Mode" description="Hides business stats from homepage & item purchase price.">
        <Toggle checked={privacyMode} onChange={() => setPrivacyMode(!privacyMode)} />
      </Row>

      <Row label="App Lock" description="Secure your business access with a lock screen">
        <Toggle checked={appLock} onChange={() => setAppLock(!appLock)} />
      </Row>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
