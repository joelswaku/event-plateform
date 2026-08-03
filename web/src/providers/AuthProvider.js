"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { hasLogoutMarker, useAuthStore } from "@/store/auth.store";
import { useSubscriptionStore } from "@/store/subscription.store";

// Public routes that don't need auth checking
const PUBLIC_ROUTES = ["/", "/login", "/register", "/signup", "/forgot-password", "/reset-password", "/features", "/pricing", "/templates", "/about", "/contact", "/faq", "/terms", "/privacy-policy", "/cookies-policy", "/acceptable-use", "/reviews"];

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

    if (shouldRedirectToDashboard && isAuthenticated && !hasLogoutMarker()) {
      console.log('Authenticated user on public page, redirecting to dashboard');
      window.location.href = "/dashboard";
      return;
    }

    if (isPublicPage) return;

    fetchMe().then((user) => {
      if (user) fetchSubscription();
    });
  }, [pathname, isHydrated, isAuthenticated, fetchMe, fetchSubscription]);

  // Revalidate a protected page when it becomes visible again or is restored
  // from the browser back-forward cache. A restored dashboard can otherwise
  // briefly show stale Zustand state after the user has logged out.
  useEffect(() => {
    const isProtectedPage = () => {
      const currentPath = window.location.pathname;
      return !PUBLIC_ROUTES.includes(currentPath) && !currentPath.startsWith("/e/");
    };

    const revalidateSession = () => {
      // If logout marker is set, immediately redirect to homepage
      // This handles bfcache restoration after logout on mobile browsers
      if (hasLogoutMarker()) {
        console.log('Logout marker detected on protected page, redirecting to homepage');
        window.location.replace("/");
        return;
      }

      if (!isProtectedPage() || !useAuthStore.getState().isAuthenticated) return;

      void fetchMe().then((user) => {
        if (user) fetchSubscription({ force: true });
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") revalidateSession();
    };

    const handlePageShow = (event) => {
      // event.persisted means the page was restored from bfcache
      // This is critical for mobile browsers (especially iOS Safari)
      if (event.persisted) {
        revalidateSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [fetchMe, fetchSubscription]);

  return children;
}
