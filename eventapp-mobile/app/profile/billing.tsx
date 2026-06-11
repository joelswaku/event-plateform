import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator,
} from 'react-native';
import { toast } from '@/lib/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionStore } from '@/store/subscription.store';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';

type FeatureItem = string | { text: string; dim: true };

const FREE_FEATURES: FeatureItem[] = [
  '1 event',
  '50 guests per event',
  'Classic theme only',
  'QR check-in scanner',
  'RSVP page builder',
  { text: '"Powered by [Platform]" branding', dim: true },
];

const STARTER_FEATURES: FeatureItem[] = [
  '5 events',
  '500 guests per event',
  'All themes & styles',
  'Ticket selling (2% fee)',
  '1 email reminder per guest',
  'Basic analytics',
  'Up to 3 team members',
];

const PRO_FEATURES: FeatureItem[] = [
  'Unlimited events & guests',
  'All themes & styles',
  'Ticket selling (1.5% fee)',
  'Unlimited email reminders',
  'Advanced analytics',
  'Custom domain',
  'Unlimited team members',
];

const TIER_ORDER: Record<string, number> = { free: 0, starter: 1, pro: 2, premium: 2, enterprise: 3 };
const tierOf = (name?: string) => TIER_ORDER[name?.toLowerCase() ?? ''] ?? 0;

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

