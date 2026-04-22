"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";

// Grace period: after setSubscribed() is called (optimistic unlock after Stripe payment),
// fetchSubscription will NOT downgrade the state back to free if the DB hasn't caught up yet.
// Cleared automatically once the DB confirms is_subscribed = true.
const GRACE_MS = 5 * 60 * 1000; // 5 minutes

function getPaidAt() {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem("sp_paid_at");
  return v ? parseInt(v, 10) : null;
}

function setPaidAt() {
  if (typeof window !== "undefined") sessionStorage.setItem("sp_paid_at", String(Date.now()));
}

function clearPaidAt() {
  if (typeof window !== "undefined") sessionStorage.removeItem("sp_paid_at");
}

export const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      plan: "free",
      isSubscribed: false,
      subscriptionStatus: null,
      currentPeriodEnd: null,
      isLoading: false,
      upgradeModalOpen: false,
      upgradeModalFeature: null,

      isPremium:  () => get().isSubscribed && get().plan === "premium",
      isPastDue:  () => get().subscriptionStatus === "past_due",
      isCanceled: () => get().subscriptionStatus === "canceled",
      isTrialing: () => get().subscriptionStatus === "trialing",

      openUpgradeModal:  (feature = null) => set({ upgradeModalOpen: true,  upgradeModalFeature: feature }),
      closeUpgradeModal: ()               => set({ upgradeModalOpen: false, upgradeModalFeature: null }),

      fetchSubscription: async () => {
        try {
          set({ isLoading: true });
          const res  = await api.get("/subscription/status");
          const data = res.data?.data ?? {};
          const dbSubscribed = data.is_subscribed ?? false;

          if (dbSubscribed) {
            // DB confirmed — clear grace period and apply full update
            clearPaidAt();
            set({
              plan:               data.plan                ?? "premium",
              isSubscribed:       true,
              subscriptionStatus: data.subscription_status ?? "active",
              currentPeriodEnd:   data.current_period_end  ?? null,
              isLoading: false,
            });
          } else {
            // DB says not subscribed. Respect grace period if user just paid.
            const paidAt = getPaidAt();
            const inGrace = paidAt && (Date.now() - paidAt < GRACE_MS);
            if (inGrace) {
              // Webhook hasn't landed yet — keep the optimistic premium state, just stop loading
              set({ isLoading: false });
            } else {
              set({
                plan:               "free",
                isSubscribed:       false,
                subscriptionStatus: data.subscription_status ?? null,
                currentPeriodEnd:   data.current_period_end  ?? null,
                isLoading: false,
              });
            }
          }
        } catch {
          set({ isLoading: false });
        }
      },

      createCheckoutSession: async (priceId) => {
        try {
          set({ isLoading: true });
          const res = await api.post("/subscription/checkout", { priceId });
          const { url } = res.data?.data ?? {};
          set({ isLoading: false });
          if (url) window.location.href = url;
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err?.response?.data?.message || "Checkout failed" };
        }
      },

      openCustomerPortal: async () => {
        try {
          set({ isLoading: true });
          const res = await api.post("/subscription/portal");
          const { url } = res.data?.data ?? {};
          set({ isLoading: false });
          if (url) window.location.href = url;
        } catch {
          set({ isLoading: false });
        }
      },

      // Called immediately when Stripe redirects to /billing/success.
      // Sets a grace period so fetchSubscription won't downgrade until DB confirms.
      setSubscribed: (plan = "premium") => {
        setPaidAt();
        set({ plan, isSubscribed: true, subscriptionStatus: "active" });
      },

      setUnsubscribed: () => {
        clearPaidAt();
        set({ plan: "free", isSubscribed: false, subscriptionStatus: "canceled" });
      },
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : undefined
      ),
      partialize: (s) => ({
        plan:               s.plan,
        isSubscribed:       s.isSubscribed,
        subscriptionStatus: s.subscriptionStatus,
        currentPeriodEnd:   s.currentPeriodEnd,
      }),
    }
  )
);
