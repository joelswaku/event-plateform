import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/lib/api';
import { openStripeCheckout, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL } from '@/lib/stripe';
import { PlanLimits, PlanUsage } from '@/types';

// Grace period: 5 min after payment before trusting DB over optimistic state
const GRACE_MS = 5 * 60 * 1000;
let _paidAt: number | null = null;

function normalizePlan(plan: string | undefined): 'free' | 'starter' | 'pro' | 'enterprise' {
  if (plan === 'pro' || plan === 'premium' || plan === 'enterprise') return 'pro';
  if (plan === 'starter') return 'starter';
  return 'free';
}

const DEFAULT_LIMITS: PlanLimits = { events: 1, templates: 3, guests: 50 };

const DEFAULT_FEATURES = {
  lockedTemplates:     true,
  lockedStyles:        true,
  freeTemplateStyle:   'CLASSIC' as string | null,
  stripeTicketing:     false,
  guestEmailReminders: 0 as number | null,
  platformFeePercent:  0,
};

interface LimitCheck { allowed: boolean; reason: string | null }

interface PlanFeatures {
  lockedTemplates:     boolean;
  lockedStyles:        boolean;
  freeTemplateStyle:   string | null;
  stripeTicketing:     boolean;
  guestEmailReminders: number | null; // null = unlimited
  platformFeePercent:  number;
  [key: string]:       unknown;
}

interface PriceInfo { amount: number | null; currency: string; interval: string }

interface SubscriptionState {
  plan:               'free' | 'starter' | 'pro' | 'enterprise';
  isSubscribed:       boolean;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
  currentPeriodEnd:   string | null;
  isLoading:          boolean;
  usage:              PlanUsage;
  limits:             PlanLimits;
  features:           PlanFeatures;
  upgradeModalOpen:    boolean;
  upgradeModalFeature: string | null;
  prices:             { starter: PriceInfo | null; pro: PriceInfo | null };

  // Computed
  isPremium:      () => boolean;
  isPastDue:      () => boolean;
  isCanceled:     () => boolean;
  isTrialing:     () => boolean;
  isAtEventLimit: () => boolean;
  checkLimit:     (feature: string) => LimitCheck;

  // Modal
  openUpgradeModal:  (feature?: string | null) => void;
  closeUpgradeModal: () => void;
  requirePremium:    (feature: string, onAllowed?: () => void) => boolean;
  fetchPrices:       () => Promise<void>;

  // API
  fetchSubscription:    () => Promise<void>;
  createCheckoutSession:(priceId: string, tier?: 'starter' | 'pro') => Promise<{ success: boolean; canceled?: boolean; message?: string }>;
  verifyAndActivate:    (sessionId: string) => Promise<boolean>;
  openCustomerPortal:   () => Promise<void>;
  setSubscribed:        (plan?: SubscriptionState['plan']) => void;
  setUnsubscribed:      () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan:               'free',
      isSubscribed:       false,
      subscriptionStatus: null,
      currentPeriodEnd:   null,
      isLoading:          false,
      usage:              { events: 0 },
      limits:             DEFAULT_LIMITS,
      features:           DEFAULT_FEATURES,
      upgradeModalOpen:    false,
      upgradeModalFeature: null,
      prices:             { starter: null, pro: null },

      // ── Computed ────────────────────────────────────────────────────────────────
      isPremium:  () => get().isSubscribed && get().plan !== 'free',
      isPastDue:  () => get().subscriptionStatus === 'past_due',
      isCanceled: () => get().subscriptionStatus === 'canceled',
      isTrialing: () => get().subscriptionStatus === 'trialing',

      isAtEventLimit: () => {
        const { usage, limits } = get();
        if (limits.events === null) return false; // unlimited
        return usage.events >= (limits.events ?? 1);
      },

