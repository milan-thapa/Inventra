// src/app/(dashboard)/whats-new/page.tsx
"use client";

import { Sparkles, Rocket, CheckCircle2, BarChart3, FileText, Building2, TrendingUp, Bell, CreditCard, BookOpen, Moon, Globe, Keyboard, Lock, Zap, ArrowRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


const UPDATES = [
  {
    version: "1.0.0",
    date: "May 2026",
    badge: "Latest",
    featured: true,
    highlight: "🚀 Inventra is Here!",
    description: "Complete business management solution for modern entrepreneurs",
    items: [
      { icon: Rocket, text: "Initial release of Inventra", category: "Launch" },
      { icon: CheckCircle2, text: "Business & Personal profile management", category: "Profile" },
      { icon: Building2, text: "Complete Party ledger system", category: "Parties" },
      { icon: BarChart3, text: "Cashflow dashboard with bar charts", category: "Analytics" },
      { icon: FileText, text: "Expense & Income tracking with categories", category: "Finance" },
      { icon: Building2, text: "Bank account management", category: "Banking" },
      { icon: TrendingUp, text: "All Party Report with print & Excel export", category: "Reports" },
      { icon: Bell, text: "Task & Payment reminders", category: "Productivity" },
      { icon: CreditCard, text: "Business Card generator", category: "Tools" },
      { icon: BookOpen, text: "Notebook for notes", category: "Tools" },
      { icon: Moon, text: "Dark / Light / Classic themes", category: "Design" },
      { icon: Globe, text: "English & Nepali language support", category: "Localization" },
      { icon: Keyboard, text: "Command palette with keyboard shortcuts", category: "UX" },
      { icon: Lock, text: "Google & GitHub OAuth + Email magic link", category: "Security" },
    ],
  },
];

const categoryColors: Record<string, string> = {
  Launch: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Profile: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Parties: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Analytics: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Finance: "bg-green-500/10 text-green-400 border-green-500/20",
  Banking: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Reports: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Productivity: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Tools: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Design: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Localization: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  UX: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Security: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function WhatsNewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-purple-500/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative px-6 py-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-purple-500/10 border border-emerald-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">New Release Available</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              What&apos;s New in <span className="bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">Inventra</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Discover the latest features, improvements, and updates designed to help you manage your business more efficiently.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                <Zap className="w-4 h-4 mr-2" /> Get Started
              </Button>
              <Button variant="outline" className="border-border/50">
                View Documentation <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Updates Section */}
      <div className="px-6 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {UPDATES.map((update, index) => (
            <div
              key={update.version}
              className={`relative group ${update.featured ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Featured Card */}
              {update.featured && (
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-purple-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              )}
              
              <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-emerald-500/5 via-purple-500/5 to-emerald-500/5 px-6 py-5 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                        <span className="text-lg font-bold text-foreground">v{update.version}</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/25">
                        {update.badge}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">{update.date}</span>
                  </div>
                  
                  {update.highlight && (
                    <div className="mt-4">
                      <h3 className="text-xl font-semibold text-foreground mb-1">{update.highlight}</h3>
                      <p className="text-muted-foreground">{update.description}</p>
                    </div>
                  )}
                </div>

                {/* Features Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {update.items.map((item, i) => {
                      const Icon = item.icon;
                      const colorClass = categoryColors[item.category] || "bg-muted/50 text-muted-foreground border-border/50";
                      
                      return (
                        <div
                          key={i}
                          className="group/item flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all duration-300 hover:shadow-sm"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/10 to-purple-500/10 flex items-center justify-center border border-emerald-500/20 group-hover/item:scale-110 transition-transform duration-300">
                            <Icon className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground mb-1">{item.text}</p>
                            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${colorClass}`}>
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-muted/20 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {update.items.length} new features and improvements
                    </span>
                    <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                      Learn More <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-purple-600 p-8 md:p-12">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ready to Transform Your Business?
              </h2>
              <p className="text-white/80 mb-6 max-w-xl">
                Start using Inventra today and experience the future of business management. Join thousands of entrepreneurs who trust Inventra.
              </p>
              <Button size="lg" className="bg-white text-emerald-600 hover:bg-white/90 font-semibold shadow-xl">
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
