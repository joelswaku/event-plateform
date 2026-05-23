"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";

// Grace period: 5 min after payment before we trust the DB over the optimistic state
const GRACE_MS = 5 * 60 * 1000;

// Normalize legacy/alias plan names to the canonical three tiers
function normalizePlan(plan) {
  if (plan === "pro" || plan === "premium" || plan === "enterprise") return "pro";
  if (plan === "starter") return "starter";
  return "free";
}

function getPaidAt() {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem("sp_paid_at");
  return v ? parseInt(v, 10) : null;
}
function setPaidAt()   { if (typeof window !== "undefined") sessionStorage.setItem("sp_paid_at", String(Date.now())); }
function clearPaidAt() { if (typeof window !== "undefined") sessionStorage.removeItem("sp_paid_at"); }

// ── Plan limits mirror (kept in sync by fetchSubscription) ───────────────────
const DEFAULT_LIMITS = {
  events:    1,
  templates: 3,
  guests:    50,
};

const DEFAULT_FEATURES = {
  customDomain:        false,
  analytics:           false,
  advancedBuilder:     false,
  rsvp:                true,
  pageBuilder:         true,
  lockedTemplates:     true,
  lockedStyles:        true,
  freeTemplateStyle:   "CLASSIC",
  stripeTicketing:     false,
  guestEmailReminders: 0,
  platformFeePercent:  0,
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

      // ── Plan features (hydrated from server) ────────────────────────────────
      features: DEFAULT_FEATURES,

      // ── Upgrade modal ────────────────────────────────────────────────────────
      upgradeModalOpen:    false,
      upgradeModalFeature: null,

      // ── Stripe prices (fetched from API) ─────────────────────────────────────
      prices: { starter: null, pro: null },

      // ── Computed helpers ─────────────────────────────────────────────────────
      /** True for any paid plan (starter, pro, enterprise). */
      isPremium:  () => get().isSubscribed && get().plan !== "free",
      isPastDue:  () => get().subscriptionStatus === "past_due",
      isCanceled: () => get().subscriptionStatus === "canceled",
      isTrialing: () => get().subscriptionStatus === "trialing",

      /** True when the user has hit their plan's event cap. */
      isAtEventLimit: () => {
        const { usage, limits } = get();
        if (limits.events === null) return false; // unlimited
        return usage.events >= (limits.events ?? 1);
      },

      /** Returns { allowed: bool, reason: string | null } for any feature key */
      checkLimit: (feature) => {
        const { plan, isSubscribed, usage, limits, features } = get();
        // Any active paid plan passes hard-gate checks by default
        if (isSubscribed && plan !== "free") {
          // Starter-specific caps still apply
          if (feature === "events") {
            if (limits.events !== null && usage.events >= limits.events)
              return { allowed: false, reason: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan includes ${limits.events} events. Upgrade to Pro for unlimited.` };
            return { allowed: true, reason: null };
          }
          return { allowed: true, reason: null };
        }
        // Free plan checks
        switch (feature) {
          case "events":
            return usage.events >= (limits.events ?? 1)
              ? { allowed: false, reason: `Free plan includes ${limits.events} event. Upgrade for unlimited.` }
              : { allowed: true, reason: null };
          case "templates":
            return features?.lockedTemplates
              ? { allowed: false, reason: "Free plan includes Classic templates only. Upgrade to unlock all styles." }
              : { allowed: true, reason: null };
          case "tickets":
            return !features?.stripeTicketing
              ? { allowed: false, reason: "Ticket selling requires Starter or Pro plan." }
              : { allowed: true, reason: null };
          case "reminders": {
            const reminderLimit = features?.guestEmailReminders ?? 0;
            return reminderLimit === 0
              ? { allowed: false, reason: "Email reminders require Starter or Pro plan." }
              : { allowed: true, reason: null };
          }
          default:
            return { allowed: false, reason: `${feature} requires a paid plan.` };
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
        const { allowed } = checkLimit(feature);
        if (allowed) { onAllowed?.(); return true; }
        openUpgradeModal(feature);
        return false;
      },

      // ── Fetch Stripe prices ───────────────────────────────────────────────────
      fetchPrices: async () => {
        try {
          const res = await api.get("/subscription/prices");
          const data = res.data?.data;
          if (data) set({ prices: { starter: data.starter ?? null, pro: data.pro ?? null } });
        } catch { /* non-fatal */ }
      },

      // ── Fetch ─────────────────────────────────────────────────────────────────
      fetchSubscription: async () => {
        try {
          set({ isLoading: true });
          get().fetchPrices();
          const res  = await api.get("/subscription/status");
          const data = res.data?.data ?? {};
          const dbSubscribed = data.is_subscribed ?? false;

          if (dbSubscribed) {
            clearPaidAt();
            set({
              plan:               normalizePlan(data.plan),
              isSubscribed:       true,
              subscriptionStatus: data.subscription_status ?? "active",
              currentPeriodEnd:   data.current_period_end  ?? null,
              usage:              data.usage               ?? { events: 0 },
              limits:             data.limits              ?? DEFAULT_LIMITS,
              features:           data.features            ?? DEFAULT_FEATURES,
              isLoading: false,
            });
          } else {
            const inGrace = (() => { const p = getPaidAt(); return p && Date.now() - p < GRACE_MS; })();
            if (inGrace) {
              // DB hasn't been updated by webhook yet. Try verify-session as a fallback
              // so we can update the DB even if the Stripe webhook hasn't fired.
              const sessionId = typeof window !== "undefined"
                ? sessionStorage.getItem("stripe_session_id")
                : null;
              if (sessionId) {
                try {
                  const vRes = await api.get(`/subscription/verify-session?session_id=${sessionId}`);
                  if (vRes.data?.data?.is_subscribed) {
                    clearPaidAt();
                    if (typeof window !== "undefined") sessionStorage.removeItem("stripe_session_id");
                    // Re-fetch now that DB is updated
                    const syncRes = await api.get("/subscription/status");
                    const syncData = syncRes.data?.data ?? {};
                    set({
                      plan:               normalizePlan(syncData.plan),
                      isSubscribed:       true,
                      subscriptionStatus: syncData.subscription_status ?? "active",
                      currentPeriodEnd:   syncData.current_period_end  ?? null,
                      usage:              syncData.usage               ?? { events: 0 },
                      limits:             syncData.limits              ?? DEFAULT_LIMITS,
                      features:           syncData.features            ?? DEFAULT_FEATURES,
                      isLoading: false,
                    });
                    return;
                  }
                } catch { /* ignore — webhook may still be in flight */ }
              }
              // Keep the optimistic plan/limits/features set by setSubscribed() — only sync usage
              set({ usage: data.usage ?? { events: 0 }, isLoading: false });
            } else {
              set({
                plan:               "free",
                isSubscribed:       false,
                subscriptionStatus: data.subscription_status ?? null,
                currentPeriodEnd:   data.current_period_end  ?? null,
                usage:              data.usage               ?? { events: 0 },
                limits:             data.limits              ?? DEFAULT_LIMITS,
                features:           data.features            ?? DEFAULT_FEATURES,
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
          const successUrl = typeof window !== "undefined"
            ? `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`
            : undefined;
          const res = await api.post("/subscription/checkout", { priceId, successUrl });
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

      // Called on /billing/success redirect — optimistic unlock
      setSubscribed: (plan = "starter") => {
        const tier = normalizePlan(plan);
        const isPro = tier === "pro";
        setPaidAt();
        set({
          plan: tier,
          isSubscribed:       true,
          subscriptionStatus: "active",
          limits: isPro
            ? { events: null,  templates: null, guests: null }
            : { events: 5,     templates: null, guests: 500  },
          features: isPro
            ? {
                customDomain: true,  analytics: true,  advancedBuilder: true,
                rsvp: true, pageBuilder: true, lockedTemplates: false,
                lockedStyles: false, freeTemplateStyle: null,
                stripeTicketing: true, guestEmailReminders: 999, platformFeePercent: 0,
              }
            : {
                customDomain: false, analytics: false, advancedBuilder: false,
                rsvp: true, pageBuilder: true, lockedTemplates: false,
                lockedStyles: false, freeTemplateStyle: null,
                stripeTicketing: true, guestEmailReminders: 1, platformFeePercent: 2,
              },
        });
      },

      setUnsubscribed: () => {
        clearPaidAt();
        set({ plan: "free", isSubscribed: false, subscriptionStatus: "canceled", features: DEFAULT_FEATURES, limits: DEFAULT_LIMITS });
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
        limits:             s.limits,
        features:           s.features,
        // usage is intentionally not persisted — always re-fetch from server
      }),
      // Normalize legacy "premium" plan name stored in localStorage
      onRehydrateStorage: () => (state) => {
        if (state) state.plan = normalizePlan(state.plan);
      },
    }
  )
);
