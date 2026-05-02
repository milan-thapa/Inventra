// src/app/(dashboard)/tutorials/page.tsx
import { BookOpen, Play, Clock } from "lucide-react";

export const metadata = { title: "Tutorials" };

const TUTORIALS = [
  { id: 1, title: "Getting Started with Inventra", duration: "3 min", category: "Basics", icon: "🚀" },
  { id: 2, title: "How to Add Parties & Manage Ledger", duration: "5 min", category: "Parties", icon: "👥" },
  { id: 3, title: "Recording Expenses & Income", duration: "4 min", category: "Transactions", icon: "💸" },
  { id: 4, title: "Understanding the Dashboard", duration: "3 min", category: "Dashboard", icon: "📊" },
  { id: 5, title: "Generating Reports", duration: "4 min", category: "Reports", icon: "📈" },
  { id: 6, title: "Setting Up Bank Accounts", duration: "3 min", category: "Accounts", icon: "🏦" },
  { id: 7, title: "Creating & Managing Reminders", duration: "2 min", category: "Tools", icon: "🔔" },
  { id: 8, title: "Customizing Settings", duration: "3 min", category: "Settings", icon: "⚙️" },
];

export default function TutorialsPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-emerald-500" />
        <h1 className="text-xl font-bold text-foreground">Tutorials</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TUTORIALS.map((tut) => (
          <div key={tut.id}
            className="bg-card rounded-xl border border-border/50 p-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {tut.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground group-hover:text-emerald-400 transition-colors mb-1">
                  {tut.title}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded">
                    {tut.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {tut.duration}
                  </span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-600/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600/40 transition-colors">
                <Play className="w-3.5 h-3.5 text-emerald-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
