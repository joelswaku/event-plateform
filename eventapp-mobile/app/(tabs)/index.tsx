
/**
 * eventapp-mobile/app/(tabs)/index.tsx
 * ─────────────────────────────────────
 * UPDATED — multi-event home screen
 * • Featured: horizontal paging carousel (all events, swipeable)
 * • Pagination dots
 * • Recent: last 5 events as row cards
 * • Cover images always shown (fallback by event type)
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
  ActivityIndicator, Dimensions, Animated, NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAuthStore }         from '@/store/auth.store';
import { useEventStore }        from '@/store/event.store';
import { useDrawerStore }       from '@/store/drawer.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { useNotificationStore } from '@/store/notification.store';
import { Colors }               from '@/constants/colors';
import { Event }                from '@/types';

const { width: SW } = Dimensions.get('window');
const CARD_W        = SW - 40; // carousel card width
const CARD_H        = 230;

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
  return (key && EVENT_IMG[key]) ? EVENT_IMG[key] : DEFAULT_IMG;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return '—'; }
}

/* ─── Quick actions ────────────────────────────────────────────────── */
const QUICK = [
  { icon: 'plus-circle' as const, label: 'Create',  route: '/events/create',  grad: ['#4f46e5', '#6366f1'] as const },
  { icon: 'layout'      as const, label: 'Builder', route: '/(tabs)/builder', grad: ['#0891b2', '#06b6d4'] as const },
  { icon: 'camera'      as const, label: 'Scanner', route: '/(tabs)/scanner', grad: ['#059669', '#10b981'] as const },
  { icon: 'credit-card' as const, label: 'Tickets', route: '/my-tickets',     grad: ['#d97706', '#f59e0b'] as const },
];

