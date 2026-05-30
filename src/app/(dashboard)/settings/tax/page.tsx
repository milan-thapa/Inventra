"use client";

import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useProfileStore } from "@/stores/profile-store";
import { updateTaxSettings } from "@/lib/actions/profile";

export default function TaxSettingsPage() {
  const { activeProfileId, profiles, updateActiveProfile } = useProfileStore();
  const profile = profiles.find(p => p.id === activeProfileId);
  
  const [taxEnabled, setTaxEnabled] = useState(profile?.taxEnabled || false);
  const [taxRate, setTaxRate] = useState(profile?.taxRate?.toString() || "0");
  const [taxType, setTaxType] = useState(profile?.taxType || "GST");
  const [taxNumber, setTaxNumber] = useState(profile?.taxNumber || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!activeProfileId) return;
    
    setLoading(true);
    try {
      const res = await updateTaxSettings(activeProfileId, {
        taxEnabled,
        taxRate: parseFloat(taxRate),
        taxType,
        taxNumber,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Tax settings saved successfully");
        // Update local store
        updateActiveProfile({
          taxEnabled,
          taxRate: parseFloat(taxRate),
          taxType,
          taxNumber,
        } as any);
      }
    } catch (error) {
      toast.error("Failed to save tax settings");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tax Settings</h1>
        <p className="text-muted-foreground">Configure tax settings for your invoices</p>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Enable Tax</h3>
            <p className="text-sm text-muted-foreground">Enable tax calculation on invoices</p>
          </div>
          <Switch
            checked={taxEnabled}
            onCheckedChange={setTaxEnabled}
          />
        </div>

        {taxEnabled && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="Enter tax rate"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="taxType">Tax Type</Label>
              <select
                id="taxType"
                value={taxType}
                onChange={(e) => setTaxType(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>

            <div>
              <Label htmlFor="taxNumber">Tax Number (Optional)</Label>
              <Input
                id="taxNumber"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="Enter tax identification number"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-border/50">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
