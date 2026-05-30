// src/app/(dashboard)/help-and-supports/page.tsx
"use client";

import { useState } from "react";
import { ChevronDown, Search, HelpCircle, BookOpen, Users, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FAQ_SECTIONS = [
  {
    id: "general",
    icon: HelpCircle,
    title: "General",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    questions: [
      { q: "What is Inventra and who can use the App?", a: "Inventra is an easy-to-use business management app designed for small and medium-sized businesses. It helps you manage sales, purchases, inventory, payments, and more, all in one platform from your mobile phone or desktop. Inventra is ideal for business owners who want to simplify their daily operations, even without any accounting knowledge." },
      { q: "Do I need to have accounting knowledge to use Inventra?", a: "No, you don't need any accounting knowledge. Inventra is designed to be simple and intuitive for everyone." },
      { q: "How can I start using the Inventra app?", a: "Simply sign up with your Google or GitHub account, or use email magic link. After signing up, create your business profile and you're ready to go!" },
      { q: "Is my data safe with the Inventra App?", a: "Yes, your data is fully encrypted and stored securely on our servers. We never share your data with third parties." },
      { q: "Is Inventra available on mobile and desktop?", a: "Yes! Inventra works on any device — mobile, tablet, and desktop — through the web browser." },
      { q: "Is Inventra App free to use?", a: "Inventra offers a 14-day free trial with full access to all features. After the trial, you can choose a Gold or Diamond plan." },
      { q: "Is Inventra suitable for businesses that are just starting?", a: "Absolutely! Inventra is perfect for new businesses. It's simple to set up and grows with your business." },
    ],
  },
  {
    id: "party",
    icon: Users,
    title: "Party",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    questions: [
      { q: "Can Inventra help me manage suppliers and customers?", a: "Yes, Inventra helps you organize and track interactions with your suppliers and customers. You can keep detailed records, track balances, and manage payments for each party to maintain healthy business relationships." },
      { q: "What is Party Ledger?", a: "Party Ledger is a complete transaction history for each customer or supplier, showing all payments in, payments out, and current balance." },
      { q: "How can I see how much Debts and Credits I have?", a: "Go to the Parties section. Each party shows their current balance — green for receivable (they owe you) and red for payable (you owe them). The All Party Report gives you a complete overview." },
    ],
  },
  {
    id: "subscription",
    icon: CreditCard,
    title: "Subscription",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    questions: [
      { q: "What features are available in the free version?", a: "The free trial includes basic accounting features to track sales, purchases, income, and expenses, with inventory management to keep tabs on stocks. Users can create and manage invoices, track sales, monitor expenses, and access basic financial reports." },
      { q: "What are the features available in the paid version?", a: "Paid plans include everything in the free version plus unlimited parties, all reports, business tools (business cards, reminders), multi-user access, priority support, and more." },
      { q: "Can I try the Inventra App before purchasing?", a: "Yes! You get a 14-day free trial with full access to all features. No credit card required." },
      { q: "What is the difference between Gold and Diamond Plan?", a: "Gold plan includes all core features for one user. Diamond plan adds multi-user access, advanced reports, API access, and dedicated support for growing businesses." },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left hover:text-foreground transition-colors"
      >
        <span className={cn("text-sm font-medium pr-4", open ? "text-foreground" : "text-foreground/80")}>
          {question}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform",
          open && "rotate-180"
        )} />
      </button>
      {open && (
        <div className="pb-4 pr-8">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("general");

  const activeData = FAQ_SECTIONS.find((s) => s.id === activeSection)!;
  const filteredQuestions = search
    ? FAQ_SECTIONS.flatMap((s) =>
        s.questions
          .filter((q) => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase()))
          .map((q) => ({ ...q, section: s.title }))
      )
    : activeData.questions.map((q) => ({ ...q, section: activeData.title }));

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-5">Help &amp; Support</h1>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-muted/30 border-border/50"
        />
      </div>

      {!search && (
        /* Section tabs */
        <div className="flex flex-wrap gap-2 mb-5">
          {FAQ_SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-muted text-foreground border border-border"
                    : "bg-muted/30 text-muted-foreground border border-border/50 hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                {section.title}
              </button>
            );
          })}
        </div>
      )}

      {/* FAQ content */}
      <div className="bg-card rounded-xl border border-border/50 p-5">
        {search && (
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            {filteredQuestions.length} result{filteredQuestions.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </h3>
        )}
        {!search && (
          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            {(() => { const Icon = activeData.icon; return <Icon className={cn("w-4 h-4", activeData.color)} />; })()}
            {activeData.title}
          </h3>
        )}

        {filteredQuestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No FAQs found matching your search</p>
        ) : (
          filteredQuestions.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))
        )}
      </div>
    </div>
  );
}