/* ─── Stat tile ────────────────────────────────────────────────────── */
function StatTile({ value, label, icon, accent }: {
  value: number | string; label: string;
  icon: keyof typeof Feather.glyphMap; accent: string;
}) {
  return (
    <View style={[s.statTile, { borderColor: `${accent}22` }]}>
      <LinearGradient
        colors={[`${accent}18`, `${accent}06`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={[s.statIcon, { backgroundColor: `${accent}20` }]}>
        <Feather name={icon} size={14} color={accent} />
      </View>
      <Text style={[s.statValue, { color: accent }]}>{value}</Text>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

/* ─── Featured carousel card ───────────────────────────────────────── */
function FeaturedCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const cfg = Colors.status[event.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;
  return (
    <Pressable onPress={onPress} style={s.featuredCard}>
      <Image
        source={heroImg(event)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.90)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.2 }} end={{ x: 0, y: 1 }}
      />
      {/* Status pill */}
      <View style={s.featuredTop}>
        <View style={[s.livePill, { backgroundColor: cfg.bg }]}>
          <View style={[s.liveDot, { backgroundColor: cfg.dot }]} />
          <Text style={[s.liveTxt, { color: cfg.text }]}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </Text>
        </View>
        <View style={s.arrowBtn}>
          <Feather name="arrow-right" size={13} color="rgba(255,255,255,0.7)" />
        </View>
      </View>
      {/* Title + date */}
      <View style={s.featuredBottom}>
        <Text style={s.featuredTitle} numberOfLines={2}>{event.title}</Text>
        <View style={s.featuredMeta}>
          <Feather name="calendar" size={11} color="rgba(255,255,255,0.5)" />
          <Text style={s.featuredMetaTxt}>
            {fmtDate(event.starts_at_utc ?? event.starts_at)}
          </Text>
          {event.location ? (
            <>
              <Text style={s.metaDot}>·</Text>
              <Feather name="map-pin" size={11} color="rgba(255,255,255,0.5)" />
              <Text style={s.featuredMetaTxt} numberOfLines={1}>{event.location}</Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/* ─── Pagination dots ──────────────────────────────────────────────── */
function Dots({ count, active }: { count: number; active: number }) {
  if (count <= 1) return null;
  return (
    <View style={s.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === active
              ? { width: 18, backgroundColor: Colors.accent.indigo }
              : { width: 6,  backgroundColor: 'rgba(255,255,255,0.2)' },
          ]}
        />
      ))}
    </View>
  );
}

/* ─── Recent event row ─────────────────────────────────────────────── */
function RecentRow({ event, onPress }: { event: Event; onPress: () => void }) {
  const cfg = Colors.status[event.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;
  return (
    <Pressable onPress={onPress} style={s.recentCard}>
      {/* Thumb */}
      <View style={s.recentThumb}>
        <Image
          source={heroImg(event)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* Info */}
      <View style={s.recentInfo}>
        <Text style={s.recentTitle} numberOfLines={1}>{event.title}</Text>
        <View style={s.recentDateRow}>
          <Feather name="calendar" size={10} color={Colors.text.subtle} />
          <Text style={s.recentDate}>{fmtDate(event.starts_at_utc ?? event.starts_at)}</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
          <View style={[s.statusDot, { backgroundColor: cfg.dot }]} />
          <Text style={[s.statusTxt, { color: cfg.text }]}>
            {event.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.text.subtle} />
    </Pressable>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────── */
function EmptyEvents({ onPress }: { onPress: () => void }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <Feather name="calendar" size={28} color="#fff" />
      </View>
      <Text style={s.emptyTitle}>No events yet</Text>
      <Text style={s.emptySubtitle}>Create your first event and start selling tickets</Text>
      <Pressable onPress={onPress} style={s.emptyBtn}>
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <Feather name="plus" size={16} color="#fff" />
        <Text style={s.emptyBtnTxt}>Create your first event</Text>
      </Pressable>
    </View>
  );
}

/* ─── Main screen ──────────────────────────────────────────────────── */
export default function HomeScreen() {
  const router   = useRouter();
  const user     = useAuthStore(st => st.user);
  const { events, fetchEvents, loading } = useEventStore();
  const { isPremium, fetchSubscription } = useSubscriptionStore();
  const { unreadCount, fetch: fetchNotifs } = useNotificationStore();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;
  const quickAnim  = useRef(new Animated.Value(0)).current;
  const listAnim   = useRef(new Animated.Value(0)).current;

  // Carousel index
  const [activeIdx, setActiveIdx] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchEvents();
    fetchSubscription();
    fetchNotifs();
    const seq = (val: Animated.Value, delay: number) =>
      Animated.timing(val, { toValue: 1, duration: 420, delay, useNativeDriver: true });
    Animated.sequence([
      seq(headerAnim, 0),
      seq(statsAnim,  60),
      seq(quickAnim,  120),
      seq(listAnim,   180),
    ]).start();
  }, []);

  // Re-check subscription + notifications when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      fetchSubscription();
      fetchNotifs();
    }, [fetchSubscription, fetchNotifs])
  );

  const onRefresh = useCallback(() => {
    fetchEvents();
    fetchSubscription();
    fetchNotifs();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';
  const premiumStatus = isPremium();
  const published = events.filter(e => e.status === 'PUBLISHED').length;
  const drafts    = events.filter(e => e.status === 'DRAFT').length;
  const recent    = events.slice(0, 6);

  const initials = (user?.full_name ?? 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  });

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
    setActiveIdx(idx);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && events.length > 0}
            onRefresh={onRefresh}
            tintColor={Colors.accent.indigo}
          />
        }
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <Animated.View style={[s.header, animStyle(headerAnim)]}>
          <View style={s.headerLeft}>
            <LinearGradient
              colors={[Colors.accent.indigo, Colors.accent.violet]}
              style={s.logoMark}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Feather name="zap" size={14} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={s.greetingLine}>{greeting()}</Text>
              <Text style={s.nameLine}>{firstName} 👋</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Pressable style={s.headerBtn} onPress={() => router.push('/notifications' as never)}>
              <Feather name="bell" size={18} color={Colors.text.muted} />
              {unreadCount > 0 && (
                <View style={s.notifBadge}>
                  <Text style={s.notifBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
            <View style={s.avatar}>
              <LinearGradient
                colors={[Colors.accent.indigo, Colors.accent.violet]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <Text style={s.avatarTxt}>{initials}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats row ─────────────────────────────────────────── */}
        <Animated.View style={animStyle(statsAnim)}>
          <View style={s.statsRow}>
            <StatTile value={events.length} label="Total"     icon="layers"     accent={Colors.accent.indigo}  />
            <StatTile value={published}     label="Published" icon="globe"       accent={Colors.accent.emerald} />
            <StatTile value={drafts}        label="Drafts"    icon="edit-2"      accent={Colors.accent.amber}   />
            <StatTile value="$0"            label="Revenue"   icon="dollar-sign" accent={Colors.accent.violet}  />
          </View>
        </Animated.View>

        {/* ── Upgrade banner ────────────────────────────────────── */}
        {!premiumStatus && (
          <Animated.View style={[s.upgradeBanner, animStyle(statsAnim)]}>
            <LinearGradient
              colors={['rgba(245,158,11,0.12)', 'rgba(217,119,6,0.06)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <View style={s.upgradeLeft}>
              <Text style={s.upgradeEmoji}>⚡</Text>
              <View>
                <Text style={s.upgradeTitle}>Unlock Pro Features</Text>
                <Text style={s.upgradeSub}>Unlimited events, custom domains & more</Text>
              </View>
            </View>
            <Pressable style={s.upgradeCta} onPress={() => router.push('/billing' as never)}>
              <Text style={s.upgradeCtaTxt}>Upgrade</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Quick actions ─────────────────────────────────────── */}
        <Animated.View style={[s.section, animStyle(quickAnim)]}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickRow}>
            {QUICK.map(q => (
              <Pressable key={q.label} style={s.quickBtn} onPress={() => router.push(q.route as never)}>
                <LinearGradient colors={q.grad} style={s.quickGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Feather name={q.icon} size={22} color="#fff" />
                </LinearGradient>
                <Text style={s.quickLabel}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ── Featured Events (carousel) ─────────────────────────── */}
        <Animated.View style={[s.section, animStyle(listAnim)]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              {events.length > 1 ? 'Your Events' : 'Featured Event'}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/events' as never)}>
              <Text style={s.seeAll}>See all →</Text>
            </Pressable>
          </View>

          {loading && events.length === 0 ? (
            <ActivityIndicator color={Colors.accent.indigo} style={{ marginTop: 40 }} />
          ) : events.length === 0 ? (
            <EmptyEvents onPress={() => router.push('/events/create' as never)} />
          ) : (
            <>
              {/* Horizontal paging carousel */}
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled={false}
                snapToInterval={CARD_W + 12}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.carouselContent}
                onMomentumScrollEnd={onCarouselScroll}
              >
                {events.map(ev => (
                  <FeaturedCard
                    key={ev.id}
                    event={ev}
                    onPress={() => router.push(`/events/${ev.id}` as never)}
                  />
                ))}
              </ScrollView>

              {/* Pagination dots */}
              <Dots count={events.length} active={activeIdx} />
            </>
          )}
        </Animated.View>

        {/* ── Recent Events list ─────────────────────────────────── */}
        {recent.length > 0 && (
          <Animated.View style={[s.section, { paddingBottom: 130 }, animStyle(listAnim)]}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Events</Text>
              {events.length > 5 && (
                <Pressable onPress={() => router.push('/(tabs)/events' as never)}>
                  <Text style={s.seeAll}>See all →</Text>
                </Pressable>
              )}
            </View>
            <View style={s.recentList}>
              {recent.map(ev => (
                <RecentRow
                  key={ev.id}
                  event={ev}
                  onPress={() => router.push(`/events/${ev.id}` as never)}
                />
              ))}
            </View>
          </Animated.View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg.primary },
  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 8 },

  /* Header */
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark:     { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  greetingLine: { fontSize: 11, color: Colors.text.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  nameLine:     { fontSize: 18, color: '#fff', fontWeight: '900', letterSpacing: -0.4 },
  headerBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT, alignItems: 'center', justifyContent: 'center' },
  notifDot:     { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent.amber, borderWidth: 1.5, borderColor: Colors.bg.primary },
  notifBadge:   { position: 'absolute', top: 5, right: 5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.bg.primary },
  notifBadgeTxt:{ fontSize: 9, fontWeight: '800', color: '#fff', lineHeight: 11 },
  avatar:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTxt:    { fontSize: 13, fontWeight: '900', color: '#fff' },

  /* Stats */
  statsRow:  { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 6 },
  statTile:  { flex: 1, borderRadius: 18, borderWidth: 1, padding: 12, gap: 3, overflow: 'hidden', backgroundColor: Colors.bg.card },
  statIcon:  { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, color: Colors.text.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  /* Upgrade */
  upgradeBanner: { marginHorizontal: 20, marginTop: 14, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: `${Colors.accent.amber}30`, overflow: 'hidden' },
  upgradeLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  upgradeEmoji:  { fontSize: 22 },
  upgradeTitle:  { fontSize: 13, fontWeight: '800', color: '#fff' },
  upgradeSub:    { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  upgradeCta:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: `${Colors.accent.amber}25`, borderWidth: 1, borderColor: `${Colors.accent.amber}45` },
  upgradeCtaTxt: { fontSize: 12, fontWeight: '800', color: Colors.accent.amber },

  /* Sections */
  section:       { marginHorizontal: 20, marginTop: 24, gap: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:  { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  seeAll:        { fontSize: 13, color: Colors.accent.indigo, fontWeight: '700' },

  /* Quick actions */
  quickRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn:  { alignItems: 'center', gap: 8, flex: 1 },
  quickGrad: { width: (SW - 40 - 36) / 4, aspectRatio: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLabel:{ fontSize: 11, fontWeight: '800', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.3 },

  /* Carousel */
  carouselContent: { paddingRight: 20, gap: 12 },
  featuredCard:    { width: CARD_W, height: CARD_H, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.subtle },
  featuredTop:     { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  livePill:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  liveDot:         { width: 6, height: 6, borderRadius: 3 },
  liveTxt:         { fontSize: 11, fontWeight: '800' },
  arrowBtn:        { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  featuredBottom:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, gap: 6 },
  featuredTitle:   { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 26 },
  featuredMeta:    { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  featuredMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  metaDot:         { fontSize: 11, color: 'rgba(255,255,255,0.3)' },

  /* Dots */
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 4 },
  dot:     { height: 6, borderRadius: 3 },

  /* Recent list */
  recentList: { gap: 10 },
  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.border.subtle, overflow: 'hidden' },
  recentThumb:{ width: 72, height: 72, backgroundColor: Colors.bg.elevated },
  recentInfo: { flex: 1, padding: 12, gap: 4 },
  recentTitle:{ fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  recentDateRow:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentDate: { fontSize: 11, color: Colors.text.subtle, fontWeight: '600' },
  statusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, marginTop: 2 },
  statusDot:  { width: 5, height: 5, borderRadius: 3 },
  statusTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  /* Empty */
  empty:       { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIcon:   { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  emptyTitle:  { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  emptySubtitle:{ fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  emptyBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});







// /**
//  * eventapp-mobile/app/(tabs)/index.tsx
//  * ─────────────────────────────────────
//  * REDESIGNED — professional-grade home screen
//  * All data logic preserved. UI layer fully rebuilt.
//  */

// import React, { useEffect, useCallback, useRef, useState } from 'react';
// import {
//   View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
//   ActivityIndicator, Dimensions, Animated, FlatList,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { Feather } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Image } from 'expo-image';
// import { useAuthStore }   from '@/store/auth.store';
// import { useEventStore }  from '@/store/event.store';
// import { useDrawerStore } from '@/store/drawer.store';
// import { StatusBadge }    from '@/components/ui/Badge';
// import { Colors }         from '@/constants/colors';
// import { Event }          from '@/types';

// const { width: SW } = Dimensions.get('window');
// const CARD_W = SW - 48;

// /* ─── Fallback images per event type ──────────────────────────────── */
// const EVENT_IMG: Record<string, string> = {
//   wedding:         'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
//   conference:      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
//   birthday:        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80',
//   concert:         'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
//   festival:        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
//   corporate_event: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
//   networking:      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
//   charity:         'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
// };
// const DEFAULT_IMG = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';

// function heroImg(ev: Event | null): string {
//   if (!ev) return DEFAULT_IMG;
//   if (ev.cover_image_url) return ev.cover_image_url;
//   const key = ev.event_type?.toLowerCase();
//   return key && EVENT_IMG[key] ? EVENT_IMG[key] : DEFAULT_IMG;
// }

// function fmtDate(iso: string | null | undefined): string {
//   if (!iso) return '—';
//   try {
//     return new Date(iso).toLocaleDateString('en-US', {
//       weekday: 'short', month: 'short', day: 'numeric',
//     });
//   } catch { return '—'; }
// }

// /* ─── Quick actions config ─────────────────────────────────────────── */
// const QUICK = [
//   { icon: 'plus-circle' as const, label: 'Create',  route: '/events/create',  accent: Colors.accent.indigo, grad: ['#4f46e5', '#6366f1'] as const },
//   { icon: 'layout'      as const, label: 'Builder', route: '/(tabs)/builder', accent: Colors.accent.cyan,   grad: ['#0891b2', '#06b6d4'] as const },
//   { icon: 'camera'      as const, label: 'Scanner', route: '/(tabs)/scanner', accent: Colors.accent.emerald,grad: ['#059669', '#10b981'] as const },
//   { icon: 'credit-card' as const, label: 'Tickets', route: '/my-tickets',     accent: Colors.accent.amber,  grad: ['#d97706', '#f59e0b'] as const },
// ];

// // /* ─── Stat tile ────────────────────────────────────────────────────── */
// // function StatTile({ value, label, icon, accent }: {
// //   value: number | string; label: string;
// //   icon: keyof typeof Feather.glyphMap; accent: string;
// // }) {
// //   return (
// //     <View style={[styles.statTile, { borderColor: `${accent}22` }]}>
// //       <LinearGradient
// //         colors={[`${accent}18`, `${accent}06`]}
// //         style={StyleSheet.absoluteFill}
// //         start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
// //       />
// //       <View style={[styles.statIcon, { backgroundColor: `${accent}20` }]}>
// //         <Feather name={icon} size={14} color={accent} />
// //       </View>
// //       <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
// //       <Text style={styles.statLabel}>{label}</Text>
// //     </View>
// //   );
// // }

// // ─── UPDATED StatTile component ───────────────────────────────────
// function StatTile({
//   value, label, icon, accent,
// }: { value: string | number; label: string; icon: string; accent: string }) {
//   return (
//     <View style={[styles.statTile, { borderColor: `${accent}25` }]}>
//       <LinearGradient
//         colors={[`${accent}18`, `${accent}08`]}
//         style={StyleSheet.absoluteFill}
//         start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//       />
//       <View style={[styles.statIcon, { backgroundColor: `${accent}20` }]}>
//         <Feather name={icon as any} size={14} color={accent} />
//       </View>
//       <Text style={[styles.statValue, { color: accent }]} numberOfLines={1} adjustsFontSizeToFit>
//         {value}
//       </Text>
//       <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
//       {/* <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>{label}</Text> */}
//     </View>
//   );
// }

// /* ─── Featured event hero card ─────────────────────────────────────── */
// function FeaturedCard({ event, onPress }: { event: Event; onPress: () => void }) {
//   const statusCfg = Colors.status[event.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;

//   return (
//     <Pressable onPress={onPress} style={styles.featuredCard}>
//       <Image
//         source={heroImg(event)}
//         style={StyleSheet.absoluteFill}
//         contentFit="cover"
//         transition={300}
//       />
//       {/* Dark gradient overlay */}
//       <LinearGradient
//         colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
//         style={StyleSheet.absoluteFill}
//         start={{ x: 0, y: 0.2 }} end={{ x: 0, y: 1 }}
//       />
//       {/* Top row */}
//       <View style={styles.featuredTop}>
//         <View style={[styles.livePill, { backgroundColor: `${statusCfg.bg}` }]}>
//           <View style={[styles.liveDot, { backgroundColor: statusCfg.dot }]} />
//           <Text style={[styles.liveTxt, { color: statusCfg.text }]}>
//             {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
//           </Text>
//         </View>
//         <View style={styles.featuredTopRight}>
//           <Feather name="arrow-right" size={14} color="rgba(255,255,255,0.6)" />
//         </View>
//       </View>

//       {/* Bottom content */}
//       <View style={styles.featuredBottom}>
//         <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
//         <View style={styles.featuredMeta}>
//           <View style={styles.featuredMetaRow}>
//             <Feather name="calendar" size={11} color="rgba(255,255,255,0.55)" />
//             <Text style={styles.featuredMetaTxt}>
//               {fmtDate(event.starts_at_utc ?? event.starts_at)}
//             </Text>
//           </View>
//           {event.location && (
//             <View style={styles.featuredMetaRow}>
//               <Feather name="map-pin" size={11} color="rgba(255,255,255,0.55)" />
//               <Text style={styles.featuredMetaTxt} numberOfLines={1}>{event.location}</Text>
//             </View>
//           )}
//         </View>
//       </View>
//     </Pressable>
//   );
// }

// /* ─── Recent event row card ────────────────────────────────────────── */
// function RecentEventCard({ event, onPress }: { event: Event; onPress: () => void }) {
//   const statusCfg = Colors.status[event.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;

//   return (
//     <Pressable onPress={onPress} style={styles.recentCard}>
//       {/* Thumbnail */}
//       <View style={styles.recentThumb}>
//         <Image
//           source={heroImg(event)}
//           style={StyleSheet.absoluteFill}
//           contentFit="cover"
//           transition={200}
//         />
//         <LinearGradient
//           colors={['transparent', 'rgba(0,0,0,0.5)']}
//           style={StyleSheet.absoluteFill}
//         />
//       </View>

//       {/* Info */}
//       <View style={styles.recentInfo}>
//         <Text style={styles.recentTitle} numberOfLines={1}>{event.title}</Text>
//         <View style={styles.recentDateRow}>
//           <Feather name="calendar" size={10} color={Colors.text.subtle} />
//           <Text style={styles.recentDate}>
//             {fmtDate(event.starts_at_utc ?? event.starts_at)}
//           </Text>
//         </View>
//         <View style={[styles.recentStatusPill, { backgroundColor: statusCfg.bg }]}>
//           <Text style={[styles.recentStatusTxt, { color: statusCfg.text }]}>
//             {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
//           </Text>
//         </View>
//       </View>

//       {/* Arrow */}
//       <View style={styles.recentArrow}>
//         <Feather name="chevron-right" size={16} color={Colors.text.subtle} />
//       </View>
//     </Pressable>
//   );
// }

// /* ─── Empty state ──────────────────────────────────────────────────── */
// function EmptyEvents({ onPress }: { onPress: () => void }) {
//   return (
//     <View style={styles.emptyWrap}>
//       <LinearGradient
//         colors={[`${Colors.accent.indigo}18`, `${Colors.accent.violet}08`]}
//         style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
//       />
//       <View style={styles.emptyIconWrap}>
//         <LinearGradient
//           colors={[Colors.accent.indigo, Colors.accent.violet]}
//           style={StyleSheet.absoluteFill}
//           start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//         />
//         <Feather name="calendar" size={28} color="#fff" />
//       </View>
//       <Text style={styles.emptyTitle}>Your first event awaits</Text>
//       <Text style={styles.emptySub}>
//         Join thousands of organizers using EventApp to run seamless events — from gatherings to conferences.
//       </Text>
//       <Pressable onPress={onPress} style={styles.emptyBtn}>
//         <LinearGradient
//           colors={[Colors.accent.indigo, Colors.accent.violet]}
//           style={StyleSheet.absoluteFill}
//           start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//         />
//         <Feather name="plus" size={16} color="#fff" />
//         <Text style={styles.emptyBtnTxt}>Create your first event</Text>
//       </Pressable>
//       <View style={styles.emptyBadges}>
//         {['Free to start', 'QR Check-in', 'Ticketing'].map(b => (
//           <View key={b} style={styles.emptyBadge}>
//             <Feather name="check" size={10} color={Colors.accent.emerald} />
//             <Text style={styles.emptyBadgeTxt}>{b}</Text>
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// }

// /* ─── Main screen ──────────────────────────────────────────────────── */
// export default function HomeScreen() {
//   const router  = useRouter();
//   const user    = useAuthStore(s => s.user);
//   const { events, fetchEvents, loading } = useEventStore();

//   // Entrance animation values
//   const headerAnim = useRef(new Animated.Value(0)).current;
//   const statsAnim  = useRef(new Animated.Value(0)).current;
//   const quickAnim  = useRef(new Animated.Value(0)).current;
//   const listAnim   = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     fetchEvents();
//     const seq = (val: Animated.Value, delay: number) =>
//       Animated.timing(val, { toValue: 1, duration: 420, delay, useNativeDriver: true });

//     Animated.sequence([
//       seq(headerAnim, 0),
//       seq(statsAnim,  60),
//       seq(quickAnim,  120),
//       seq(listAnim,   180),
//     ]).start();
//   }, []);

//   const onRefresh = useCallback(() => fetchEvents(), []);

//   const greeting = () => {
//     const h = new Date().getHours();
//     if (h < 12) return 'Good morning';
//     if (h < 17) return 'Good afternoon';
//     return 'Good evening';
//   };

//   const firstName = user?.full_name?.split(' ')[0] ?? 'there';
//   const isPremium = user?.is_subscribed && user?.subscription_plan === 'premium';
//   const published = events.filter(e => e.status === 'PUBLISHED').length;
//   const drafts    = events.filter(e => e.status === 'DRAFT').length;
//   const recent    = events.slice(0, 5);
//   const featured  = events.find(e => e.status === 'PUBLISHED') ?? events[0] ?? null;

//   const initials = (user?.full_name ?? 'U')
//     .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

//   const animStyle = (anim: Animated.Value) => ({
//     opacity: anim,
//     transform: [{
//       translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }),
//     }],
//   });

//   return (
//     <SafeAreaView style={styles.safe} edges={['top']}>
//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={loading && events.length > 0}
//             onRefresh={onRefresh}
//             tintColor={Colors.accent.indigo}
//           />
//         }
//       >

//         {/* ── Header ────────────────────────────────────────────────── */}
//         <Animated.View style={[styles.header, animStyle(headerAnim)]}>
//           <View style={styles.headerLeft}>
//             <LinearGradient
//               colors={[Colors.accent.indigo, Colors.accent.violet]}
//               style={styles.logoMark}
//               start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//             >
//               <Feather name="zap" size={14} color="#fff" />
//             </LinearGradient>
//             <View>
//               <Text style={styles.greetingLine}>{greeting()}</Text>
//               <Text style={styles.nameLine}>{firstName} 👋</Text>
//             </View>
//           </View>

//           <View style={styles.headerRight}>
//             <Pressable style={styles.headerBtn}>
//               <Feather name="bell" size={18} color={Colors.text.muted} />
//               <View style={styles.notifDot} />
//             </Pressable>
//             <View style={styles.avatarCircle}>
//               <LinearGradient
//                 colors={[Colors.accent.indigo, Colors.accent.violet]}
//                 style={StyleSheet.absoluteFill}
//                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//               />
//               <Text style={styles.avatarTxt}>{initials}</Text>
//             </View>
//           </View>
//         </Animated.View>

//         {/* ── Stats row ─────────────────────────────────────────────── */}
//         {/* <Animated.View style={[animStyle(statsAnim)]}>
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.statsRow}
//           >
//             <StatTile value={events.length} label="Total"     icon="layers"    accent={Colors.accent.indigo}  />
//             <StatTile value={published}     label="Published" icon="globe"      accent={Colors.accent.emerald} />
//             <StatTile value={drafts}        label="Drafts"    icon="edit-2"     accent={Colors.accent.amber}   />
//             <StatTile value="$0"            label="Revenue"   icon="dollar-sign" accent={Colors.accent.violet} />
//           </ScrollView>
//         </Animated.View> */}
//         <Animated.View style={[animStyle(statsAnim)]}>
//   <View style={styles.statsRow}>
//     <StatTile value={events.length} label="Total"     icon="layers"     accent={Colors.accent.indigo}  />
//     <StatTile value={published}     label="Published" icon="globe"       accent={Colors.accent.emerald} />
//     <StatTile value={drafts}        label="Drafts"    icon="edit-2"      accent={Colors.accent.amber}   />
//     <StatTile value="$0"            label="Revenue"   icon="dollar-sign" accent={Colors.accent.violet}  />
//   </View>
// </Animated.View>

//         {/* ── Upgrade banner (free users only) ──────────────────────── */}
//         {!isPremium && (
//           <Animated.View style={[styles.upgradeBanner, animStyle(statsAnim)]}>
//             <LinearGradient
//               colors={['rgba(245,158,11,0.12)', 'rgba(217,119,6,0.06)']}
//               style={StyleSheet.absoluteFill}
//               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//             />
//             <View style={styles.upgradeLeft}>
//               <Text style={styles.upgradeEmoji}>⚡</Text>
//               <View>
//                 <Text style={styles.upgradeTitle}>Unlock Pro Features</Text>
//                 <Text style={styles.upgradeSub}>Unlimited events, custom domains & more</Text>
//               </View>
//             </View>
//             <Pressable style={styles.upgradeCta} onPress={() => router.push('/billing' as never)}>
//               <Text style={styles.upgradeCtaTxt}>Upgrade</Text>
//             </Pressable>
//           </Animated.View>
//         )}

//         {/* ── Quick actions ─────────────────────────────────────────── */}
//         <Animated.View style={[styles.section, animStyle(quickAnim)]}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Quick Actions</Text>
//           </View>
//           <View style={styles.quickRow}>
//             {QUICK.map(q => (
//               <Pressable
//                 key={q.label}
//                 style={styles.quickBtn}
//                 onPress={() => router.push(q.route as never)}
//               >
//                 <LinearGradient
//                   colors={q.grad}
//                   style={styles.quickGrad}
//                   start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//                 >
//                   <Feather name={q.icon} size={22} color="#fff" />
//                 </LinearGradient>
//                 <Text style={styles.quickLabel}>{q.label}</Text>
//               </Pressable>
//             ))}
//           </View>
//         </Animated.View>

//         {/* ── Featured event ─────────────────────────────────────────── */}
//         {featured && (
//           <Animated.View style={[styles.section, animStyle(listAnim)]}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Featured Event</Text>
//               <Pressable onPress={() => router.push('/(tabs)/events' as never)}>
//                 <Text style={styles.seeAll}>See all →</Text>
//               </Pressable>
//             </View>
//             <FeaturedCard
//               event={featured}
//               onPress={() => router.push(`/events/${featured.id}` as never)}
//             />
//           </Animated.View>
//         )}

//         {/* ── Recent events ─────────────────────────────────────────── */}
//         <Animated.View style={[styles.section, { paddingBottom: 130 }, animStyle(listAnim)]}>
//           <View style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Recent Events</Text>
//             {events.length > 0 && (
//               <Pressable onPress={() => router.push('/(tabs)/events' as never)}>
//                 <Text style={styles.seeAll}>See all →</Text>
//               </Pressable>
//             )}
//           </View>

//           {loading && events.length === 0 ? (
//             <ActivityIndicator color={Colors.accent.indigo} style={{ marginTop: 40 }} />
//           ) : events.length === 0 ? (
//             <EmptyEvents onPress={() => router.push('/events/create' as never)} />
//           ) : (
//             <View style={styles.recentList}>
//               {recent.map(ev => (
//                 <RecentEventCard
//                   key={ev.id}
//                   event={ev}
//                   onPress={() => router.push(`/events/${ev.id}` as never)}
//                 />
//               ))}
//             </View>
//           )}
//         </Animated.View>

//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// /* ─── Styles ───────────────────────────────────────────────────────── */
// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//     backgroundColor: Colors.bg.primary,
//   },
//   scroll: { flex: 1 },
//   scrollContent: { paddingTop: 8 },

//   /* Header */
//   header: {
//     flexDirection:  'row',
//     alignItems:     'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingVertical:   14,
//   },
//   headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
//   headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
//   logoMark: {
//     width: 38, height: 38, borderRadius: 12,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   greetingLine: {
//     fontSize: 11, color: Colors.text.muted,
//     fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6,
//   },
//   nameLine: {
//     fontSize: 18, color: '#fff', fontWeight: '900', letterSpacing: -0.4,
//   },
//   headerBtn: {
//     width: 38, height: 38, borderRadius: 12,
//     backgroundColor: Colors.bg.elevated,
//     borderWidth: 1, borderColor: Colors.border.DEFAULT,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   notifDot: {
//     position: 'absolute', top: 8, right: 8,
//     width: 7, height: 7, borderRadius: 4,
//     backgroundColor: Colors.accent.amber,
//     borderWidth: 1.5, borderColor: Colors.bg.primary,
//   },
//   avatarCircle: {
//     width: 38, height: 38, borderRadius: 19,
//     alignItems: 'center', justifyContent: 'center',
//     overflow: 'hidden',
//   },
//   avatarTxt: {
//     fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 0.5,
//   },

//   // /* Stats */
//   // statsRow: {
//   //   paddingHorizontal: 20, paddingVertical: 6, gap: 10, flexDirection: 'row',
//   // },
//   // statTile: {
//   //   width: 84, borderRadius: 18, borderWidth: 1,
//   //   padding: 14, gap: 3, overflow: 'hidden',
//   //   backgroundColor: Colors.bg.card,
//   // },
//   // statIcon: {
//   //   width: 28, height: 28, borderRadius: 9,
//   //   alignItems: 'center', justifyContent: 'center', marginBottom: 6,
//   // },
//   // statValue: {
//   //   fontSize: 22, fontWeight: '900', letterSpacing: -0.5,
//   // },
//   // statLabel: {
//   //   fontSize: 10, color: Colors.text.muted, fontWeight: '700',
//   //   textTransform: 'uppercase', letterSpacing: 0.4,
//   // },



//   // ─── UPDATED styles (replace statsRow + statTile) ───────────────

//   statsRow: {
//     paddingHorizontal: 20,
//     paddingVertical: 6,
//     gap: 10,
//     flexDirection: 'row',
//     // NO fixed width — let tiles size themselves
//   },
//   statTile: {
//     // flex: 1 so all 4 tiles share width equally — no overflow, no clipping
//     flex: 1,
//     minWidth: 72,          // prevents extreme squish on tiny screens
//     borderRadius: 18,
//     borderWidth: 1,
//     padding: 12,
//     gap: 3,
//     overflow: 'hidden',
//     backgroundColor: Colors.bg.card,
//   },
//   statIcon: {
//     width: 26,
//     height: 26,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 4,
//   },
//   statValue: {
//     fontSize: 20,
//     fontWeight: '900',
//     letterSpacing: -0.5,
//   },
//   statLabel: {
//     fontSize: 9,
//     color: Colors.text.muted,
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: 0.4,
//   },


//   /* Upgrade banner */
//   upgradeBanner: {
//     marginHorizontal: 20, marginTop: 14,
//     borderRadius: 16, padding: 14,
//     flexDirection: 'row', alignItems: 'center',
//     justifyContent: 'space-between',
//     borderWidth: 1, borderColor: `${Colors.accent.amber}30`,
//     overflow: 'hidden',
//   },
//   upgradeLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
//   upgradeEmoji: { fontSize: 22 },
//   upgradeTitle: { fontSize: 13, fontWeight: '800', color: '#fff' },
//   upgradeSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
//   upgradeCta: {
//     paddingHorizontal: 14, paddingVertical: 8,
//     borderRadius: 10, backgroundColor: `${Colors.accent.amber}25`,
//     borderWidth: 1, borderColor: `${Colors.accent.amber}45`,
//   },
//   upgradeCtaTxt: { fontSize: 12, fontWeight: '800', color: Colors.accent.amber },

//   /* Sections */
//   section: { marginHorizontal: 20, marginTop: 24, gap: 14 },
//   sectionHeader: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//   },
//   sectionTitle: {
//     fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.3,
//   },
//   seeAll: { fontSize: 13, color: Colors.accent.indigo, fontWeight: '700' },

//   /* Quick actions */
//   quickRow: {
//     flexDirection: 'row', justifyContent: 'space-between',
//   },
//   quickBtn: { alignItems: 'center', gap: 8, flex: 1 },
//   quickGrad: {
//     width: (SW - 40 - 36) / 4,
//     aspectRatio: 1,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   quickLabel: {
//     fontSize: 11, fontWeight: '800', color: Colors.text.muted,
//     textTransform: 'uppercase', letterSpacing: 0.3,
//   },

//   /* Featured card */
//   featuredCard: {
//     height: 220, borderRadius: 22, overflow: 'hidden',
//     backgroundColor: Colors.bg.card,
//     borderWidth: 1, borderColor: Colors.border.subtle,
//   },
//   featuredTop: {
//     position: 'absolute', top: 14, left: 14, right: 14,
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//   },
//   livePill: {
//     flexDirection: 'row', alignItems: 'center', gap: 5,
//     paddingHorizontal: 10, paddingVertical: 4,
//     borderRadius: 99,
//   },
//   liveDot:  { width: 6, height: 6, borderRadius: 3 },
//   liveTxt:  { fontSize: 11, fontWeight: '800' },
//   featuredTopRight: {
//     width: 28, height: 28, borderRadius: 14,
//     backgroundColor: 'rgba(0,0,0,0.35)',
//     alignItems: 'center', justifyContent: 'center',
//     borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
//   },
//   featuredBottom: {
//     position: 'absolute', bottom: 0, left: 0, right: 0,
//     padding: 18, gap: 8,
//   },
//   featuredTitle: {
//     fontSize: 20, fontWeight: '900', color: '#fff',
//     letterSpacing: -0.5, lineHeight: 26,
//   },
//   featuredMeta: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
//   featuredMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
//   featuredMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600', maxWidth: 140 },

//   /* Recent list */
//   recentList: { gap: 10 },
//   recentCard: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: Colors.bg.card,
//     borderRadius: 18, borderWidth: 1, borderColor: Colors.border.subtle,
//     overflow: 'hidden',
//   },
//   recentThumb: {
//     width: 72, height: 72, backgroundColor: Colors.bg.elevated,
//   },
//   recentInfo: {
//     flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 5,
//   },
//   recentTitle: {
//     fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2,
//   },
//   recentDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
//   recentDate:    { fontSize: 11, color: Colors.text.subtle, fontWeight: '600' },
//   recentStatusPill: {
//     alignSelf: 'flex-start',
//     paddingHorizontal: 8, paddingVertical: 2,
//     borderRadius: 99,
//   },
//   recentStatusTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
//   recentArrow: { paddingRight: 14 },

//   /* Empty state */
//   emptyWrap: {
//     alignItems: 'center', borderRadius: 24,
//     paddingVertical: 40, paddingHorizontal: 24,
//     gap: 12, overflow: 'hidden',
//     borderWidth: 1, borderColor: `${Colors.accent.indigo}20`,
//     backgroundColor: Colors.bg.card,
//   },
//   emptyIconWrap: {
//     width: 68, height: 68, borderRadius: 22, overflow: 'hidden',
//     alignItems: 'center', justifyContent: 'center', marginBottom: 4,
//   },
//   emptyTitle: {
//     fontSize: 20, fontWeight: '900', color: '#fff',
//     letterSpacing: -0.4, textAlign: 'center',
//   },
//   emptySub: {
//     fontSize: 13, color: Colors.text.muted, textAlign: 'center',
//     lineHeight: 20, maxWidth: 280,
//   },
//   emptyBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 8,
//     paddingHorizontal: 28, paddingVertical: 14,
//     borderRadius: 99, overflow: 'hidden', marginTop: 4,
//   },
//   emptyBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
//   emptyBadges: {
//     flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
//     marginTop: 4,
//   },
//   emptyBadge: {
//     flexDirection: 'row', alignItems: 'center', gap: 5,
//     paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99,
//     backgroundColor: `${Colors.accent.emerald}12`,
//     borderWidth: 1, borderColor: `${Colors.accent.emerald}25`,
//   },
//   emptyBadgeTxt: { fontSize: 11, fontWeight: '700', color: Colors.accent.emerald },
// });









