/**
 * eventapp-mobile/app/(tabs)/events.tsx
 *
 * REDESIGNED — senior dev, production-grade My Events screen.
 *
 * Changes vs current:
 *  ✅ Header: clean horizontal layout, menu + title + create button
 *  ✅ Search: pill-shaped, smooth focus state
 *  ✅ Filter chips: small horizontal pills (fixed height), not giant ovals
 *  ✅ Event cards: replaced with new ProEventCard (see below)
 *  ✅ Empty state: illustrated, per-filter messaging
 *  ✅ Pull-to-refresh with indigo tint
 *  ✅ Smooth staggered entrance animation per card
 */

import React, {
  useEffect, useState, useMemo, useCallback, useRef,
} from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  Pressable, RefreshControl, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter }      from 'expo-router';
import { Feather }        from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEventStore }  from '@/store/event.store';
import { useDrawerStore } from '@/store/drawer.store';
import { Colors }         from '@/constants/colors';
import { EventStatus }    from '@/types';
import { ProEventCard }   from '@/components/events/EventCard';

const SW = Dimensions.get('window').width;

type Filter = 'ALL' | EventStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL',       label: 'All'       },
  { key: 'DRAFT',     label: 'Draft'     },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'ARCHIVED',  label: 'Archived'  },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_COUNT_COLOR: Record<string, string> = {
  ALL:       Colors.accent.indigo,
  DRAFT:     Colors.accent.amber,
  PUBLISHED: Colors.accent.emerald,
  ARCHIVED:  '#6b7280',
  CANCELLED: Colors.accent.red,
};

