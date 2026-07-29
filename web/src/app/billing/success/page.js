"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Sparkles } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";

function BillingSuccessContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const verifyAndActivate = useSubscriptionStore((s) => s.verifyAndActivate);
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    let cancelled = false;
    let timer;

    async function confirmPayment() {
      if (!sessionId) {
        if (!cancelled) setStatus("pending");
        return;
      }

      const verified = await verifyAndActivate(sessionId);
      if (cancelled) return;
      setStatus(verified ? "active" : "pending");
      if (verified) timer = setTimeout(() => router.push("/dashboard"), 1500);
    }

    void confirmPayment();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [verifyAndActivate, router, searchParams]);

  const verified = status === "active";
  const pending = status === "pending";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3 h-3" />
          {verified ? "Payment confirmed" : pending ? "Payment pending" : "Confirming payment"}
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          {verified ? "You&apos;re all set!" : pending ? "We’re confirming your payment" : "Confirming your payment"}
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {verified
            ? "Your plan is active. Redirecting to dashboard…"
            : pending
            ? "Your payment was not confirmed yet. Your plan will unlock after Stripe confirms it."
            : "Please wait while we securely verify your Stripe payment."}
        </p>

        <Link
          href={verified ? "/dashboard" : "/settings/billing"}
          className="block w-full py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-colors"
        >
          {verified ? "Go to Dashboard" : "Back to Billing"}
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <BillingSuccessContent />
    </Suspense>
  );
}
