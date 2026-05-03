import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth.store';
import { Colors } from '@/constants/colors';

const FEATURES = [
  { icon: 'calendar',    text: 'Unlimited events'                },
  { icon: 'users',       text: 'Unlimited guests per event'      },
  { icon: 'layout',      text: 'All premium templates'           },
  { icon: 'mail',        text: 'Custom email invitations'        },
  { icon: 'bar-chart-2', text: 'Advanced analytics & exports'    },
  { icon: 'credit-card', text: 'Full ticketing & Stripe payouts' },
  { icon: 'camera',      text: 'QR scanner with offline sync'    },
  { icon: 'globe',       text: 'Custom domain support'           },
] as const;

export default function UpgradeScreen() {
  const router  = useRouter();
  const user    = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // TODO: open Stripe billing portal or in-app purchase flow
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Back */}
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

        {/* Price */}
        <View style={styles.priceCard}>
          <LinearGradient
            colors={[`${Colors.accent.gold}18`, `${Colors.accent.violet}10`]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <Text style={styles.priceAmount}>$29</Text>
          <Text style={styles.pricePer}>/month</Text>
          <Text style={styles.priceSub}>or $199/year — save 43%</Text>
        </View>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map(f => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon} size={15} color={Colors.accent.gold} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

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
                <Text style={styles.ctaText}>Upgrade to Premium</Text>
              </>
          }
        </Pressable>

        <Text style={styles.fine}>
          Cancel anytime. No hidden fees. Billed securely via Stripe.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: 20, gap: 20, paddingBottom: 60 },

  backBtn: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: Colors.bg.elevated,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    alignItems:      'center',
    justifyContent:  'center',
    alignSelf:       'flex-start',
  },

  hero: {
    borderRadius:  24,
    padding:       28,
    alignItems:    'center',
    gap:           10,
    borderWidth:   1,
    borderColor:   `${Colors.accent.gold}25`,
  },
  crownWrap: {
    width:           64,
    height:          64,
    borderRadius:    20,
    backgroundColor: `${Colors.accent.gold}18`,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  crownEmoji: { fontSize: 32 },
  heroTitle:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:    { fontSize: 14, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },

  priceCard: {
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     `${Colors.accent.gold}35`,
    backgroundColor: Colors.bg.card,
    padding:         24,
    alignItems:      'center',
    gap:             2,
    overflow:        'hidden',
  },
  priceAmount: { fontSize: 52, fontWeight: '900', color: Colors.accent.gold, letterSpacing: -2 },
  pricePer:    { fontSize: 16, fontWeight: '700', color: Colors.text.muted, marginTop: -8 },
  priceSub:    { fontSize: 12, color: Colors.text.subtle, marginTop: 4 },

  featureList: {
    backgroundColor: Colors.bg.card,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         16,
    gap:             12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  featureIcon: {
    width:           32,
    height:          32,
    borderRadius:    10,
    backgroundColor: `${Colors.accent.gold}15`,
    alignItems:      'center',
    justifyContent:  'center',
  },
  featureText: { fontSize: 14, color: Colors.text.primary, fontWeight: '500' },

  ctaBtn: {
    height:         54,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    flexDirection:  'row',
    gap:            8,
    overflow:       'hidden',
  },
  ctaText: { fontSize: 16, fontWeight: '900', color: Colors.text.inverse },

  fine: { fontSize: 11, color: Colors.text.subtle, textAlign: 'center' },
});
