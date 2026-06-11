import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore, SAEvent } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatMoney(val?: string | number): string {
  if (val === undefined || val === null) return '$0.00';
  return `$${parseFloat(String(val)).toFixed(2)}`;
}

const STATUS_FILTERS = ['All', 'PUBLISHED', 'DRAFT', 'CANCELLED'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PUBLISHED: { bg: 'rgba(16,185,129,0.15)',  text: '#10b981' },
  DRAFT:     { bg: 'rgba(245,158,11,0.15)',  text: '#f59e0b' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)',   text: '#ef4444' },
  ARCHIVED:  { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ height: 14, width: '55%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ height: 20, width: 72, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      </View>
      <View style={{ height: 11, width: '38%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
        <View style={{ height: 11, width: 60, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <View style={{ height: 11, width: 70, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      </View>
    </View>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ item }: { item: SAEvent }) {
  const sc = STATUS_COLORS[item.status] ?? { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>{item.status}</Text>
        </View>
      </View>
      {!!item.org_name && (
        <Text style={styles.cardOrg}>{item.org_name}</Text>
      )}
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Feather name="users" size={11} color={Colors.text.muted} />
          <Text style={styles.metaText}>{item.guest_count ?? 0} guests</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="dollar-sign" size={11} color={Colors.accent.gold} />
          <Text style={[styles.metaText, { color: Colors.accent.gold }]}>
            {formatMoney(item.revenue)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const { events, loading, fetchEvents } = useSuperAdminStore();
  const [search, setSearch]              = useState('');
  const [status, setStatus]              = useState<StatusFilter>('All');

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents({ search, status: status === 'All' ? undefined : status });
    }, [])
  );

  function applyFilters() {
    fetchEvents({ search, status: status === 'All' ? undefined : status });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={Colors.text.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events…"
          placeholderTextColor={Colors.text.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={applyFilters}
          returnKeyType="search"
        />
        {!!search && (
          <Pressable onPress={() => { setSearch(''); fetchEvents({ status: status === 'All' ? undefined : status }); }}>
            <Feather name="x" size={15} color={Colors.text.muted} />
          </Pressable>
        )}
      </View>

      {/* Status Filters */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={f => f}
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
        renderItem={({ item: f }) => (
          <Pressable
            style={[styles.chip, status === f && styles.chipActive]}
            onPress={() => {
              setStatus(f);
              fetchEvents({ search, status: f === 'All' ? undefined : f });
            }}
          >
            <Text style={[styles.chipText, status === f && styles.chipTextActive]}>{f}</Text>
          </Pressable>
        )}
      />

      {/* List */}
      <FlatList
        data={loading && !events.length ? [] : events}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <>{[0, 1, 2].map(i => <SkeletonRow key={i} />)}</>
          ) : (
            <View style={styles.empty}>
              <Feather name="calendar" size={32} color={Colors.text.muted} />
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          )
        }
        renderItem={({ item }) => <EventCard item={item} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#07070f' },

  searchWrap: {
    flexDirection:    'row',
    alignItems:       'center',
    margin:           16,
    marginBottom:     8,
    backgroundColor:  '#0d0d1a',
    borderRadius:     12,
    borderWidth:      1,
    borderColor:      Colors.border.DEFAULT,
    paddingHorizontal: 12,
    paddingVertical:  10,
    gap:              8,
  },
  searchIcon:  {},
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },

  filtersScroll:  { flexGrow: 0 },
  filtersContent: { paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      99,
    backgroundColor:   '#0d0d1a',
    borderWidth:       1,
    borderColor:       Colors.border.DEFAULT,
  },
  chipActive: {
    backgroundColor: 'rgba(201,169,110,0.15)',
    borderColor:     'rgba(201,169,110,0.4)',
  },
  chipText:       { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
  chipTextActive: { color: Colors.accent.gold },

  listContent: { padding: 16, gap: 10, flexGrow: 0 },

  card: {
    backgroundColor: '#0d0d1a',
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.08)',
    padding:         14,
  },
  cardHeader: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    justifyContent:  'space-between',
    gap:             10,
    marginBottom:    6,
  },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
  badge: {
    paddingHorizontal: 9,
    paddingVertical:   4,
    borderRadius:      99,
  },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  cardOrg:   { fontSize: 11, color: Colors.text.muted, marginBottom: 8 },
  cardMeta:  { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:  { fontSize: 11, color: Colors.text.muted },

  empty: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Colors.text.muted },
});
