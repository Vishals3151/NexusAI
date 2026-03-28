"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRICING_TIERS = [
  {
    name: "Monthly",
    price: "$29",
    period: "/month",
    subtitle: "For teams getting started",
    features: ["Unlimited meetings", "Unlimited agents"],
    planId: "monthly",
  },
  {
    name: "Yearly",
    badge: "Best value",
    price: "$259",
    period: "/year",
    subtitle: "For teams that need to scale",
    features: ["Unlimited meetings", "Unlimited agents", "2 months free"],
    planId: "yearly",
  },
  {
    name: "Enterprise",
    price: "$999",
    period: "/year",
    subtitle: "For teams with special requests",
    features: [
      "2 months free",
      "Unlimited meetings",
      "Unlimited agents",
      "Dedicated Discord Support",
    ],
    planId: "enterprise",
  },
];

export const UpgradeView = () => {
  const trpc = useTRPC();
  const { data: stats } = useSuspenseQuery(
    trpc.meetings.getStats.queryOptions()
  );

  // For visual testing based on the mockup, if the user is on 'free', we can pretend they are on Yearly,
  // or just use whatever they have. Since we want dynamic:
  const currentPlan = stats.plan.toLowerCase() === "free" ? "yearly" : stats.plan.toLowerCase();
  const displayPlan = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen py-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <h1 className="text-3xl font-semibold mb-12 text-slate-800">
          You are on the <span className="text-green-600">{displayPlan}</span> plan
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {PRICING_TIERS.map((tier) => {
            const isActive = tier.planId === currentPlan;
            return (
              <div
                key={tier.name}
                className={cn(
                  "rounded-2xl p-8 flex flex-col border",
                  isActive
                    ? "bg-[#092e1d] text-white border-transparent"
                    : "bg-white text-slate-800 border-slate-200"
                )}
              >
                <div className="flex items-center gap-x-3 mb-2">
                  <h3 className="text-xl font-medium">{tier.name}</h3>
                  {tier.badge && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-200 text-orange-800">
                      {tier.badge}
                    </span>
                  )}
                </div>
                
                <p className={cn("text-sm mb-6", isActive ? "text-emerald-100" : "text-muted-foreground")}>
                  {tier.subtitle}
                </p>

                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className={cn("text-sm ml-1", isActive ? "text-emerald-100" : "text-muted-foreground")}>
                    {tier.period}
                  </span>
                </div>

                <Button
                  className={cn(
                    "w-full rounded-lg mb-8 h-12 font-medium",
                    isActive
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900 shadow-sm border border-slate-200"
                  )}
                >
                  {isActive ? "Manage" : "Change Plan"}
                </Button>

                <div className="flex flex-col gap-y-3 mt-auto">
                  <p className="text-sm font-semibold tracking-wider uppercase mb-2">Features</p>
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-x-3">
                      <CheckCircle2Icon
                        className={cn(
                          "size-5",
                          isActive ? "text-emerald-400 fill-emerald-400/20" : "text-emerald-500 fill-emerald-500/20"
                        )}
                      />
                      <span className={cn("text-sm", isActive ? "text-slate-200" : "text-slate-700")}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
