// src/components/tools/business-card-generator.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, RotateCcw, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const COLORS = [
  { value: "#16a34a", label: "Green" },
  { value: "#ec4899", label: "Pink" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#f97316", label: "Orange" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#10b981", label: "Emerald" },
  { value: "#8b5cf6", label: "Purple" },
];

const CARD_STYLES = [
  { id: 0, name: "Modern Curve" },
  { id: 1, name: "Split Panel" },
  { id: 2, name: "Minimal" },
];

interface CardData {
  name: string;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
}

function CardPreview({ data, color, style }: { data: CardData; color: string; style: number }) {
  const initials = data.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "IN";

  if (style === 0) {
    // Modern Curve
    return (
      <div className="relative w-72 h-40 rounded-xl overflow-hidden shadow-2xl" style={{ background: "#1a1f2e" }}>
        {/* Colored blob */}
        <div className="absolute right-0 top-0 w-24 h-full rounded-l-full opacity-90" style={{ background: color }} />
        {/* Initials circle */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg"
          style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)" }}>
          {initials}
        </div>
        {/* Content */}
        <div className="absolute left-4 top-4">
          <p className="text-white font-bold text-sm leading-tight">{data.name || "Your Name"}</p>
          <p className="text-white/60 text-xs">{data.businessName || APP_NAME}</p>
        </div>
        {/* Contact */}
        <div className="absolute left-4 bottom-4 space-y-0.5">
          {data.phone && (
            <p className="text-white/70 text-[10px] flex items-center gap-1">
              <Phone className="w-2.5 h-2.5" style={{ color }} /> {data.phone}
            </p>
          )}
          {data.address && (
            <p className="text-white/70 text-[10px] flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" style={{ color }} /> {data.address}
            </p>
          )}
        </div>
        {/* Brand */}
        <div className="absolute right-4 bottom-3">
          <p className="text-white/30 text-[9px]">{APP_NAME}</p>
        </div>
      </div>
    );
  }

  if (style === 1) {
    // Split Panel
    return (
      <div className="relative w-72 h-40 rounded-xl overflow-hidden shadow-2xl flex">
        <div className="w-2/5 flex flex-col items-center justify-center p-3" style={{ background: color }}>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-base mb-1.5">
            {initials}
          </div>
          <p className="text-white text-[10px] font-bold text-center leading-tight">{data.businessName || APP_NAME}</p>
        </div>
        <div className="flex-1 bg-[#1a1f2e] p-4 flex flex-col justify-center">
          <p className="text-white font-bold text-sm mb-0.5">{data.name || "Your Name"}</p>
          <div className="w-10 h-0.5 rounded mb-2" style={{ background: color }} />
          <div className="space-y-1">
            {data.phone && <p className="text-white/60 text-[10px] flex items-center gap-1"><Phone className="w-2.5 h-2.5" style={{ color }} />{data.phone}</p>}
            {data.email && <p className="text-white/60 text-[10px] flex items-center gap-1"><Mail className="w-2.5 h-2.5" style={{ color }} />{data.email}</p>}
            {data.address && <p className="text-white/60 text-[10px] flex items-center gap-1"><MapPin className="w-2.5 h-2.5" style={{ color }} />{data.address}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Minimal
  return (
    <div className="relative w-72 h-40 rounded-xl overflow-hidden shadow-2xl p-5" style={{ background: "#1a1f2e" }}>
      <div className="h-1 w-10 rounded mb-4" style={{ background: color }} />
      <p className="text-white font-bold text-base mb-0.5">{data.name || "Your Name"}</p>
      <p className="text-white/50 text-xs mb-3">{data.businessName || APP_NAME}</p>
      <div className="flex gap-3">
        {data.phone && <p className="text-white/50 text-[10px] flex items-center gap-1"><Phone className="w-2.5 h-2.5" style={{ color }} />{data.phone}</p>}
        {data.email && <p className="text-white/50 text-[10px] flex items-center gap-1"><Mail className="w-2.5 h-2.5" style={{ color }} />{data.email}</p>}
      </div>
      <div className="absolute bottom-4 right-4">
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: color }}>
          <Building2 className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function BusinessCardGenerator({
  defaultName,
  defaultBusinessName,
  defaultPhone,
}: {
  defaultName: string;
  defaultBusinessName: string;
  defaultPhone: string;
}) {
  const router = useRouter();
  const [cardData, setCardData] = useState<CardData>({
    name: defaultName,
    businessName: defaultBusinessName,
    address: "",
    phone: defaultPhone,
    email: "",
    logo: null,
  });
  const [color, setColor] = useState(COLORS[0].value);
  const [styleIdx, setStyleIdx] = useState(0);

  const update = (field: keyof CardData, value: string) =>
    setCardData((prev) => ({ ...prev, [field]: value }));

  const handleDownload = () => {
    // Simple implementation - in production use html2canvas
    alert("Download feature: In production, this would use html2canvas to export the card as PNG/PDF");
  };

  const handleReset = () => {
    setCardData({ name: defaultName, businessName: defaultBusinessName, address: "", phone: defaultPhone, email: "", logo: null });
    setColor(COLORS[0].value);
    setStyleIdx(0);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Generate Your Business Card</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Form ─────────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border/50 p-5 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Your Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={cardData.name} onChange={(e) => update("name", e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50 border-border/50" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Business Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={cardData.businessName} onChange={(e) => update("businessName", e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50 border-border/50" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Business Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={cardData.address} onChange={(e) => update("address", e.target.value)}
                placeholder="Enter business address"
                className="pl-9 h-9 text-sm bg-muted/50 border-border/50" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Your Contact Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={cardData.phone} onChange={(e) => update("phone", e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50 border-border/50" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Business Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" value={cardData.email} onChange={(e) => update("email", e.target.value)}
                placeholder="Enter your business email"
                className="pl-9 h-9 text-sm bg-muted/50 border-border/50" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Business Logo</Label>
            <div className="w-14 h-14 bg-muted/50 border border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors">
              <Building2 className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* ── Right: Preview ──────────────────────────────── */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          {/* Card Style Selector */}
          <div className="flex items-center justify-between mb-4">
            <Label className="text-xs text-muted-foreground">Select Card Style</Label>
            <div className="flex items-center gap-1">
              <button onClick={() => setStyleIdx((i) => (i - 1 + CARD_STYLES.length) % CARD_STYLES.length)}
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground px-1">{CARD_STYLES[styleIdx].name}</span>
              <button onClick={() => setStyleIdx((i) => (i + 1) % CARD_STYLES.length)}
                className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card preview */}
          <div className="flex justify-center mb-5 py-4 bg-muted/20 rounded-xl">
            <CardPreview data={cardData} color={color} style={styleIdx} />
          </div>

          {/* Color selector */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Select Color</Label>
              <div className="flex items-center gap-1">
                <button className="p-0.5 rounded hover:bg-accent text-muted-foreground"><ChevronLeft className="w-3.5 h-3.5" /></button>
                <button className="p-0.5 rounded hover:bg-accent text-muted-foreground"><ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c.value} onClick={() => setColor(c.value)}
                  className={cn("w-7 h-7 rounded-full transition-transform hover:scale-110",
                    color === c.value && "ring-2 ring-white ring-offset-2 ring-offset-card scale-110")}
                  style={{ background: c.value }}
                  title={c.label} />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <button onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
              Restore to Default
            </button>
            <Button onClick={handleDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 text-sm">
              <Download className="w-3.5 h-3.5" />
              Download Business Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
