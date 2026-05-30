// src/app/(dashboard)/settings/my-account/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getInitials, getAvatarColor, cn } from "@/lib/utils";
import Image from "next/image";
import { updateUserAccount } from "@/lib/actions/profile";

export default function MyAccountPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [phone, setPhone] = useState("");

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await updateUserAccount({ name, phone });
      if (res.error) {
        toast({ variant: "destructive", title: "Error", description: res.error });
      } else {
        toast({ title: "Account updated successfully" });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to update account" });
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(session?.user?.name ?? "U");
  const avatarColor = getAvatarColor(session?.user?.name ?? "U");

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-bold text-foreground mb-6">My Account</h2>

      {session && (
        <>
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
            <div className="flex items-center gap-5">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "user photo"}
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-bold">{session.user?.name}</h2>
                <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                <p className="text-xs text-emerald-500 mt-0.5">
                  Signed in via {session.user?.email?.includes("gmail") ? "Google" : "OAuth"}
                </p>
              </div>
            </div>
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
        </>
      )}

      {/* Form */}
      <div className="space-y-4 max-w-md">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="pl-9 h-9 text-sm bg-muted/50 border-border/50"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={session?.user?.email ?? ""}
              disabled
              className="pl-9 h-9 text-sm bg-muted/50 border-border/50 opacity-60"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="pl-9 h-9 text-sm bg-muted/50 border-border/50"
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
