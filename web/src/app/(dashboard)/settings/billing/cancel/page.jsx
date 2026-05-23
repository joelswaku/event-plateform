"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RefreshCcw } from "lucide-react";

export default function BillingCancelPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-7 text-center">

        {/* Icon */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "var(--bg-elevated)",
            border: "2px solid var(--border)",
          }}
        >
          <XCircle className="h-10 w-10 text-(--text-muted)" />
        </div>

        {/* Copy */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-(--text-primary)">
            No worries!
          </h1>
          <p className="mt-2 text-base text-(--text-muted)">
            Your checkout was cancelled. You're still on the free plan —
            no charges were made.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-(--bg-elevated) px-5 py-2.5 text-sm font-semibold text-(--text-primary) transition hover:bg-(--bg-base)"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
