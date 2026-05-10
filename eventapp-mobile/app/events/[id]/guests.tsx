/**
 * eventapp-mobile/app/events/[id]/guests.tsx
 *
 * REDESIGNED — premium-grade Guests screen.
 *
 * Layout:
 *  ┌─────────────────────────────────────┐
 *  │  ← Guests          [⋯] [+ invite]  │
 *  │  X total · Y checked in             │
 *  ├─────────────────────────────────────┤
 *  │  Stats row: 4 cards (confirmed/     │
 *  │  pending/declined/checked in)        │
 *  ├─────────────────────────────────────┤
 *  │  Search bar                          │
 *  │  Filter chips (compact pills)       │
 *  ├─────────────────────────────────────┤
 *  │  Guest list (premium cards)         │
 *  │  Empty state (illustrated)          │
 *  └─────────────────────────────────────┘
 *  Bottom sheet: Add guest form
 *
 * All logic, store calls, and API preserved.
 */

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  Pressable, RefreshControl, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather }        from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics       from 'expo-haptics';
import Toast              from 'react-native-toast-message';

import { useGuestStore }  from '@/store/guest.store';
import { BottomSheet }    from '@/components/ui/BottomSheet';
import { Input }          from '@/components/ui/Input';
import { Colors }         from '@/constants/colors';
import { GuestStatus }    from '@/types';

const { width: SW } = Dimensions.get('window');

/* ── Filter config ───────────────────────────────────────────── */
type Filter = 'ALL' | GuestStatus | 'CHECKED_IN';

const FILTERS: { key: Filter; label: string; color: string }[] = [
  { key: 'ALL',        label: 'All',        color: Colors.accent.indigo  },
  { key: 'CONFIRMED',  label: 'Confirmed',  color: Colors.accent.emerald },
  { key: 'PENDING',    label: 'Pending',    color: Colors.accent.amber   },
  { key: 'DECLINED',   label: 'Declined',   color: Colors.accent.red     },
  { key: 'CHECKED_IN', label: 'Checked In', color: '#06b6d4'             },
];

/* ── Status config ───────────────────────────────────────────── */
const STATUS_CFG: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  CONFIRMED:  { color: Colors.accent.emerald, bg: `${Colors.accent.emerald}18`, dot: Colors.accent.emerald, label: 'Confirmed'  },
  PENDING:    { color: Colors.accent.amber,   bg: `${Colors.accent.amber}18`,   dot: Colors.accent.amber,   label: 'Pending'    },
  DECLINED:   { color: Colors.accent.red,     bg: `${Colors.accent.red}18`,     dot: Colors.accent.red,     label: 'Declined'   },
  GOING:      { color: Colors.accent.emerald, bg: `${Colors.accent.emerald}18`, dot: Colors.accent.emerald, label: 'Going'      },
  NOT_GOING:  { color: Colors.accent.red,     bg: `${Colors.accent.red}18`,     dot: Colors.accent.red,     label: 'Not Going'  },
};

function getStatusCfg(guest: any) {
  if (guest.checked_in_at) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.14)', dot: '#06b6d4', label: 'Checked In' };
  return STATUS_CFG[guest.status] ?? { color: Colors.text.muted, bg: Colors.bg.elevated, dot: Colors.text.subtle, label: guest.status };
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

/* ══════════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════════ */
function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={[sc.card, { borderColor: `${accent}22` }]}>
      <LinearGradient
        colors={[`${accent}18`, `${accent}07`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <Text style={[sc.value, { color: accent }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
    backgroundColor: Colors.bg.card,
    overflow: 'hidden', gap: 3,
  },
  value: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, textTransform: 'uppercase', letterSpacing: 0.5 },
});

