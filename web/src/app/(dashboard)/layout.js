"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell  from "@/components/layout/app-shell";
import TermsGate from "@/components/legal/TermsGate";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  // Redirect to login if not authenticated
  // This prevents cached pages from being accessible after logout
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
      <FloatingChatButton />
    </AppShell>
  );
}
