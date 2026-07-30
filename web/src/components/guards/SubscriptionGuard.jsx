"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscriptionStore } from "@/store/subscription.store";
import { Loader2, Lock, Sparkles } from "lucide-react";

/**
 * SubscriptionGuard - Protects premium features from free users
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if subscribed
 * @param {string} props.feature - Feature key to check (e.g., 'planner')
 * @param {string} props.redirectTo - Where to redirect if not subscribed (default: '/dashboard')
 * @param {boolean} props.showUpgrade - Show upgrade modal instead of redirecting
 */
export default function SubscriptionGuard({
  children,
  feature = null,
  redirectTo = "/dashboard",
  showUpgrade = false
}) {
  const router = useRouter();
  const { isSubscribed, features, openBillingModal, fetchSubscription } = useSubscriptionStore();
  const [checking, setChecking] = useState(true);
  const hasAccess = feature
    ? isSubscribed && features?.[feature]
    : isSubscribed;

  useEffect(() => {
    let active = true;
    // Revalidate on every protected-route entry. Browser storage is never proof
    // of a paid entitlement and can otherwise lead to planner API 403 errors.
    void fetchSubscription().finally(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, [fetchSubscription]);

  useEffect(() => {
    if (checking || hasAccess) return;
    if (!hasAccess) {
      if (showUpgrade) {
        openBillingModal();
      } else {
        // Hard redirect - user cannot access this page
        router.replace(redirectTo);
      }
    }
  }, [checking, hasAccess, router, redirectTo, showUpgrade, openBillingModal]);

  // Do not mount protected content until access has been confirmed by the API.
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a0a14]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  // Keep the user in the current context and display the global Billing popup.
  // This is used by Planner so a direct URL cannot redirect users to the
  // standalone billing page after they clicked an in-app Planner control.
  if (!hasAccess && showUpgrade) {
    return <SubscriptionWall featureName={feature === "planner" ? "the Event Planner" : feature || "this feature"} />;
  }

  // A redirect is in progress for guards that use a route fallback.
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a0a14]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  // Render protected content only if subscribed
  return <>{children}</>;
}

/**
 * SubscriptionWall - Show upgrade prompt instead of content
 * Use this when you want to show a message instead of redirecting
 */
export function SubscriptionWall({ featureName = "this feature" }) {
  const openBillingModal = useSubscriptionStore((s) => s.openBillingModal);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a0a14] p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Premium Feature
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Upgrade your plan to unlock {featureName} and other premium features.
        </p>
        <button
          onClick={openBillingModal}
          className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Sparkles className="w-4 h-4" />
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
