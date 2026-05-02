// src/app/(dashboard)/business-tools/notebook/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { createNote } from "@/lib/actions/note";
import { useProfileStore } from "@/stores/profile-store";

export default function CreateNotePage() {
  const router = useRouter();
  const { toast } = useToast();
  const activeProfile = useProfileStore((s) => s.getActiveProfile());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!activeProfile) {
      toast({ variant: "destructive", title: "Error", description: "No active profile found." });
      return;
    }
    if (!title && !body) {
      toast({ variant: "destructive", title: "Please add a title or content" });
      return;
    }
    setSaving(true);
    const res = await createNote(activeProfile.id, title, body);
    setSaving(false);
    if (res.error) {
      toast({ variant: "destructive", title: "Error", description: res.error });
    } else {
      toast({ title: "Note saved!" });
      router.push("/business-tools/notebook");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Button onClick={handleSave} disabled={saving}
          variant="outline"
          className="h-8 px-3 text-xs gap-1.5 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
          {saving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Check className="w-3.5 h-3.5" />
          }
          Save Note
        </Button>
      </div>

      {/* Note editor */}
      <div className="bg-card rounded-xl border border-border/50 p-6 min-h-[500px]">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title of note..."
          className="w-full text-xl font-bold text-foreground placeholder:text-muted-foreground/40 bg-transparent border-none outline-none mb-2"
        />

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
          <span>📅</span>
          {formatDate(new Date(), "dd MMM yyyy · hh:mm aa")}
        </p>

        {/* Body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start Typing..."
          className="w-full flex-1 text-sm text-foreground placeholder:text-muted-foreground/40 bg-transparent border-none outline-none resize-none min-h-[350px]"
        />
      </div>
    </div>
  );
}