      checkLimit: (feature) => {
        const { plan, isSubscribed, usage, limits, features } = get();
        if (isSubscribed && plan !== 'free') {
          if (feature === 'events') {
            if (limits.events !== null && usage.events >= limits.events)
              return { allowed: false, reason: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan includes ${limits.events} events. Upgrade to Pro for unlimited.` };
            return { allowed: true, reason: null };
          }
          return { allowed: true, reason: null };
        }
        switch (feature) {
          case 'events':
            return usage.events >= (limits.events ?? 1)
              ? { allowed: false, reason: `Free plan includes ${limits.events} event. Upgrade for unlimited.` }
              : { allowed: true, reason: null };
          case 'templates':
            return features?.lockedTemplates
              ? { allowed: false, reason: 'Free plan includes Classic templates only. Upgrade to unlock all styles.' }
              : { allowed: true, reason: null };
          case 'tickets':
            return !features?.stripeTicketing
              ? { allowed: false, reason: 'Ticket selling requires Starter or Pro plan.' }
              : { allowed: true, reason: null };
          case 'reminders': {
            const reminderLimit = features?.guestEmailReminders ?? 0;
            return reminderLimit === 0
              ? { allowed: false, reason: 'Email reminders require Starter or Pro plan.' }
              : { allowed: true, reason: null };
          }
          default:
            return { allowed: false, reason: `${feature} requires a paid plan.` };
        }
      },

      // ── Modal ────────────────────────────────────────────────────────────────────
      openUpgradeModal:  (feature = null) => set({ upgradeModalOpen: true,  upgradeModalFeature: feature ?? null }),
      closeUpgradeModal: ()               => set({ upgradeModalOpen: false, upgradeModalFeature: null }),

      requirePremium: (feature, onAllowed) => {
        const { checkLimit, openUpgradeModal } = get();
        const { allowed, reason: _reason } = checkLimit(feature);
        if (allowed) { onAllowed?.(); return true; }
        openUpgradeModal(feature);
        return false;
      },

      // ── Fetch Stripe prices ───────────────────────────────────────────────────────
      fetchPrices: async () => {
        try {
          const res = await api.get<{ data: { starter: PriceInfo | null; pro: PriceInfo | null } }>('/subscription/prices');
          const data = res.data?.data;
          if (data) set({ prices: { starter: data.starter ?? null, pro: data.pro ?? null } });
        } catch { /* non-fatal — UI falls back to hardcoded defaults */ }
      },

      // ── Fetch ─────────────────────────────────────────────────────────────────────
      fetchSubscription: async () => {
        try {
          set({ isLoading: true });
          get().fetchPrices();
          const res  = await api.get<{ data: {
            is_subscribed?: boolean;
            plan?: string;
            subscription_status?: string;
            current_period_end?: string | null;
            usage?: PlanUsage;
            limits?: PlanLimits;
            features?: PlanFeatures;
          } }>('/subscription/status');
          const data = res.data?.data ?? {};
          const dbSubscribed = data.is_subscribed ?? false;

          if (dbSubscribed) {
            _paidAt = null;
            set({
              plan:               normalizePlan(data.plan),
              isSubscribed:       true,
              subscriptionStatus: (data.subscription_status as SubscriptionState['subscriptionStatus']) ?? 'active',
              currentPeriodEnd:   data.current_period_end ?? null,
              usage:              data.usage    ?? { events: 0 },
              limits:             data.limits   ?? DEFAULT_LIMITS,
              features:           (data.features as PlanFeatures) ?? DEFAULT_FEATURES,
              isLoading:          false,
            });
          } else {
            const inGrace = _paidAt !== null && Date.now() - _paidAt < GRACE_MS;
            if (inGrace) {
              set({ usage: data.usage ?? { events: 0 }, isLoading: false });
            } else {
              set({
                plan:               normalizePlan(data.plan),
                isSubscribed:       false,
                subscriptionStatus: (data.subscription_status as SubscriptionState['subscriptionStatus']) ?? null,
                currentPeriodEnd:   data.current_period_end ?? null,
                usage:              data.usage    ?? { events: 0 },
                limits:             data.limits   ?? DEFAULT_LIMITS,
                features:           (data.features as PlanFeatures) ?? DEFAULT_FEATURES,
                isLoading:          false,
              });
            }
          }
        } catch {
          set({ isLoading: false });
        }
      },

      // ── Stripe checkout (in-app browser via expo-web-browser) ─────────────────────
      createCheckoutSession: async (priceId, tier = 'starter') => {
        try {
          set({ isLoading: true });
          // Ask the backend to build a Stripe session with mobile deep-link redirects
          const res = await api.post<{ data: { url: string; sessionId: string } }>(
            '/subscription/checkout',
            {
              priceId,
              successUrl: STRIPE_SUCCESS_URL,
              cancelUrl:  STRIPE_CANCEL_URL,
            },
          );
          const { url } = res.data?.data ?? {};
          set({ isLoading: false });
          if (!url) return { success: false, message: 'No checkout URL returned' };

          // Open Stripe in-app (Safari View Controller / Chrome Custom Tab)
          const result = await openStripeCheckout(url);

          if (result.type === 'subscription_success') {
            // Optimistically mark with the correct tier while the webhook lands
            get().setSubscribed(tier);
            // Then verify with the API (retries handled by caller if needed)
            await get().verifyAndActivate(result.sessionId);
            return { success: true };
          }
          if (result.type === 'cancel') return { success: false, canceled: true };
          return { success: false, message: (result as { type: 'error'; message: string }).message };
        } catch (err: unknown) {
          set({ isLoading: false });
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Checkout failed';
          return { success: false, message };
        }
      },

      // Verify a completed Stripe checkout session — updates DB, then does a full sync
      verifyAndActivate: async (sessionId) => {
        try {
          const res = await api.get<{ data: {
            is_subscribed: boolean;
            plan?: string;
            subscription_status?: string;
            current_period_end?: string | null;
          } }>('/subscription/verify-session', { params: { session_id: sessionId } });
          const data = res.data?.data ?? {};
          if (data.is_subscribed) {
            _paidAt = null; // clear grace — DB is authoritative now
            // Full sync so limits/features reflect what the server now says
            await get().fetchSubscription();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      openCustomerPortal: async () => {
        try {
          set({ isLoading: true });
          const res = await api.post<{ data: { url: string } }>('/subscription/portal');
          const { url } = res.data?.data ?? {};
          set({ isLoading: false });
          // Portal is a full browser experience — open externally (it has its own return_url)
          if (url) {
            await Linking.openURL(url);
          }
        } catch {
          set({ isLoading: false });
        }
      },

      // Optimistic unlock after payment
      setSubscribed: (plan = 'starter') => {
        const tier = normalizePlan(plan);
        const isPro = tier === 'pro';
        _paidAt = Date.now();
        set({
          plan:               tier,
          isSubscribed:       true,
          subscriptionStatus: 'active',
          limits: isPro
            ? { events: null, templates: null, guests: null }
            : { events: 5,    templates: null, guests: 500  },
          features: isPro
            ? {
                lockedTemplates: false, lockedStyles: false, freeTemplateStyle: null,
                stripeTicketing: true, guestEmailReminders: null, platformFeePercent: 0,
              }
            : {
                lockedTemplates: false, lockedStyles: false, freeTemplateStyle: null,
                stripeTicketing: true, guestEmailReminders: 1, platformFeePercent: 2,
              },
        });
      },

      setUnsubscribed: () => {
        _paidAt = null;
        set({ plan: 'free', isSubscribed: false, subscriptionStatus: 'canceled', features: DEFAULT_FEATURES, limits: DEFAULT_LIMITS });
      },
    }),
    {
      name:    'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        plan:               s.plan,
        isSubscribed:       s.isSubscribed,
        subscriptionStatus: s.subscriptionStatus,
        currentPeriodEnd:   s.currentPeriodEnd,
        limits:             s.limits,
        features:           s.features,
        // usage is intentionally not persisted — always re-fetch from server
      }),
      // Normalize legacy "premium" plan name stored in AsyncStorage
      onRehydrateStorage: () => (state) => {
        if (state) state.plan = normalizePlan(state.plan);
      },
    }
  )
);
