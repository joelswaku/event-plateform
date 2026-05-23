"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { useSubscriptionStore } from "@/store/subscription.store";

const FEATURES_UNLOCKED = [
  "Unlimited events",
  "All themes & templates",
  "QR check-in scanner",
  "Analytics dashboard",
  "Priority support",
];

export default function BillingSuccessPage() {
  const router = useRouter();
  const { setSubscribed, fetchSubscription } = useSubscriptionStore();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Optimistically unlock premium while webhook processes
    setSubscribed("premium");
    fetchSubscription();
  }, [setSubscribed, fetchSubscription]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          router.push("/dashboard");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-7 text-center">

        {/* Icon */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
            border: "2px solid rgba(16,185,129,0.30)",
          }}
        >
          <CheckCircle className="h-10 w-10" style={{ color: "#10b981" }} />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-(--text-primary)">
            🎉 Plan upgraded!
          </h1>
          <p className="mt-2 text-base text-(--text-muted)">
            Welcome to Premium. All features are now unlocked.
          </p>
        </div>

        {/* Features unlocked */}
        <div className="w-full rounded-2xl border border-border bg-(--bg-surface) p-5 text-left">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--accent)" }} />
            <span className="text-sm font-bold text-(--text-primary)">What's unlocked</span>
          </div>
          <ul className="space-y-2.5">
            {FEATURES_UNLOCKED.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-(--text-secondary)">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Countdown + CTA */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-(--text-muted)">
            Redirecting to dashboard in{" "}
            <span className="font-bold text-(--text-primary)">{countdown}s</span>…
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}
