"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useSubscriptionStore } from "@/store/subscription.store";

// Public routes that don't need auth checking
const PUBLIC_ROUTES = ["/", "/login", "/register", "/signup", "/forgot-password", "/reset-password", "/features", "/pricing", "/templates", "/about", "/contact", "/faq", "/terms", "/privacy-policy", "/cookies-policy", "/acceptable-use"];

export default function AuthProvider({ children }) {
  const pathname           = usePathname();
  const fetchMe            = useAuthStore((s) => s.fetchMe);
  const initSync           = useAuthStore((s) => s.initSync);
  const isHydrated         = useAuthStore((s) => s.isHydrated);
  const isAuthenticated    = useAuthStore((s) => s.isAuthenticated);
  const fetchSubscription  = useSubscriptionStore((s) => s.fetchSubscription);

  // Initialize cross-tab sync on mount
  useEffect(() => {
    initSync();
  }, [initSync]);

  // Boot: authenticate then load subscription (ONLY on protected pages)
  useEffect(() => {
    // Skip auth check if pathname not ready yet or auth state not hydrated
    if (!pathname || !isHydrated) return;

    // Allow /verify-email only if token parameter exists
    if (pathname === "/verify-email") {
      const hasToken = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("token");
      if (!hasToken) {
        // No token parameter - redirect to register
        window.location.href = "/register";
        return;
      }
      return; // Valid verification page access
    }

    const isPublicPage = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/e/");

    // Redirect authenticated users to dashboard if on homepage or auth pages
    const shouldRedirectToDashboard = (
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password"
    );

    if (shouldRedirectToDashboard && isAuthenticated) {
      console.log('Authenticated user on public page, redirecting to dashboard');
      window.location.href = "/dashboard";
      return;
    }

    if (isPublicPage) return;

    fetchMe().then((user) => {
      if (user) fetchSubscription();
    });
  }, [pathname, isHydrated, isAuthenticated, fetchMe, fetchSubscription]);

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
