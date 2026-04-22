"use client";

import { useSubscriptionStore } from "@/store/subscription.store";
import { X, Sparkles, Check, Zap, Star } from "lucide-react";

const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || "";

const FEATURES = [
  "All 30 wedding templates (15 premium)",
  "Custom domain support",
  "RSVP management & guest list",
  "Advanced gallery & animation styles",
  "Unlimited page edits",
  "Priority support",
];

export default function UpgradeModal() {
  const { upgradeModalOpen, upgradeModalFeature, closeUpgradeModal, createCheckoutSession, isLoading } =
    useSubscriptionStore();

  if (!upgradeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={closeUpgradeModal}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="relative bg-linear-to-br from-amber-400 via-yellow-400 to-amber-500 px-8 pt-8 pb-10 text-center">
          <button
            onClick={closeUpgradeModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X size={15} />
          </button>

          {/* Floating stars */}
          <span className="absolute top-6 left-8 text-white/40 text-xl">✦</span>
          <span className="absolute bottom-8 right-6 text-white/30 text-lg">✦</span>

          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
            <Sparkles size={30} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Unlock Premium</h2>
          {upgradeModalFeature && (
            <p className="text-amber-100 text-sm mt-1">
              <span className="font-semibold">{upgradeModalFeature}</span> requires a Premium plan
            </p>
          )}
        </div>

        {/* Notch */}
        <div className="relative -mt-5 mx-6">
          <div className="bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center justify-between border border-amber-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Premium Plan</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-gray-900">$12</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-6 pt-5 pb-6">
          <ul className="space-y-2.5 mb-6">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                  <Check size={10} className="text-amber-600" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => createCheckoutSession(PRICE_ID)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-amber-200 text-sm"
          >
            <Zap size={15} />
            {isLoading ? "Redirecting…" : "Upgrade to Premium"}
          </button>

          <button onClick={closeUpgradeModal} className="mt-3 w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
