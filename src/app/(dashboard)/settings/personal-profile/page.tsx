// src/app/(dashboard)/settings/personal-profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Building2, MapPin, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProfileStore } from "@/stores/profile-store";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { updatePersonalProfile } from "@/lib/actions/profile";

export default function PersonalProfilePage() {
  const { toast } = useToast();
  const { activeProfileId, getActiveProfile, updateActiveProfile } = useProfileStore();
  const profile = getActiveProfile();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    address: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        category: profile.category ?? "",
        address: profile.address ?? "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!activeProfileId) {
      toast({ variant: "destructive", title: "No active profile found" });
      return;
    }
    
    setLoading(true);
    try {
      const res = await updatePersonalProfile(activeProfileId, form);
      if (res.error) {
        toast({ variant: "destructive", title: "Error", description: res.error });
      } else {
        toast({ title: "Profile updated successfully" });
        // Update local store
        updateActiveProfile(form as any);
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-bold text-foreground mb-6">Personal Profile</h2>

      {/* Logo */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-xl bg-emerald-600/20 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-emerald-500" />
          </div>
          <button className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors">
            <Camera className="w-3 h-3 text-white" />
          </button>
        </div>
        <div>
          <p className="font-semibold text-foreground">{form.name || "Business Name"}</p>
          <p className="text-xs text-muted-foreground">Click camera to update logo</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Business Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter business name"
              className="pl-9 h-9 text-sm bg-muted/50 border-border/50" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Business Category</Label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full h-9 px-3 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground appearance-none focus:border-emerald-500 outline-none">
            <option value="">Select Category</option>
            {BUSINESS_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Business Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Enter business address"
              className="pl-9 h-9 text-sm bg-muted/50 border-border/50" />
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
