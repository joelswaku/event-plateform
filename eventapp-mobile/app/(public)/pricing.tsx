import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Perfect to get started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '1 event',
      '50 guests per event',
      'Basic event page',
      'RSVP management',
      'Email support',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For growing events',
    monthlyPrice: 19,
    yearlyPrice: 15.2,
    features: [
      '5 events',
      '200 guests per event',
      'All Free features',
      'Custom branding',
      'Ticketing (5% fee)',
      'QR check-in',
      'Analytics',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For professional organizers',
    popular: true,
    monthlyPrice: 49,
    yearlyPrice: 39.2,
    features: [
      'Unlimited events',
      'Unlimited guests',
      'All Starter features',
      'Advanced analytics',
      'Team collaboration',
      'API access',
      'White-label',
      'Ticketing (2% fee)',
      'Dedicated support',
    ],
  },
];

function PricingCard({ plan }: { plan: typeof PRICING_PLANS[0] }) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const isYearly = billingInterval === 'yearly';
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const yearlyTotal = plan.yearlyPrice * 12;
  const monthlyTotal = plan.monthlyPrice * 12;
  const savings = monthlyTotal - yearlyTotal;

  return (
    <View
      style={[
        styles.planCard,
        plan.popular && {
          backgroundColor: Colors.accent.indigo + '15',
          borderColor: Colors.accent.indigo,
        },
      ]}
    >
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Feather name="zap" size={14} color="#fff" />
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
      )}

      <Text style={[styles.planName, plan.popular && { color: Colors.accent.indigo }]}>
        {plan.name}
      </Text>
      <Text style={styles.planTagline}>{plan.tagline}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceAmount}>${price}</Text>
        <Text style={styles.pricePeriod}>/month</Text>
      </View>

      {isYearly && plan.id !== 'free' && (
        <Text style={styles.savingsText}>Save ${savings.toFixed(0)}/year with annual billing</Text>
      )}

      {plan.id === 'free' && <Text style={styles.freeForever}>Free forever</Text>}

      <Pressable
        style={[
          styles.planBtn,
          plan.popular && {
            backgroundColor: Colors.accent.indigo,
          },
        ]}
      >
        <Text
          style={[
            styles.planBtnText,
            !plan.popular && { color: Colors.text.primary },
          ]}
        >
          {plan.id === 'free' ? 'Get Started Free' : `Start ${plan.name}`}
        </Text>
      </Pressable>

      <View style={styles.featuresList}>
        {plan.features.map((feature, idx) => (
          <View key={idx} style={styles.featureRow}>
            <Feather
              name="check"
              size={16}
              color={plan.popular ? Colors.accent.indigo : Colors.accent.emerald}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function PricingScreen() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Pricing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Feather name="dollar-sign" size={14} color={Colors.accent.emerald} />
            <Text style={[styles.badgeText, { color: Colors.accent.emerald }]}>
              Simple, Transparent Pricing
            </Text>
          </View>
          <Text style={styles.heroTitle}>Choose Your Plan</Text>
          <Text style={styles.heroDesc}>
            Start free and scale as you grow. All plans include our core event management features
            with no hidden fees.
          </Text>

          {/* Billing Toggle */}
          <View style={styles.toggle}>
            <Pressable
              onPress={() => setBillingInterval('monthly')}
              style={[
                styles.toggleBtn,
                billingInterval === 'monthly' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  billingInterval === 'monthly' && styles.toggleTextActive,
                ]}
              >
                Monthly
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBillingInterval('yearly')}
              style={[
                styles.toggleBtn,
                billingInterval === 'yearly' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  billingInterval === 'yearly' && styles.toggleTextActive,
                ]}
              >
                Yearly
              </Text>
              <View style={styles.saveChip}>
                <Text style={styles.saveChipText}>Save 20%</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Pricing Cards */}
        <View style={styles.plansContainer}>
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </View>

        {/* Note */}
        <Text style={styles.note}>
          All paid plans include a 14-day money-back guarantee. No credit card required for Free
          plan.
        </Text>

        {/* CTA Section */}
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaTitle}>Ready to create amazing events?</Text>
          <Text style={styles.ctaDesc}>
            Join thousands of event organizers who trust LiteEvent to power their events.
          </Text>
          <Pressable style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Get Started Free</Text>
          </Pressable>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.accent.emerald + '20',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.emerald + '40',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 16,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: Colors.accent.indigo,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.muted,
  },
  toggleTextActive: {
    color: '#fff',
  },
  saveChip: {
    backgroundColor: Colors.accent.emerald,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  plansContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border.DEFAULT,
    padding: 24,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent.amber,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  planName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  planTagline: {
    fontSize: 14,
    color: Colors.text.muted,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.text.primary,
  },
  pricePeriod: {
    fontSize: 16,
    color: Colors.text.muted,
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent.emerald,
    marginBottom: 8,
  },
  freeForever: {
    fontSize: 13,
    color: Colors.text.muted,
    marginBottom: 8,
  },
  planBtn: {
    backgroundColor: Colors.bg.elevated,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  planBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  featuresList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  note: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: 24,
    marginHorizontal: 20,
    lineHeight: 20,
  },
  cta: {
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accent.indigo,
  },
});
