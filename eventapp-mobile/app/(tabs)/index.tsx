
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
  NativeScrollEvent, Modal,
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
import { notify, toast } from '@/lib/toast';



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


/* ─── Switch Event Confirm Modal ──────────────────────────────────── */
function SwitchEventModal({
  event,
  onConfirm,
  onCancel,
}: {
  event: Event | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={!!event}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={sw.overlay}>
        <View style={sw.sheet}>
          {/* Icon bubble */}
          <View style={sw.iconBubble}>
            <Feather name="zap" size={22} color={Colors.accent.indigo} />
          </View>

          {/* Heading */}
          <Text style={sw.title}>Switch Active Event?</Text>

          {/* Event name */}
          <View style={sw.eventNameRow}>
            <Feather name="calendar" size={13} color={Colors.text.muted} />
            <Text style={sw.eventName} numberOfLines={2}>{event?.title}</Text>
          </View>

          {/* Body */}
          <Text style={sw.body}>
            The scanner, builder, and guest tools will switch to this event.
            Any in-progress actions on the current event will not be affected.
          </Text>

          {/* Buttons */}
          <Pressable style={sw.confirmBtn} onPress={onConfirm}>
            <LinearGradient
              colors={[Colors.accent.indigo, '#818cf8']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Feather name="check-circle" size={15} color="#fff" />
            <Text style={sw.confirmTxt}>Yes, Switch Event</Text>
          </Pressable>

          <Pressable style={sw.cancelBtn} onPress={onCancel}>
            <Text style={sw.cancelTxt}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const sw = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         24,
  },
  sheet: {
    width:           '100%',
    backgroundColor: Colors.bg.card,
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         24,
    alignItems:      'center',
    gap:             12,
  },
  iconBubble: {
    width:           56,
    height:          56,
    borderRadius:    16,
    backgroundColor: `${Colors.accent.indigo}18`,
    borderWidth:     1,
    borderColor:     `${Colors.accent.indigo}30`,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  title: {
    fontSize:      20,
    fontWeight:    '800',
    color:         Colors.text.primary,
    letterSpacing: -0.4,
    textAlign:     'center',
  },
  eventNameRow: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              7,
    backgroundColor:  Colors.bg.elevated,
    borderRadius:     10,
    borderWidth:      1,
    borderColor:      Colors.border.subtle,
    paddingHorizontal:12,
    paddingVertical:  9,
    alignSelf:        'stretch',
  },
  eventName: {
    flex:       1,
    fontSize:   13,
    fontWeight: '700',
    color:      Colors.text.secondary,
  },
  body: {
    fontSize:   13,
    fontWeight: '500',
    color:      Colors.text.muted,
    textAlign:  'center',
    lineHeight: 19,
  },
  confirmBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              8,
    borderRadius:     14,
    overflow:         'hidden',
    paddingVertical:  15,
    alignSelf:        'stretch',
    marginTop:        4,
  },
  confirmTxt: {
    fontSize:   15,
    fontWeight: '800',
    color:      '#fff',
    letterSpacing: -0.2,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignSelf:       'stretch',
    alignItems:      'center',
  },
  cancelTxt: {
    fontSize:   14,
    fontWeight: '600',
    color:      Colors.text.muted,
  },
});

/* ─── Upgrade Plan Modal ───────────────────────────────────────────
   Compact bottom-sheet shown when tapping the upgrade banner.
   Free users see Starter + Pro tiles side by side.
   Starter users see only the Pro tile.
─────────────────────────────────────────────────────────────────── */
const PLAN_TILES = {
  starter: {
    label:    'Starter',
    price:    '$19',
    gradFrom: '#4f46e5',
    gradTo:   '#818cf8',
    shadow:   'rgba(99,102,241,0.40)',
    ctaColor: '#fff',
    perks:    ['5 events', '500 guests / event', 'All themes', 'Ticket selling'],
  },
  pro: {
    label:    'Pro',
    price:    '$49',
    gradFrom: '#c9a96e',
    gradTo:   '#f59e0b',
    shadow:   'rgba(201,169,110,0.40)',
    ctaColor: '#000',
    perks:    ['Unlimited events', 'Unlimited guests', 'Custom domain', 'Priority support'],
  },
} as const;

