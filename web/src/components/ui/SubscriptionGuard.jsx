"use client";

import { useSubscriptionStore } from "@/store/subscription.store";

/**
 * <SubscriptionGuard requiredTier="premium" featureName="Custom Domains">
 *   <PremiumComponent />
 * </SubscriptionGuard>
 */
export default function SubscriptionGuard({ children, requiredTier = "premium", featureName = null, fallback = null }) {
  const { plan, isSubscribed, openUpgradeModal } = useSubscriptionStore();

  const hasAccess = requiredTier === "free" || (requiredTier === "premium" && isSubscribed && plan === "premium");
  if (hasAccess) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative cursor-pointer" onClick={() => openUpgradeModal(featureName)}>
      <div className="pointer-events-none opacity-40 blur-[1px] select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); openUpgradeModal(featureName); }}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transition-colors"
        >
          ⭐ Premium Feature
        </button>
      </div>
    </div>
  );
}
