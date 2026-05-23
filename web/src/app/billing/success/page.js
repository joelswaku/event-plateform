"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Sparkles } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";

function BillingSuccessContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const setSubscribed = useSubscriptionStore((s) => s.setSubscribed);
  const mounted       = useRef(true);

  useEffect(() => {
    // Read which tier the user was purchasing (stored before the Stripe redirect)
    const tier = (typeof window !== "undefined" && sessionStorage.getItem("checkout_tier")) || "starter";
    if (typeof window !== "undefined") sessionStorage.removeItem("checkout_tier");
    setSubscribed(tier);

    // Store session_id so fetchSubscription() can call verify-session
    // as a fallback DB-sync when the Stripe webhook is delayed or not running.
    const sessionId = searchParams.get("session_id");
    if (sessionId && typeof window !== "undefined") {
      sessionStorage.setItem("stripe_session_id", sessionId);
    }

    const timer = setTimeout(() => {
      if (mounted.current) router.push("/dashboard");
    }, 1500);

    return () => { mounted.current = false; clearTimeout(timer); };
  }, [setSubscribed, router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3 h-3" />
          Premium Activated
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          You&apos;re all set!
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Your Premium plan is now active. Redirecting to dashboard…
        </p>

        <Link
          href="/dashboard"
          className="block w-full py-3 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm transition-colors"
        >
          Go to Dashboard
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
