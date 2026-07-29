"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

// Keep this legacy route safe if an old bookmark or Stripe configuration still
// points here. The central success page verifies the Checkout Session first.
function BillingSuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
    router.replace(`/billing/success${query}`);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <CheckCircle className="h-10 w-10" style={{ color: "#10b981" }} />
        <h1 className="text-2xl font-black text-(--text-primary)">Confirming your payment</h1>
        <p className="text-sm text-(--text-muted)">Please wait while we securely verify your Stripe checkout.</p>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <BillingSuccessRedirect />
    </Suspense>
  );
}
