"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-gray-400" />
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          Payment cancelled
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          No charge was made. You can upgrade whenever you&apos;re ready.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/#pricing"
            className="block w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm transition-colors"
          >
            View Plans
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-3 rounded-2xl border border-gray-200 text-gray-600 hover:border-gray-400 font-medium text-sm transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
