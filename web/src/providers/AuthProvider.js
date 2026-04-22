"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useSubscriptionStore } from "@/store/subscription.store";

export default function AuthProvider({ children }) {
  const fetchMe            = useAuthStore((s) => s.fetchMe);
  const fetchSubscription  = useSubscriptionStore((s) => s.fetchSubscription);

  // Boot: authenticate then load subscription
  useEffect(() => {
    fetchMe().then((user) => {
      if (user) fetchSubscription();
    });
  }, [fetchMe, fetchSubscription]);

  // Keep subscription state fresh whenever the tab becomes visible again.
  // This catches the common case: user pays in another tab / Stripe redirects
  // back, webhook fires while the dashboard tab was backgrounded.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const isAuth = useAuthStore.getState().isAuthenticated;
        if (isAuth) fetchSubscription();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchSubscription]);

  return children;
}
