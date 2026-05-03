import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
  ActivityIndicator, Dimensions, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore }   from '@/store/auth.store';
import { useEventStore }  from '@/store/event.store';
import { useDrawerStore } from '@/store/drawer.store';
import { EventCard }      from '@/components/events/EventCard';
import { Colors }         from '@/constants/colors';
import { Event }          from '@/types';

const { width: SW } = Dimensions.get('window');

/* ─── Fallback images per event type ───────────────────────────────────────── */
const EVENT_IMG: Record<string, string> = {
  wedding:         'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  engagement:      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
  anniversary:     'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
  birthday:        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80',
  graduation:      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  baby_shower:     'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
  conference:      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  corporate_event: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  seminar:         'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
  workshop:        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  networking:      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
  concert:         'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
  festival:        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
  nightclub:       'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
  church:          'https://images.unsplash.com/photo-1608501078713-8e445a709b39?w=800&q=80',
  charity:         'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: Colors.accent.emerald,
  DRAFT:     Colors.accent.amber,
  CANCELLED: '#ef4444',
  ARCHIVED:  Colors.text.subtle,
};

/* ─── Quick actions ────────────────────────────────────────────────────────── */
const QUICK = [
  { icon: 'plus-circle' as const, label: 'Create Event', route: '/events/create',     accent: Colors.accent.indigo  },
  { icon: 'layout'      as const, label: 'Builder',      route: '/(tabs)/builder',    accent: Colors.accent.cyan    },
  { icon: 'camera'      as const, label: 'Scan QR',      route: '/(tabs)/scanner',    accent: Colors.accent.emerald },
  { icon: 'credit-card' as const, label: 'My Tickets',   route: '/my-tickets',        accent: Colors.accent.amber   },
];

function heroImg(ev: Event | null): string {
  if (!ev) return DEFAULT_IMG;
  if (ev.cover_image_url) return ev.cover_image_url;
  const key = ev.event_type?.toLowerCase();
  return (key && EVENT_IMG[key]) ? EVENT_IMG[key] : DEFAULT_IMG;
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return null; }
}

