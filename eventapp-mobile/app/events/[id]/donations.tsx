import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDonationStore, Donation } from '@/store/donation.store';
import { Colors } from '@/constants/colors';

const ROSE = '#f43f5e';

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmtAmount(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={[s.statCard, { borderColor: `${color}22`, backgroundColor: `${color}10` }]}>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/* ── Donation row ────────────────────────────────────────────────── */
function DonationRow({ item }: { item: Donation }) {
  const isOk = item.payment_status === 'SUCCEEDED';
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Feather name="heart" size={16} color={ROSE} />
      </View>
      <View style={s.rowBody}>
        <Text style={s.rowName} numberOfLines={1}>{item.donor_name || 'Anonymous'}</Text>
        <Text style={s.rowEmail} numberOfLines={1}>{item.donor_email || fmtDate(item.created_at)}</Text>
        {item.message ? <Text style={s.rowMsg} numberOfLines={1}>"{item.message}"</Text> : null}
      </View>
      <View style={s.rowRight}>
        <Text style={[s.rowAmount, { color: isOk ? Colors.accent.emerald : Colors.accent.amber }]}>
          {fmtAmount(item.amount, item.currency)}
        </Text>
        <View style={[s.statusPill, { backgroundColor: isOk ? `${Colors.accent.emerald}18` : `${Colors.accent.amber}18` }]}>
          <Feather
            name={isOk ? 'check-circle' : 'clock'}
            size={9}
            color={isOk ? Colors.accent.emerald : Colors.accent.amber}
          />
          <Text style={[s.statusTxt, { color: isOk ? Colors.accent.emerald : Colors.accent.amber }]}>
            {isOk ? 'Received' : 'Pending'}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Screen ──────────────────────────────────────────────────────── */
export default function DonationsScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { donations, loading, totalRaised, confirmedCount, fetchDonations } = useDonationStore();

  useEffect(() => { if (eventId) fetchDonations(eventId); }, [eventId]);

  const onRefresh = useCallback(() => { if (eventId) fetchDonations(eventId); }, [eventId]);

  const ListHeader = (
    <>
      {/* Stats row */}
      <View style={s.statsRow}>
        <StatCard label="Total Raised"  value={fmtAmount(totalRaised)} color={Colors.accent.emerald} />
        <StatCard label="Confirmed"     value={confirmedCount}          color={Colors.accent.indigo}  />
        <StatCard label="Total"         value={donations.length}        color={Colors.text.muted}     />
      </View>

      {donations.length > 0 && (
        <Text style={s.sectionLabel}>DONORS</Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </Pressable>
        <View style={s.headerMid}>
          <View style={s.headerIcon}>
            <LinearGradient colors={['#be185d', ROSE]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Feather name="heart" size={16} color="#fff" />
          </View>
          <View>
            <Text style={s.headerTitle}>Donations</Text>
            <Text style={s.headerSub}>Track contributions</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={donations}
        keyExtractor={d => d.id}
        renderItem={({ item }) => <DonationRow item={item} />}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading && donations.length > 0} onRefresh={onRefresh} tintColor={ROSE} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={ROSE} size="large" style={{ marginTop: 48 }} />
          ) : (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Feather name="heart" size={28} color={ROSE} style={{ opacity: 0.5 }} />
              </View>
              <Text style={s.emptyTitle}>No donations yet</Text>
              <Text style={s.emptySub}>
                Enable donations in event settings so attendees can contribute.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerMid:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  listContent: { paddingHorizontal: 16, paddingBottom: 48 },

  statsRow: { flexDirection: 'row', gap: 10, paddingTop: 16, paddingBottom: 4 },
  statCard:  {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1,
  },
  statVal:   { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: '700', color: Colors.text.subtle, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.text.subtle,
    textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 16, marginBottom: 8,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${ROSE}14`, borderWidth: 1, borderColor: `${ROSE}28`,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody:  { flex: 1, gap: 2 },
  rowName:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  rowEmail: { fontSize: 11, color: Colors.text.subtle },
  rowMsg:   { fontSize: 11, color: Colors.text.muted, fontStyle: 'italic' },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowAmount:{ fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  statusPill:{
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99,
  },
  statusTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  sep:  { height: 1, backgroundColor: Colors.border.subtle },

  empty:     { alignItems: 'center', paddingTop: 64, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: `${ROSE}10`, borderWidth: 1, borderColor: `${ROSE}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  emptySub:   { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});
