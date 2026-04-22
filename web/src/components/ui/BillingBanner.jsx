"use client";

import { AlertTriangle, XCircle, Sparkles, ExternalLink } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";

export default function BillingBanner() {
  const subscriptionStatus = useSubscriptionStore((s) => s.subscriptionStatus);
  const currentPeriodEnd   = useSubscriptionStore((s) => s.currentPeriodEnd);
  const isSubscribed       = useSubscriptionStore((s) => s.isSubscribed);
  const openCustomerPortal = useSubscriptionStore((s) => s.openCustomerPortal);
  const isLoading          = useSubscriptionStore((s) => s.isLoading);

  if (!subscriptionStatus || subscriptionStatus === "active") return null;

  const periodEndDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const BANNERS = {
    past_due: {
      bg:   "bg-red-50 border-red-200",
      icon: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
      text: "Your payment failed. Update your card to keep Premium access.",
      action: "Update Payment Method",
      actionStyle: "bg-red-600 hover:bg-red-700 text-white",
    },
    canceled: {
      bg:   "bg-amber-50 border-amber-200",
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
      text: `Your subscription is canceled.${periodEndDate ? ` Premium access ends ${periodEndDate}.` : ""}`,
      action: "Reactivate Plan",
      actionStyle: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    trialing: {
      bg:   "bg-indigo-50 border-indigo-200",
      icon: <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />,
      text: `You're on a free trial.${periodEndDate ? ` Trial ends ${periodEndDate}.` : ""}`,
      action: "Add Payment Method",
      actionStyle: "bg-indigo-600 hover:bg-indigo-700 text-white",
    },
    unpaid: {
      bg:   "bg-red-50 border-red-200",
      icon: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
      text: "Invoice unpaid. Update your billing details to restore access.",
      action: "Fix Billing",
      actionStyle: "bg-red-600 hover:bg-red-700 text-white",
    },
  };

  const banner = BANNERS[subscriptionStatus];
  if (!banner) return null;

  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-2.5 border-b text-sm ${banner.bg}`}>
      <div className="flex items-center gap-2 min-w-0">
        {banner.icon}
        <span className="text-gray-700 truncate">{banner.text}</span>
      </div>
      <button
        onClick={openCustomerPortal}
        disabled={isLoading}
        className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${banner.actionStyle}`}
      >
        {banner.action}
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}