/* ── Animated card wrapper ──────────────────────────────────────── */
function FadeSlideIn({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 340, delay: index * 55, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 340, delay: index * 55, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN
══════════════════════════════════════════════════════════════════ */
export default function EventsTab() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const openDrawer = useDrawerStore(s => s.open);
  const { events, fetchEvents, loading } = useEventStore();

  const [query,  setQuery]  = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [focused, setFocused] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const filtered = useMemo(() => {
    let result = events;
    if (filter !== 'ALL') result = result.filter(e => e.status === filter);
    if (query.trim())     result = result.filter(e => e.title.toLowerCase().includes(query.toLowerCase()));
    return result;
  }, [events, filter, query]);

  // Count per filter
  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: events.length };
    for (const e of events) {
      c[e.status] = (c[e.status] ?? 0) + 1;
    }
    return c;
  }, [events]);

  const refresh = useCallback(() => fetchEvents(), []);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable style={s.menuBtn} onPress={openDrawer} hitSlop={10}>
          <Feather name="menu" size={19} color={Colors.text.muted} />
        </Pressable>

        <Text style={s.headerTitle}>My Events</Text>

        <Pressable
          style={s.createBtn}
          onPress={() => router.push('/events/create' as never)}
        >
          <LinearGradient
            colors={[Colors.accent.indigo, Colors.accent.violet]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <Feather name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* ── Search ──────────────────────────────────────────────── */}
      <View style={[s.searchWrap, focused && s.searchFocused]}>
        <Feather name="search" size={15} color={focused ? Colors.accent.indigo : Colors.text.subtle} />
        <TextInput
          style={s.searchInput}
          placeholder="Search events…"
          placeholderTextColor={Colors.text.subtle}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <View style={s.clearBtn}>
              <Feather name="x" size={11} color={Colors.text.muted} />
            </View>
          </Pressable>
        )}
      </View>

      {/* ── Filter chips ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersRow}
      >
        {FILTERS.map(f => {
          const active = filter === f.key;
          const color  = STATUS_COUNT_COLOR[f.key];
          const count  = counts[f.key] ?? 0;
          return (
            <Pressable
              key={f.key}
              style={[
                s.chip,
                active
                  ? { backgroundColor: `${color}22`, borderColor: `${color}55` }
                  : { backgroundColor: Colors.bg.elevated, borderColor: Colors.border.subtle },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.chipTxt, active && { color }]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[s.chipCount, { backgroundColor: active ? `${color}30` : Colors.border.subtle }]}>
                  <Text style={[s.chipCountTxt, { color: active ? color : Colors.text.subtle }]}>
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Event list ──────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && events.length > 0}
            onRefresh={refresh}
            tintColor={Colors.accent.indigo}
          />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState filter={filter} query={query} onCreate={() => router.push('/events/create' as never)} />
        ) : (
          filtered.map((event, idx) => (
            <FadeSlideIn key={event.id} index={idx}>
              <ProEventCard event={event} onRefresh={refresh} />
            </FadeSlideIn>
          ))
        )}
        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

/* ── Empty state ─────────────────────────────────────────────────── */
function EmptyState({ filter, query, onCreate }: {
  filter: Filter; query: string; onCreate: () => void;
}) {
  const msg = query
    ? { icon: 'search' as const,   title: `No results for "${query}"`, sub: 'Try a different search term.' }
    : filter === 'ALL'
    ? { icon: 'calendar' as const, title: 'No events yet',             sub: 'Create your first event to get started.' }
    : { icon: 'filter'   as const, title: `No ${filter.toLowerCase()} events`, sub: 'Events with this status will appear here.' };

  return (
    <View style={es.wrap}>
      <View style={es.iconWrap}>
        <LinearGradient
          colors={[`${Colors.accent.indigo}20`, `${Colors.accent.violet}10`]}
          style={StyleSheet.absoluteFill}
        />
        <Feather name={msg.icon} size={28} color={Colors.accent.indigo} />
      </View>
      <Text style={es.title}>{msg.title}</Text>
      <Text style={es.sub}>{msg.sub}</Text>
      {filter === 'ALL' && !query && (
        <Pressable style={es.btn} onPress={onCreate}>
          <LinearGradient colors={[Colors.accent.indigo, Colors.accent.violet]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Feather name="plus" size={15} color="#fff" />
          <Text style={es.btnTxt}>Create Event</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 22, fontWeight: '900',
    color: '#fff', letterSpacing: -0.4,
  },
  createBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  /* Search */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, height: 44,
    backgroundColor: Colors.bg.elevated,
    borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  searchFocused: {
    borderColor: `${Colors.accent.indigo}55`,
    backgroundColor: `${Colors.accent.indigo}08`,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#fff',
    fontWeight: '500',
  },
  clearBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.bg.card,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Filter chips */
  filtersRow: {
    paddingHorizontal: 16, paddingBottom: 14, gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, height: 32, borderRadius: 99,
    borderWidth: 1,
  },
  chipTxt: {
    fontSize: 13, fontWeight: '700',
    color: Colors.text.muted, letterSpacing: -0.1,
  },
  chipCount: {
    minWidth: 18, height: 18, borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  chipCountTxt: { fontSize: 10, fontWeight: '800' },

  /* List */
  list: { paddingHorizontal: 16, gap: 14 },
});

const es = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 4,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}20`,
  },
  title: { fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.3 },
  sub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 44, paddingHorizontal: 24, borderRadius: 12,
    overflow: 'hidden', marginTop: 8,
  },
  btnTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});






// import React, { useEffect, useState, useMemo, useCallback } from 'react';
// import {
//   View, Text, TextInput, ScrollView, StyleSheet, Pressable, RefreshControl,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { Feather } from '@expo/vector-icons';
// import { useEventStore }  from '@/store/event.store';
// import { useDrawerStore } from '@/store/drawer.store';
// import { EventCard }      from '@/components/events/EventCard';
// import Toast from 'react-native-toast-message';
// import { Colors }         from '@/constants/colors';
// import { EventStatus }    from '@/types';

// type Filter = 'ALL' | EventStatus;
// const FILTERS: Filter[] = ['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED'];

// export default function EventsTab() {
//   const router     = useRouter();
//   const openDrawer = useDrawerStore(s => s.open);
//   const { events, fetchEvents, loading, activeEventId, setActiveEvent } = useEventStore();
//   const [query,  setQuery]  = useState('');
//   const [filter, setFilter] = useState<Filter>('ALL');

//   useEffect(() => { fetchEvents(); }, []);

//   const filtered = useMemo(() => {
//     return events
//       .filter(e => filter === 'ALL' || e.status === filter)
//       .filter(e => !query || e.title.toLowerCase().includes(query.toLowerCase()));
//   }, [events, filter, query]);

//   const refresh = useCallback(() => fetchEvents(), []);

//   return (
//     <SafeAreaView style={styles.safe}>
//       <View style={styles.root}>

//         {/* Header */}
//         <View style={styles.header}>
//           <Pressable style={styles.menuBtn} onPress={openDrawer} hitSlop={10}>
//             <Feather name="menu" size={20} color="#fff" />
//           </Pressable>
//           <Text style={styles.title}>My Events</Text>
//           <Pressable style={styles.createBtn} onPress={() => router.push('/events/create' as never)}>
//             <Feather name="plus" size={18} color="#fff" />
//           </Pressable>
//         </View>

//         {/* Search */}
//         <View style={styles.searchWrap}>
//           <Feather name="search" size={15} color={Colors.text.subtle} style={styles.searchIcon} />
//           <TextInput
//             style={styles.search}
//             placeholder="Search events…"
//             placeholderTextColor={Colors.text.subtle}
//             value={query}
//             onChangeText={setQuery}
//           />
//           {query.length > 0 && (
//             <Pressable onPress={() => setQuery('')}>
//               <Feather name="x" size={15} color={Colors.text.subtle} />
//             </Pressable>
//           )}
//         </View>

//         {/* Filter tabs */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
//           {FILTERS.map(f => (
//             <Pressable
//               key={f}
//               style={[styles.filterChip, filter === f && styles.filterChipActive]}
//               onPress={() => setFilter(f)}
//             >
//               <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
//                 {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
//               </Text>
//             </Pressable>
//           ))}
//         </ScrollView>

//         {/* List */}
//         <ScrollView
//           contentContainerStyle={styles.list}
//           refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.accent.indigo} />}
//           showsVerticalScrollIndicator={false}
//         >
//           {filtered.length === 0 ? (
//             <View style={styles.empty}>
//               <Feather name="calendar" size={40} color={Colors.text.subtle} />
//               <Text style={styles.emptyTitle}>
//                 {query ? `No results for "${query}"` : 'No events'}
//               </Text>
//               <Text style={styles.emptyText}>
//                 {query ? 'Try a different search term' : 'Create your first event to get started'}
//               </Text>
//             </View>
//           ) : (
//             filtered.map(event => (
//               <EventCard
//                 key={event.id}
//                 event={event}
//                 onRefresh={fetchEvents}
//                 isActive={event.id === activeEventId}
//                 onSetActive={() => {
//                   setActiveEvent(event.id);
//                   Toast.show({ type: 'success', text1: '✓ Active event set', text2: event.title, visibilityTime: 1800 });
//                 }}
//               />
//             ))
//           )}
//         </ScrollView>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: Colors.bg.primary },
//   root: { flex: 1, gap: 12 },

//   header: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     justifyContent:    'space-between',
//     paddingHorizontal: 16,
//     paddingTop:        12,
//     gap:               12,
//   },
//   menuBtn: {
//     width: 40, height: 40, borderRadius: 12,
//     backgroundColor: Colors.bg.elevated,
//     borderWidth: 1, borderColor: Colors.border.DEFAULT,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   title:     { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4, flex: 1 },
//   createBtn: {
//     width:           40,
//     height:          40,
//     borderRadius:    12,
//     backgroundColor: Colors.accent.indigo,
//     alignItems:      'center',
//     justifyContent:  'center',
//   },

//   searchWrap: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     backgroundColor:   Colors.bg.input,
//     borderRadius:      14,
//     borderWidth:       1,
//     borderColor:       Colors.border.DEFAULT,
//     marginHorizontal:  16,
//     paddingHorizontal: 12,
//     height:            46,
//     gap:               8,
//   },
//   searchIcon: { flexShrink: 0 },
//   search:     { flex: 1, color: '#fff', fontSize: 14 },

//   filtersRow: { paddingHorizontal: 16, gap: 8 },
//   filterChip: {
//     paddingHorizontal: 14,
//     paddingVertical:    7,
//     borderRadius:       99,
//     borderWidth:        1,
//     borderColor:        Colors.border.DEFAULT,
//     backgroundColor:    Colors.bg.elevated,
//   },
//   filterChipActive: {
//     backgroundColor: `${Colors.accent.indigo}20`,
//     borderColor:     `${Colors.accent.indigo}50`,
//   },
//   filterText:       { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
//   filterTextActive: { color: Colors.accent.indigo, fontWeight: '700' },

//   list:       { padding: 16, paddingBottom: 100 },
//   empty:      { alignItems: 'center', gap: 8, paddingVertical: 60 },
//   emptyTitle: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
//   emptyText:  { fontSize: 13, color: Colors.text.muted, textAlign: 'center' },
// });