/* ══════════════════════════════════════════════════════════════
   GUEST CARD
══════════════════════════════════════════════════════════════ */
function GuestCard({ guest, onPress }: { guest: any; onPress: () => void }) {
  const cfg      = getStatusCfg(guest);
  const initials = getInitials(guest.full_name);

  return (
    <Pressable style={gc.card} onPress={onPress} activeOpacity={0.82}>
      {/* Avatar */}
      <View style={[gc.avatar, { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}40` }]}>
        {guest.is_vip && (
          <View style={gc.vipCrown}>
            <Text style={{ fontSize: 8 }}>👑</Text>
          </View>
        )}
        <Text style={[gc.initials, { color: cfg.color }]}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={gc.info}>
        <View style={gc.nameRow}>
          <Text style={gc.name} numberOfLines={1}>{guest.full_name}</Text>
          {guest.is_vip && (
            <View style={gc.vipBadge}>
              <Text style={gc.vipTxt}>VIP</Text>
            </View>
          )}
        </View>
        {guest.email ? (
          <Text style={gc.meta} numberOfLines={1}>{guest.email}</Text>
        ) : guest.phone ? (
          <Text style={gc.meta} numberOfLines={1}>{guest.phone}</Text>
        ) : (
          <Text style={gc.metaEmpty}>No contact info</Text>
        )}
        {guest.checked_in_at && (
          <Text style={gc.checkinTime}>
            <Feather name="check-circle" size={10} color="#06b6d4" /> {fmtDateTime(guest.checked_in_at)}
          </Text>
        )}
      </View>

      {/* Status pill */}
      <View style={[gc.statusPill, { backgroundColor: cfg.bg }]}>
        <View style={[gc.statusDot, { backgroundColor: cfg.dot }]} />
        <Text style={[gc.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.15)" style={{ marginLeft: 2 }} />
    </Pressable>
  );
}

const gc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border.subtle,
    padding: 14,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, position: 'relative', flexShrink: 0,
  },
  initials: { fontSize: 15, fontWeight: '900' },
  vipCrown: { position: 'absolute', top: -6, right: -4, zIndex: 2 },
  info:     { flex: 1, gap: 3, minWidth: 0 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:     { fontSize: 14, fontWeight: '800', color: '#fff', flex: 1 },
  vipBadge: {
    backgroundColor: 'rgba(201,169,110,0.2)', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
    borderWidth: 1, borderColor: 'rgba(201,169,110,0.4)',
  },
  vipTxt:      { fontSize: 8, fontWeight: '900', color: '#c9a96e', letterSpacing: 0.5 },
  meta:        { fontSize: 12, color: Colors.text.muted },
  metaEmpty:   { fontSize: 12, color: Colors.text.subtle, fontStyle: 'italic' },
  checkinTime: { fontSize: 11, color: '#06b6d4', fontWeight: '600' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
    flexShrink: 0,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '800' },
});

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════ */
function EmptyGuests({ filter, query, onAdd }: { filter: Filter; query: string; onAdd: () => void }) {
  const msg = query
    ? { icon: 'search'    as const, title: `No results for "${query}"`, sub: 'Try a different name or email.' }
    : filter !== 'ALL'
      ? { icon: 'filter'   as const, title: `No ${filter.toLowerCase()} guests`, sub: 'Guests with this status will appear here.' }
      : { icon: 'users'    as const, title: 'No guests yet',                      sub: 'Add your first guest to get started.' };

  return (
    <View style={em.wrap}>
      <View style={em.iconWrap}>
        <LinearGradient
          colors={[`${Colors.accent.indigo}20`, `${Colors.accent.violet}10`]}
          style={StyleSheet.absoluteFill}
        />
        <Feather name={msg.icon} size={28} color={Colors.accent.indigo} />
      </View>
      <Text style={em.title}>{msg.title}</Text>
      <Text style={em.sub}>{msg.sub}</Text>
      {filter === 'ALL' && !query && (
        <Pressable style={em.btn} onPress={onAdd}>
          <LinearGradient
            colors={[Colors.accent.indigo, Colors.accent.violet]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Feather name="user-plus" size={15} color="#fff" />
          <Text style={em.btnTxt}>Add First Guest</Text>
        </Pressable>
      )}
    </View>
  );
}

const em = StyleSheet.create({
  wrap:    { alignItems: 'center', paddingTop: 48, gap: 12, paddingHorizontal: 32 },
  iconWrap:{
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 4,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}20`,
  },
  title:   { fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.3 },
  sub:     { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 44, paddingHorizontal: 24, borderRadius: 12,
    overflow: 'hidden', marginTop: 8,
  },
  btnTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },
});

