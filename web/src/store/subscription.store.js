"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";

// Normalize legacy/alias plan names to the canonical three tiers
function normalizePlan(plan) {
  if (plan === "pro" || plan === "premium" || plan === "enterprise") return "pro";
  if (plan === "starter") return "starter";
  return "free";
}

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
  stripeTicketing:     true,
  guestEmailReminders: 0,
  platformFeePercent:  2,
  planner:             false,
};

// Several dashboard components request the subscription at the same time.
// Coalesce those requests and briefly reuse the fresh result so route changes
// do not repeatedly reload plan data and trigger unrelated page renders.
const SUBSCRIPTION_CACHE_MS = 15_000;
let subscriptionRequest = null;
let subscriptionUpdatedAt = 0;
let subscriptionEpoch = 0;

export const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      // ── Subscription state ──────────────────────────────────────────────────
      plan:               "free",
      isSubscribed:       false,
      subscriptionStatus: null,
      currentPeriodEnd:   null,
      isLoading:          false,
      // Access guards wait for this server check instead of trusting persisted
      // browser data from a previous login or subscription period.
      subscriptionLoaded: false,

      // ── Usage (hydrated from server) ────────────────────────────────────────
      usage: { events: 0 },

      // ── Plan limits (hydrated from server, mirrors planLimits.service.js) ───
      limits: DEFAULT_LIMITS,

      // ── Plan features (hydrated from server) ────────────────────────────────
      features: DEFAULT_FEATURES,

      // ── Upgrade modal ────────────────────────────────────────────────────────
      upgradeModalOpen:    false,
      upgradeModalFeature: null,

      // ── Billing modal ────────────────────────────────────────────────────────
      billingModalOpen: false,

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
        if (feature === "planner" && !features?.planner) {
          return { allowed: false, reason: "The event planner requires Starter or Pro plan." };
        }
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
              ? { allowed: false, reason: "Ticket selling is not available on your current plan." }
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

      openBillingModal:  () => set({ billingModalOpen: true }),
      closeBillingModal: () => set({ billingModalOpen: false }),

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
      fetchSubscription: ({ force = false } = {}) => {
        if (subscriptionRequest) return subscriptionRequest;

        const hasFreshSubscription = get().subscriptionLoaded &&
          Date.now() - subscriptionUpdatedAt < SUBSCRIPTION_CACHE_MS;
        if (!force && hasFreshSubscription) return Promise.resolve();

        const requestEpoch = subscriptionEpoch;
        let request;
        request = (async () => {
          try {
            set({ isLoading: true });
            get().fetchPrices();
            const res  = await api.get("/subscription/status");
            const data = res.data?.data ?? {};
            const dbSubscribed = data.is_subscribed ?? false;

            // A logout or account switch happened while this request was in
            // flight. Its response is no longer allowed to restore old access.
            if (requestEpoch !== subscriptionEpoch) return;

            if (dbSubscribed) {
              set({
                plan:               normalizePlan(data.plan),
                isSubscribed:       true,
                subscriptionStatus: data.subscription_status ?? "active",
                currentPeriodEnd:   data.current_period_end  ?? null,
                usage:              data.usage               ?? { events: 0 },
                limits:             data.limits              ?? DEFAULT_LIMITS,
                features:           data.features            ?? DEFAULT_FEATURES,
                isLoading: false,
                subscriptionLoaded: true,
              });
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
                subscriptionLoaded: true,
              });
            }
            subscriptionUpdatedAt = Date.now();
          } catch {
            if (requestEpoch !== subscriptionEpoch) return;
            // A failed entitlement check must never leave stale paid access in
            // the client. The backend remains the authoritative enforcement.
            set({
              plan: "free",
              isSubscribed: false,
              subscriptionStatus: null,
              currentPeriodEnd: null,
              usage: { events: 0 },
              limits: DEFAULT_LIMITS,
              features: DEFAULT_FEATURES,
              isLoading: false,
              subscriptionLoaded: true,
            });
          } finally {
            if (subscriptionRequest === request) subscriptionRequest = null;
          }
        })();

        subscriptionRequest = request;
        return request;
      },

      /**
       * Refresh the server entitlement before entering Planner. This prevents a
       * stale persisted plan in the browser from sending a user to Planner and
       * producing a 403 during project generation.
       */
      requestPlannerAccess: async () => {
        await get().fetchSubscription({ force: true });
        const { isSubscribed, features, openBillingModal } = get();
        const allowed = Boolean(isSubscribed && features?.planner);
        if (!allowed) openBillingModal();
        return allowed;
      },

      // ── Stripe checkout (for new subscriptions only) ─────────────────────────
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
          const message = err?.response?.data?.message || "Checkout failed";
          const code = err?.response?.data?.code;
          return { success: false, message, code };
        }
      },

      // Verify Stripe directly before updating local access after a hosted
      // checkout redirect. The success URL itself is never proof of payment.
      verifyAndActivate: async (sessionId) => {
        try {
          const res = await api.get(`/subscription/verify-session?session_id=${encodeURIComponent(sessionId)}`);
          if (!res.data?.data?.is_subscribed) return false;
          await get().fetchSubscription({ force: true });
          return true;
        } catch {
          return false;
        }
      },

      /**
       * CRITICAL FIX #2: Change existing subscription plan (upgrade/downgrade).
       * Use this when user already has an active subscription.
       * Returns immediately without redirect — plan changes take effect instantly.
       */
      changeSubscriptionPlan: async (priceId) => {
        try {
          set({ isLoading: true });
          const res = await api.post("/subscription/change-plan", { priceId });
          const data = res.data?.data ?? {};

          // Update local state immediately with the new plan
          if (data.plan) {
            set({
              plan: normalizePlan(data.plan),
              subscriptionStatus: data.subscription_status ?? "active",
              currentPeriodEnd: data.current_period_end ?? null,
            });
            // Re-fetch to get updated limits/features
            await get().fetchSubscription({ force: true });
          }

          set({ isLoading: false });
          return { success: true, plan: data.plan };
        } catch (err) {
          set({ isLoading: false });
          const message = err?.response?.data?.message || "Plan change failed";
          const code = err?.response?.data?.code;
          return { success: false, message, code };
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

      setUnsubscribed: () => {
        subscriptionEpoch += 1;
        subscriptionUpdatedAt = 0;
        subscriptionRequest = null;
        set({ plan: "free", isSubscribed: false, subscriptionStatus: "canceled", features: DEFAULT_FEATURES, limits: DEFAULT_LIMITS, subscriptionLoaded: false });
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
