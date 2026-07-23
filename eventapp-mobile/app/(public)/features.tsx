import React from 'react';
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

const FEATURES = [
  {
    icon: 'layout',
    title: 'Event Page Builder',
    desc: 'Create stunning event pages with our intuitive drag & drop builder. Customize layouts, colors, and sections in real-time without any coding knowledge.',
    accent: Colors.accent.violet,
    benefits: [
      '30+ professional templates',
      'Real-time preview',
      'Mobile-responsive design',
      'Custom branding support',
    ],
  },
  {
    icon: 'credit-card',
    title: 'Ticketing System',
    desc: 'Sell tickets seamlessly with secure checkout and payment processing. Support multiple ticket types, early bird pricing, and promo codes.',
    accent: Colors.accent.emerald,
    benefits: [
      'Secure payment processing',
      'Multiple ticket tiers',
      'Promo code support',
      'Automatic confirmation emails',
    ],
  },
  {
    icon: 'check-circle',
    title: 'RSVP Management',
    desc: 'Track guest confirmations effortlessly with our comprehensive RSVP system. Collect dietary preferences, plus-ones, and custom responses.',
    accent: Colors.accent.cyan,
    benefits: [
      'Guest confirmation tracking',
      'Dietary preferences collection',
      'Plus-one management',
      'Automated reminders',
    ],
  },
  {
    icon: 'grid',
    title: 'QR Code Check-in',
    desc: 'Speed up guest verification with QR code scanning. Check-in guests instantly using our mobile app with offline support.',
    accent: Colors.accent.red,
    benefits: [
      'Instant guest verification',
      'Offline mode support',
      'Real-time attendance tracking',
      'Duplicate check-in prevention',
    ],
  },
  {
    icon: 'users',
    title: 'Guest Management',
    desc: 'Maintain a comprehensive attendee database with detailed guest profiles, RSVP history, and communication logs.',
    accent: Colors.accent.amber,
    benefits: [
      'Centralized guest database',
      'Import/export capabilities',
      'Guest grouping & segmentation',
      'Communication history',
    ],
  },
  {
    icon: 'user-plus',
    title: 'Team Collaboration',
    desc: 'Invite team members and co-organizers with customizable role-based permissions. Work together seamlessly on event planning.',
    accent: Colors.accent.indigo,
    benefits: [
      'Role-based access control',
      'Unlimited team members',
      'Activity logs & audit trails',
      'Real-time collaboration',
    ],
  },
  {
    icon: 'bar-chart-2',
    title: 'Event Analytics',
    desc: 'Get real-time insights into ticket sales, RSVP rates, guest demographics, and engagement metrics to optimize your event.',
    accent: Colors.accent.violet,
    benefits: [
      'Real-time dashboards',
      'Sales & revenue tracking',
      'Guest demographic insights',
      'Export custom reports',
    ],
  },
  {
    icon: 'smartphone',
    title: 'Mobile App',
    desc: 'Manage events on the go with our native iOS & Android apps. Check-in guests, track sales, and respond to inquiries from anywhere.',
    accent: Colors.accent.emerald,
    benefits: [
      'Native iOS & Android apps',
      'Offline functionality',
      'Push notifications',
      'Mobile check-in scanner',
    ],
  },
  {
    icon: 'mail',
    title: 'Email Notifications',
    desc: 'Keep attendees informed with automated email notifications. Send confirmations, reminders, and updates with customizable templates.',
    accent: Colors.accent.cyan,
    benefits: [
      'Automated email sequences',
      'Customizable templates',
      'Scheduled reminders',
      'Delivery analytics',
    ],
  },
  {
    icon: 'edit-3',
    title: 'Custom Branding',
    desc: 'White-label your event pages with custom domains, logos, and brand colors. Remove LiteEvent branding on Pro plans.',
    accent: Colors.accent.red,
    benefits: [
      'Custom domain support',
      'Logo & brand colors',
      'White-label options',
      'Custom CSS injection',
    ],
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  return (
    <View style={[styles.card, index % 2 === 0 && styles.cardEven]}>
      <View style={[styles.iconBox, { backgroundColor: feature.accent + '20' }]}>
        <Feather name={feature.icon as any} size={24} color={feature.accent} />
      </View>
      <Text style={styles.cardTitle}>{feature.title}</Text>
      <Text style={styles.cardDesc}>{feature.desc}</Text>
      <View style={styles.benefits}>
        {feature.benefits.map((benefit, idx) => (
          <View key={idx} style={styles.benefitRow}>
            <Feather name="check-circle" size={14} color={feature.accent} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function FeaturesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Features</Text>
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
            <Feather name="zap" size={14} color={Colors.accent.indigo} />
            <Text style={styles.badgeText}>Platform Features</Text>
          </View>
          <Text style={styles.heroTitle}>
            Powerful Features for{'\n'}
            <Text style={{ color: Colors.accent.indigo }}>Modern Event Management</Text>
          </Text>
          <Text style={styles.heroDesc}>
            Everything you need to create, manage, and host unforgettable events. From beautiful
            event pages to advanced analytics, we've got you covered.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.grid}>
          {FEATURES.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </View>

        {/* CTA Section */}
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Feather name="star" size={32} color="#fff" style={styles.ctaIcon} />
          <Text style={styles.ctaTitle}>Ready to create your next amazing event?</Text>
          <Text style={styles.ctaDesc}>
            Join thousands of event organizers who trust LiteEvent to power their events. Get
            started in minutes.
          </Text>
          <Pressable style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Get Started Free</Text>
            <Feather name="arrow-right" size={18} color={Colors.accent.indigo} />
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
    backgroundColor: Colors.accent.indigo + '20',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.indigo + '40',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.indigo,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  heroDesc: {
    fontSize: 16,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
  },
  cardEven: {
    backgroundColor: Colors.bg.elevated,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.text.muted,
    lineHeight: 20,
    marginBottom: 16,
  },
  benefits: {
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.muted,
  },
  cta: {
    marginHorizontal: 16,
    marginTop: 32,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  ctaIcon: {
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
