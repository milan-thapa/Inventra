// src/app/(dashboard)/business-tools/greeting-cards/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CARD_TEMPLATES = [
  { id: "new_year",    label: "New Year",      emoji: "🎆", color: "#1a1f2e", accent: "#f59e0b" },
  { id: "dashain",    label: "Dashain",        emoji: "🙏", color: "#14532d", accent: "#16a34a" },
  { id: "tihar",      label: "Tihar",          emoji: "🪔", color: "#78350f", accent: "#f97316" },
  { id: "birthday",   label: "Birthday",       emoji: "🎂", color: "#1e1b4b", accent: "#8b5cf6" },
  { id: "wedding",    label: "Wedding",        emoji: "💒", color: "#4a1942", accent: "#ec4899" },
  { id: "business",   label: "Business",       emoji: "🤝", color: "#0c1445", accent: "#3b82f6" },
];

export default function GreetingCardsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(CARD_TEMPLATES[0]);
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Greeting Cards</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Select Template</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {CARD_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setSelected(t)}
                className={cn("p-3 rounded-xl border-2 text-center transition-all",
                  selected.id === t.id ? "border-emerald-500 bg-emerald-500/10" : "border-border/50 hover:border-emerald-500/40")}>
                <span className="text-2xl block mb-1">{t.emoji}</span>
                <span className="text-xs text-foreground">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">To</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)}
                placeholder="Recipient name" className="h-9 text-sm bg-muted/50 border-border/50" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">From</Label>
              <Input value={from} onChange={(e) => setFrom(e.target.value)}
                placeholder="Your name / business" className="h-9 text-sm bg-muted/50 border-border/50" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Message</Label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your greeting message..."
                rows={3}
                className="w-full px-3 py-2 bg-muted/50 border border-border/50 rounded-md text-sm text-foreground placeholder:text-muted-foreground resize-none focus:border-emerald-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Preview</p>
          <div className="rounded-xl overflow-hidden mb-4 aspect-[4/3] flex flex-col items-center justify-center p-8 text-center"
            style={{ background: selected.color }}>
            <span className="text-5xl mb-3">{selected.emoji}</span>
            <p className="font-bold text-white text-lg mb-1">{selected.label} Wishes!</p>
            {to && <p className="text-white/70 text-sm mb-2">To: {to}</p>}
            {message && <p className="text-white/60 text-xs leading-relaxed max-w-xs">{message}</p>}
            {from && <p className="text-white/70 text-sm mt-3">— {from}</p>}
            <div className="w-16 h-0.5 rounded mx-auto mt-3 mb-2" style={{ background: selected.accent }} />
            <p className="text-white/30 text-[10px]">Inventra</p>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            onClick={() => alert("Download feature: use html2canvas in production")}>
            <Download className="w-3.5 h-3.5" /> Download Card
          </Button>
        </div>
      </div>
    </div>
  );
}
