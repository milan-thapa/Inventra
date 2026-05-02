// src/app/(dashboard)/settings/feature-settings/parties/page.tsx
"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const PARTY_FEATURES = [
  {
    id: "send_reminder",
    label: "Send Payment Reminders",
    description: "Enable sending payment reminders to parties via notifications",
    defaultEnabled: true,
  },
  {
    id: "opening_balance",
    label: "Opening Balance",
    description: "Allow setting opening balance when creating a new party",
    defaultEnabled: true,
  },
  {
    id: "party_photo",
    label: "Party Photo Upload",
    description: "Allow uploading photos for parties",
    defaultEnabled: true,
  },
  {
    id: "pan_number",
    label: "PAN Number Field",
    description: "Show PAN number field in party form",
    defaultEnabled: true,
  },
];

export default function FeatureSettingsPartiesPage() {
  const { toast } = useToast();
  const [features, setFeatures] = useState(
    Object.fromEntries(PARTY_FEATURES.map((f) => [f.id, f.defaultEnabled]))
  );
  const [loading, setLoading] = useState(false);

  const toggle = (id: string) =>
    setFeatures((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    toast({ title: "Party settings saved" });
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button type="button" onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-muted"}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-bold text-foreground mb-6">Party Feature Settings</h2>

      <div className="space-y-0.5">
        {PARTY_FEATURES.map((feature) => (
          <div key={feature.id}
            className="flex items-center justify-between py-4 border-b border-border/50 last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">{feature.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
            </div>
            <Toggle checked={features[feature.id]} onChange={() => toggle(feature.id)} />
          </div>
        ))}
      </div>

      <div className="pt-5 flex justify-end">
        <Button onClick={handleSave} disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