export default function HomeScreen() {
  const router     = useRouter();
  const openDrawer = useDrawerStore(s => s.open);
  const user       = useAuthStore(s => s.user);
  const { events, fetchEvents, loading } = useEventStore();

  const [activeIdx, setActiveIdx] = useState(0);

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    fetchEvents();
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // Reset index when events list refreshes
  useEffect(() => {
    setActiveIdx(i => Math.min(i, Math.max(0, events.length - 1)));
  }, [events.length]);

  const onRefresh = useCallback(() => fetchEvents(), []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const isPremium = user?.is_subscribed && user?.subscription_plan === 'premium';
  const recent    = events.slice(0, 3);
  const published = events.filter(e => e.status === 'PUBLISHED').length;
  const drafts    = events.filter(e => e.status === 'DRAFT').length;

  const activeEvent  = events.length > 0 ? events[activeIdx] : null;
  const bg           = heroImg(activeEvent);
  const statusColor  = activeEvent ? (STATUS_COLOR[activeEvent.status] ?? Colors.text.subtle) : Colors.accent.indigo;
  const dateStr      = fmtDate(activeEvent?.starts_at_local ?? null);

  const prevEvent = () => setActiveIdx(i => Math.max(0, i - 1));
  const nextEvent = () => setActiveIdx(i => Math.min(events.length - 1, i + 1));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={Colors.accent.indigo} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable style={styles.menuBtn} onPress={openDrawer} hitSlop={10}>
            <Feather name="menu" size={22} color="#fff" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.appName}>EventApp</Text>
          </View>
          <Pressable style={styles.notifBtn} onPress={() => router.push('/(tabs)/profile' as never)} hitSlop={10}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>{(user?.full_name ?? 'U')[0].toUpperCase()}</Text>
            </View>
          </Pressable>
        </View>

        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

          {/* ── Hero Event Banner ────────────────────────────────────── */}
          <View style={styles.heroBanner}>
            {/* Background image */}
            <Image source={{ uri: bg }} style={[StyleSheet.absoluteFill, styles.heroBg]} resizeMode="cover" />

            {/* Bottom-up overlay for text readability */}
            <LinearGradient
              colors={['rgba(4,4,12,0.18)', 'rgba(4,4,12,0.55)', 'rgba(4,4,12,0.88)']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.heroContent}>
              {/* Greeting */}
              <Text style={styles.heroGreeting}>{greeting()}, {firstName} 👋</Text>

              {/* No events state */}
              {events.length === 0 ? (
                <View style={{ gap: 6 }}>
                  <Text style={styles.heroTitle}>Design stunning{'\n'}event pages</Text>
                  <Text style={styles.heroSub}>Create your first event to get started</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {/* Status pill */}
                  <View style={[styles.statusPill, { borderColor: statusColor + '60', backgroundColor: statusColor + '18' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusLabel, { color: statusColor }]}>{activeEvent!.status}</Text>
                  </View>
                  {/* Event title */}
                  <Text style={styles.heroTitle} numberOfLines={2}>{activeEvent!.title}</Text>
                  {dateStr && (
                    <View style={styles.heroDateRow}>
                      <Feather name="calendar" size={11} color="rgba(255,255,255,0.55)" />
                      <Text style={styles.heroDate}>{dateStr}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Footer: browse templates + event toggle */}
              <View style={styles.heroFooter}>
                <Pressable
                  style={styles.browseBtn}
                  onPress={() => router.push('/(tabs)/builder' as never)}
                >
                  <Feather name="layout" size={12} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.browseBtnText}>Browse all templates</Text>
                  <Feather name="arrow-right" size={12} color="rgba(255,255,255,0.8)" />
                </Pressable>

                {events.length > 1 && (
                  <View style={styles.eventToggle}>
                    <Pressable
                      onPress={prevEvent}
                      style={[styles.toggleBtn, activeIdx === 0 && { opacity: 0.35 }]}
                      disabled={activeIdx === 0}
                    >
                      <Feather name="chevron-left" size={15} color="#fff" />
                    </Pressable>
                    <Text style={styles.toggleCount}>{activeIdx + 1}/{events.length}</Text>
                    <Pressable
                      onPress={nextEvent}
                      style={[styles.toggleBtn, activeIdx === events.length - 1 && { opacity: 0.35 }]}
                      disabled={activeIdx === events.length - 1}
                    >
                      <Feather name="chevron-right" size={15} color="#fff" />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Upgrade banner (free users) ─────────────────────────── */}
          {!isPremium && (
            <Pressable style={styles.upgradeBanner} onPress={() => router.push('/profile/upgrade' as never)}>
              <LinearGradient
                colors={[`${Colors.accent.amber}20`, `${Colors.accent.violet}15`]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <View style={styles.upgradeBannerLeft}>
                <Text style={styles.upgradeBannerIcon}>✨</Text>
                <View>
                  <Text style={styles.upgradeBannerTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeBannerSub}>Unlimited events · All templates · Priority support</Text>
                </View>
              </View>
              <View style={styles.upgradeBannerCta}>
                <Text style={styles.upgradeBannerCtaText}>Go Pro</Text>
              </View>
            </Pressable>
          )}

          {/* ── Stats row ───────────────────────────────────────────── */}
          <View style={styles.statsGrid}>
            <StatTile value={events.length} label="Total Events"  icon="calendar"     accent={Colors.accent.indigo}  />
            <StatTile value={published}     label="Published"     icon="globe"        accent={Colors.accent.emerald} />
            <StatTile value={drafts}        label="Drafts"        icon="edit-2"       accent={Colors.accent.amber}   />
            <StatTile value={0}             label="Check-ins"     icon="check-circle" accent={Colors.accent.violet}  />
          </View>

          {/* ── Quick actions ───────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {QUICK.map(q => (
                <Pressable
                  key={q.label}
                  style={[styles.quickCard, { borderColor: `${q.accent}20`, backgroundColor: `${q.accent}08` }]}
                  onPress={() => router.push(q.route as never)}
                >
                  <View style={[styles.quickIcon, { backgroundColor: `${q.accent}20` }]}>
                    <Feather name={q.icon} size={19} color={q.accent} />
                  </View>
                  <Text style={[styles.quickLabel, { color: q.accent }]}>{q.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── Recent Events ───────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Events</Text>
              <Pressable onPress={() => router.push('/(tabs)/events' as never)}>
                <Text style={styles.seeAll}>See all →</Text>
              </Pressable>
            </View>

            {loading && events.length === 0 ? (
              <ActivityIndicator color={Colors.accent.indigo} style={{ marginTop: 32 }} />
            ) : recent.length === 0 ? (
              <EmptyState onPress={() => router.push('/events/create' as never)} />
            ) : (
              recent.map(ev => (
                <EventCard key={ev.id} event={ev} onRefresh={fetchEvents} />
              ))
            )}
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Stat tile ───────────────────────────────────────────────────────────── */
function StatTile({ value, label, icon, accent }: {
  value: number; label: string; icon: keyof typeof Feather.glyphMap; accent: string;
}) {
  return (
    <View style={[statStyles.tile, { borderColor: `${accent}18` }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: `${accent}15` }]}>
        <Feather name={icon} size={14} color={accent} />
      </View>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  tile: {
    flex: 1, alignItems: 'center', gap: 5,
    paddingVertical: 14, paddingHorizontal: 6,
    borderRadius: 16, borderWidth: 1,
    backgroundColor: Colors.bg.card,
  },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  label:    { fontSize: 9, color: Colors.text.subtle, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
});

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ onPress }: { onPress: () => void }) {
  return (
    <View style={emptyStyles.wrap}>
      <LinearGradient colors={[`${Colors.accent.indigo}12`, 'transparent']} style={emptyStyles.glow} />
      <View style={emptyStyles.iconWrap}>
        <Feather name="calendar" size={36} color={Colors.accent.indigo} />
      </View>
      <Text style={emptyStyles.title}>Your first event awaits</Text>
      <Text style={emptyStyles.sub}>
        Join thousands of organizers using EventApp to run{'\n'}
        seamless events — from intimate gatherings to conferences.
      </Text>
      <Pressable style={emptyStyles.cta} onPress={onPress}>
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
        />
        <Feather name="plus" size={16} color="#fff" />
        <Text style={emptyStyles.ctaText}>Create your first event</Text>
      </Pressable>
      <View style={emptyStyles.featureRow}>
        {['Free to start', 'QR Check-in', 'Ticketing'].map(f => (
          <View key={f} style={emptyStyles.featureChip}>
            <Feather name="check" size={10} color={Colors.accent.emerald} />
            <Text style={emptyStyles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const emptyStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center', gap: 12,
    paddingVertical: 40, paddingHorizontal: 16,
    borderRadius: 20, marginTop: 4,
    borderWidth: 1, borderColor: Colors.border.subtle,
    backgroundColor: Colors.bg.card, overflow: 'hidden',
  },
  glow:    { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  iconWrap:{
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: `${Colors.accent.indigo}15`,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}25`,
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  sub:      { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
  cta: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, overflow: 'hidden', marginTop: 4,
  },
  ctaText:    { fontSize: 15, fontWeight: '800', color: '#fff' },
  featureRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  featureChip:{
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 99, borderWidth: 1, borderColor: `${Colors.accent.emerald}25`,
    backgroundColor: `${Colors.accent.emerald}08`,
  },
  featureText:{ fontSize: 10, color: Colors.accent.emerald, fontWeight: '700' },
});

/* ─── Main styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  scroll:  { flex: 1 },
  content: { paddingBottom: 110 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    justifyContent: 'space-between',
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter:    { flex: 1, alignItems: 'center' },
  appName:         { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  notifBtn:        { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  avatarSmall: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: `${Colors.accent.indigo}25`,
    borderWidth: 1.5, borderColor: `${Colors.accent.indigo}50`,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 14, fontWeight: '900', color: Colors.accent.indigo },

  // Hero banner
  heroBanner: {
    marginHorizontal: 16, marginTop: 4,
    height: 240, borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'flex-end',
  },
  heroBg: { borderRadius: 24 },
  heroContent: {
    padding: 20, gap: 10,
  },
  heroGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  heroTitle: {
    fontSize: 24, fontWeight: '900', color: '#fff',
    letterSpacing: -0.6, lineHeight: 30,
  },
  heroSub:  { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 18 },
  heroDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroDate:    { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },

  // Status pill
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1,
  },
  statusDot:   { width: 5, height: 5, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },

  // Hero footer
  heroFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 4,
  },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  browseBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },

  // Event toggle
  eventToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 99, paddingHorizontal: 4, paddingVertical: 2,
  },
  toggleBtn:   { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  toggleCount: { fontSize: 11, color: '#fff', fontWeight: '800', minWidth: 32, textAlign: 'center' },

  // Upgrade banner
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: `${Colors.accent.amber}25`,
  },
  upgradeBannerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  upgradeBannerIcon:    { fontSize: 24 },
  upgradeBannerTitle:   { fontSize: 13, fontWeight: '800', color: '#fff' },
  upgradeBannerSub:     { fontSize: 10, color: Colors.text.muted, marginTop: 1 },
  upgradeBannerCta: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 99, backgroundColor: `${Colors.accent.amber}22`,
    borderWidth: 1, borderColor: `${Colors.accent.amber}40`,
  },
  upgradeBannerCtaText: { fontSize: 12, fontWeight: '800', color: Colors.accent.amber },

  // Stats
  statsGrid: {
    flexDirection: 'row', gap: 8,
    marginHorizontal: 16, marginTop: 14,
  },

  // Sections
  section:       { marginHorizontal: 16, marginTop: 20, gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.2 },
  seeAll:        { fontSize: 12, color: Colors.accent.indigo, fontWeight: '700' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: (SW - 32 - 10) / 2,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 1,
  },
  quickIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '800', flex: 1 },
});