function UpgradePlanModal({
  visible,
  plan,
  eventsUsed,
  eventsLimit,
  onClose,
  onBilling,
}: {
  visible:     boolean;
  plan:        'free' | 'starter' | 'pro' | 'enterprise';
  eventsUsed:  number;
  eventsLimit: number | null;
  onClose:     () => void;
  onBilling:   () => void;
}) {
  const isFree    = plan === 'free' || !plan;
  const isStarter = plan === 'starter';
  if (!isFree && !isStarter) return null;

  const tiles = isFree
    ? [PLAN_TILES.starter, PLAN_TILES.pro]
    : [PLAN_TILES.pro];

  const usePct = eventsLimit ? Math.min((eventsUsed / eventsLimit) * 100, 100) : 0;
  const accent = isFree ? Colors.accent.indigo : Colors.accent.amber;
  const planLabel = isFree ? 'Free Plan' : 'Starter Plan';
  const tagline   = isFree
    ? 'Limited to 1 event & 50 guests. Unlock the full platform.'
    : 'Ready for unlimited? Pro removes all limits.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Tap-outside overlay */}
      <Pressable style={um.overlay} onPress={onClose}>
        {/* Sheet — stops touch propagation */}
        <Pressable style={um.sheet} onPress={(e) => e.stopPropagation()}>

          {/* Drag handle */}
          <View style={um.handle} />

          {/* Header row */}
          <View style={um.headerRow}>
            <View style={[um.planBadge, { backgroundColor: `${accent}18`, borderColor: `${accent}30` }]}>
              <Feather name="zap" size={12} color={accent} />
              <Text style={[um.planBadgeTxt, { color: accent }]}>{planLabel}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={um.closeBtn}>
              <Feather name="x" size={18} color={Colors.text.muted} />
            </Pressable>
          </View>

          {/* Tagline */}
          <Text style={um.tagline}>{tagline}</Text>

          {/* Usage bar */}
          {eventsLimit != null && (
            <View style={um.usageRow}>
              <Text style={um.usageTxt}>{eventsUsed}/{eventsLimit} events used</Text>
              <View style={um.usageTrack}>
                <View
                  style={[
                    um.usageFill,
                    {
                      width: `${usePct}%` as any,
                      backgroundColor: usePct >= 90 ? '#ef4444' : accent,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Plan tiles */}
          <View style={[um.tilesRow, tiles.length === 1 && um.tilesRowSingle]}>
            {tiles.map((t) => (
              <View
                key={t.label}
                style={[
                  um.tile,
                  tiles.length === 1 && um.tileFull,
                  { borderColor: `${t.gradFrom}40` },
                ]}
              >
                {/* Ambient glow */}
                <LinearGradient
                  colors={[`${t.gradFrom}12`, `${t.gradTo}06`]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />

                {/* Plan header */}
                <View style={um.tileHeader}>
                  <View style={[um.tileIcon, { shadowColor: t.shadow }]}>
                    <LinearGradient
                      colors={[t.gradFrom, t.gradTo]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <Feather name="star" size={12} color="#fff" />
                  </View>
                  <Text style={um.tileName}>{t.label}</Text>
                  <Text style={um.tilePrice}>
                    {t.price}<Text style={um.tilePeriod}>/mo</Text>
                  </Text>
                </View>

                {/* Perks */}
                {t.perks.map((p) => (
                  <View key={p} style={um.perkRow}>
                    <View style={[um.perkDot, { backgroundColor: `${t.gradFrom}30` }]}>
                      <Feather name="check" size={8} color={t.gradFrom} />
                    </View>
                    <Text style={um.perkTxt} numberOfLines={1}>{p}</Text>
                  </View>
                ))}

                {/* CTA */}
                <Pressable style={um.tileCta} onPress={onBilling}>
                  <LinearGradient
                    colors={[t.gradFrom, t.gradTo]}
                    style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                  <Feather name="zap" size={12} color={t.ctaColor} />
                  <Text style={[um.tileCtaTxt, { color: t.ctaColor }]}>
                    {t.label === 'Pro' && isStarter ? 'Go Pro' : `Get ${t.label}`}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Footer link */}
          <Pressable onPress={onBilling} style={um.footerLink}>
            <Text style={um.footerLinkTxt}>See all plans & billing details →</Text>
          </Pressable>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const um = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bg.card,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    borderTopWidth:  1,
    borderLeftWidth: 1,
    borderRightWidth:1,
    borderColor:     Colors.border.DEFAULT,
    paddingHorizontal: 18,
    paddingBottom:   28,
    paddingTop:      12,
    gap:             12,
  },
  handle:     { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border.DEFAULT, marginBottom: 4 },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  planBadgeTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  closeBtn:   { padding: 4 },
  tagline:    { fontSize: 12, color: Colors.text.muted, lineHeight: 17 },
  usageRow:   { gap: 5 },
  usageTxt:   { fontSize: 11, color: Colors.text.muted, fontWeight: '600' },
  usageTrack: { height: 4, backgroundColor: Colors.bg.elevated, borderRadius: 2, overflow: 'hidden' },
  usageFill:  { height: '100%', borderRadius: 2 },
  tilesRow:   { flexDirection: 'row', gap: 10 },
  tilesRowSingle: {},
  tile: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 12,
    gap: 7, overflow: 'hidden',
  },
  tileFull:   { flex: 1 },
  tileHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  tileIcon:   { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  tileName:   { fontSize: 13, fontWeight: '800', color: Colors.text.primary, flex: 1 },
  tilePrice:  { fontSize: 16, fontWeight: '900', color: Colors.text.primary, letterSpacing: -0.5 },
  tilePeriod: { fontSize: 10, fontWeight: '500', color: Colors.text.muted },
  perkRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  perkDot:    { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  perkTxt:    { fontSize: 11, color: Colors.text.secondary, flex: 1 },
  tileCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, borderRadius: 10, paddingVertical: 9, marginTop: 4,
    overflow: 'hidden',
  },
  tileCtaTxt: { fontSize: 12, fontWeight: '800' },
  footerLink: { alignItems: 'center', paddingVertical: 2 },
  footerLinkTxt: { fontSize: 11, color: Colors.text.muted, fontWeight: '600' },
});

/* ─── Active Event Toggle ──────────────────────────────────────────
   Shows only when user has 2+ events.
   Tap on an inactive event → confirm modal → switch.
─────────────────────────────────────────────────────────────────── */
function ActiveEventToggle() {
  const { events, activeEventId, setActiveEvent } = useEventStore();
  const [pending, setPending] = useState<Event | null>(null);

  // Only show when there are 2+ events
  if (events.length < 2) return null;

  function handleConfirm() {
    if (pending) setActiveEvent(pending.id);
    setPending(null);
  }

  return (
    <>
      <View style={tog.wrap}>
        <View style={tog.labelRow}>
          <Feather name="zap" size={10} color={Colors.accent.indigo} />
          <Text style={tog.label}>ACTIVE EVENT</Text>
          <Text style={tog.sublabel}>· scanner & builder use this</Text>
        </View>

        <View style={tog.pills}>
          {events.map(ev => {
            const isActive = ev.id === activeEventId;
            const cfg      = Colors.status[ev.status as keyof typeof Colors.status]
                             ?? Colors.status.DRAFT;
            return (
              <Pressable
                key={ev.id}
                style={[tog.pill, isActive && tog.pillActive]}
                onPress={() => { if (!isActive) setPending(ev); }}
              >
                {/* Active glow */}
                {isActive && (
                  <LinearGradient
                    colors={[`${Colors.accent.indigo}25`, `${Colors.accent.indigo}08`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                )}

                {/* Status dot */}
                <View style={[tog.dot, { backgroundColor: cfg.dot }]} />

                {/* Title */}
                <Text
                  style={[tog.pillTxt, isActive && tog.pillTxtActive]}
                  numberOfLines={1}
                >
                  {ev.title}
                </Text>

                {/* Active checkmark */}
                {isActive && (
                  <View style={tog.check}>
                    <Feather name="check" size={10} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <SwitchEventModal
        event={pending}
        onConfirm={handleConfirm}
        onCancel={() => setPending(null)}
      />
    </>
  );
}

const tog = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop:        14,
    backgroundColor:  Colors.bg.card,
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      Colors.border.DEFAULT,
    padding:          12,
    gap:              10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  label: {
    fontSize:      9,
    fontWeight:    '800',
    color:         Colors.accent.indigo,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sublabel: {
    fontSize:  9,
    color:     Colors.text.subtle,
    fontWeight:'600',
  },
  pills: {
    flexDirection: 'row',
    gap:           8,
  },
  pill: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               7,
    paddingHorizontal: 10,
    paddingVertical:   9,
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       Colors.border.subtle,
    backgroundColor:   Colors.bg.elevated,
    overflow:          'hidden',
  },
  pillActive: {
    borderColor: `${Colors.accent.indigo}50`,
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: 4,
    flexShrink:   0,
  },
  pillTxt: {
    flex:          1,
    fontSize:      12,
    fontWeight:    '700',
    color:         Colors.text.muted,
    letterSpacing: -0.1,
  },
  pillTxtActive: {
    color:      '#fff',
    fontWeight: '800',
  },
  check: {
    width:           18,
    height:          18,
    borderRadius:    9,
    backgroundColor: Colors.accent.indigo,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
});





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
  const cfg    = Colors.status[event.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;
  const isTeam = event.user_role && event.user_role !== 'OWNER';
  const role   = event.user_role ?? 'ADMIN';
  return (
    <Pressable onPress={onPress} style={[s.featuredCard, isTeam && { borderWidth: 2, borderColor: 'rgba(251,191,36,0.50)' }]}>
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
      {/* Status / role pill */}
      <View style={s.featuredTop}>
        {isTeam ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(251,191,36,0.90)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Feather name="users" size={9} color="#000" />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#000' }}>{role.replace('_', ' ')}</Text>
          </View>
        ) : (
          <View style={[s.livePill, { backgroundColor: cfg.bg }]}>
            <View style={[s.liveDot, { backgroundColor: cfg.dot }]} />
            <Text style={[s.liveTxt, { color: cfg.text }]}>
              {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
            </Text>
          </View>
        )}
        <View style={s.arrowBtn}>
          <Feather name="arrow-right" size={13} color="rgba(255,255,255,0.7)" />
        </View>
      </View>
      {/* Title + date */}
      <View style={[s.featuredBottom, isTeam && { backgroundColor: 'rgba(42,29,0,0.85)' }]}>
        <Text style={s.featuredTitle} numberOfLines={2}>{event.title}</Text>
        <View style={s.featuredMeta}>
          <Feather name="calendar" size={11} color={isTeam ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.5)'} />
          <Text style={[s.featuredMetaTxt, isTeam && { color: 'rgba(251,191,36,0.6)' }]}>
            {fmtDate(event.starts_at_utc ?? event.starts_at)}
          </Text>
          {isTeam && event.owner_name ? (
            <><Text style={{ color: 'rgba(251,191,36,0.4)', fontSize: 11 }}>· by {event.owner_name}</Text></>
          ) : event.location ? (
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
  const cfg    = Colors.status[event.status as keyof typeof Colors.status] ?? Colors.status.DRAFT;
  const isTeam = event.user_role && event.user_role !== 'OWNER';
  const role   = event.user_role ?? 'ADMIN';
  return (
    <Pressable
      onPress={onPress}
      style={[s.recentCard, isTeam && { backgroundColor: '#2a1d00', borderColor: 'rgba(251,191,36,0.35)', borderWidth: 1 }]}
    >
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
        <Text style={[s.recentTitle, isTeam && { color: '#fef3c7' }]} numberOfLines={1}>{event.title}</Text>
        <View style={s.recentDateRow}>
          <Feather name="calendar" size={10} color={isTeam ? 'rgba(251,191,36,0.6)' : Colors.text.subtle} />
          <Text style={[s.recentDate, isTeam && { color: 'rgba(251,191,36,0.6)' }]}>
            {fmtDate(event.starts_at_utc ?? event.starts_at)}
          </Text>
        </View>
        {isTeam ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,191,36,0.18)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
            <Feather name="users" size={9} color="#fbbf24" />
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#fbbf24' }}>{role.replace('_', ' ')}</Text>
          </View>
        ) : (
          <View style={[s.statusPill, { backgroundColor: cfg.bg }]}>
            <View style={[s.statusDot, { backgroundColor: cfg.dot }]} />
            <Text style={[s.statusTxt, { color: cfg.text }]}>
              {event.status.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={16} color={isTeam ? 'rgba(251,191,36,0.5)' : Colors.text.subtle} />
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

  const { events, fetchEvents, loading, activeEventId, setActiveEvent, dashboard, fetchEventDashboard } = useEventStore();
  const { isPremium, fetchSubscription, plan, usage, limits } = useSubscriptionStore();
  const { unreadCount, fetch: fetchNotifs } = useNotificationStore();
  const teamEvents  = events.filter(e => e.user_role && e.user_role !== 'OWNER');

  // My events only — exclude admin/team events, archived events, and expired events
  const myEvents = events.filter(e =>
    (!e.user_role || e.user_role === 'OWNER') &&
    e.status !== 'ARCHIVED' &&
    e.status !== 'DELETED'
  );

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim  = useRef(new Animated.Value(0)).current;
  const quickAnim  = useRef(new Animated.Value(0)).current;
  const listAnim   = useRef(new Animated.Value(0)).current;

  // Carousel index
  const [activeIdx,      setActiveIdx]      = useState(0);
  const [planModalOpen,  setPlanModalOpen]  = useState(false);
  const carouselRef = useRef<ScrollView>(null);

  // Toast on active-event switch (skip initial mount)
  const prevActiveRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeEventId) return;
    if (prevActiveRef.current === null) {
      prevActiveRef.current = activeEventId;
      return;
    }
    if (prevActiveRef.current !== activeEventId) {
      prevActiveRef.current = activeEventId;
      const ev = events.find(e => e.id === activeEventId);
      if (ev) {
        notify.eventSelected(ev.title);
      }
    }
  }, [activeEventId, events]);

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

  // Fetch dashboard whenever active event changes
  useEffect(() => {
    if (activeEventId) fetchEventDashboard(activeEventId);
  }, [activeEventId]);

  // Auto-scroll carousel to active event
  useEffect(() => {
    if (!activeEventId || !events.length) return;
    const idx = events.findIndex(e => e.id === activeEventId);
    if (idx < 0) return;
    setActiveIdx(idx);
    setTimeout(() => {
      carouselRef.current?.scrollTo({ x: idx * (CARD_W + 12), animated: true });
    }, 100);
  }, [activeEventId, events.length]);

  // Re-check subscription + notifications when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      fetchSubscription();
      fetchNotifs();
      if (activeEventId) fetchEventDashboard(activeEventId);
    }, [activeEventId, fetchSubscription, fetchNotifs])
  );

  const onRefresh = useCallback(() => {
    fetchEvents();
    fetchSubscription();
    fetchNotifs();
    if (activeEventId) fetchEventDashboard(activeEventId);
  }, [activeEventId]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Pending nav event (recent row tap → confirm switch → navigate)
  const [pendingNavEvent, setPendingNavEvent] = useState<Event | null>(null);

  function handleConfirmNavEvent() {
    if (!pendingNavEvent) return;
    setActiveEvent(pendingNavEvent.id);
    const id = pendingNavEvent.id;
    setPendingNavEvent(null);
    router.push(`/events/${id}` as never);
  }

  const firstName   = user?.full_name?.split(' ')[0] ?? 'there';
  const premiumStatus = isPremium();
  const recent      = myEvents.slice(0, 6);

  // Active event + its dashboard stats
  const activeEvent = events.find(e => e.id === activeEventId) ?? events[0] ?? null;
  const activeStats = dashboard?.event?.id === activeEventId ? dashboard.stats : null;
  const guestCount    = activeStats?.guest_count     ?? 0;
  const attendingCount = activeStats?.attending_count ?? 0;
  const ticketCount   = activeStats?.ticket_count    ?? 0;
  const checkinCount  = activeStats?.checkin_count   ?? 0;

  const initials = (user?.full_name ?? 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const animStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  });

  const [pendingCarouselEvent, setPendingCarouselEvent] = useState<Event | null>(null);
  const [pendingCarouselIdx,   setPendingCarouselIdx]   = useState(0);

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 12));
    const scrolledEvent = events[idx];
    if (scrolledEvent && scrolledEvent.id !== activeEventId) {
      // Ask for confirmation before switching
      setPendingCarouselEvent(scrolledEvent);
      setPendingCarouselIdx(idx);
    } else {
      setActiveIdx(idx);
    }
  };

  function handleConfirmCarouselSwitch() {
    if (!pendingCarouselEvent) return;
    setActiveEvent(pendingCarouselEvent.id);
    setActiveIdx(pendingCarouselIdx);
    setPendingCarouselEvent(null);
  }

  function handleCancelCarouselSwitch() {
    // Scroll back to the currently active event position
    const prevIdx = events.findIndex(e => e.id === activeEventId);
    const scrollTo = prevIdx >= 0 ? prevIdx : activeIdx;
    carouselRef.current?.scrollTo({ x: scrollTo * (CARD_W + 12), animated: true });
    setPendingCarouselEvent(null);
  }

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
              colors={user?.is_super_admin ? ['#c9a96e', '#f59e0b'] : [Colors.accent.indigo, Colors.accent.violet]}
              style={s.logoMark}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Feather name={user?.is_super_admin ? 'shield' : 'zap'} size={14} color={user?.is_super_admin ? '#000' : '#fff'} />
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
            <Pressable style={s.avatar} onPress={() => router.push('/(tabs)/profile' as never)} hitSlop={8}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <>
                  <LinearGradient
                    colors={[Colors.accent.indigo, Colors.accent.violet]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                  <Text style={s.avatarTxt}>{initials}</Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Super Admin Banner ───────────────────────────────── */}
        {user?.is_super_admin && (
          <Animated.View style={[s.sadmBanner, animStyle(headerAnim)]}>
            <LinearGradient
              colors={['rgba(201,169,110,0.14)', 'rgba(245,158,11,0.05)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <View style={s.sadmLeft}>
              <View style={s.sadmIcon}>
                <Feather name="shield" size={14} color="#c9a96e" />
              </View>
              <View>
                <Text style={s.sadmTitle}>Super Admin Mode</Text>
                <Text style={s.sadmSub}>Full platform access</Text>
              </View>
            </View>
            <View style={s.sadmBadge}>
              <Text style={s.sadmBadgeTxt}>ADMIN</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Stats row (active event) ──────────────────────────── */}
        <Animated.View style={animStyle(statsAnim)}>
          {activeEvent && (
            <View style={s.activeEventBanner}>
              <View style={s.activeEventDot} />
              <Text style={s.activeEventName} numberOfLines={1}>{activeEvent.title}</Text>
              <Pressable onPress={() => router.push(`/events/${activeEvent.id}` as never)}>
                <Text style={s.activeEventLink}>Open →</Text>
              </Pressable>
            </View>
          )}
          <View style={s.statsRow}>
            <StatTile value={guestCount}     label="Guests"    icon="users"       accent={Colors.accent.indigo}  />
            <StatTile value={attendingCount} label="Attending" icon="user-check"  accent={Colors.accent.emerald} />
            <StatTile value={ticketCount}    label="Tickets"   icon="credit-card" accent={Colors.accent.amber}   />
            <StatTile value={checkinCount}   label="Scanned"   icon="camera"      accent={Colors.accent.violet}  />
          </View>
        </Animated.View>
        {/* ── Active event toggle ───────────────────────────────── */}
        <Animated.View style={animStyle(statsAnim)}>
          <ActiveEventToggle />
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
            <Pressable style={s.upgradeCta} onPress={() => setPlanModalOpen(true)}>
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

        {/* ── Events you're managing ────────────────────────────── */}
        {teamEvents.length > 0 && (
          <Animated.View style={[s.section, animStyle(quickAnim)]}>
            <View style={s.sectionHeader}>
              <View style={s.teamSectionLabel}>
                <Feather name="users" size={13} color="#fbbf24" />
                <Text style={s.teamSectionTitle}>Events you&apos;re managing</Text>
              </View>
              <View style={s.teamCountBadge}>
                <Text style={s.teamCountTxt}>{teamEvents.length}</Text>
              </View>
            </View>
            <View style={s.teamList}>
              {teamEvents.map(ev => {
                const date = ev.starts_at_local ?? ev.starts_at_utc;
                const dateStr = date
                  ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : null;
                const roleLabel = (ev.user_role ?? 'ADMIN').replace('_', ' ');
                return (
                  <Pressable
                    key={ev.id}
                    style={s.teamCard}
                    onPress={() => router.push(`/events/${ev.id}` as never)}
                  >
                    {/* Thumbnail */}
                    <View style={s.teamCardThumb}>
                      <Image
                        source={{ uri: heroImg(ev) }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={200}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.55)']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={s.teamCardThumbBadge}>
                        <Feather name="users" size={8} color="#fbbf24" />
                      </View>
                    </View>
                    <View style={s.teamCardInfo}>
                      <Text style={s.teamCardTitle} numberOfLines={1}>{ev.title}</Text>
                      <Text style={s.teamCardSub} numberOfLines={1}>
                        {dateStr ? `${dateStr} · ` : ''}By {ev.owner_name}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <View style={{ backgroundColor: 'rgba(251,191,36,0.20)', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#fbbf24' }}>{roleLabel}</Text>
                      </View>
                      <Feather name="chevron-right" size={14} color="rgba(251,191,36,0.35)" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── Featured Events (carousel) ─────────────────────────── */}
        <Animated.View style={[s.section, animStyle(listAnim)]}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>
              {myEvents.length > 1 ? 'Your Events' : 'Featured Event'}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/events' as never)}>
              <Text style={s.seeAll}>See all →</Text>
            </Pressable>
          </View>

          {loading && myEvents.length === 0 ? (
            <ActivityIndicator color={Colors.accent.indigo} style={{ marginTop: 40 }} />
          ) : myEvents.length === 0 ? (
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
                {myEvents.map(ev => (
                  <FeaturedCard
                    key={ev.id}
                    event={ev}
                    onPress={() => router.push(`/events/${ev.id}` as never)}
                  />
                ))}
              </ScrollView>

              {/* Pagination dots */}
              <Dots count={myEvents.length} active={activeIdx} />
            </>
          )}
        </Animated.View>

        {/* ── Recent Events list ─────────────────────────────────── */}
        {recent.length > 0 && (
          <Animated.View style={[s.section, { paddingBottom: 130 }, animStyle(listAnim)]}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Events</Text>
              {myEvents.length > 5 && (
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
                  onPress={() => setPendingNavEvent(ev)}
                />
              ))}
            </View>
          </Animated.View>
        )}

      </ScrollView>

      {/* Recent row → switch event confirmation */}
      <SwitchEventModal
        event={pendingNavEvent}
        onConfirm={handleConfirmNavEvent}
        onCancel={() => setPendingNavEvent(null)}
      />

      {/* Carousel swipe -> switch event confirmation */}
      <SwitchEventModal
        event={pendingCarouselEvent}
        onConfirm={handleConfirmCarouselSwitch}
        onCancel={handleCancelCarouselSwitch}
      />

      {/* Upgrade plan modal */}
      <UpgradePlanModal
        visible={planModalOpen}
        plan={plan}
        eventsUsed={usage?.events ?? 0}
        eventsLimit={limits?.events ?? null}
        onClose={() => setPlanModalOpen(false)}
        onBilling={() => {
          setPlanModalOpen(false);
          router.push('/profile/billing' as never);
        }}
      />
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

  /* Active event banner */
  activeEventBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 2,
  },
  activeEventDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent.indigo, flexShrink: 0 },
  activeEventName: { flex: 1, fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  activeEventLink: { fontSize: 12, fontWeight: '700', color: Colors.accent.indigo },

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

  /* Managing section */
  teamSectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  teamSectionTitle: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: 0.6 },
  teamCountBadge:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: 'rgba(251,191,36,0.15)' },
  teamCountTxt:     { fontSize: 11, fontWeight: '800', color: '#fbbf24' },
  teamList:         { gap: 8 },
  teamCard:           { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)', backgroundColor: '#2a1d00' },
  teamCardThumb:      { width: 46, height: 46, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#14141f' },
  teamCardThumbBadge: { position: 'absolute', bottom: 3, right: 3, width: 14, height: 14, borderRadius: 4, backgroundColor: 'rgba(42,29,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  teamCardInfo:       { flex: 1, minWidth: 0, gap: 2 },
  teamCardTitle:    { fontSize: 13, fontWeight: '800', color: '#fef3c7' },
  teamCardSub:      { fontSize: 11, color: 'rgba(251,191,36,0.55)' },

  /* Super admin banner */
  sadmBanner:   { marginHorizontal: 20, marginTop: 6, marginBottom: 2, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(201,169,110,0.30)', overflow: 'hidden' },
  sadmLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sadmIcon:     { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(201,169,110,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)' },
  sadmTitle:    { fontSize: 13, fontWeight: '800', color: '#c9a96e' },
  sadmSub:      { fontSize: 10, color: 'rgba(201,169,110,0.60)', marginTop: 1 },
  sadmBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(201,169,110,0.15)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.30)' },
  sadmBadgeTxt: { fontSize: 9, fontWeight: '900', color: '#c9a96e', letterSpacing: 1.2 },

  /* Empty */
  empty:       { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIcon:   { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 },
  emptyTitle:  { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  emptySubtitle:{ fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  emptyBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});