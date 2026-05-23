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

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  Pressable, RefreshControl, Dimensions, Animated,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather }        from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics       from 'expo-haptics';
import Toast              from 'react-native-toast-message';

import { useGuestStore }         from '@/store/guest.store';
import { useSeatingStore }       from '@/store/seating.store';
import { useSubscriptionStore }  from '@/store/subscription.store';
import { BottomSheet }     from '@/components/ui/BottomSheet';
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
function GuestCard({
  guest, onPress, selectMode = false, selected = false, onToggle,
  seatInfo, onAssignSeat,
}: {
  guest: any; onPress: () => void;
  selectMode?: boolean; selected?: boolean; onToggle?: () => void;
  seatInfo?: { tableName: string; seatNumber: number | null } | null;
  onAssignSeat?: () => void;
}) {
  const cfg      = getStatusCfg(guest);
  const initials = getInitials(guest.full_name);
  const showAssignBtn = !seatInfo && !selectMode;

  return (
    // Outer View — never tappable itself; avoids any nested-Pressable conflicts
    <View style={[gc.card, selected && gc.cardSelected, showAssignBtn && gc.cardWithFooter]}>

      {/* ── Main row — taps → guest detail (or toggle in select mode) ── */}
      <Pressable
        style={gc.mainRow}
        onPress={selectMode ? onToggle : onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.05)', borderless: false }}
      >
        {/* Selection checkbox */}
        {selectMode && (
          <View style={[gc.checkbox, selected && gc.checkboxChecked]}>
            {selected && <Feather name="check" size={11} color="#fff" />}
          </View>
        )}

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
          {seatInfo && (
            <Text style={gc.seatChip} numberOfLines={1}>
              {'🪑 '}{seatInfo.tableName}{seatInfo.seatNumber != null ? ` · Seat ${seatInfo.seatNumber}` : ''}
            </Text>
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

        {!selectMode && (
          <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.15)" style={{ marginLeft: 2 }} />
        )}
      </Pressable>

      {/* ── Assign Seat footer — completely separate from the main row ── */}
      {showAssignBtn && (
        <Pressable
          style={gc.assignRow}
          onPress={onAssignSeat}
          android_ripple={{ color: `${Colors.accent.indigo}20`, borderless: false }}
        >
          <Feather name="layout" size={11} color={Colors.accent.indigo} />
          <Text style={gc.assignSeat}>Assign Seat</Text>
          <Feather name="chevron-right" size={11} color={Colors.accent.indigo} style={{ marginLeft: 'auto' }} />
        </Pressable>
      )}
    </View>
  );
}

const gc = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: `${Colors.accent.indigo}55`,
    backgroundColor: `${Colors.accent.indigo}0a`,
  },
  cardWithFooter: {
    // extra bottom border separation handled by assignRow's borderTop
  },
  mainRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
    borderWidth: 1.5, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg.elevated,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent.indigo,
    borderColor: Colors.accent.indigo,
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
  seatChip:    { fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' },
  checkinTime: { fontSize: 11, color: '#06b6d4', fontWeight: '600' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
    flexShrink: 0,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusTxt: { fontSize: 10, fontWeight: '800' },
  assignRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: `${Colors.accent.indigo}18`,
    backgroundColor: `${Colors.accent.indigo}08`,
  },
  assignSeat: {
    fontSize: 12, fontWeight: '700',
    color: Colors.accent.indigo, letterSpacing: 0.2,
  },
});

