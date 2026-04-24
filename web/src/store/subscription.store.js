"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";

// Grace period: 5 min after payment before we trust the DB over the optimistic state
const GRACE_MS = 5 * 60 * 1000;

function getPaidAt() {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem("sp_paid_at");
  return v ? parseInt(v, 10) : null;
}
function setPaidAt()   { if (typeof window !== "undefined") sessionStorage.setItem("sp_paid_at", String(Date.now())); }
function clearPaidAt() { if (typeof window !== "undefined") sessionStorage.removeItem("sp_paid_at"); }

// ── Plan limits mirror (kept in sync by fetchSubscription) ───────────────────
const DEFAULT_LIMITS = {
  events:    1,    // free cap
  templates: 3,    // 3 CLASSIC style templates free
  guests:    50,
};

export const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      // ── Subscription state ──────────────────────────────────────────────────
      plan:               "free",
      isSubscribed:       false,
      subscriptionStatus: null,
      currentPeriodEnd:   null,
      isLoading:          false,

      // ── Usage (hydrated from server) ────────────────────────────────────────
      usage: { events: 0 },

      // ── Plan limits (hydrated from server, mirrors planLimits.service.js) ───
      limits: DEFAULT_LIMITS,

      // ── Upgrade modal ────────────────────────────────────────────────────────
      upgradeModalOpen:    false,
      upgradeModalFeature: null,

      // ── Computed helpers ─────────────────────────────────────────────────────
      isPremium:  () => get().isSubscribed && get().plan === "premium",
      isPastDue:  () => get().subscriptionStatus === "past_due",
      isCanceled: () => get().subscriptionStatus === "canceled",
      isTrialing: () => get().subscriptionStatus === "trialing",

      /** True when the free user has already used their 1 allowed event. */
      isAtEventLimit: () => {
        const { plan, isSubscribed, usage, limits } = get();
        if (isSubscribed && plan === "premium") return false;
        return usage.events >= (limits.events ?? 1);
      },

      /** Returns { allowed: bool, reason: string | null } for any feature key */
      checkLimit: (feature) => {
        const { plan, isSubscribed, usage, limits } = get();
        if (isSubscribed && plan === "premium") return { allowed: true, reason: null };
        switch (feature) {
          case "events":
            return usage.events >= (limits.events ?? 1)
              ? { allowed: false, reason: `Free plan includes ${limits.events} event. Upgrade for unlimited.` }
              : { allowed: true, reason: null };
          case "templates":
            return { allowed: false, reason: "Free plan includes 3 Classic templates. Upgrade to access all 18 styles." };
          default:
            return { allowed: false, reason: `${feature} requires a Premium plan.` };
        }
      },

      // ── Modal helpers ────────────────────────────────────────────────────────
      openUpgradeModal:  (feature = null) => set({ upgradeModalOpen: true,  upgradeModalFeature: feature }),
      closeUpgradeModal: ()               => set({ upgradeModalOpen: false, upgradeModalFeature: null  }),

      /**
       * Gate helper: if the user can perform `feature`, calls onAllowed().
       * Otherwise opens the upgrade modal with the right context string.
       * Returns true if allowed, false if blocked.
       */
      requirePremium: (feature, onAllowed) => {
        const { checkLimit, openUpgradeModal } = get();
        const { allowed, reason } = checkLimit(feature);
        if (allowed) { onAllowed?.(); return true; }
        openUpgradeModal(feature);
        return false;
      },

      // ── Fetch ─────────────────────────────────────────────────────────────────
      fetchSubscription: async () => {
        try {
          set({ isLoading: true });
          const res  = await api.get("/subscription/status");
          const data = res.data?.data ?? {};
          const dbSubscribed = data.is_subscribed ?? false;

          if (dbSubscribed) {
            clearPaidAt();
            set({
              plan:               data.plan                ?? "premium",
              isSubscribed:       true,
              subscriptionStatus: data.subscription_status ?? "active",
              currentPeriodEnd:   data.current_period_end  ?? null,
              usage:              data.usage               ?? { events: 0 },
              limits:             data.limits              ?? DEFAULT_LIMITS,
              isLoading: false,
            });
          } else {
            const inGrace = (() => { const p = getPaidAt(); return p && Date.now() - p < GRACE_MS; })();
            if (inGrace) {
              // Webhook hasn't landed yet — keep optimistic premium, update usage only
              set({ usage: data.usage ?? { events: 0 }, isLoading: false });
            } else {
              set({
                plan:               "free",
                isSubscribed:       false,
                subscriptionStatus: data.subscription_status ?? null,
                currentPeriodEnd:   data.current_period_end  ?? null,
                usage:              data.usage               ?? { events: 0 },
                limits:             data.limits              ?? DEFAULT_LIMITS,
                isLoading: false,
              });
            }
          }
        } catch {
          set({ isLoading: false });
        }
      },

      // ── Stripe checkout ───────────────────────────────────────────────────────
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

      // Called on /billing/success redirect — optimistic premium unlock
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
        // Don't persist usage — always re-fetch from server
      }),
    }
  )
);
