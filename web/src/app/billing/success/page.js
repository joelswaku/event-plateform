"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";
import { api } from "@/lib/api";

function BillingSuccessContent() {
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const setSubscribed  = useSubscriptionStore((s) => s.setSubscribed);
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);

  const [status, setStatus] = useState("verifying"); // verifying | confirmed | fallback
  const mounted = useRef(true);

  useEffect(() => {
    // Optimistic unlock immediately so UI is unblocked while we verify
    setSubscribed("premium");

    const sessionId = searchParams.get("session_id");

    async function verify() {
      if (!sessionId) { setStatus("fallback"); return; }

      // Try up to 8 times (24 s) to confirm the DB update
      for (let attempt = 0; attempt < 8; attempt++) {
        try {
          const res = await api.get(`/subscription/verify-session?session_id=${sessionId}`);
          if (res.data?.data?.is_subscribed) {
            if (!mounted.current) return;
            await fetchSubscription(); // sync store from DB
            setStatus("confirmed");
            setTimeout(() => { if (mounted.current) router.push("/dashboard"); }, 2500);
            return;
          }
        } catch {
          // ignore transient errors
        }
        // Wait 3 s before retrying
        await new Promise((r) => setTimeout(r, 3000));
        if (!mounted.current) return;
      }

      // Webhook might still be in flight — grace period covers the next 5 min
      if (mounted.current) {
        setStatus("fallback");
        setTimeout(() => { if (mounted.current) router.push("/dashboard"); }, 2500);
      }
    }

    verify();

    return () => { mounted.current = false; };
  }, [setSubscribed, fetchSubscription, router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          {status === "verifying" ? (
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          ) : (
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3 h-3" />
          Premium Activated
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          You&apos;re all set!
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {status === "verifying"
            ? "Confirming your subscription…"
            : "Your Premium plan is now active. All templates and features are unlocked. Redirecting to dashboard…"}
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
