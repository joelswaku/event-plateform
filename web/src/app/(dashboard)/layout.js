"use client";

import { useEffect } from "react";
import AppShell  from "@/components/layout/app-shell";
import TermsGate from "@/components/legal/TermsGate";
import { hasLogoutMarker, useAuthStore } from "@/store/auth.store";

export default function DashboardLayout({ children }) {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const fetchMe = useAuthStore((state) => state.fetchMe);

  // Do not render a protected page when state was restored from browser cache
  // after logout. The marker is necessary on iOS/Android, where Back may
  // revive an older dashboard without re-running the normal app bootstrap.
  useEffect(() => {
    if (!isHydrated) return;

    const marker = hasLogoutMarker();
    console.log('[Dashboard Layout] Auth check:', { isAuthenticated, hasMarker: marker });

    if (marker || !isAuthenticated) {
      console.log('[Dashboard Layout] Redirecting to login');
      window.location.replace("/login");
    }
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    const verifyRestoredPage = () => {
      if (hasLogoutMarker()) {
        window.location.replace("/login");
        return;
      }

      void fetchMe().then((user) => {
        if (!user) window.location.replace("/login");
      });
    };

    // pageshow handles bfcache restoration; popstate covers mobile browsers
    // that restore SPA history without setting the pageshow persisted flag.
    window.addEventListener("pageshow", verifyRestoredPage);
    window.addEventListener("popstate", verifyRestoredPage);
    return () => {
      window.removeEventListener("pageshow", verifyRestoredPage);
      window.removeEventListener("popstate", verifyRestoredPage);
    };
  }, [fetchMe]);

  // Don't render protected content if not authenticated
  const marker = hasLogoutMarker();
  if (!isHydrated || !isAuthenticated || marker) {
    console.log('[Dashboard Layout] Blocking render:', { isHydrated, isAuthenticated, hasMarker: marker });
    return null;
  }

  return (
    <AppShell>
      <TermsGate>{children}</TermsGate>
    </AppShell>
  );
}
