/**
 * eventapp-mobile/app/(tabs)/index.tsx
 * ─────────────────────────────────────
 * REDESIGNED — professional-grade home screen
 * All data logic preserved. UI layer fully rebuilt.
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
  ActivityIndicator, Dimensions, Animated, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuthStore }   from '@/store/auth.store';
import { useEventStore }  from '@/store/event.store';
import { useDrawerStore } from '@/store/drawer.store';
import { StatusBadge }    from '@/components/ui/Badge';
import { Colors }         from '@/constants/colors';
import { Event }          from '@/types';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 48;

/* ─── Fallback images per event type ──────────────────────────────── */
const EVENT_IMG: Record<string, string> = {
  wedding:         'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  conference:      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  birthday:        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80',
  concert:         'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
  festival:        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
  corporate_event: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  networking:      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
  charity:         'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';

function heroImg(ev: Event | null): string {
  if (!ev) return DEFAULT_IMG;
  if (ev.cover_image_url) return ev.cover_image_url;
  const key = ev.event_type?.toLowerCase();
  return key && EVENT_IMG[key] ? EVENT_IMG[key] : DEFAULT_IMG;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return '—'; }
}

/* ─── Quick actions config ─────────────────────────────────────────── */
const QUICK = [
  { icon: 'plus-circle' as const, label: 'Create',  route: '/events/create',  accent: Colors.accent.indigo, grad: ['#4f46e5', '#6366f1'] as const },
  { icon: 'layout'      as const, label: 'Builder', route: '/(tabs)/builder', accent: Colors.accent.cyan,   grad: ['#0891b2', '#06b6d4'] as const },
  { icon: 'camera'      as const, label: 'Scanner', route: '/(tabs)/scanner', accent: Colors.accent.emerald,grad: ['#059669', '#10b981'] as const },
  { icon: 'credit-card' as const, label: 'Tickets', route: '/my-tickets',     accent: Colors.accent.amber,  grad: ['#d97706', '#f59e0b'] as const },
];

