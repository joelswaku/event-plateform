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

const STATS = [
  { value: '12,000+', label: 'Events Created', icon: 'calendar' },
  { value: '500,000+', label: 'Happy Guests', icon: 'users' },
  { value: '4.9★', label: 'Average Rating', icon: 'star' },
  { value: '98%', label: 'Satisfaction Rate', icon: 'heart' },
];

const TIMELINE = [
  {
    year: '2023',
    title: 'The Beginning',
    desc: 'Founded with a mission to simplify event management for everyone.',
  },
  {
    year: '2024',
    title: 'Rapid Growth',
    desc: 'Reached 5,000 events and launched our mobile app for on-the-go management.',
  },
  {
    year: '2025',
    title: 'Going Global',
    desc: 'Expanded to 50+ countries with multi-language support and international payments.',
  },
  {
    year: '2026',
    title: 'Leading Innovation',
    desc: 'Serving 12,000+ events with advanced analytics and AI-powered features.',
  },
];

const VALUE_PROPS = [
  {
    icon: 'zap',
    title: 'Lightning Fast Setup',
    desc: 'Create and launch your event page in minutes, not hours. Our intuitive builder gets you up and running instantly.',
    accent: Colors.accent.amber,
  },
  {
    icon: 'shield',
    title: 'Enterprise-Grade Security',
    desc: 'Bank-level encryption and secure payment processing protect your data and your guests information.',
    accent: Colors.accent.emerald,
  },
  {
    icon: 'users',
    title: 'Exceptional Support',
    desc: 'Our dedicated support team is here to help you succeed, with priority response times and expert guidance.',
    accent: Colors.accent.indigo,
  },
  {
    icon: 'globe',
    title: 'Global Reach',
    desc: 'Multi-language support, international payment processing, and worldwide event hosting capabilities.',
    accent: Colors.accent.cyan,
  },
  {
    icon: 'clock',
    title: '24/7 Reliability',
    desc: '99.9% uptime guarantee ensures your event pages are always accessible when your guests need them.',
    accent: Colors.accent.violet,
  },
  {
    icon: 'award',
    title: 'Industry Leading',
    desc: 'Trusted by thousands of organizers worldwide, from small gatherings to large-scale conferences.',
    accent: Colors.accent.red,
  },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>About</Text>
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
            <Feather name="info" size={14} color={Colors.accent.indigo} />
            <Text style={[styles.badgeText, { color: Colors.accent.indigo }]}>About LiteEvent</Text>
          </View>
          <Text style={styles.heroTitle}>
            Making Event Management{'\n'}
            <Text style={{ color: Colors.accent.indigo }}>Simple & Powerful</Text>
          </Text>
          <Text style={styles.heroDesc}>
            We believe every event deserves professional tools that are easy to use. From intimate
            gatherings to large-scale conferences, LiteEvent empowers organizers to create
            unforgettable experiences.
          </Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {STATS.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statIcon}>
                <Feather name={stat.icon as any} size={20} color={Colors.accent.indigo} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <View style={styles.sectionIcon}>
            <Feather name="target" size={24} color={Colors.accent.indigo} />
          </View>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionDesc}>
            To democratize professional event management by providing powerful, intuitive tools that
            anyone can use. We are committed to helping organizers of all sizes create memorable
            experiences without the complexity and cost of traditional event platforms.
          </Text>

          <View style={styles.pillarsGrid}>
            <View style={styles.pillarCard}>
              <Feather name="heart" size={20} color={Colors.accent.red} />
              <Text style={styles.pillarTitle}>User First</Text>
              <Text style={styles.pillarDesc}>
                Every feature is designed with our users in mind, prioritizing simplicity and
                effectiveness.
              </Text>
            </View>
            <View style={styles.pillarCard}>
              <Feather name="trending-up" size={20} color={Colors.accent.emerald} />
              <Text style={styles.pillarTitle}>Continuous Innovation</Text>
              <Text style={styles.pillarDesc}>
                We constantly evolve our platform with new features and improvements based on user
                feedback.
              </Text>
            </View>
            <View style={styles.pillarCard}>
              <Feather name="shield" size={20} color={Colors.accent.cyan} />
              <Text style={styles.pillarTitle}>Trust & Security</Text>
              <Text style={styles.pillarDesc}>
                Your data and your guests' information are protected with enterprise-grade security.
              </Text>
            </View>
          </View>
        </View>

        {/* Our Story Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.sectionDesc}>
            From a simple idea to empowering thousands of event organizers worldwide
          </Text>

          <View style={styles.timeline}>
            {TIMELINE.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineYear}>
                  <Text style={styles.yearText}>{item.year}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Why Choose Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose LiteEvent</Text>
          <Text style={styles.sectionDesc}>
            The features and benefits that make us the preferred choice for event organizers
          </Text>

          <View style={styles.valuePropsGrid}>
            {VALUE_PROPS.map((prop, index) => (
              <View key={index} style={styles.valuePropCard}>
                <View style={[styles.valuePropIcon, { backgroundColor: prop.accent + '20' }]}>
                  <Feather name={prop.icon as any} size={22} color={prop.accent} />
                </View>
                <Text style={styles.valuePropTitle}>{prop.title}</Text>
                <Text style={styles.valuePropDesc}>{prop.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaTitle}>Ready to Create Your Event?</Text>
          <Text style={styles.ctaDesc}>
            Join thousands of organizers who trust LiteEvent to power their events. Start for free,
            no credit card required.
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
    backgroundColor: Colors.accent.indigo + '20',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.accent.indigo + '40',
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.accent.indigo + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent.indigo + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionDesc: {
    fontSize: 16,
    color: Colors.text.muted,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  pillarsGrid: {
    gap: 16,
  },
  pillarCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
  },
  pillarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  pillarDesc: {
    fontSize: 14,
    color: Colors.text.muted,
    lineHeight: 20,
  },
  timeline: {
    gap: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineYear: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  timelineDesc: {
    fontSize: 14,
    color: Colors.text.muted,
    lineHeight: 20,
  },
  valuePropsGrid: {
    gap: 16,
  },
  valuePropCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 20,
  },
  valuePropIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  valuePropTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  valuePropDesc: {
    fontSize: 14,
    color: Colors.text.muted,
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