/* ══════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════ */
function EmptyGuests({ filter, query, onAdd, onContacts }: { filter: Filter; query: string; onAdd: () => void; onContacts: () => void }) {
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
        <View style={em.btnRow}>
          <Pressable style={em.btn} onPress={onAdd}>
            <LinearGradient
              colors={[Colors.accent.indigo, Colors.accent.violet]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Feather name="user-plus" size={15} color="#fff" />
            <Text style={em.btnTxt}>Add Guest</Text>
          </Pressable>
          <Pressable style={em.contactsBtn} onPress={onContacts}>
            <Feather name="book-open" size={15} color={Colors.accent.indigo} />
            <Text style={em.contactsBtnTxt}>From Contacts</Text>
          </Pressable>
        </View>
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
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    height: 44, paddingHorizontal: 20, borderRadius: 12,
    overflow: 'hidden', flex: 1, justifyContent: 'center',
  },
  btnTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  contactsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 44, paddingHorizontal: 20, borderRadius: 12, flex: 1,
    borderWidth: 1.5, borderColor: `${Colors.accent.indigo}40`,
    backgroundColor: `${Colors.accent.indigo}10`,
  },
  contactsBtnTxt: { fontSize: 14, fontWeight: '800', color: Colors.accent.indigo },
});

/* ══════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════ */
export default function GuestsScreen() {
  const { id: eventId }  = useLocalSearchParams<{ id: string }>();
  const router           = useRouter();
  const insets           = useSafeAreaInsets();
  const {
    guests, dashboard, fetchGuests, fetchDashboard, getAttendance, createGuest,
    bulkDeleteGuests, bulkSubmitRsvp, bulkSendInvitations,
  } = useGuestStore();
  const prices    = useSubscriptionStore(s => s.prices);
  const plan      = useSubscriptionStore(s => s.plan);
  const isStarter = plan === 'starter';

  const {
    fetchAssignments, fetchLocations,
    getAssignmentForGuest, getLocationById,
  } = useSeatingStore();

  const [query,       setQuery]       = useState('');
  const [filter,      setFilter]      = useState<Filter>('ALL');
  const [addOpen,     setAddOpen]     = useState(false);
  const [focused,     setFocused]     = useState(false);
  const [newGuest,    setNewGuest]    = useState({ full_name: '', email: '', phone: '', is_vip: false });
  const [adding,      setAdding]      = useState(false);
  const [limitModal,  setLimitModal]  = useState(false);

  /* Bulk selection */
  const [selectMode,   setSelectMode]   = useState(false);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [rsvpMenu,     setRsvpMenu]     = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!eventId) return;
      fetchGuests(eventId);
      fetchDashboard(eventId);
      getAttendance(eventId);
      fetchAssignments(eventId);
      fetchLocations(eventId);

      // Poll every 15 s so check-ins from the web appear automatically
      const interval = setInterval(() => {
        if (!eventId) return;
        fetchGuests(eventId);
        fetchDashboard(eventId);
        getAttendance(eventId);
      }, 15000);
      return () => clearInterval(interval);
    }, [eventId])
  );

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
    fetchAssignments(eventId);
    fetchLocations(eventId);
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
    } else if (result.code === 'PLAN_LIMIT_GUESTS') {
      setAddOpen(false);
      setLimitModal(true);
    } else {
      Toast.show({ type: 'error', text1: 'Failed to add guest' });
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((g: any) => g.id)));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedIds, filtered]);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setRsvpMenu(false);
  }, []);

  const handleBulkDelete = useCallback(() => {
    Alert.alert(
      'Delete Guests',
      `Remove ${selectedIds.size} guest${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setBulkLoading(true);
            const res = await bulkDeleteGuests(eventId!, Array.from(selectedIds));
            setBulkLoading(false);
            if (res.success) {
              Toast.show({ type: 'success', text1: `${selectedIds.size} guest${selectedIds.size !== 1 ? 's' : ''} deleted` });
              exitSelectMode();
            } else {
              Toast.show({ type: 'error', text1: 'Bulk delete failed' });
            }
          },
        },
      ],
    );
  }, [selectedIds, eventId, bulkDeleteGuests, exitSelectMode]);

  const handleBulkInvite = useCallback(async () => {
    setBulkLoading(true);
    const res = await bulkSendInvitations(eventId!, Array.from(selectedIds));
    setBulkLoading(false);
    if (res.success) {
      Toast.show({ type: 'success', text1: `Invitations sent to ${selectedIds.size} guest${selectedIds.size !== 1 ? 's' : ''}` });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to send invitations' });
    }
  }, [selectedIds, eventId, bulkSendInvitations]);

  const handleBulkRsvp = useCallback(async (status: string) => {
    setRsvpMenu(false);
    setBulkLoading(true);
    const res = await bulkSubmitRsvp(eventId!, Array.from(selectedIds), status);
    setBulkLoading(false);
    if (res.success) {
      Toast.show({ type: 'success', text1: `RSVP set to ${status.toLowerCase()} for ${selectedIds.size} guest${selectedIds.size !== 1 ? 's' : ''}` });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to update RSVP' });
    }
  }, [selectedIds, eventId, bulkSubmitRsvp]);

  const dash = dashboard as any;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={selectMode ? exitSelectMode : () => router.back()} hitSlop={10}>
          <Feather name={selectMode ? 'x' : 'arrow-left'} size={17} color={Colors.text.muted} />
        </Pressable>

        <View style={{ flex: 1 }}>
          {selectMode ? (
            <>
              <Text style={s.headerTitle}>{selectedIds.size} selected</Text>
              <Pressable onPress={toggleSelectAll} hitSlop={6}>
                <Text style={s.selectAllTxt}>
                  {selectedIds.size === filtered.length ? 'Deselect all' : 'Select all'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.headerTitle}>Guests</Text>
              <Text style={s.headerSub}>
                {dash
                  ? `${dash.total ?? guests.length} total · ${dash.checked_in ?? 0} checked in`
                  : `${guests.length} total`
                }
              </Text>
            </>
          )}
        </View>

        {!selectMode && (
          <>
            {/* Select mode toggle */}
            {guests.length > 0 && (
              <Pressable
                style={s.iconBtn}
                onPress={() => { setSelectMode(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
                hitSlop={8}
              >
                <Feather name="check-square" size={17} color={Colors.text.muted} />
              </Pressable>
            )}

            {/* From Contacts shortcut */}
            <Pressable
              style={s.iconBtn}
              onPress={() => router.push(`/events/${eventId}/guests/contacts` as never)}
              hitSlop={8}
            >
              <Feather name="book-open" size={17} color={Colors.accent.indigo} />
            </Pressable>

            {/* Add guest manually */}
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
          </>
        )}
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
          <EmptyGuests
            filter={filter}
            query={query}
            onAdd={() => setAddOpen(true)}
            onContacts={() => router.push(`/events/${eventId}/guests/contacts` as never)}
          />
        ) : (
          <>
            <Text style={s.listCount}>
              {filtered.length} {filtered.length === 1 ? 'guest' : 'guests'}
            </Text>
            <View style={s.listItems}>
              {filtered.map((g: any) => {
                const assignment = getAssignmentForGuest(g.id);
                const location   = assignment ? getLocationById(assignment.seating_table_id) : null;
                const seatInfo   = assignment && location
                  ? { tableName: location.location_name, seatNumber: assignment.seat_number }
                  : null;
                return (
                  <GuestCard
                    key={g.id}
                    guest={g}
                    selectMode={selectMode}
                    selected={selectedIds.has(g.id)}
                    onToggle={() => toggleSelect(g.id)}
                    onPress={() => router.push(`/events/${eventId}/guests/${g.id}` as never)}
                    seatInfo={seatInfo}
                    onAssignSeat={() => router.push(`/events/${eventId}/seating` as never)}
                  />
                );
              })}
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── BULK ACTION TOOLBAR ─────────────────────────────────── */}
      {selectMode && selectedIds.size > 0 && (
        <View style={bl.toolbar}>
          <Text style={bl.count}>{selectedIds.size} selected</Text>
          <View style={bl.actions}>
            {/* Send Invite */}
            <Pressable style={bl.btn} onPress={handleBulkInvite} disabled={bulkLoading}>
              <Feather name="send" size={15} color={Colors.accent.indigo} />
              <Text style={[bl.btnTxt, { color: Colors.accent.indigo }]}>Invite</Text>
            </Pressable>

            {/* RSVP */}
            <Pressable style={bl.btn} onPress={() => setRsvpMenu(true)} disabled={bulkLoading}>
              <Feather name="check-circle" size={15} color={Colors.accent.emerald} />
              <Text style={[bl.btnTxt, { color: Colors.accent.emerald }]}>RSVP</Text>
            </Pressable>

            {/* Delete */}
            <Pressable style={bl.deleteBtn} onPress={handleBulkDelete} disabled={bulkLoading}>
              {bulkLoading
                ? <ActivityIndicator size="small" color={Colors.accent.red} />
                : <Feather name="trash-2" size={15} color={Colors.accent.red} />
              }
              <Text style={[bl.btnTxt, { color: Colors.accent.red }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── RSVP MENU MODAL ─────────────────────────────────────── */}
      <Modal visible={rsvpMenu} transparent animationType="fade" onRequestClose={() => setRsvpMenu(false)}>
        <Pressable style={rm.overlay} onPress={() => setRsvpMenu(false)}>
          <View style={rm.sheet}>
            <Text style={rm.title}>Set RSVP for {selectedIds.size} guest{selectedIds.size !== 1 ? 's' : ''}</Text>
            {[
              { label: 'Confirmed', value: 'CONFIRMED', color: Colors.accent.emerald },
              { label: 'Pending',   value: 'PENDING',   color: Colors.accent.amber   },
              { label: 'Declined',  value: 'DECLINED',  color: Colors.accent.red     },
            ].map(opt => (
              <Pressable key={opt.value} style={rm.option} onPress={() => handleBulkRsvp(opt.value)}>
                <View style={[rm.optDot, { backgroundColor: opt.color }]} />
                <Text style={[rm.optTxt, { color: opt.color }]}>{opt.label}</Text>
              </Pressable>
            ))}
            <Pressable style={rm.cancel} onPress={() => setRsvpMenu(false)}>
              <Text style={rm.cancelTxt}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ── GUEST LIMIT MODAL ───────────────────────────────────── */}
      <Modal visible={limitModal} transparent animationType="fade" onRequestClose={() => setLimitModal(false)}>
        <View style={lm.overlay}>
          <View style={lm.card}>
            {/* Close */}
            <Pressable style={lm.closeBtn} onPress={() => setLimitModal(false)}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.4)" />
            </Pressable>

            {/* Icon */}
            <LinearGradient colors={['#4f46e5', '#7c3aed']} style={lm.iconWrap}>
              <Feather name="lock" size={26} color="#fff" />
            </LinearGradient>

            {/* Badge */}
            <View style={lm.badge}>
              <Feather name="zap" size={9} color="#818cf8" />
              <Text style={lm.badgeTxt}>PLAN LIMIT REACHED</Text>
            </View>

            {/* Text */}
            <Text style={lm.title}>Guest Limit Reached</Text>
            <Text style={lm.sub}>
              {isStarter
                ? "You've hit the 500-guest Starter cap. Upgrade to Pro for unlimited guests per event."
                : 'Free plan allows 50 guests per event. Upgrade to Starter for 500, or Pro for unlimited.'}
            </Text>

            {/* Plan cards */}
            <View style={[lm.plans, isStarter && { justifyContent: 'center' }]}>
              {/* Starter — only shown to free users */}
              {!isStarter && (
                <View style={[lm.plan, lm.planStarter]}>
                  <Text style={lm.planName}>Starter</Text>
                  <Text style={lm.planPrice}>
                    {prices.starter?.amount != null ? `$${prices.starter.amount}` : '$19'}
                    <Text style={lm.planPer}>/mo</Text>
                  </Text>
                  <Text style={lm.planDetail}>500 guests · 5 events</Text>
                </View>
              )}
              {/* Pro */}
              <View style={[lm.plan, lm.planPro, isStarter && { flex: 0, width: '80%' }]}>
                <View style={lm.bestBadge}><Text style={lm.bestTxt}>{isStarter ? 'UPGRADE' : 'BEST'}</Text></View>
                <Text style={lm.planName}>Pro</Text>
                <Text style={[lm.planPrice, { color: '#c9a96e' }]}>
                  {prices.pro?.amount != null ? `$${prices.pro.amount}` : '$49'}
                  <Text style={lm.planPer}>/mo</Text>
                </Text>
                <Text style={lm.planDetail}>Unlimited guests &amp; events</Text>
              </View>
            </View>

            {/* CTA */}
            <Pressable
              style={lm.cta}
              onPress={() => { setLimitModal(false); router.push('/profile/billing' as never); }}
            >
              <LinearGradient
                colors={isStarter ? ['#c9a96e', '#f59e0b'] : ['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Feather name="zap" size={16} color={isStarter ? '#000' : '#fff'} />
              <Text style={[lm.ctaTxt, isStarter && { color: '#000' }]}>
                {isStarter ? 'Upgrade to Pro' : 'Upgrade Now'}
              </Text>
            </Pressable>

            {/* Cancel */}
            <Pressable onPress={() => setLimitModal(false)} style={{ paddingVertical: 6 }}>
              <Text style={lm.cancelTxt}>Not now</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  headerTitle:   { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  headerSub:     { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  selectAllTxt:  { fontSize: 12, fontWeight: '700', color: Colors.accent.indigo, marginTop: 1 },
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

/* Guest limit modal */
const lm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', borderRadius: 28, padding: 28,
    backgroundColor: '#0e0e1a',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', gap: 14,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrap: {
    width: 68, height: 68, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
  },
  badgeTxt: { fontSize: 9, fontWeight: '900', color: '#818cf8', letterSpacing: 1.5 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20 },
  plans: { flexDirection: 'row', gap: 10, width: '100%' },
  plan: { flex: 1, borderRadius: 18, padding: 14, gap: 4 },
  planStarter: { backgroundColor: 'rgba(99,102,241,0.1)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  planPro: { backgroundColor: 'rgba(201,169,110,0.08)', borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)', position: 'relative', overflow: 'hidden' },
  bestBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#c9a96e',
    paddingHorizontal: 8, paddingVertical: 3,
    borderBottomLeftRadius: 10,
  },
  bestTxt: { fontSize: 8, fontWeight: '900', color: '#000' },
  planName: { fontSize: 15, fontWeight: '900', color: '#fff' },
  planPrice: { fontSize: 26, fontWeight: '900', color: '#818cf8' },
  planPer: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.35)' },
  planDetail: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  cta: {
    width: '100%', height: 52, borderRadius: 16, marginTop: 4,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8, overflow: 'hidden',
  },
  ctaTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
  cancelTxt: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
});

/* Bulk action toolbar */
const bl = StyleSheet.create({
  toolbar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg.elevated,
    borderTopWidth: 1, borderTopColor: Colors.border.subtle,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  count: { fontSize: 13, fontWeight: '800', color: Colors.text.muted, flexShrink: 0 },
  actions: { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.bg.card,
  },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: `${Colors.accent.red}40`,
    backgroundColor: `${Colors.accent.red}12`,
  },
  btnTxt: { fontSize: 13, fontWeight: '700' },
});

/* RSVP modal */
const rm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24,
  },
  sheet: {
    width: '90%', backgroundColor: Colors.bg.elevated,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border.subtle,
    padding: 16, gap: 4,
  },
  title: { fontSize: 14, fontWeight: '800', color: Colors.text.muted, marginBottom: 10, textAlign: 'center' },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14,
    backgroundColor: Colors.bg.card, marginBottom: 4,
  },
  optDot:    { width: 10, height: 10, borderRadius: 5 },
  optTxt:    { fontSize: 15, fontWeight: '800' },
  cancel: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 14, marginTop: 4,
    backgroundColor: Colors.bg.card,
  },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: Colors.text.muted },
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


