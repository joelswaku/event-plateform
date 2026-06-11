import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore, SAOrg } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

const PLAN_COLORS: Record<string, string> = {
  free:       Colors.accent.emerald,
  starter:    Colors.accent.indigo,
  pro:        Colors.accent.violet,
  premium:    Colors.accent.gold,
  enterprise: Colors.accent.amber,
};

function SkeletonRow() {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ height: 14, width: '50%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ height: 18, width: 56, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      </View>
      <View style={{ height: 11, width: '35%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
        <View style={{ height: 11, width: 55, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)' }} />
        <View style={{ height: 11, width: 65, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)' }} />
      </View>
    </View>
  );
}

function OrgCard({ item }: { item: SAOrg }) {
  const planColor = PLAN_COLORS[item.plan?.toLowerCase() ?? 'free'] ?? Colors.accent.indigo;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Feather name="briefcase" size={15} color={Colors.accent.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          {!!item.owner_name && (
            <Text style={styles.cardSub} numberOfLines={1}>{item.owner_name}</Text>
          )}
          {!!item.owner_email && (
            <Text style={styles.cardSubMuted} numberOfLines={1}>{item.owner_email}</Text>
          )}
        </View>
        {!!item.plan && (
          <View style={[styles.badge, { backgroundColor: `${planColor}18` }]}>
            <Text style={[styles.badgeText, { color: planColor }]}>
              {item.plan.charAt(0).toUpperCase() + item.plan.slice(1)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardMeta}>
        {item.event_count !== undefined && (
          <View style={styles.metaItem}>
            <Feather name="calendar" size={11} color={Colors.text.muted} />
            <Text style={styles.metaText}>{item.event_count} events</Text>
          </View>
        )}
        {item.member_count !== undefined && (
          <View style={styles.metaItem}>
            <Feather name="users" size={11} color={Colors.text.muted} />
            <Text style={styles.metaText}>{item.member_count} members</Text>
          </View>
        )}
        {!!item.created_at && (
          <View style={styles.metaItem}>
            <Feather name="clock" size={11} color={Colors.text.muted} />
            <Text style={styles.metaText}>
              {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function OrganizationsScreen() {
  const { orgs, loading, fetchOrgs } = useSuperAdminStore();
  const [search, setSearch]          = useState('');

  useFocusEffect(
    React.useCallback(() => { fetchOrgs(); }, [])
  );

  function applySearch() { fetchOrgs({ search }); }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={Colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search organizations…"
          placeholderTextColor={Colors.text.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={applySearch}
          returnKeyType="search"
        />
        {!!search && (
          <Pressable onPress={() => { setSearch(''); fetchOrgs(); }}>
            <Feather name="x" size={15} color={Colors.text.muted} />
          </Pressable>
        )}
      </View>

      {orgs.length > 0 && (
        <Text style={styles.countText}>{orgs.length} organizations</Text>
      )}

      <FlatList
        data={loading && !orgs.length ? [] : orgs}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <>{[0, 1, 2].map(i => <SkeletonRow key={i} />)}</>
          ) : (
            <View style={styles.empty}>
              <Feather name="briefcase" size={32} color={Colors.text.muted} />
              <Text style={styles.emptyText}>No organizations found</Text>
            </View>
          )
        }
        renderItem={({ item }) => <OrgCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

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
  searchInput: { flex: 1, fontSize: 14, color: '#fff', padding: 0 },

  countText: {
    fontSize: 11, color: Colors.text.muted,
    paddingHorizontal: 20, marginBottom: 8, fontWeight: '600',
  },

  listContent: { padding: 16, paddingTop: 8, flexGrow: 0 },

  card: {
    backgroundColor: '#0d0d1a',
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     'rgba(201,169,110,0.12)',
    padding:         14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(201,169,110,0.10)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardSub:      { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  cardSubMuted: { fontSize: 10, color: Colors.text.subtle, marginTop: 1 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.text.muted },

  empty: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Colors.text.muted },
});
