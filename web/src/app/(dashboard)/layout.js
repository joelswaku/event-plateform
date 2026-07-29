"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell  from "@/components/layout/app-shell";
import TermsGate from "@/components/legal/TermsGate";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Web uses httpOnly cookies - no token initialization needed
  // The axios interceptor handles refresh automatically on 401

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  // Don't render protected content if not authenticated
  if (!isHydrated || !isAuthenticated) {
    return null;
  }

  return (
    <AppShell>
      <TermsGate>{children}</TermsGate>
    </AppShell>
  );
}
