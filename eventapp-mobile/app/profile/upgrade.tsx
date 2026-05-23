import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionStore } from '@/store/subscription.store';
import { Colors } from '@/constants/colors';
import { Config } from '@/constants/config';

const FEATURES = [
  { icon: 'calendar',    text: 'Unlimited events'                },
  { icon: 'users',       text: 'Unlimited guests per event'      },
  { icon: 'layout',      text: 'All 6 premium themes'            },
  { icon: 'mail',        text: 'Custom email invitations'        },
  { icon: 'bar-chart-2', text: 'Advanced analytics & exports'    },
  { icon: 'credit-card', text: 'Full ticketing & Stripe payouts' },
  { icon: 'camera',      text: 'QR scanner with offline sync'    },
  { icon: 'globe',       text: 'Custom domain support'           },
] as const;

type Plan = 'starter' | 'pro';

export default function UpgradeScreen() {
  const router = useRouter();
  const { plan, isPremium, isSubscribed, currentPeriodEnd, createCheckoutSession, openCustomerPortal, fetchSubscription, prices } =
    useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('starter');
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const alreadyPremium = isPremium();
  const planLabel = plan === 'starter' ? 'Starter Plan' : plan === 'pro' ? 'Pro Plan' : 'Free Plan';

  const handleUpgrade = async () => {
    const priceId = selectedPlan === 'pro'
      ? Config.STRIPE.PRO_PRICE_ID
      : Config.STRIPE.STARTER_PRICE_ID;

    setLoading(true);
    const result = await createCheckoutSession(priceId);
    setLoading(false);

    if (result.success) {
      Alert.alert('Welcome to Premium!', "You're now on the Premium plan.", [
        { text: 'Great!', onPress: () => router.back() },
      ]);
    } else if (!result.canceled) {
      Alert.alert('Payment failed', result.message ?? 'Something went wrong. Please try again.');
    }
    // canceled: do nothing — user dismissed the sheet
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    await openCustomerPortal();
    setPortalLoading(false);
    // Refresh subscription after returning from portal
    await fetchSubscription();
  };

  if (alreadyPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>

          {/* Premium active card */}
          <LinearGradient
            colors={[`${Colors.accent.gold}30`, `${Colors.accent.violet}18`, 'transparent']}
            style={styles.hero}
          >
            <View style={styles.crownWrap}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            <Text style={styles.heroTitle}>You're on {planLabel}</Text>
            <Text style={styles.heroSub}>
              All {planLabel} features are active. Thank you for supporting EventApp!
            </Text>
          </LinearGradient>

          {/* Subscription details */}
          {currentPeriodEnd && (
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Feather name="calendar" size={14} color={Colors.accent.gold} />
                <Text style={styles.infoLabel}>Renews</Text>
                <Text style={styles.infoValue}>
                  {new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Feather name="shield" size={14} color={Colors.accent.emerald} />
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: Colors.accent.emerald }]}>Active</Text>
              </View>
            </View>
          )}

          {/* Feature list */}
          <FeatureList />

          {/* Manage billing */}
          <Pressable
            style={[styles.manageBtn, portalLoading && { opacity: 0.7 }]}
            onPress={handleManageBilling}
            disabled={portalLoading}
          >
            {portalLoading
              ? <ActivityIndicator color={Colors.text.muted} size="small" />
              : <>
                  <Feather name="external-link" size={14} color={Colors.text.muted} />
                  <Text style={styles.manageBtnText}>Manage billing on Stripe</Text>
                </>
            }
          </Pressable>

          <Text style={styles.fine}>
            Cancel anytime. Changes take effect at the end of your billing period.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>

        {/* Hero */}
        <LinearGradient
          colors={[`${Colors.accent.gold}22`, `${Colors.accent.violet}18`, 'transparent']}
          style={styles.hero}
        >
          <View style={styles.crownWrap}>
            <Text style={styles.crownEmoji}>👑</Text>
          </View>
          <Text style={styles.heroTitle}>Go Premium</Text>
          <Text style={styles.heroSub}>
            Everything you need to run professional events — unlimited, unrestricted.
          </Text>
        </LinearGradient>

        {/* Plan toggle */}
        <View style={styles.planToggle}>
          <Pressable
            style={[styles.planOption, selectedPlan === 'starter' && styles.planOptionActive]}
            onPress={() => setSelectedPlan('starter')}
          >
            <Text style={[styles.planOptionLabel, selectedPlan === 'starter' && styles.planOptionLabelActive]}>Starter</Text>
            <Text style={[styles.planOptionPrice, selectedPlan === 'starter' && { color: Colors.accent.gold }]}>
              {prices.starter?.amount != null ? `$${prices.starter.amount}/mo` : '$5/mo'}
            </Text>
            <Text style={[{ fontSize: 10, color: Colors.text.subtle }]}>5 events · 500 guests</Text>
          </Pressable>
          <Pressable
            style={[styles.planOption, selectedPlan === 'pro' && styles.planOptionActive]}
            onPress={() => setSelectedPlan('pro')}
          >
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Best Value</Text>
            </View>
            <Text style={[styles.planOptionLabel, selectedPlan === 'pro' && styles.planOptionLabelActive]}>Pro</Text>
            <Text style={[styles.planOptionPrice, selectedPlan === 'pro' && { color: Colors.accent.gold }]}>
              {prices.pro?.amount != null ? `$${prices.pro.amount}/mo` : '$12/mo'}
            </Text>
            <Text style={[{ fontSize: 10, color: Colors.text.subtle }]}>Unlimited everything</Text>
          </Pressable>
        </View>

        {/* Feature list */}
        <FeatureList />

        {/* CTA */}
        <Pressable
          style={[styles.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={handleUpgrade}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.accent.gold, Colors.accent.amber]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
          {loading
            ? <ActivityIndicator color={Colors.text.inverse} />
            : <>
                <Feather name="zap" size={17} color={Colors.text.inverse} />
                <Text style={styles.ctaText}>
                  {selectedPlan === 'pro'
                    ? `Upgrade to Pro — ${prices.pro?.amount != null ? `$${prices.pro.amount}/mo` : '$12/mo'}`
                    : `Upgrade to Starter — ${prices.starter?.amount != null ? `$${prices.starter.amount}/mo` : '$5/mo'}`}
                </Text>
              </>
          }
        </Pressable>

        <Text style={styles.fine}>
          Cancel anytime · No hidden fees · Billed securely via Stripe
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureList() {
  return (
    <View style={styles.featureList}>
      {FEATURES.map(f => (
        <View key={f.icon} style={styles.featureRow}>
          <View style={styles.featureIcon}>
            <Feather name={f.icon} size={15} color={Colors.accent.gold} />
          </View>
          <Text style={styles.featureText}>{f.text}</Text>
          <Feather name="check" size={14} color={Colors.accent.emerald} style={{ marginLeft: 'auto' }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: 20, gap: 20, paddingBottom: 60 },

  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  hero: {
    borderRadius: 24, padding: 28, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: `${Colors.accent.gold}25`,
  },
  crownWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: `${Colors.accent.gold}18`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  crownEmoji: { fontSize: 32 },
  heroTitle:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:    { fontSize: 14, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },

  planToggle: { flexDirection: 'row', gap: 10 },
  planOption: {
    flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    position: 'relative',
  },
  planOptionActive: { borderColor: Colors.accent.gold, backgroundColor: `${Colors.accent.gold}10` },
  planOptionLabel:  { fontSize: 11, fontWeight: '700', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  planOptionLabelActive: { color: Colors.text.primary },
  planOptionPrice:  { fontSize: 20, fontWeight: '900', color: Colors.text.muted },
  saveBadge: {
    position: 'absolute', top: -10, right: 10,
    backgroundColor: Colors.accent.emerald,
    borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
  },
  saveBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  featureList: {
    backgroundColor: Colors.bg.card, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 16, gap: 14,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: `${Colors.accent.gold}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: { fontSize: 14, color: Colors.text.primary, fontWeight: '500', flex: 1 },

  ctaBtn: {
    height: 54, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, overflow: 'hidden',
  },
  ctaText: { fontSize: 16, fontWeight: '900', color: Colors.text.inverse },

  // Premium active state
  infoCard: {
    backgroundColor: Colors.bg.card, borderRadius: 16,
    borderWidth: 1, borderColor: `${Colors.accent.gold}30`, padding: 16, gap: 12,
  },
  infoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13, color: Colors.text.muted, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '700', color: Colors.text.primary },

  manageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.bg.card,
  },
  manageBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text.muted },

  fine: { fontSize: 11, color: Colors.text.subtle, textAlign: 'center' },
});