export default function BillingScreen() {
  const router = useRouter();
  const { plan: urlPlan } = useLocalSearchParams<{ plan?: string }>();
  const {
    plan, isSubscribed, subscriptionStatus, currentPeriodEnd,
    usage, limits, isPremium,
    fetchSubscription, createCheckoutSession, openCustomerPortal, isLoading,
  } = useSubscriptionStore();

  const [checkoutLoading, setCheckoutLoading] = useState<'starter' | 'pro' | null>(null);
  const [portalLoading,   setPortalLoading]   = useState(false);
  const [selectedPlan,    setSelectedPlan]    = useState<'starter' | 'pro' | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const proCardRef = useRef<View>(null);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  // Auto-select Pro plan when coming from planner modal
  useEffect(() => {
    if (urlPlan === 'pro') {
      setSelectedPlan('pro');
      // Scroll to Pro card after a short delay
      setTimeout(() => {
        proCardRef.current?.measureLayout(
          scrollViewRef.current as any,
          (_x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
          },
          () => {}
        );
      }, 300);
    }
  }, [urlPlan]);

  const premium    = isPremium();
  // "premium" and "enterprise" from the API map to the Pro tier
  const isPro        = isSubscribed && (plan === 'pro' || plan === 'premium' || plan === 'enterprise');
  const currentTier  = tierOf(isPro ? 'pro' : plan);
  const eventsUsed = usage?.events ?? 0;
  const renewDate  = fmtDate(currentPeriodEnd);

  const handleUpgrade = async (tier: 'starter' | 'pro') => {
    const priceId = tier === 'starter'
      ? Config.STRIPE.STARTER_PRICE_ID
      : Config.STRIPE.PRO_PRICE_ID;
    setCheckoutLoading(tier);
    const result = await createCheckoutSession(priceId, tier);
    setCheckoutLoading(null);
    if (result.success) {
      toast.success(`Welcome to ${tier === 'starter' ? 'Starter' : 'Pro'}!`, 'All features are now unlocked.');
      router.back();
    } else if (!result.canceled) {
      toast.error('Payment failed', result.message ?? 'Something went wrong. Please try again.');
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    await openCustomerPortal();
    setPortalLoading(false);
    await fetchSubscription();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Plans & Billing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Current plan banner ─────────────────────────────────────── */}
        <LinearGradient
          colors={isSubscribed
            ? [`${Colors.accent.gold}28`, `${Colors.accent.amber}0a`, 'transparent']
            : [Colors.bg.elevated, Colors.bg.elevated]}
          style={[s.planBanner, { borderColor: isSubscribed ? `${Colors.accent.gold}40` : Colors.border.DEFAULT }]}
        >
          <View style={s.planBannerInner}>
            <View style={[s.planIcon, {
              backgroundColor: isSubscribed ? `${Colors.accent.gold}20` : Colors.bg.card,
              borderColor: isSubscribed ? `${Colors.accent.gold}40` : Colors.border.DEFAULT,
            }]}>
              <Feather
                name={isSubscribed ? 'star' : 'zap'}
                size={20}
                color={isSubscribed ? Colors.accent.gold : Colors.text.muted}
              />
            </View>
            <View style={s.planInfo}>
              <View style={s.planNameRow}>
                <Text style={s.planName}>
                  {isSubscribed ? (plan.charAt(0).toUpperCase() + plan.slice(1)) : 'Free'} Plan
                </Text>
                {isSubscribed && subscriptionStatus === 'active' && (
                  <View style={s.activeBadge}>
                    <Text style={s.activeBadgeText}>Active</Text>
                  </View>
                )}
                {!isSubscribed && (
                  <View style={s.freeBadge}>
                    <Text style={s.freeBadgeText}>Free forever</Text>
                  </View>
                )}
              </View>
              <Text style={s.planSub}>
                {isSubscribed && renewDate
                  ? `Renews ${renewDate}`
                  : isSubscribed
                  ? 'Active subscription'
                  : 'Upgrade for unlimited events & more'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Usage ──────────────────────────────────────────────────── */}
        <View style={s.usageRow}>
          <UsageCard
            icon="calendar"
            label="Events"
            used={eventsUsed}
            limit={limits?.events ?? null}
          />
          <UsageCard
            icon="users"
            label="Guests / event"
            used={0}
            limit={limits?.guests ?? null}
          />
        </View>

        {/* ── Plan cards ─────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Choose a plan</Text>

        {/* FREE card */}
        <PlanCard
          name="Free"
          price="$0"
          period="forever"
          features={FREE_FEATURES}
          isCurrent={!isSubscribed}
          isPassed={currentTier > tierOf('free')}
          isPopular={false}
          accent={Colors.text.muted}
        />

        {/* STARTER card */}
        <PlanCard
          name="Starter"
          price="$19"
          period="/ month"
          badge="MOST POPULAR"
          features={STARTER_FEATURES}
          isCurrent={isSubscribed && plan === 'starter'}
          isPassed={currentTier > tierOf('starter')}
          isPopular
          isSelected={selectedPlan === 'starter'}
          onSelect={() => setSelectedPlan('starter')}
          accent={Colors.accent.indigo}
          onUpgrade={() => handleUpgrade('starter')}
          upgradeLoading={checkoutLoading === 'starter'}
          upgradeDisabled={isPro || (isSubscribed && plan === 'starter') || checkoutLoading !== null || isLoading}
        />

        {/* PRO card */}
        <View ref={proCardRef} collapsable={false}>
          <PlanCard
            name="Pro"
            price="$49"
            period="/ month"
            features={PRO_FEATURES}
            isCurrent={isPro}
            isPassed={false}
            isPopular={false}
            isSelected={selectedPlan === 'pro'}
            onSelect={() => setSelectedPlan('pro')}
            accent={Colors.accent.gold}
            onUpgrade={() => handleUpgrade('pro')}
            upgradeLoading={checkoutLoading === 'pro'}
            upgradeDisabled={isPro || checkoutLoading !== null || isLoading}
          />
        </View>

        {/* ── Manage subscription ─────────────────────────────────────── */}
        {isSubscribed && (
          <View style={s.manageCard}>
            <Text style={s.manageTitle}>Manage Subscription</Text>
            <Text style={s.manageSub}>
              Update payment method, view invoices, or cancel your plan.
            </Text>
            <Pressable
              style={[s.manageBtn, portalLoading && { opacity: 0.6 }]}
              onPress={handlePortal}
              disabled={portalLoading}
            >
              {portalLoading
                ? <ActivityIndicator color={Colors.text.muted} size="small" />
                : <>
                    <Feather name="external-link" size={14} color={Colors.text.muted} />
                    <Text style={s.manageBtnText}>Manage / Cancel on Stripe</Text>
                  </>
              }
            </Pressable>
            <Text style={s.manageFine}>
              You'll be redirected to Stripe to manage payment or cancel.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Sub-components ────────────────────────────────────────────────── */

function UsageCard({ icon, label, used, limit }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  used: number;
  limit: number | null; // null = unlimited
}) {
  // null limit means unlimited — show a token 15% fill so the bar isn't empty
  const barPct = limit !== null
    ? Math.min(1, used / Math.max(limit, 1))
    : 0.15;

  return (
    <View style={uc.card}>
      <View style={uc.top}>
        <View style={uc.iconWrap}>
          <Feather name={icon} size={14} color={Colors.accent.indigo} />
        </View>
        <Text style={uc.label}>{label}</Text>
      </View>
      <Text style={uc.value}>
        {used} / {limit ?? '∞'}
      </Text>
      <View style={uc.track}>
        <View style={[uc.fill, { width: `${Math.round(barPct * 100)}%` as any }]} />
      </View>
    </View>
  );
}

function PlanCard({ name, price, period, badge, features, isCurrent, isPassed, isPopular, isSelected, onSelect, accent, onUpgrade, upgradeLoading, upgradeDisabled }: {
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: FeatureItem[];
  isCurrent: boolean;
  isPassed?: boolean;
  isPopular: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  accent: string;
  onUpgrade?: () => void;
  upgradeLoading?: boolean;
  upgradeDisabled?: boolean;
}) {
  const isSelectable = !isCurrent && !isPassed && !!onSelect;

  const cardBorderColor = isSelected
    ? accent
    : isPopular
    ? `${accent}55`
    : Colors.border.DEFAULT;

  return (
    <Pressable
      onPress={isSelectable ? onSelect : undefined}
      style={[
        pc.card,
        { borderColor: cardBorderColor, opacity: isPassed ? 0.45 : 1 },
        isSelected && {
          backgroundColor: `${accent}0f`,
          shadowColor: accent,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        },
      ]}
    >
      {badge && (
        <View style={[pc.badge, { backgroundColor: Colors.accent.indigo }]}>
          <Text style={pc.badgeText}>{badge}</Text>
        </View>
      )}

      {/* Selected check indicator */}
      {isSelected && !isCurrent && (
        <View style={[pc.selectedCheck, { backgroundColor: accent }]}>
          <Feather name="check" size={11} color="#fff" />
        </View>
      )}

      <View style={pc.top}>
        <Text style={pc.name}>{name}</Text>
        <View style={pc.priceRow}>
          <Text style={[pc.price, { color: accent }]}>{price}</Text>
          <Text style={pc.period}>{period}</Text>
        </View>
      </View>

      <View style={pc.features}>
        {features.map((f, i) => {
          const text = typeof f === 'string' ? f : f.text;
          const dim  = typeof f === 'object' && f.dim;
          return (
            <View key={i} style={pc.featureRow}>
              <Feather name="check" size={13} color={dim ? Colors.text.subtle : accent} />
              <Text style={[pc.featureText, dim && { color: Colors.text.subtle }]}>{text}</Text>
            </View>
          );
        })}
      </View>

      {isCurrent ? (
        <View style={pc.currentBtn}>
          <Text style={pc.currentBtnText}>Current plan</Text>
        </View>
      ) : onUpgrade ? (
        <Pressable
          style={[pc.upgradeBtn, upgradeDisabled && { opacity: 0.6 }]}
          onPress={(e) => { onUpgrade(); }}
          disabled={upgradeDisabled}
        >
          <LinearGradient
            colors={[Colors.accent.gold, Colors.accent.amber]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          />
          {upgradeLoading
            ? <ActivityIndicator color={Colors.text.inverse} size="small" />
            : <>
                <Feather name="zap" size={15} color={Colors.text.inverse} />
                <Text style={pc.upgradeBtnText}>Upgrade to {name}</Text>
              </>
          }
        </Pressable>
      ) : null}
    </Pressable>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg.primary },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  content:     { padding: 16, gap: 14 },

  planBanner:      { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  planBannerInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  planIcon:        { width: 46, height: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  planInfo:        { flex: 1 },
  planNameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  planName:        { fontSize: 17, fontWeight: '800', color: '#fff' },
  activeBadge:     { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(16,185,129,0.18)' },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: '#10b981' },
  freeBadge:       { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  freeBadgeText:   { fontSize: 10, fontWeight: '700', color: Colors.text.muted },
  planSub:         { fontSize: 12, color: Colors.text.muted, marginTop: 2 },

  usageRow:     { flexDirection: 'row', gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 },

  manageCard:   { backgroundColor: Colors.bg.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 18, gap: 10 },
  manageTitle:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  manageSub:    { fontSize: 12, color: Colors.text.muted, lineHeight: 18 },
  manageBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 13, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: Colors.bg.elevated },
  manageBtnText:{ fontSize: 13, fontWeight: '600', color: Colors.text.muted },
  manageFine:   { fontSize: 11, color: Colors.text.subtle, textAlign: 'center' },
});

const uc = StyleSheet.create({
  card:    { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 14, gap: 8 },
  top:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconWrap:{ width: 26, height: 26, borderRadius: 8, backgroundColor: `${Colors.accent.indigo}18`, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 11, fontWeight: '700', color: Colors.text.muted, flex: 1 },
  value:   { fontSize: 18, fontWeight: '900', color: '#fff' },
  track:   { height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill:    { height: '100%', borderRadius: 99, backgroundColor: Colors.accent.indigo },
});

const pc = StyleSheet.create({
  card:          { backgroundColor: Colors.bg.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 18, gap: 16, position: 'relative', overflow: 'visible' },
  badge:         { position: 'absolute', top: -11, alignSelf: 'center', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 },
  selectedCheck: { position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText:     { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1, textTransform: 'uppercase' },
  top:           { gap: 4, paddingTop: 6 },
  name:          { fontSize: 10, fontWeight: '800', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1 },
  priceRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  price:         { fontSize: 36, fontWeight: '900', lineHeight: 40 },
  period:        { fontSize: 13, color: Colors.text.muted, marginBottom: 4 },
  features:      { gap: 10 },
  featureRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText:   { fontSize: 13, color: Colors.text.primary, fontWeight: '500', flex: 1 },
  currentBtn:    { paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: Colors.bg.elevated },
  currentBtnText:{ fontSize: 13, fontWeight: '700', color: Colors.text.muted },
  upgradeBtn:    { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, overflow: 'hidden' },
  upgradeBtnText:{ fontSize: 15, fontWeight: '900', color: Colors.text.inverse },
});
