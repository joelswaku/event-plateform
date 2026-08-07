"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { hasLogoutMarker, useAuthStore } from "@/store/auth.store";
import { useSubscriptionStore } from "@/store/subscription.store";

// Public routes that don't need auth checking
const PUBLIC_ROUTES = ["/", "/login", "/register", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/features", "/pricing", "/templates", "/about", "/contact", "/faq", "/terms", "/privacy-policy", "/cookies-policy", "/acceptable-use", "/reviews"];

function getPendingVerificationToken() {
  if (typeof window === "undefined") return "";

  try {
    return (
      window.sessionStorage.getItem("verify_token") ||
      window.localStorage.getItem("verify_token") ||
      ""
    );
  } catch {
    return "";
  }
}

export default function AuthProvider({ children }) {
  const pathname           = usePathname();
  const fetchMe            = useAuthStore((s) => s.fetchMe);
  const initSync           = useAuthStore((s) => s.initSync);
  const isHydrated         = useAuthStore((s) => s.isHydrated);
  const isAuthenticated    = useAuthStore((s) => s.isAuthenticated);
  const fetchSubscription  = useSubscriptionStore((s) => s.fetchSubscription);
  const redirectingRef     = useRef(false);

  // Initialize cross-tab sync on mount
  useEffect(() => {
    initSync();
  }, [initSync]);

  // Boot: authenticate then load subscription (ONLY on protected pages)
  useEffect(() => {
    // Skip auth check if pathname not ready yet or auth state not hydrated
    if (!pathname || !isHydrated) return;

    // Keep verification open when mobile browsers restore this page after the
    // user switches to their email app. The verification screen persists its
    // short-lived token in localStorage, while older tabs may use sessionStorage.
    if (pathname === "/verify-email") {
      if (typeof window !== "undefined") {
        const hasUrlToken = new URLSearchParams(window.location.search).has("token");
        const hasStoredToken = getPendingVerificationToken();

        if (!hasUrlToken && !hasStoredToken) {
          // No token in URL or storage - redirect to register
          window.location.href = "/register";
          return;
        }
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
      // Prevent multiple simultaneous redirects
      if (redirectingRef.current) return;

      console.log('Authenticated user on public page, redirecting to dashboard');
      redirectingRef.current = true;

      // Detect mobile browsers
      const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // Mobile: Small delay to ensure auth state is fully settled
        // Re-check auth state when timeout fires to avoid stale redirects
        setTimeout(() => {
          if (useAuthStore.getState().isAuthenticated && !hasLogoutMarker()) {
            console.log('Mobile redirect executing to dashboard');
            window.location.replace("/dashboard");
          } else {
            console.log('Mobile redirect cancelled - auth state changed');
            redirectingRef.current = false;
          }
        }, 250);
      } else {
        // Desktop: Immediate redirect
        console.log('Desktop redirect executing to dashboard');
        window.location.replace("/dashboard");
      }
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
      // Exclude verify-email from revalidation - it has its own token management
      if (currentPath === "/verify-email") return false;
      return !PUBLIC_ROUTES.includes(currentPath) && !currentPath.startsWith("/e/");
    };

    const revalidateSession = () => {
      // Skip revalidation entirely on public pages
      if (!isProtectedPage()) return;

      // If logout marker is set, immediately redirect to homepage
      // This handles bfcache restoration after logout on mobile browsers
      if (hasLogoutMarker()) {
        console.log('Logout marker detected on protected page, redirecting to homepage');
        window.location.replace("/");
        return;
      }

      // Only revalidate if currently authenticated
      if (!useAuthStore.getState().isAuthenticated) return;

      void fetchMe().then((user) => {
        if (user) fetchSubscription({ force: true });
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        console.log('[AuthProvider] Tab became visible, checking session...');
        revalidateSession();
      }
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
