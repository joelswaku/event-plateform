import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import api from '@/lib/api';
import { PlanLimits, PlanUsage } from '@/types';

// Grace period: 5 min after payment before trusting DB over optimistic state
const GRACE_MS = 5 * 60 * 1000;
let _paidAt: number | null = null;

const DEFAULT_LIMITS: PlanLimits = { events: 1, templates: 3, guests: 50 };

interface LimitCheck { allowed: boolean; reason: string | null }

interface SubscriptionState {
  plan:               'free' | 'premium';
  isSubscribed:       boolean;
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
  currentPeriodEnd:   string | null;
  isLoading:          boolean;
  usage:              PlanUsage;
  limits:             PlanLimits;
  upgradeModalOpen:    boolean;
  upgradeModalFeature: string | null;

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

  // API
  fetchSubscription:    () => Promise<void>;
  createCheckoutSession:(priceId: string) => Promise<{ success: boolean; message?: string }>;
  openCustomerPortal:   () => Promise<void>;
  setSubscribed:        (plan?: 'free' | 'premium') => void;
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
      upgradeModalOpen:    false,
      upgradeModalFeature: null,

      // ── Computed ────────────────────────────────────────────────────────────────
      isPremium:  () => get().isSubscribed && get().plan === 'premium',
      isPastDue:  () => get().subscriptionStatus === 'past_due',
      isCanceled: () => get().subscriptionStatus === 'canceled',
      isTrialing: () => get().subscriptionStatus === 'trialing',

      isAtEventLimit: () => {
        const { plan, isSubscribed, usage, limits } = get();
        if (isSubscribed && plan === 'premium') return false;
        return usage.events >= (limits.events ?? 1);
      },

      checkLimit: (feature) => {
        const { plan, isSubscribed, usage, limits } = get();
        if (isSubscribed && plan === 'premium') return { allowed: true, reason: null };
        switch (feature) {
          case 'events':
            return usage.events >= (limits.events ?? 1)
              ? { allowed: false, reason: `Free plan includes ${limits.events} event. Upgrade for unlimited.` }
              : { allowed: true, reason: null };
          case 'templates':
            return { allowed: false, reason: 'Free plan includes 3 Classic templates. Upgrade to access all 18 styles.' };
          default:
            return { allowed: false, reason: `${feature} requires a Premium plan.` };
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

      // ── Fetch ─────────────────────────────────────────────────────────────────────
      fetchSubscription: async () => {
        try {
          set({ isLoading: true });
          const res  = await api.get<{ data: {
            is_subscribed?: boolean;
            plan?: string;
            subscription_status?: string;
            current_period_end?: string | null;
            usage?: PlanUsage;
            limits?: PlanLimits;
          } }>('/subscription/status');
          const data = res.data?.data ?? {};
          const dbSubscribed = data.is_subscribed ?? false;

          if (dbSubscribed) {
            _paidAt = null;
            set({
              plan:               (data.plan as 'free' | 'premium') ?? 'premium',
              isSubscribed:       true,
              subscriptionStatus: (data.subscription_status as SubscriptionState['subscriptionStatus']) ?? 'active',
              currentPeriodEnd:   data.current_period_end ?? null,
              usage:              data.usage  ?? { events: 0 },
              limits:             data.limits ?? DEFAULT_LIMITS,
              isLoading:          false,
            });
          } else {
            const inGrace = _paidAt !== null && Date.now() - _paidAt < GRACE_MS;
            if (inGrace) {
              set({ usage: data.usage ?? { events: 0 }, isLoading: false });
            } else {
              set({
                plan:               'free',
                isSubscribed:       false,
                subscriptionStatus: (data.subscription_status as SubscriptionState['subscriptionStatus']) ?? null,
                currentPeriodEnd:   data.current_period_end ?? null,
                usage:              data.usage  ?? { events: 0 },
                limits:             data.limits ?? DEFAULT_LIMITS,
                isLoading:          false,
              });
            }
          }
        } catch {
          set({ isLoading: false });
        }
      },

      // ── Stripe checkout ────────────────────────────────────────────────────────────
      createCheckoutSession: async (priceId) => {
        try {
          set({ isLoading: true });
          const res = await api.post<{ data: { url: string } }>('/subscription/checkout', { priceId });
          const { url } = res.data?.data ?? {};
          set({ isLoading: false });
          if (url) await Linking.openURL(url);
          return { success: true };
        } catch (err: unknown) {
          set({ isLoading: false });
          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Checkout failed';
          return { success: false, message };
        }
      },

      openCustomerPortal: async () => {
        try {
          set({ isLoading: true });
          const res = await api.post<{ data: { url: string } }>('/subscription/portal');
          const { url } = res.data?.data ?? {};
          set({ isLoading: false });
          if (url) await Linking.openURL(url);
        } catch {
          set({ isLoading: false });
        }
      },

      // Optimistic premium unlock after payment
      setSubscribed: (plan = 'premium') => {
        _paidAt = Date.now();
        set({ plan, isSubscribed: true, subscriptionStatus: 'active' });
      },

      setUnsubscribed: () => {
        _paidAt = null;
        set({ plan: 'free', isSubscribed: false, subscriptionStatus: 'canceled' });
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
        // usage is never persisted — always re-fetch from server
      }),
    }
  )
);
