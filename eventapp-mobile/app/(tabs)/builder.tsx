/**
 * eventapp-mobile/app/(tabs)/builder.tsx
 *
 * REBUILT — This tab now shows an event-picker list.
 * Selecting an event navigates to the real builder at
 * /events/[id]/builder (which already has the full canvas,
 * BottomSheetTabs, StylePanel, BlocksPanel, LayersPanel, EditPanel).
 *
 * Layout mirrors the web builder small-viewport chrome:
 *   TOP:    [≡ menu]  Page Builder  [+ create]
 *   LIST:   YOUR EVENTS → each card → tap → /events/:id/builder
 *   EMPTY:  Create first event CTA
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter }      from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEventStore }  from '@/store/event.store';
import { useAuthStore }   from '@/store/auth.store';
import { useDrawerStore } from '@/store/drawer.store';
import { Colors }         from '@/constants/colors';

const { width: SW } = Dimensions.get('window');

/* ── Status config (reuse Colors.status) ──────────────────────────── */
const statusCfg = (status: string) =>
  (Colors.status as any)[status] ?? Colors.status.DRAFT;

/* ══════════════════════════════════════════════════════════════════
   SCREEN
══════════════════════════════════════════════════════════════════ */
export default function BuilderTabScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const openDrawer = useDrawerStore(s => s.open);
  const { events, fetchEvents, loading, activeEventId } = useEventStore();
  const { isHydrated, isAuthenticated }  = useAuthStore(s => ({ isHydrated: s.isHydrated, isAuthenticated: s.isAuthenticated }));

  useEffect(() => {
    if (isHydrated && isAuthenticated) fetchEvents();
  }, [isHydrated, isAuthenticated]);

  // Auto-navigate to active event's builder on focus
  const didNavigate = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const target = activeEventId ?? events[0]?.id;
      if (target && !didNavigate.current) {
        didNavigate.current = true;
        router.push(`/events/${target}/builder` as never);
      }
      return () => { didNavigate.current = false; };
    }, [activeEventId, events])
  );

  const handleSelect = (eventId: string) => {
    router.push(`/events/${eventId}/builder` as never);
  };

  /* ── Loading ── */
  if (loading && events.length === 0) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <TopBar onMenu={openDrawer} onCreate={() => router.push('/events/create' as never)} />
        <View style={s.center}>
          <ActivityIndicator color={Colors.accent.indigo} size="large" />
          <Text style={s.loadingTxt}>Loading events…</Text>
        </View>
      </View>
    );
  }

  /* ── Empty ── */
  if (!loading && events.length === 0) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <TopBar onMenu={openDrawer} onCreate={() => router.push('/events/create' as never)} />
        <View style={s.center}>
          <EmptyState onCreate={() => router.push('/events/create' as never)} />
        </View>
      </View>
    );
  }

  /* ── Event list (fallback if no active event yet) ── */
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <TopBar onMenu={openDrawer} onCreate={() => router.push('/events/create' as never)} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label — matches web sidebar "YOUR EVENTS" */}
        <Text style={s.listLabel}>YOUR EVENTS</Text>

        {events.map(ev => {
          const cfg = statusCfg(ev.status);
          const isActive = ev.id === activeEventId;
          return (
            <Pressable
              key={ev.id}
              style={[s.card, isActive && { borderColor: `${Colors.accent.indigo}60`, borderWidth: 1.5 }]}
              onPress={() => handleSelect(ev.id)}
            >
              {/* Subtle left-side gradient accent */}
              <LinearGradient
                colors={[`${Colors.accent.indigo}14`, 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              />

              {/* Builder icon — matches web WandSparkles */}
              <View style={s.cardIcon}>
                <LinearGradient
                  colors={['rgba(108,111,238,0.22)', 'rgba(108,111,238,0.08)']}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="sparkles" size={18} color={Colors.accent.indigo} />
              </View>

              {/* Info */}
              <View style={s.cardInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{ev.title}</Text>
                  {isActive && (
                    <View style={s.activeBadge}>
                      <Text style={s.activeBadgeTxt}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <View style={s.cardMeta}>
                  <View style={[s.statusDot, { backgroundColor: cfg.dot }]} />
                  <Text style={[s.statusTxt, { color: cfg.text }]}>
                    {ev.status.charAt(0) + ev.status.slice(1).toLowerCase()}
                  </Text>
                  <Text style={s.dot}>·</Text>
                  <Text style={s.cardSub}>Open builder</Text>
                </View>
              </View>

              {/* Arrow */}
              <Feather name="chevron-right" size={15} color={isActive ? Colors.accent.indigo : 'rgba(255,255,255,0.18)'} />
            </Pressable>
          );
        })}

        {/* Quick-create link at bottom */}
        <Pressable
          style={s.createCard}
          onPress={() => router.push('/events/create' as never)}
        >
          <View style={s.createIcon}>
            <Feather name="plus" size={18} color={Colors.accent.indigo} />
          </View>
          <Text style={s.createTxt}>Create a new event</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TOP BAR  —  mirrors web BuilderTopbar mobile layout:
   [≡]  Page Builder  ···  [+]
══════════════════════════════════════════════════════════════════ */
function TopBar({ onMenu, onCreate }: { onMenu: () => void; onCreate: () => void }) {
  return (
    <View style={tb.bar}>
      {/* Left: menu */}
      <Pressable style={tb.iconBtn} onPress={onMenu} hitSlop={10}>
        <Feather name="menu" size={18} color="#8b8f9a" />
      </Pressable>

      {/* Center: title + subtitle (matches web event-name area) */}
      <View style={tb.center}>
        <Text style={tb.title}>Page Builder</Text>
        <Text style={tb.sub}>Select an event to edit</Text>
      </View>

      {/* Right: create button (matches web top-right + button) */}
      <Pressable style={tb.createBtn} onPress={onCreate} hitSlop={8}>
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <Feather name="plus" size={17} color="#fff" />
      </Pressable>
    </View>
  );
}

/* ── Empty state ──────────────────────────────────────────────────── */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={es.wrap}>
      {/* Icon mark */}
      <View style={es.iconWrap}>
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <Ionicons name="sparkles" size={28} color="#fff" />
      </View>

      <Text style={es.title}>No events yet</Text>
      <Text style={es.sub}>Create your first event to start building its page</Text>

      <Pressable style={es.btn} onPress={onCreate}>
        <LinearGradient
          colors={[Colors.accent.indigo, Colors.accent.violet]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <Feather name="plus" size={15} color="#fff" />
        <Text style={es.btnTxt}>Create Event</Text>
      </Pressable>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════ */
const BG     = '#0e0f11';
const CARD   = '#0f1015';
const BORDER = 'rgba(255,255,255,0.07)';

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: BG },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingTxt: { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: '600' },

  list:      { padding: 14, gap: 9, paddingBottom: 120 },
  listLabel: {
    fontSize: 9.5, fontWeight: '700', color: '#44495a',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4,
  },

  /* Event card */
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: CARD,
    borderRadius:    14,
    padding:         13,
    borderWidth:     1,
    borderColor:     `${Colors.accent.indigo}18`,
    overflow:        'hidden',
  },
  cardIcon: {
    width:          42,
    height:         42,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
    flexShrink:     0,
  },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: {
    fontSize:    14,
    fontWeight:  '800',
    color:       '#f0f1f3',
    letterSpacing: -0.2,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot:{ width: 5, height: 5, borderRadius: 3 },
  statusTxt:{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  dot:      { fontSize: 10, color: '#44495a' },
  cardSub:  { fontSize: 10, color: '#44495a', fontWeight: '600' },
  activeBadge:    { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: `${Colors.accent.indigo}22`, borderWidth: 1, borderColor: `${Colors.accent.indigo}40` },
  activeBadgeTxt: { fontSize: 8, fontWeight: '800', color: Colors.accent.indigo, letterSpacing: 0.8 },

  /* Quick create card */
  createCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    backgroundColor: CARD,
    borderRadius:    14,
    padding:         13,
    borderWidth:     1,
    borderColor:     BORDER,
    borderStyle:     'dashed',
    marginTop:       4,
  },
  createIcon: {
    width:          42,
    height:         42,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.accent.indigo}14`,
    borderWidth:    1,
    borderColor:    `${Colors.accent.indigo}25`,
  },
  createTxt: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.35)' },
});

/* Top bar */
const tb = StyleSheet.create({
  bar: {
    height:            56,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 12,
    gap:               10,
    backgroundColor:   '#16181c',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  iconBtn: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth:     1,
    borderColor:     BORDER,
    alignItems:      'center',
    justifyContent:  'center',
  },
  center: { flex: 1 },
  title:  { fontSize: 15, fontWeight: '900', color: '#f0f1f3', letterSpacing: -0.3 },
  sub:    { fontSize: 10, color: '#44495a', marginTop: 1, fontWeight: '600' },
  createBtn: {
    width:    34,
    height:   34,
    borderRadius: 10,
    alignItems:   'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

/* Empty state */
const es = StyleSheet.create({
  wrap: {
    alignItems:      'center',
    gap:             12,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width:        72,
    height:       72,
    borderRadius: 22,
    alignItems:   'center',
    justifyContent: 'center',
    overflow:     'hidden',
    marginBottom: 4,
  },
  title: {
    fontSize:     20,
    fontWeight:   '900',
    color:        '#f0f1f3',
    letterSpacing: -0.4,
  },
  sub: {
    fontSize:  13,
    color:     Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           7,
    height:        44,
    paddingHorizontal: 24,
    borderRadius:  12,
    overflow:      'hidden',
    marginTop:     4,
  },
  btnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});












// import React, { useEffect } from 'react';
// import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { Feather } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useEventStore } from '@/store/event.store';
// import { Colors } from '@/constants/colors';

// export default function BuilderGateway() {
//   const router = useRouter();
//   const { events, activeEventId, fetchEvents, loading } = useEventStore();

//   useEffect(() => { fetchEvents(); }, []);

//   useEffect(() => {
//     if (loading) return;
//     const target = events.find(e => e.id === activeEventId) ?? events[0];
//     if (target) {
//       router.replace(`/events/${target.id}/builder` as never);
//     }
//   }, [events, activeEventId, loading]);

//   if (!loading && events.length === 0) {
//     return (
//       <SafeAreaView style={s.safe} edges={['top']}>
//         <View style={s.center}>
//           <View style={s.iconWrap}>
//             <Feather name="layout" size={32} color={Colors.accent.indigo} />
//           </View>
//           <Text style={s.title}>No events yet</Text>
//           <Text style={s.sub}>Create an event first to start building your page</Text>
//           <Pressable style={s.btn} onPress={() => router.push('/events/create' as never)}>
//             <LinearGradient
//               colors={[Colors.accent.indigo, Colors.accent.violet]}
//               start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//               style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
//             />
//             <Feather name="plus" size={15} color="#fff" />
//             <Text style={s.btnTxt}>Create Event</Text>
//           </Pressable>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <View style={s.safe}>
//       <ActivityIndicator size="large" color={Colors.accent.indigo} style={s.loader} />
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   safe:     { flex: 1, backgroundColor: Colors.bg.primary },
//   loader:   { flex: 1 },
//   center: {
//     flex: 1, alignItems: 'center', justifyContent: 'center',
//     gap: 12, paddingHorizontal: 40,
//   },
//   iconWrap: {
//     width: 72, height: 72, borderRadius: 22,
//     backgroundColor: Colors.accent.indigo + '14',
//     borderWidth: 1, borderColor: Colors.accent.indigo + '25',
//     alignItems: 'center', justifyContent: 'center',
//     marginBottom: 4,
//   },
//   title:  { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
//   sub:    { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
//   btn: {
//     flexDirection: 'row', alignItems: 'center', gap: 8,
//     paddingHorizontal: 28, paddingVertical: 14,
//     borderRadius: 14, overflow: 'hidden', marginTop: 8,
//   },
//   btnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
// });