/* ─── Stat tile ────────────────────────────────────────────────────── */
function StatTile({ value, label, icon, accent }: {
  value: number | string; label: string;
  icon: keyof typeof Feather.glyphMap; accent: string;
}) {
  return (
    <View style={[styles.statTile, { borderColor: `${accent}22` }]}>
      <LinearGradient
        colors={[`${accent}18`, `${accent}06`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={[styles.statIcon, { backgroundColor: `${accent}20` }]}>
        <Feather name={icon} size={14} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ─── Featured event hero card ─────────────────────────────────────── */
function FeaturedCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const statusCfg = Colors.status[event.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;

  return (
    <Pressable onPress={onPress} style={styles.featuredCard}>
      <Image
        source={heroImg(event)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.2 }} end={{ x: 0, y: 1 }}
      />
      {/* Top row */}
      <View style={styles.featuredTop}>
        <View style={[styles.livePill, { backgroundColor: `${statusCfg.bg}` }]}>
          <View style={[styles.liveDot, { backgroundColor: statusCfg.dot }]} />
          <Text style={[styles.liveTxt, { color: statusCfg.text }]}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </Text>
        </View>
        <View style={styles.featuredTopRight}>
          <Feather name="arrow-right" size={14} color="rgba(255,255,255,0.6)" />
        </View>
      </View>

      {/* Bottom content */}
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.featuredMeta}>
          <View style={styles.featuredMetaRow}>
            <Feather name="calendar" size={11} color="rgba(255,255,255,0.55)" />
            <Text style={styles.featuredMetaTxt}>
              {fmtDate(event.starts_at_utc ?? event.starts_at)}
            </Text>
          </View>
          {event.location && (
            <View style={styles.featuredMetaRow}>
              <Feather name="map-pin" size={11} color="rgba(255,255,255,0.55)" />
              <Text style={styles.featuredMetaTxt} numberOfLines={1}>{event.location}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Recent event row card ────────────────────────────────────────── */
function RecentEventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const statusCfg = Colors.status[event.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;

  return (
    <Pressable onPress={onPress} style={styles.recentCard}>
      {/* Thumbnail */}
      <View style={styles.recentThumb}>
        <Image
          source={heroImg(event)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Info */}
      <View style={styles.recentInfo}>
        <Text style={styles.recentTitle} numberOfLines={1}>{event.title}</Text>
        <View style={styles.recentDateRow}>
          <Feather name="calendar" size={10} color={Colors.text.subtle} />
          <Text style={styles.recentDate}>
            {fmtDate(event.starts_at_utc ?? event.starts_at)}
          </Text>
        </View>
        <View style={[styles.recentStatusPill, { backgroundColor: statusCfg.bg }]}>
          <Text style={[styles.recentStatusTxt, { color: statusCfg.text }]}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <View style={styles.recentArrow}>
        <Feather name="chevron-right" size={16} color={Colors.text.subtle} />
      </View>
    </Pressable>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────── */
function EmptyEvents({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={[`${Colors.accent.indigo}18`, `${Colors.accent.violet}08`]}
        style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
      />
      <View style={styles.emptyIconWrap}>
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <Feather name="calendar" size={28} color="#fff" />
      </View>
      <Text style={styles.emptyTitle}>Your first event awaits</Text>
      <Text style={styles.emptySub}>
        Join thousands of organizers using EventApp to run seamless events — from gatherings to conferences.
      </Text>
      <Pressable onPress={onPress} style={styles.emptyBtn}>
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <Feather name="plus" size={16} color="#fff" />
        <Text style={styles.emptyBtnTxt}>Create your first event</Text>
      </Pressable>
      <View style={styles.emptyBadges}>
        {['Free to start', 'QR Check-in', 'Ticketing'].map(b => (
          <View key={b} style={styles.emptyBadge}>
            <Feather name="check" size={10} color={Colors.accent.emerald} />
            <Text style={styles.emptyBadgeTxt}>{b}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ─── Main screen ──────────────────────────────────────────────────── */
export default function HomeScreen() {
  const router  = useRouter();
  const user    = useAuthStore(s => s.user);
  const { events, fetchEvents, loading } = useEventStore();

  // Entrance animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;
  const quickAnim  = useRef(new Animated.Value(0)).current;
  const listAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchEvents();
    const seq = (val: Animated.Value, delay: number) =>
      Animated.timing(val, { toValue: 1, duration: 420, delay, useNativeDriver: true });

    Animated.sequence([
      seq(headerAnim, 0),
      seq(statsAnim,  60),
      seq(quickAnim,  120),
      seq(listAnim,   180),
    ]).start();
  }, []);

  const onRefresh = useCallback(() => fetchEvents(), []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const isPremium = user?.is_subscribed && user?.subscription_plan === 'premium';
  const published = events.filter(e => e.status === 'PUBLISHED').length;
  const drafts    = events.filter(e => e.status === 'DRAFT').length;
  const recent    = events.slice(0, 5);
  const featured  = events.find(e => e.status === 'PUBLISHED') ?? events[0] ?? null;

  const initials = (user?.full_name ?? 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
    }],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && events.length > 0}
            onRefresh={onRefresh}
            tintColor={Colors.accent.indigo}
          />
        }
      >

        {/* ── Header ────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, animStyle(headerAnim)]}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[Colors.accent.indigo, Colors.accent.violet]}
              style={styles.logoMark}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Feather name="zap" size={14} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.greetingLine}>{greeting()}</Text>
              <Text style={styles.nameLine}>{firstName} 👋</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.headerBtn}>
              <Feather name="bell" size={18} color={Colors.text.muted} />
              <View style={styles.notifDot} />
            </Pressable>
            <View style={styles.avatarCircle}>
              <LinearGradient
                colors={[Colors.accent.indigo, Colors.accent.violet]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Text style={styles.avatarTxt}>{initials}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <Animated.View style={[animStyle(statsAnim)]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsRow}
          >
            <StatTile value={events.length} label="Total"     icon="layers"    accent={Colors.accent.indigo}  />
            <StatTile value={published}     label="Published" icon="globe"      accent={Colors.accent.emerald} />
            <StatTile value={drafts}        label="Drafts"    icon="edit-2"     accent={Colors.accent.amber}   />
            <StatTile value="$0"            label="Revenue"   icon="dollar-sign" accent={Colors.accent.violet} />
          </ScrollView>
        </Animated.View>

        {/* ── Upgrade banner (free users only) ──────────────────────── */}
        {!isPremium && (
          <Animated.View style={[styles.upgradeBanner, animStyle(statsAnim)]}>
            <LinearGradient
              colors={['rgba(245,158,11,0.12)', 'rgba(217,119,6,0.06)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <View style={styles.upgradeLeft}>
              <Text style={styles.upgradeEmoji}>⚡</Text>
              <View>
                <Text style={styles.upgradeTitle}>Unlock Pro Features</Text>
                <Text style={styles.upgradeSub}>Unlimited events, custom domains & more</Text>
              </View>
            </View>
            <Pressable style={styles.upgradeCta} onPress={() => router.push('/billing' as never)}>
              <Text style={styles.upgradeCtaTxt}>Upgrade</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Quick actions ─────────────────────────────────────────── */}
        <Animated.View style={[styles.section, animStyle(quickAnim)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickRow}>
            {QUICK.map(q => (
              <Pressable
                key={q.label}
                style={styles.quickBtn}
                onPress={() => router.push(q.route as never)}
              >
                <LinearGradient
                  colors={q.grad}
                  style={styles.quickGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Feather name={q.icon} size={22} color="#fff" />
                </LinearGradient>
                <Text style={styles.quickLabel}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ── Featured event ─────────────────────────────────────────── */}
        {featured && (
          <Animated.View style={[styles.section, animStyle(listAnim)]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Event</Text>
              <Pressable onPress={() => router.push('/(tabs)/events' as never)}>
                <Text style={styles.seeAll}>See all →</Text>
              </Pressable>
            </View>
            <FeaturedCard
              event={featured}
              onPress={() => router.push(`/events/${featured.id}` as never)}
            />
          </Animated.View>
        )}

        {/* ── Recent events ─────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { paddingBottom: 110 }, animStyle(listAnim)]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Events</Text>
            {events.length > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/events' as never)}>
                <Text style={styles.seeAll}>See all →</Text>
              </Pressable>
            )}
          </View>

          {loading && events.length === 0 ? (
            <ActivityIndicator color={Colors.accent.indigo} style={{ marginTop: 40 }} />
          ) : events.length === 0 ? (
            <EmptyEvents onPress={() => router.push('/events/create' as never)} />
          ) : (
            <View style={styles.recentList}>
              {recent.map(ev => (
                <RecentEventCard
                  key={ev.id}
                  event={ev}
                  onPress={() => router.push(`/events/${ev.id}` as never)}
                />
              ))}
            </View>
          )}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },

  /* Header */
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  greetingLine: {
    fontSize: 11, color: Colors.text.muted,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6,
  },
  nameLine: {
    fontSize: 18, color: '#fff', fontWeight: '900', letterSpacing: -0.4,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.accent.amber,
    borderWidth: 1.5, borderColor: Colors.bg.primary,
  },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarTxt: {
    fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 0.5,
  },

  /* Stats */
  statsRow: {
    paddingHorizontal: 20, paddingVertical: 6, gap: 10, flexDirection: 'row',
  },
  statTile: {
    width: 84, borderRadius: 18, borderWidth: 1,
    padding: 14, gap: 3, overflow: 'hidden',
    backgroundColor: Colors.bg.card,
  },
  statIcon: {
    width: 28, height: 28, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  statValue: {
    fontSize: 22, fontWeight: '900', letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10, color: Colors.text.muted, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },

  /* Upgrade banner */
  upgradeBanner: {
    marginHorizontal: 20, marginTop: 14,
    borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1, borderColor: `${Colors.accent.amber}30`,
    overflow: 'hidden',
  },
  upgradeLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  upgradeEmoji: { fontSize: 22 },
  upgradeTitle: { fontSize: 13, fontWeight: '800', color: '#fff' },
  upgradeSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  upgradeCta: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, backgroundColor: `${Colors.accent.amber}25`,
    borderWidth: 1, borderColor: `${Colors.accent.amber}45`,
  },
  upgradeCtaTxt: { fontSize: 12, fontWeight: '800', color: Colors.accent.amber },

  /* Sections */
  section: { marginHorizontal: 20, marginTop: 24, gap: 14 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.3,
  },
  seeAll: { fontSize: 13, color: Colors.accent.indigo, fontWeight: '700' },

  /* Quick actions */
  quickRow: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  quickBtn: { alignItems: 'center', gap: 8, flex: 1 },
  quickGrad: {
    width: (SW - 40 - 36) / 4,
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },

  /* Featured card */
  featuredCard: {
    height: 220, borderRadius: 22, overflow: 'hidden',
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  featuredTop: {
    position: 'absolute', top: 14, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3 },
  liveTxt:  { fontSize: 11, fontWeight: '800' },
  featuredTopRight: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  featuredBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 18, gap: 8,
  },
  featuredTitle: {
    fontSize: 20, fontWeight: '900', color: '#fff',
    letterSpacing: -0.5, lineHeight: 26,
  },
  featuredMeta: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  featuredMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  featuredMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', maxWidth: 140 },

  /* Recent list */
  recentList: { gap: 10 },
  recentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  recentThumb: {
    width: 72, height: 72, backgroundColor: Colors.bg.elevated,
  },
  recentInfo: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 5,
  },
  recentTitle: {
    fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2,
  },
  recentDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recentDate:    { fontSize: 11, color: Colors.text.subtle, fontWeight: '600' },
  recentStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 99,
  },
  recentStatusTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  recentArrow: { paddingRight: 14 },

  /* Empty state */
  emptyWrap: {
    alignItems: 'center', borderRadius: 24,
    paddingVertical: 40, paddingHorizontal: 24,
    gap: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: `${Colors.accent.indigo}20`,
    backgroundColor: Colors.bg.card,
  },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 22, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '900', color: '#fff',
    letterSpacing: -0.4, textAlign: 'center',
  },
  emptySub: {
    fontSize: 13, color: Colors.text.muted, textAlign: 'center',
    lineHeight: 20, maxWidth: 280,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 99, overflow: 'hidden', marginTop: 4,
  },
  emptyBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  emptyBadges: {
    flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
    marginTop: 4,
  },
  emptyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
    backgroundColor: `${Colors.accent.emerald}12`,
    borderWidth: 1, borderColor: `${Colors.accent.emerald}25`,
  },
  emptyBadgeTxt: { fontSize: 11, fontWeight: '700', color: Colors.accent.emerald },
});









