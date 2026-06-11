import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { ConfirmModal, useConfirm } from '@/components/ui/ConfirmModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore, SAVendor } from '@/store/superAdmin.store';

/* ── Design tokens ───────────────────────────────────────────── */
const BG   = '#07070f';
const CARD = '#0d0d1a';
const GOLD = '#C9A96E';

const CAT_COLORS: Record<string, string> = {
  'Photography':    '#818cf8', 'Videography':    '#a78bfa',
  'Music & DJ':     '#4ade80', 'Catering':       '#fbbf24',
  'Flowers & Décor':'#f472b6', 'Venue':          '#38bdf8',
  'Transportation': '#fb923c', 'Security':       '#94a3b8',
  'Lighting':       '#fde68a', 'Sound & AV':     '#34d399',
  'Hair & Makeup':  '#f9a8d4', 'Officiant':      '#c084fc',
  'Cake & Desserts':'#fb923c', 'Invitations':    '#818cf8',
  'Rentals':        '#a3e635', 'Entertainment':  '#f87171',
};

const VSTATUS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  verified: { label: 'Verified', color: '#10b981', bg: 'rgba(16,185,129,0.13)',  icon: 'check-circle' },
  pending:  { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.13)', icon: 'clock'        },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.13)',   icon: 'x-circle'     },
};

function fmt(n?: number) { return Number(n ?? 0).toLocaleString(); }

