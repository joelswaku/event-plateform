/**
 * app/events/[id]/seating.tsx
 *
 * Full seating management screen.
 * Mirrors web/(dashboard)/events/[eventId]/seating/page.js small-viewport design:
 *   • Stats 2×2 grid (capacity, assigned, available, fill rate)
 *   • Table cards — accent stripe, shape icon, fill bar, guest avatars, assign/remove
 *   • Add Table FAB
 *   • Bottom sheets: Add/Edit Table · Assign Guest · Auto-Assign · Clear All
 *   • Unassigned guests section (expandable below table list)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useSeatingStore } from '@/store/seating.store';
import { useGuestStore }   from '@/store/guest.store';
import { BottomSheet }     from '@/components/ui/BottomSheet';
import { ConfirmModal }    from '@/components/ui/ConfirmModal';
import { Colors }          from '@/constants/colors';
import { Guest, SeatingLocation, SeatingAssignment } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
}

const AVATAR_PALETTE = [
  '#6366f1','#8b5cf6','#ec4899','#14b8a6',
  '#f59e0b','#10b981','#3b82f6','#f43f5e',
];
function avatarBg(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function fillAccent(pct: number) {
  if (pct >= 90) return '#f43f5e';
  if (pct >= 60) return '#f59e0b';
  return '#10b981';
}

// ── GuestAvatar ──────────────────────────────────────────────────────────────────

function GuestAvatar({ name, vip, size = 28 }: { name: string; vip?: boolean; size?: number }) {
  return (
    <View style={[avs.wrap, { width: size, height: size, backgroundColor: avatarBg(name), borderRadius: size / 2 }]}>
      <Text style={[avs.text, { fontSize: size * 0.36 }]}>{getInitials(name)}</Text>
      {vip && <Text style={avs.crown}>👑</Text>}
    </View>
  );
}
const avs = StyleSheet.create({
  wrap:  { alignItems: 'center', justifyContent: 'center' },
  text:  { color: '#fff', fontWeight: '800' },
  crown: { position: 'absolute', top: -6, right: -4, fontSize: 9 },
});

// ── Stats row ────────────────────────────────────────────────────────────────────

function StatsGrid({ cap, asgn, tables }: { cap: number; asgn: number; tables: number }) {
  const free = Math.max(0, cap - asgn);
  const rate = cap > 0 ? Math.round((asgn / cap) * 100) : 0;
  const items = [
    { label: 'Total Capacity', value: cap,      accent: '#6366f1', sub: `${tables} table${tables !== 1 ? 's' : ''}` },
    { label: 'Assigned',       value: asgn,     accent: '#10b981', sub: `${rate}% fill rate`              },
    { label: 'Available',      value: free,     accent: free > 0 ? '#f59e0b' : '#10b981', sub: free === 0 ? 'All seated!' : 'seats free' },
    { label: 'Fill Rate',      value: `${rate}%`, accent: rate >= 80 ? '#f43f5e' : rate >= 50 ? '#f59e0b' : '#10b981',
      sub: rate >= 90 ? 'Almost full' : rate >= 50 ? 'Filling up' : 'Plenty of space' },
  ];
  return (
    <View style={sg.grid}>
      {items.map(({ label, value, accent, sub }) => (
        <View key={label} style={sg.card}>
          <Text style={[sg.value, { color: accent }]}>{value}</Text>
          <Text style={sg.label}>{label}</Text>
          {sub && <Text style={sg.sub}>{sub}</Text>}
        </View>
      ))}
    </View>
  );
}
const sg = StyleSheet.create({
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  card:  { flex: 1, minWidth: '45%', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 14, paddingVertical: 12 },
  value: { fontSize: 22, fontWeight: '900', marginBottom: 2 },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  sub:   { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 },
});

// ── TableCard ────────────────────────────────────────────────────────────────────

function TableCard({
  loc, assigns, guests, saving,
  onEdit, onDelete, onAssign, onRemove,
}: {
  loc: SeatingLocation;
  assigns: SeatingAssignment[];
  guests: Guest[];
  saving: boolean;
  onEdit: (l: SeatingLocation) => void;
  onDelete: (id: string) => void;
  onAssign: (l: SeatingLocation) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const filled  = assigns.length;
  const cap     = loc.capacity || 0;
  const pct     = cap > 0 ? Math.round((filled / cap) * 100) : 0;
  const isFull  = filled >= cap;
  const accent  = fillAccent(pct);

  const enriched = assigns.map(a => ({ ...a, g: guests.find(x => x.id === a.guest_id) }));

  const ShapeIcon = loc.shape === 'rectangle' ? 'square' : loc.shape === 'custom' ? 'triangle' : 'circle';

  return (
    <View style={tc.card}>
      {/* Accent stripe */}
      <View style={[tc.stripe, { backgroundColor: accent }]} />

      {/* Header row */}
      <View style={tc.header}>
        <View style={[tc.shapeIcon, { backgroundColor: `${accent}20` }]}>
          <Feather name={ShapeIcon as any} size={14} color={accent} />
        </View>
        <View style={tc.titleWrap}>
          <Text style={tc.tableName} numberOfLines={1}>{loc.location_name}</Text>
          <Text style={tc.tableSub}>{filled}/{cap} seats · {pct}% full</Text>
        </View>
        <View style={tc.actions}>
          <Pressable onPress={() => onEdit(loc)} style={tc.iconBtn} hitSlop={6}>
            <Feather name="edit-2" size={13} color="rgba(255,255,255,0.3)" />
          </Pressable>
          <Pressable onPress={() => onDelete(loc.id)} style={tc.iconBtn} hitSlop={6}>
            <Feather name="trash-2" size={13} color="rgba(239,68,68,0.5)" />
          </Pressable>
        </View>
      </View>

      {/* Fill bar */}
      <View style={tc.barWrap}>
        <View style={tc.barBg}>
          <View style={[tc.barFill, { width: `${pct}%` as any, backgroundColor: accent }]} />
        </View>
      </View>

      {/* Guest avatars row */}
      {enriched.length > 0 && (
        <Pressable onPress={() => setExpanded(v => !v)} style={tc.guestRow}>
          <View style={tc.avatarStack}>
            {enriched.slice(0, 6).map(({ guest_id, g }) => (
              <View key={guest_id} style={[tc.avatarItem, { marginLeft: enriched.indexOf(enriched.find(e => e.guest_id === guest_id)!) === 0 ? 0 : -8 }]}>
                <GuestAvatar name={g?.full_name ?? '?'} vip={g?.is_vip} size={24} />
              </View>
            ))}
            {enriched.length > 6 && (
              <View style={tc.avatarMore}>
                <Text style={tc.avatarMoreTxt}>+{enriched.length - 6}</Text>
              </View>
            )}
          </View>
          <Text style={tc.guestCount}>{enriched.length} guest{enriched.length !== 1 ? 's' : ''}</Text>
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={12} color="rgba(255,255,255,0.3)" />
        </Pressable>
      )}

      {/* Expanded guest list */}
      {expanded && enriched.length > 0 && (
        <View style={tc.guestList}>
          {enriched.map(({ id: aid, guest_id, seat_number, g }) => (
            <View key={aid ?? guest_id} style={tc.guestItem}>
              <GuestAvatar name={g?.full_name ?? '?'} vip={g?.is_vip} size={26} />
              <Text style={tc.guestName} numberOfLines={1}>{g?.full_name ?? 'Unknown'}</Text>
              {seat_number != null && (
                <View style={tc.seatBadge}>
                  <Text style={tc.seatNum}>#{seat_number}</Text>
                </View>
              )}
              <Pressable onPress={() => aid && onRemove(aid)} style={tc.removeBtn} hitSlop={6}>
                <Feather name="x" size={12} color="rgba(239,68,68,0.6)" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* CTA */}
      {!isFull ? (
        <Pressable onPress={() => onAssign(loc)} style={[tc.assignBtn, { borderColor: `${accent}50` }]}>
          <Feather name="plus" size={11} color={accent} />
          <Text style={[tc.assignTxt, { color: accent }]}>Add Guest</Text>
        </Pressable>
      ) : (
        <View style={tc.fullBadge}>
          <Feather name="check-circle" size={11} color="rgba(255,255,255,0.25)" />
          <Text style={tc.fullTxt}>Full</Text>
        </View>
      )}
    </View>
  );
}

const tc = StyleSheet.create({
  card:         { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.035)', overflow: 'hidden', marginBottom: 10 },
  stripe:       { height: 2 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  shapeIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  titleWrap:    { flex: 1, minWidth: 0 },
  tableName:    { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  tableSub:     { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  actions:      { flexDirection: 'row', gap: 2, flexShrink: 0 },
  iconBtn:      { padding: 6, borderRadius: 8 },
  barWrap:      { paddingHorizontal: 14, paddingBottom: 10 },
  barBg:        { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill:      { height: 4, borderRadius: 2 },
  guestRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' },
  avatarStack:  { flexDirection: 'row', alignItems: 'center' },
  avatarItem:   { borderWidth: 1.5, borderColor: Colors.bg.card, borderRadius: 12 },
  avatarMore:   { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginLeft: -8, borderWidth: 1.5, borderColor: Colors.bg.card },
  avatarMoreTxt:{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  guestCount:   { flex: 1, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  guestList:    { paddingHorizontal: 14, paddingBottom: 8, gap: 4 },
  guestItem:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderRadius: 10, paddingHorizontal: 4 },
  guestName:    { flex: 1, fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  seatBadge:    { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  seatNum:      { fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' },
  removeBtn:    { padding: 4, borderRadius: 6 },
  assignBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginHorizontal: 14, marginBottom: 12, marginTop: 4, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 8 },
  assignTxt:    { fontSize: 11, fontWeight: '700' },
  fullBadge:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginHorizontal: 14, marginBottom: 12, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, paddingVertical: 8 },
  fullTxt:      { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.25)' },
});

// ── TableSheet — Add / Edit table ─────────────────────────────────────────────────

function TableSheet({
  open, onClose, onSave, initial, saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (p: { table_name: string; capacity: number; shape: string }) => void;
  initial: SeatingLocation | null;
  saving: boolean;
}) {
  const [name,     setName]     = useState('');
  const [capacity, setCapacity] = useState(8);
  const [shape,    setShape]    = useState<'round' | 'rectangle' | 'custom'>('round');
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.location_name ?? '');
    setCapacity(initial?.capacity ?? 8);
    setShape((initial?.shape as any) ?? 'round');
    setError('');
  }, [open, initial]);

  function submit() {
    if (!name.trim()) { setError('Table name is required'); return; }
    if (capacity < 1) { setError('Capacity must be at least 1'); return; }
    onSave({ table_name: name.trim(), capacity, shape });
  }

  const shapes: Array<{ key: 'round' | 'rectangle' | 'custom'; label: string; icon: string }> = [
    { key: 'round',     label: 'Round',   icon: 'circle'   },
    { key: 'rectangle', label: 'Rect',    icon: 'square'   },
    { key: 'custom',    label: 'Custom',  icon: 'triangle' },
  ];

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Edit Table' : 'Add Table / Zone'} maxHeight={520}>
      <View style={ts.form}>
        <View>
          <Text style={ts.label}>Name</Text>
          <TextInput
            style={ts.input}
            value={name}
            onChangeText={t => { setName(t); setError(''); }}
            placeholder="e.g. Table 1, VIP Stage…"
            placeholderTextColor="rgba(255,255,255,0.2)"
            selectionColor={Colors.accent.indigo}
          />
        </View>

        <View>
          <Text style={ts.label}>Capacity</Text>
          <View style={ts.stepRow}>
            <Pressable onPress={() => setCapacity(c => Math.max(1, c - 1))} style={ts.stepBtn}>
              <Text style={ts.stepTxt}>−</Text>
            </Pressable>
            <Text style={ts.capVal}>{capacity}</Text>
            <Pressable onPress={() => setCapacity(c => Math.min(500, c + 1))} style={ts.stepBtn}>
              <Text style={ts.stepTxt}>+</Text>
            </Pressable>
            <Text style={ts.maxNote}>max 500</Text>
          </View>
        </View>

        <View>
          <Text style={ts.label}>Shape</Text>
          <View style={ts.shapeRow}>
            {shapes.map(({ key, label, icon }) => (
              <Pressable
                key={key}
                onPress={() => setShape(key)}
                style={[ts.shapePill, shape === key && ts.shapePillActive]}
              >
                <Feather name={icon as any} size={14} color={shape === key ? '#818cf8' : 'rgba(255,255,255,0.35)'} />
                <Text style={[ts.shapeTxt, shape === key && ts.shapeTxtActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text style={ts.error}>{error}</Text> : null}

        <View style={ts.btnRow}>
          <Pressable onPress={onClose} style={ts.cancelBtn}>
            <Text style={ts.cancelTxt}>Cancel</Text>
          </Pressable>
          <Pressable onPress={submit} disabled={saving} style={[ts.saveBtn, saving && { opacity: 0.5 }]}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={ts.saveTxt}>{initial ? 'Save' : 'Create'}</Text>}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const ts = StyleSheet.create({
  form:          { gap: 16 },
  label:         { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input:         { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  stepRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn:       { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  stepTxt:       { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  capVal:        { fontSize: 18, fontWeight: '900', color: '#fff', minWidth: 32, textAlign: 'center' },
  maxNote:       { fontSize: 11, color: 'rgba(255,255,255,0.25)' },
  shapeRow:      { flexDirection: 'row', gap: 8 },
  shapePill:     { flex: 1, flexDirection: 'column', alignItems: 'center', gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  shapePillActive: { borderColor: 'rgba(99,102,241,0.5)', backgroundColor: 'rgba(99,102,241,0.12)' },
  shapeTxt:      { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  shapeTxtActive:{ color: '#818cf8' },
  error:         { fontSize: 12, color: '#f87171', textAlign: 'center' },
  btnRow:        { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:     { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center' },
  cancelTxt:     { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  saveBtn:       { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center' },
  saveTxt:       { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ── AssignSheet — pick a guest for a table ────────────────────────────────────────

function AssignSheet({
  open, onClose, target, guests, assignments, onAssign, saving,
}: {
  open: boolean;
  onClose: () => void;
  target: SeatingLocation | null;
  guests: Guest[];
  assignments: SeatingAssignment[];
  onAssign: (p: { guest_id: string; seating_table_id: string; seat_number?: string }) => void;
  saving: boolean;
}) {
  const [q,       setQ]       = useState('');
  const [seatNum, setSeatNum] = useState('');
  const [picked,  setPicked]  = useState<Guest | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ(''); setSeatNum(''); setPicked(null);
  }, [open, target?.id]);

  const assignedIds = new Set(assignments.map(a => a.guest_id));
  const atTable     = assignments.filter(a => a.seating_table_id === target?.id).length;
  const spots       = (target?.capacity ?? 0) - atTable;
  const lq          = q.toLowerCase();
  const list        = guests
    .filter(g => !assignedIds.has(g.id))
    .filter(g => !lq || (g.full_name || '').toLowerCase().includes(lq) || (g.email || '').toLowerCase().includes(lq))
    .sort((a, b) => {
      if (a.is_vip && !b.is_vip) return -1;
      if (!a.is_vip && b.is_vip) return  1;
      return (a.full_name || '').localeCompare(b.full_name || '');
    });

  return (
    <BottomSheet open={open} onClose={onClose} title="Assign Guest" maxHeight={640}>
      <View style={as.wrap}>
        {/* Table info */}
        <View style={as.info}>
          <Text style={as.infoName}>{target?.location_name}</Text>
          <Text style={as.infoSpots}>{spots} spot{spots !== 1 ? 's' : ''} remaining</Text>
        </View>

        {/* Search */}
        <View style={as.searchWrap}>
          <Feather name="search" size={13} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={as.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Search unassigned guests…"
            placeholderTextColor="rgba(255,255,255,0.2)"
            selectionColor={Colors.accent.indigo}
          />
        </View>

        {/* Guest list */}
        <ScrollView style={as.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {list.length === 0 ? (
            <View style={as.empty}>
              <Feather name="users" size={22} color="rgba(255,255,255,0.2)" />
              <Text style={as.emptyTxt}>
                {guests.filter(g => !assignedIds.has(g.id)).length === 0
                  ? 'All guests are assigned'
                  : 'No guests match'}
              </Text>
            </View>
          ) : list.map(g => (
            <Pressable
              key={g.id}
              onPress={() => setPicked(p => p?.id === g.id ? null : g)}
              style={[as.guestRow, picked?.id === g.id && as.guestRowPicked]}
            >
              <GuestAvatar name={g.full_name} vip={g.is_vip} size={34} />
              <View style={as.guestInfo}>
                <Text style={as.guestName} numberOfLines={1}>
                  {g.full_name}{g.is_vip ? ' 👑' : ''}
                </Text>
                {g.email && <Text style={as.guestEmail} numberOfLines={1}>{g.email}</Text>}
              </View>
              {picked?.id === g.id && <Feather name="check" size={14} color="#818cf8" />}
            </Pressable>
          ))}
        </ScrollView>

        {/* Seat number + action */}
        <View style={as.footer}>
          {picked && (
            <View style={as.seatRow}>
              <Text style={as.seatLabel}>Seat # (optional)</Text>
              <TextInput
                style={as.seatInput}
                value={seatNum}
                onChangeText={setSeatNum}
                placeholder="A1, 12…"
                placeholderTextColor="rgba(255,255,255,0.2)"
                selectionColor={Colors.accent.indigo}
              />
            </View>
          )}
          <View style={as.btnRow}>
            <Pressable onPress={onClose} style={as.cancelBtn}>
              <Text style={as.cancelTxt}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (picked && target) {
                  onAssign({ guest_id: picked.id, seating_table_id: target.id, seat_number: seatNum.trim() || undefined });
                }
              }}
              disabled={!picked || saving}
              style={[as.assignBtn, (!picked || saving) && { opacity: 0.4 }]}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Feather name="arrow-right" size={13} color="#fff" />
                    <Text style={as.assignTxt}>Assign</Text>
                  </>}
            </Pressable>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const as = StyleSheet.create({
  wrap:         { gap: 12 },
  info:         { backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)' },
  infoName:     { fontSize: 14, fontWeight: '800', color: '#818cf8' },
  infoSpots:    { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput:  { flex: 1, color: '#fff', fontSize: 13 },
  list:         { maxHeight: 260 },
  empty:        { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTxt:     { fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  guestRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  guestRowPicked: { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)' },
  guestInfo:    { flex: 1, minWidth: 0 },
  guestName:    { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  guestEmail:   { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  footer:       { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12, gap: 10 },
  seatRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seatLabel:    { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' } as any,
  seatInput:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 13 },
  btnRow:       { flexDirection: 'row', gap: 10 },
  cancelBtn:    { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center' },
  cancelTxt:    { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  assignBtn:    { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center' },
  assignTxt:    { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ── AutoSheet — auto-assign options ──────────────────────────────────────────────

const AUTO_OPTS = [
  { key: 'prioritize_vip',       label: 'Prioritise VIP guests',         desc: 'VIP guests get first pick of seats'         },
  { key: 'keep_groups_together', label: 'Keep groups together',           desc: 'Guests in same group sit at same table'     },
  { key: 'assign_seat_numbers',  label: 'Assign seat numbers',            desc: 'Auto-number seats within each table'        },
  { key: 'overwrite_existing',   label: 'Overwrite existing assignments', desc: 'Clear current assignments before running'   },
];

function AutoSheet({
  open, onClose, onRun, saving,
}: {
  open: boolean;
  onClose: () => void;
  onRun: (opts: Record<string, boolean>) => void;
  saving: boolean;
}) {
  const [vip,   setVip]   = useState(true);
  const [grp,   setGrp]   = useState(true);
  const [seats, setSeats] = useState(true);
  const [over,  setOver]  = useState(false);

  const vals: Record<string, boolean> = {
    prioritize_vip:       vip,
    keep_groups_together: grp,
    assign_seat_numbers:  seats,
    overwrite_existing:   over,
  };
  const togglers: Record<string, () => void> = {
    prioritize_vip:       () => setVip(v => !v),
    keep_groups_together: () => setGrp(v => !v),
    assign_seat_numbers:  () => setSeats(v => !v),
    overwrite_existing:   () => setOver(v => !v),
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Auto-Assign Seats" maxHeight={540}>
      <View style={au.wrap}>
        {AUTO_OPTS.map(({ key, label, desc }) => (
          <Pressable key={key} onPress={togglers[key]} style={[au.option, vals[key] && au.optionOn]}>
            <View style={[au.check, vals[key] && au.checkOn]}>
              {vals[key] && <Feather name="check" size={10} color="#fff" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={au.optLabel}>{label}</Text>
              <Text style={au.optDesc}>{desc}</Text>
            </View>
          </Pressable>
        ))}

        {over && (
          <View style={au.warning}>
            <Feather name="alert-circle" size={13} color="#fbbf24" />
            <Text style={au.warningTxt}>All existing assignments will be cleared before re-assigning.</Text>
          </View>
        )}

        <View style={au.btnRow}>
          <Pressable onPress={onClose} style={au.cancelBtn}>
            <Text style={au.cancelTxt}>Cancel</Text>
          </Pressable>
          <Pressable onPress={() => onRun(vals)} disabled={saving} style={[au.runBtn, saving && { opacity: 0.5 }]}>
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Feather name="zap" size={13} color="#fff" />
                  <Text style={au.runTxt}>Run</Text>
                </>}
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const au = StyleSheet.create({
  wrap:      { gap: 10 },
  option:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  optionOn:  { borderColor: 'rgba(99,102,241,0.35)', backgroundColor: 'rgba(99,102,241,0.10)' },
  check:     { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkOn:   { borderColor: Colors.accent.indigo, backgroundColor: Colors.accent.indigo },
  optLabel:  { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  optDesc:   { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  warning:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(245,158,11,0.10)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)', borderRadius: 12, padding: 12 },
  warningTxt:{ fontSize: 11, color: 'rgba(251,191,36,0.9)', flex: 1, lineHeight: 16 },
  btnRow:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center' },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  runBtn:    { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 13, borderRadius: 12, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center' },
  runTxt:    { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ── Unassigned section ────────────────────────────────────────────────────────────

function UnassignedSection({
  guests, assignments, locations, onSeat,
}: {
  guests: Guest[];
  assignments: SeatingAssignment[];
  locations: SeatingLocation[];
  onSeat: (g: Guest) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q,    setQ]    = useState('');

  const ids   = new Set(assignments.map(a => a.guest_id));
  const lq    = q.toLowerCase();
  const list  = guests
    .filter(g => !ids.has(g.id))
    .filter(g => !lq || (g.full_name || '').toLowerCase().includes(lq) || (g.email || '').toLowerCase().includes(lq))
    .sort((a, b) => {
      if (a.is_vip && !b.is_vip) return -1;
      if (!a.is_vip && b.is_vip) return  1;
      return (a.full_name || '').localeCompare(b.full_name || '');
    });
  const total = guests.filter(g => !ids.has(g.id)).length;

  return (
    <View style={un.section}>
      <Pressable onPress={() => setOpen(v => !v)} style={un.toggle}>
        <View style={un.toggleLeft}>
          <Text style={un.toggleTitle}>Unassigned Guests</Text>
          <View style={un.countBadge}>
            <Text style={un.countTxt}>{total}</Text>
          </View>
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color="rgba(255,255,255,0.3)" />
      </Pressable>

      {open && (
        <View style={un.body}>
          <View style={un.searchWrap}>
            <Feather name="search" size={12} color="rgba(255,255,255,0.3)" />
            <TextInput
              style={un.searchInput}
              value={q}
              onChangeText={setQ}
              placeholder="Search…"
              placeholderTextColor="rgba(255,255,255,0.2)"
              selectionColor={Colors.accent.indigo}
            />
          </View>

          {list.length === 0 ? (
            <View style={un.empty}>
              <Feather name="check-circle" size={18} color="rgba(16,185,129,0.5)" />
              <Text style={un.emptyTxt}>{total === 0 ? 'All guests seated 🎉' : 'No match'}</Text>
            </View>
          ) : list.map(g => (
            <View key={g.id} style={un.row}>
              <GuestAvatar name={g.full_name} vip={g.is_vip} size={26} />
              <View style={un.info}>
                <Text style={un.name} numberOfLines={1}>
                  {g.full_name}{g.is_vip ? ' 👑' : ''}
                </Text>
                {g.email && <Text style={un.email} numberOfLines={1}>{g.email}</Text>}
              </View>
              {locations.length > 0 && (
                <Pressable onPress={() => onSeat(g)} style={un.seatBtn}>
                  <Text style={un.seatBtnTxt}>Seat</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const un = StyleSheet.create({
  section:     { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', marginBottom: 80 },
  toggle:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  toggleLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8 },
  countBadge:  { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  countTxt:    { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
  body:        { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 6 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 6 },
  searchInput: { flex: 1, color: '#fff', fontSize: 12 },
  empty:       { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyTxt:    { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 2 },
  info:        { flex: 1, minWidth: 0 },
  name:        { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  email:       { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  seatBtn:     { backgroundColor: 'rgba(99,102,241,0.18)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  seatBtnTxt:  { fontSize: 10, fontWeight: '800', color: '#818cf8' },
});

// ── Main screen ───────────────────────────────────────────────────────────────────

export default function SeatingScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const {
    locations, assignments, saving,
    fetchLocations, fetchAssignments,
    createLocation, updateLocation, deleteLocation,
    assignGuest, removeAssignment,
    autoAssign, clearAllAssignments,
    getAssignmentsForLocation,
  } = useSeatingStore();

  const { guests, getGuests } = useGuestStore();

  const [loading,   setLoading]   = useState(true);
  const [tableSh,   setTableSh]   = useState(false);
  const [editLoc,   setEditLoc]   = useState<SeatingLocation | null>(null);
  const [assignSh,  setAssignSh]  = useState(false);
  const [assignTgt, setAssignTgt] = useState<SeatingLocation | null>(null);
  const [autoSh,    setAutoSh]    = useState(false);
  const [clearConf, setClearConf] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    await Promise.all([
      fetchLocations(id),
      fetchAssignments(id),
      getGuests(id),
    ]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const cap    = locations.reduce((s, l) => s + (l.capacity || 0), 0);
  const asgn   = assignments.length;

  async function handleSaveTable(payload: { table_name: string; capacity: number; shape: string }) {
    if (!id) return;
    if (editLoc) {
      const r = await updateLocation(id, editLoc.id, payload as any);
      if (r.success) { setTableSh(false); setEditLoc(null); }
    } else {
      const r = await createLocation(id, payload as any);
      if (r.success) setTableSh(false);
    }
  }

  async function handleDeleteTable(locId: string) {
    if (!id) return;
    await deleteLocation(id, locId);
  }

  async function handleAssign(payload: { guest_id: string; seating_table_id: string; seat_number?: string }) {
    if (!id || !assignTgt) return;
    const r = await assignGuest(id, { ...payload, seating_table_id: assignTgt.id });
    if (r.success) { setAssignSh(false); setAssignTgt(null); }
  }

  async function handleAutoAssign(opts: Record<string, boolean>) {
    if (!id) return;
    const r = await autoAssign(id, opts);
    if (r.success) { setAutoSh(false); await fetchAssignments(id); }
  }

  async function handleClearAll() {
    if (!id) return;
    await clearAllAssignments(id);
  }

  function openAssignFor(loc: SeatingLocation) {
    setAssignTgt(loc);
    setAssignSh(true);
  }

  function openAssignForGuest(g: Guest) {
    setAssignTgt(locations.length === 1 ? locations[0] : null);
    setAssignSh(true);
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={s.topBar}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={17} color="#fff" />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title}>Seating Chart</Text>
        </View>
        <View style={s.topActions}>
          {assignments.length > 0 && (
            <Pressable onPress={() => setClearConf(true)} style={s.topBtn}>
              <Feather name="rotate-ccw" size={13} color="#f87171" />
            </Pressable>
          )}
          <Pressable onPress={() => setAutoSh(true)} style={[s.topBtn, s.topBtnAccent]}>
            <Feather name="zap" size={13} color="#818cf8" />
            <Text style={s.topBtnTxt}>Auto</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.accent.indigo} size="large" />
          <Text style={s.loadingTxt}>Loading seating chart…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats */}
          <StatsGrid cap={cap} asgn={asgn} tables={locations.length} />

          {/* Empty state */}
          {locations.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Feather name="grid" size={28} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={s.emptyTitle}>No tables yet</Text>
              <Text style={s.emptySub}>Create your first table to start building the seating chart.</Text>
              <Pressable onPress={() => { setEditLoc(null); setTableSh(true); }} style={s.emptyBtn}>
                <Feather name="plus" size={14} color="#fff" />
                <Text style={s.emptyBtnTxt}>Add First Table</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Table cards */}
              {locations.map(loc => (
                <TableCard
                  key={loc.id}
                  loc={loc}
                  assigns={getAssignmentsForLocation(loc.id)}
                  guests={guests}
                  saving={saving}
                  onEdit={l => { setEditLoc(l); setTableSh(true); }}
                  onDelete={handleDeleteTable}
                  onAssign={openAssignFor}
                  onRemove={aid => id && removeAssignment(id, aid)}
                />
              ))}

              {/* Unassigned section */}
              {guests.length > 0 && (
                <UnassignedSection
                  guests={guests}
                  assignments={assignments}
                  locations={locations}
                  onSeat={openAssignForGuest}
                />
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* FAB — Add Table */}
      {!loading && (
        <View style={[s.fab, { bottom: insets.bottom + 24 }]}>
          <Pressable
            onPress={() => { setEditLoc(null); setTableSh(true); }}
            style={s.fabBtn}
          >
            <Feather name="plus" size={22} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Bottom sheets */}
      <TableSheet
        open={tableSh}
        onClose={() => { setTableSh(false); setEditLoc(null); }}
        onSave={handleSaveTable}
        initial={editLoc}
        saving={saving}
      />
      <AssignSheet
        open={assignSh}
        onClose={() => { setAssignSh(false); setAssignTgt(null); }}
        target={assignTgt}
        guests={guests}
        assignments={assignments}
        onAssign={handleAssign}
        saving={saving}
      />
      <AutoSheet
        open={autoSh}
        onClose={() => setAutoSh(false)}
        onRun={handleAutoAssign}
        saving={saving}
      />
      <ConfirmModal
        open={clearConf}
        title="Clear all assignments?"
        description={`This will remove all ${assignments.length} seat assignment${assignments.length !== 1 ? 's' : ''}. Tables will remain.`}
        confirmText="Clear All"
        variant="danger"
        onConfirm={handleClearAll}
        onClose={() => setClearConf(false)}
      />
    </View>
  );
}

// ── Page styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.bg.primary,
  },
  topBar: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap:               10,
  },
  backBtn:    { padding: 4 },
  titleWrap:  { flex: 1 },
  title:      { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topBtn:     { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)' },
  topBtnAccent: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, borderColor: 'rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.12)' },
  topBtnTxt:  { fontSize: 12, fontWeight: '700', color: '#818cf8' },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { fontSize: 13, color: 'rgba(255,255,255,0.3)' },

  empty:       { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon:   { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle:  { fontSize: 17, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  emptySub:    { fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 22, paddingVertical: 12, marginTop: 4 },
  emptyBtnTxt: { fontSize: 14, fontWeight: '800', color: '#07070f' },

  fab:    { position: 'absolute', right: 20, alignItems: 'center' },
  fabBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent.indigo, shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
});