/* ══════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════ */
export default function GuestsScreen() {
  const { id: eventId }  = useLocalSearchParams<{ id: string }>();
  const router           = useRouter();
  const insets           = useSafeAreaInsets();
  const { guests, dashboard, fetchGuests, fetchDashboard, createGuest } = useGuestStore();

  const [query,    setQuery]    = useState('');
  const [filter,   setFilter]   = useState<Filter>('ALL');
  const [addOpen,  setAddOpen]  = useState(false);
  const [focused,  setFocused]  = useState(false);
  const [newGuest, setNewGuest] = useState({ full_name: '', email: '', phone: '', is_vip: false });
  const [adding,   setAdding]   = useState(false);

  useEffect(() => {
    if (!eventId) return;
    fetchGuests(eventId);
    fetchDashboard(eventId);
  }, [eventId]);

  const filtered = useMemo(() => {
    return guests
      .filter(g => {
        if (filter === 'ALL')        return true;
        if (filter === 'CHECKED_IN') return !!g.checked_in_at;
        return g.status === filter;
      })
      .filter(g =>
        !query ||
        g.full_name.toLowerCase().includes(query.toLowerCase()) ||
        g.email?.toLowerCase().includes(query.toLowerCase()) ||
        g.phone?.includes(query)
      );
  }, [guests, filter, query]);

  const onRefresh = useCallback(() => {
    if (!eventId) return;
    fetchGuests(eventId);
    fetchDashboard(eventId);
  }, [eventId]);

  const handleAdd = async () => {
    if (!newGuest.full_name.trim()) {
      Toast.show({ type: 'error', text1: 'Full name is required' });
      return;
    }
    setAdding(true);
    const result = await createGuest(eventId!, newGuest);
    setAdding(false);
    if (result.success) {
      Toast.show({ type: 'success', text1: '✓ Guest added' });
      setAddOpen(false);
      setNewGuest({ full_name: '', email: '', phone: '', is_vip: false });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to add guest' });
    }
  };

  const dash = dashboard as any;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={17} color={Colors.text.muted} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Guests</Text>
          <Text style={s.headerSub}>
            {dash
              ? `${dash.total ?? guests.length} total · ${dash.checked_in ?? 0} checked in`
              : `${guests.length} total`
            }
          </Text>
        </View>

        {/* Import / more */}
        <Pressable style={s.iconBtn} hitSlop={8}>
          <Feather name="more-horizontal" size={17} color={Colors.text.muted} />
        </Pressable>

        {/* Add guest */}
        <Pressable
          style={s.addBtn}
          onPress={() => setAddOpen(true)}
          hitSlop={6}
        >
          <LinearGradient
            colors={[Colors.accent.indigo, Colors.accent.violet]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          <Feather name="user-plus" size={16} color="#fff" />
        </Pressable>
      </View>

      {/* ── STATS ROW ───────────────────────────────────────────── */}
      {dash && (
        <View style={s.statsRow}>
          <StatCard label="Confirmed"  value={dash.confirmed  ?? 0} accent={Colors.accent.emerald} />
          <StatCard label="Pending"    value={dash.pending    ?? 0} accent={Colors.accent.amber}   />
          <StatCard label="Declined"   value={dash.declined   ?? 0} accent={Colors.accent.red}     />
          <StatCard label="Checked In" value={dash.checked_in ?? 0} accent="#06b6d4"               />
        </View>
      )}

      {/* ── SEARCH ──────────────────────────────────────────────── */}
      <View style={[s.searchWrap, focused && s.searchFocused]}>
        <Feather name="search" size={15} color={focused ? Colors.accent.indigo : Colors.text.subtle} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name, email or phone…"
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

      {/* ── FILTER CHIPS ────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersRow}
      >
        {FILTERS.map(f => {
          const active = filter === f.key;
          const count  = f.key === 'ALL'
            ? guests.length
            : f.key === 'CHECKED_IN'
              ? (dash?.checked_in ?? guests.filter((g: any) => g.checked_in_at).length)
              : guests.filter((g: any) => g.status === f.key).length;

          return (
            <Pressable
              key={f.key}
              style={[
                s.chip,
                active
                  ? { backgroundColor: `${f.color}22`, borderColor: `${f.color}55` }
                  : { backgroundColor: Colors.bg.elevated, borderColor: Colors.border.subtle },
              ]}
              onPress={() => {
                setFilter(f.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[s.chipTxt, active && { color: f.color }]}>{f.label}</Text>
              <View style={[s.chipCount, { backgroundColor: active ? `${f.color}30` : Colors.border.subtle }]}>
                <Text style={[s.chipCountTxt, { color: active ? f.color : Colors.text.subtle }]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── GUEST LIST ──────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={Colors.accent.indigo}
          />
        }
      >
        {filtered.length === 0 ? (
          <EmptyGuests filter={filter} query={query} onAdd={() => setAddOpen(true)} />
        ) : (
          <>
            <Text style={s.listCount}>
              {filtered.length} {filtered.length === 1 ? 'guest' : 'guests'}
            </Text>
            <View style={s.listItems}>
              {filtered.map((g: any) => (
                <GuestCard
                  key={g.id}
                  guest={g}
                  onPress={() => router.push(`/events/${eventId}/guests/${g.id}` as never)}
                />
              ))}
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── ADD GUEST SHEET ─────────────────────────────────────── */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="Add Guest">
        <View style={ag.form}>
          <Input
            label="Full Name *"
            icon="user"
            placeholder="Jane Smith"
            value={newGuest.full_name}
            onChangeText={t => setNewGuest(g => ({ ...g, full_name: t }))}
          />
          <Input
            label="Email"
            icon="mail"
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={newGuest.email}
            onChangeText={t => setNewGuest(g => ({ ...g, email: t }))}
          />
          <Input
            label="Phone"
            icon="phone"
            placeholder="+1 555 000 0000"
            keyboardType="phone-pad"
            value={newGuest.phone}
            onChangeText={t => setNewGuest(g => ({ ...g, phone: t }))}
          />

          {/* VIP toggle */}
          <Pressable
            style={[
              ag.vipRow,
              newGuest.is_vip && { borderColor: 'rgba(201,169,110,0.5)', backgroundColor: 'rgba(201,169,110,0.10)' },
            ]}
            onPress={() => {
              setNewGuest(g => ({ ...g, is_vip: !g.is_vip }));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={ag.vipEmoji}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={ag.vipLabel}>VIP Guest</Text>
              <Text style={ag.vipSub}>Mark this guest as VIP</Text>
            </View>
            <View style={[ag.vipCheck, newGuest.is_vip && ag.vipCheckOn]}>
              {newGuest.is_vip && <Feather name="check" size={11} color="#fff" />}
            </View>
          </Pressable>

          {/* Submit */}
          <Pressable
            style={[ag.submitBtn, adding && { opacity: 0.6 }]}
            onPress={handleAdd}
            disabled={adding}
          >
            <LinearGradient
              colors={[Colors.accent.indigo, Colors.accent.violet]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Feather name="user-plus" size={16} color="#fff" />
            <Text style={ag.submitTxt}>{adding ? 'Adding…' : 'Add Guest'}</Text>
          </Pressable>
        </View>
      </BottomSheet>

    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const BG     = Colors.bg.primary;
const BORDER = Colors.border.DEFAULT;
const ELEV   = Colors.bg.elevated;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: ELEV, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  headerSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: ELEV, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingBottom: 14,
  },

  /* Search */
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, height: 44,
    backgroundColor: ELEV, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  searchFocused: {
    borderColor: `${Colors.accent.indigo}55`,
    backgroundColor: `${Colors.accent.indigo}08`,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
  clearBtn: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.bg.card,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Filter chips */
  filtersRow: {
    paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, height: 32, borderRadius: 99, borderWidth: 1,
  },
  chipTxt:      { fontSize: 13, fontWeight: '700', color: Colors.text.muted },
  chipCount:    { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  chipCountTxt: { fontSize: 10, fontWeight: '800' },

  /* List */
  list:      { paddingHorizontal: 16 },
  listCount: {
    fontSize: 11, fontWeight: '700', color: Colors.text.subtle,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  listItems: { gap: 10 },
});

/* Add guest form */
const ag = StyleSheet.create({
  form:    { gap: 14, paddingBottom: 8 },
  vipRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 14, padding: 14,
    backgroundColor: ELEV,
  },
  vipEmoji: { fontSize: 22 },
  vipLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
  vipSub:   { fontSize: 12, color: Colors.text.muted, marginTop: 1 },
  vipCheck: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 1.5, borderColor: BORDER,
    backgroundColor: ELEV,
    alignItems: 'center', justifyContent: 'center',
  },
  vipCheckOn: {
    backgroundColor: Colors.accent.indigo,
    borderColor: Colors.accent.indigo,
  },
  submitBtn: {
    height: 52, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, overflow: 'hidden',
    marginTop: 4,
  },
  submitTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});


