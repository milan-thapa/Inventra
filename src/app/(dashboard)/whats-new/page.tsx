// src/app/(dashboard)/whats-new/page.tsx
import { Sparkles } from "lucide-react";

export const metadata = { title: "What's New" };

const UPDATES = [
  {
    version: "1.0.0",
    date: "May 2026",
    badge: "Latest",
    items: [
      "🚀 Initial release of Inventra",
      "✅ Business & Personal profile management",
      "💼 Complete Party ledger system",
      "📊 Cashflow dashboard with bar charts",
      "📝 Expense & Income tracking with categories",
      "🏦 Bank account management",
      "📈 All Party Report with print & Excel export",
      "🔔 Task & Payment reminders",
      "💳 Business Card generator",
      "📓 Notebook for notes",
      "🌙 Dark / Light / Classic themes",
      "🌐 English & Nepali language support",
      "⌨️ Command palette with keyboard shortcuts",
      "🔐 Google & GitHub OAuth + Email magic link",
    ],
  },
];

export default function WhatsNewPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-emerald-500" />
        <h1 className="text-xl font-bold text-foreground">What&apos;s New</h1>
      </div>

      <div className="space-y-4">
        {UPDATES.map((update) => (
          <div key={update.version} className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-bold text-foreground">v{update.version}</span>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                {update.badge}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{update.date}</span>
            </div>
            <ul className="space-y-2">
              {update.items.map((item, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
