// src/app/(dashboard)/settings/subscription/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/actions/profile";
import { Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Subscription" };

const PLANS = [
  {
    id: "trial",
    name: "Inventra Trial",
    price: 0,
    period: "14 days free",
    features: ["Basic accounting", "Expense & Income", "Parties management", "3 reports"],
    color: "border-orange-500/30 bg-orange-500/5",
    badge: "bg-orange-500",
  },
  {
    id: "gold",
    name: "Gold Plan",
    price: 999,
    period: "per year",
    features: ["Everything in Trial", "Unlimited parties", "All reports", "Business tools", "Priority support"],
    color: "border-yellow-500/30 bg-yellow-500/5",
    badge: "bg-yellow-500",
  },
  {
    id: "diamond",
    name: "Diamond Plan",
    price: 1999,
    period: "per year",
    features: ["Everything in Gold", "Multi-user access", "Advanced reports", "API access", "Dedicated support"],
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500",
  },
];

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profileRes = await getActiveProfile();
  const currentPlan = profileRes.data?.subscriptionPlan ?? "trial";

  const trialEnd = profileRes.data?.subscriptionEnd;
  const daysRemaining = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000))
    : 2;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-bold text-foreground mb-6">Manage Subscription</h2>

      {/* Current plan card */}
      <div className={cn(
        "rounded-xl border-2 p-5 mb-6",
        currentPlan === "trial"
          ? "border-orange-500/40 bg-orange-500/10"
          : "border-emerald-500/40 bg-emerald-500/10"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("w-5 h-5 rounded-full", currentPlan === "trial" ? "bg-orange-500" : "bg-emerald-500")} />
          <span className="font-bold text-foreground capitalize">Inventra {currentPlan}</span>
        </div>
        {currentPlan === "trial" && (
          <>
            <p className="text-4xl font-black text-rose-400 mb-0.5">{daysRemaining}</p>
            <p className="text-sm text-muted-foreground">Days Remaining</p>
          </>
        )}
        <Button className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm h-8 px-4">
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          Upgrade Plan
        </Button>
      </div>

      {/* Plan comparison */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Available Plans</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PLANS.map((plan) => (
          <div key={plan.id} className={cn("rounded-xl border-2 p-4", plan.color)}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-4 h-4 rounded-full", plan.badge)} />
              <span className="font-bold text-sm text-foreground">{plan.name}</span>
            </div>
            <p className="text-2xl font-black text-foreground mb-0.5">
              {plan.price === 0 ? "Free" : `Rs. ${plan.price}`}
            </p>
            <p className="text-xs text-muted-foreground mb-3">{plan.period}</p>
            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-foreground">
                  <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {currentPlan !== plan.id && (
              <Button variant="outline"
                className="w-full mt-4 h-8 text-xs border-border/50 hover:border-emerald-500 hover:text-emerald-500">
                {plan.price === 0 ? "Current Plan" : "Upgrade"}
              </Button>
            )}
            {currentPlan === plan.id && (
              <div className="w-full mt-4 h-8 text-xs flex items-center justify-center text-emerald-500 font-medium">
                ✓ Active Plan
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