/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ label, value, color = '#fff' }: { label: string; value: number; color?: string }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statVal, { color }]}>{fmt(value)}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* ── Vendor card ─────────────────────────────────────────────── */
function VendorCard({ item, onUpdate, onDelete, updating }: {
  item: SAVendor;
  onUpdate: (id: string, data: Partial<SAVendor>) => void;
  onDelete: (item: SAVendor) => void;
  updating: string | null;
}) {
  const vstyle  = VSTATUS[item.verification_status] ?? VSTATUS.pending;
  const accent  = CAT_COLORS[item.category ?? ''] || '#818cf8';
  const isUpd   = updating === item.id;
  const initial = (item.business_name?.[0] ?? 'V').toUpperCase();

  return (
    <View style={s.card}>
      {/* Cover */}
      <View style={[s.cover, { backgroundColor: accent + '0e' }]}>
        <View style={[s.bloom, { backgroundColor: accent + '1a' }]} />
        <View style={[s.logo, { borderColor: accent + '38' }]}>
          {item.logo_url
            ? <Image source={{ uri: item.logo_url }} style={s.logoImg} resizeMode="cover" />
            : <Text style={[s.logoLetter, { color: accent }]}>{initial}</Text>}
        </View>
        <View style={[s.catChip, { borderColor: accent + '30' }]}>
          <Text style={[s.catChipText, { color: accent }]}>{item.category}</Text>
        </View>
        <View style={[s.vPill, { backgroundColor: vstyle.bg, borderColor: vstyle.color + '38' }]}>
          <Feather name={vstyle.icon as any} size={9} color={vstyle.color} />
          <Text style={[s.vPillText, { color: vstyle.color }]}>{vstyle.label}</Text>
        </View>
        {item.is_featured && (
          <View style={s.featuredBadge}>
            <Feather name="star" size={9} color="#f59e0b" />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={s.body}>
        <Text style={s.name} numberOfLines={1}>{item.business_name}</Text>
        <Text style={s.email} numberOfLines={1}>{item.email}</Text>
        {(item.city || item.country) && (
          <View style={s.locRow}>
            <Feather name="map-pin" size={9} color="rgba(255,255,255,0.25)" />
            <Text style={s.locText}>{[item.city, item.country].filter(Boolean).join(', ')}</Text>
          </View>
        )}

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Feather name="star" size={11} color="#f59e0b" />
            <Text style={[s.statNum, { color: '#f59e0b' }]}>{Number(item.rating ?? 0).toFixed(1)}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: accent }]}>{fmt(item.inquiry_count)}</Text>
            <Text style={s.statSub}> inq</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{fmt(item.review_count)}</Text>
            <Text style={s.statSub}> rev</Text>
          </View>
          {!!item.base_price && (
            <>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statSub}>from </Text>
                <Text style={[s.statNum, { color: '#4ade80' }]}>${fmt(item.base_price)}</Text>
              </View>
            </>
          )}
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {item.verification_status !== 'verified' && (
            <Pressable style={[s.pill, { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.25)' }]}
              onPress={() => onUpdate(item.id, { verification_status: 'verified' })} disabled={isUpd}>
              <Feather name="check-circle" size={12} color="#10b981" />
              <Text style={[s.pillText, { color: '#10b981' }]}>Verify</Text>
            </Pressable>
          )}
          {item.verification_status !== 'rejected' && (
            <Pressable style={[s.pill, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.22)' }]}
              onPress={() => onUpdate(item.id, { verification_status: 'rejected' })} disabled={isUpd}>
              <Feather name="x-circle" size={12} color="#ef4444" />
              <Text style={[s.pillText, { color: '#ef4444' }]}>Reject</Text>
            </Pressable>
          )}
          <Pressable style={[s.pill, { backgroundColor: item.is_active ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.04)', borderColor: item.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.10)' }]}
            onPress={() => onUpdate(item.id, { is_active: !item.is_active })} disabled={isUpd}>
            <Feather name={item.is_active ? 'toggle-right' : 'toggle-left'} size={12} color={item.is_active ? '#10b981' : 'rgba(255,255,255,0.3)'} />
            <Text style={[s.pillText, { color: item.is_active ? '#10b981' : 'rgba(255,255,255,0.38)' }]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </Pressable>
          <Pressable style={[s.pill, { backgroundColor: item.is_featured ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.04)', borderColor: item.is_featured ? 'rgba(245,158,11,0.28)' : 'rgba(255,255,255,0.10)' }]}
            onPress={() => onUpdate(item.id, { is_featured: !item.is_featured })} disabled={isUpd}>
            <Feather name="star" size={12} color={item.is_featured ? '#f59e0b' : 'rgba(255,255,255,0.3)'} />
            <Text style={[s.pillText, { color: item.is_featured ? '#f59e0b' : 'rgba(255,255,255,0.38)' }]}>
              {item.is_featured ? 'Featured' : 'Feature'}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable style={[s.pill, { backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.22)' }]}
            onPress={() => onDelete(item)}>
            <Feather name="trash-2" size={12} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      {isUpd && (
        <View style={[StyleSheet.absoluteFillObject, s.overlay]}>
          <ActivityIndicator color={accent} size="small" />
        </View>
      )}
    </View>
  );
}

/* ── Screen ──────────────────────────────────────────────────── */
export default function SAVendorsScreen() {
  const { vendors, vendorsMeta, vendorStats, fetchAdminVendors, updateAdminVendor, deleteAdminVendor, loading } = useSuperAdminStore();
  const [q,        setQ]        = useState('');
  const [verified, setVerified] = useState('');
  const [status,   setStatus]   = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const { confirm, confirmProps } = useConfirm();

  const VERIFIED_OPTS = [
    { label: 'All',      value: ''         },
    { label: 'Verified', value: 'verified' },
    { label: 'Pending',  value: 'pending'  },
    { label: 'Rejected', value: 'rejected' },
  ];
  const STATUS_OPTS = [
    { label: 'All',      value: 'all'      },
    { label: 'Active',   value: 'active'   },
    { label: 'Inactive', value: 'inactive' },
  ];

  const load = useCallback(() => {
    fetchAdminVendors({ q, verified, status, limit: 50 });
  }, [q, verified, status]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleUpdate(id: string, data: Partial<SAVendor>) {
    setUpdating(id);
    await updateAdminVendor(id, data);
    setUpdating(null);
  }

  function handleDelete(item: SAVendor) {
    confirm({
      title: 'Delete Vendor',
      message: `Remove "${item.business_name}" from the platform?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteAdminVendor(item.id),
    });
  }

  // ── All header content in ListHeaderComponent — scrolls with the list ──
  const ListHeader = (
    <View>
      {/* Stats strip */}
      {vendorStats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.statsContent}>
          <StatCard label="Total"     value={vendorStats.total}           color="#fff"                  />
          <StatCard label="Active"    value={vendorStats.active}          color="#10b981"               />
          <StatCard label="Verified"  value={vendorStats.verified}        color="#818cf8"               />
          <StatCard label="Pending"   value={vendorStats.pending}         color="#f59e0b"               />
          <StatCard label="Inquiries" value={vendorStats.total_inquiries} color={GOLD}                  />
          <StatCard label="Reviews"   value={vendorStats.total_reviews}   color="rgba(255,255,255,0.55)" />
        </ScrollView>
      )}

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Feather name="search" size={13} color="rgba(255,255,255,0.28)" />
          <TextInput value={q} onChangeText={setQ} placeholder="Search vendors…"
            placeholderTextColor="rgba(255,255,255,0.22)" style={s.searchInput}
            returnKeyType="search" onSubmitEditing={load} />
          {!!q && <Pressable onPress={() => setQ('')}><Feather name="x" size={12} color="rgba(255,255,255,0.3)" /></Pressable>}
        </View>
        <Pressable onPress={load} style={s.refreshBtn}>
          <Feather name="refresh-cw" size={14} color={GOLD} />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipsContent}>
        {VERIFIED_OPTS.map(o => (
          <Pressable key={o.value} onPress={() => { setVerified(o.value); }}
            style={[s.chip, verified === o.value && s.chipActive]}>
            <Text style={[s.chipText, verified === o.value && { color: '#818cf8' }]}>{o.label}</Text>
          </Pressable>
        ))}
        <View style={s.chipDivider} />
        {STATUS_OPTS.map(o => (
          <Pressable key={o.value} onPress={() => { setStatus(o.value); }}
            style={[s.chip, status === o.value && s.chipActive]}>
            <Text style={[s.chipText, status === o.value && { color: '#818cf8' }]}>{o.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      <ConfirmModal {...confirmProps} />
      <FlatList
        data={vendors}
        keyExtractor={item => item.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <VendorCard item={item} onUpdate={handleUpdate} onDelete={handleDelete} updating={updating} />
        )}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            {loading
              ? <ActivityIndicator color={GOLD} size="large" />
              : <>
                  <View style={s.emptyIcon}>
                    <Feather name="shopping-bag" size={24} color="rgba(255,255,255,0.15)" />
                  </View>
                  <Text style={s.emptyTitle}>No vendors found</Text>
                  <Text style={s.emptySub}>Try adjusting your filters</Text>
                </>
            }
          </View>
        }
        ListFooterComponent={vendorsMeta ? <Text style={s.footer}>{fmt(vendorsMeta.total)} vendors total</Text> : null}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* Stats strip */
  statsContent: { gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  statCard: {
    backgroundColor: CARD, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    minWidth: 84, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center',
  },
  statVal:   { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: 'rgba(255,255,255,0.28)', marginTop: 3 },

  /* Search */
  searchRow:   { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, alignItems: 'center' },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CARD, borderRadius: 13, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  searchInput: { flex: 1, color: '#fff', fontSize: 13 },
  refreshBtn:  { width: 44, height: 44, backgroundColor: CARD, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },

  /* Filter chips */
  chipsContent: { gap: 6, paddingHorizontal: 16, paddingBottom: 14 },
  chipDivider:  { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 4, alignSelf: 'center' },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  chipActive:   { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.28)' },
  chipText:     { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },

  /* List */
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  /* Vendor card */
  card: { backgroundColor: CARD, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },

  cover: { height: 110, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  bloom: { position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: 75 },
  logo:  { width: 54, height: 54, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg:    { width: '100%', height: '100%' },
  logoLetter: { fontSize: 20, fontWeight: '800' },

  catChip:     { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.28)' },
  catChipText: { fontSize: 9, fontWeight: '700' },
  vPill:       { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  vPillText:   { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  featuredBadge: { position: 'absolute', bottom: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', alignItems: 'center', justifyContent: 'center' },

  body:  { padding: 14, gap: 6 },
  name:  { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  email: { fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: -2 },
  locRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: '500' },

  statsRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 2 },
  statItem:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statNum:     { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: -0.2 },
  statSub:     { fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: '500' },
  statDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.07)' },

  actions:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: '600' },

  overlay: { backgroundColor: 'rgba(13,13,26,0.62)', alignItems: 'center', justifyContent: 'center', borderRadius: 18 },

  emptyWrap:  { height: 200, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon:  { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { color: 'rgba(255,255,255,0.42)', fontSize: 15, fontWeight: '600' },
  emptySub:   { color: 'rgba(255,255,255,0.2)', fontSize: 12 },

  footer: { textAlign: 'center', paddingVertical: 16, fontSize: 11, color: 'rgba(255,255,255,0.22)', fontWeight: '500' },
});
