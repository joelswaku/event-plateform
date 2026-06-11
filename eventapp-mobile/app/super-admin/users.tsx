import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore, SAUser } from '@/store/superAdmin.store';
import { Colors } from '@/constants/colors';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name: string): string {
  return (name ?? 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const PLAN_COLORS: Record<string, string> = {
  free:       '#10b981',
  starter:    '#6366f1',
  pro:        '#a78bfa',
  premium:    '#C9A96E',
  enterprise: '#f59e0b',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
      <View style={{ flex: 1, gap: 7 }}>
        <View style={{ height: 12, width: '50%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <View style={{ height: 10, width: '65%', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      </View>
      <View style={{ height: 20, width: 50, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.05)' }} />
    </View>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({ item }: { item: SAUser }) {
  const { updateUser } = useSuperAdminStore();
  const planColor    = PLAN_COLORS[item.plan ?? 'free'] ?? Colors.accent.indigo;
  const isActive     = item.is_active !== false;
  const isSuperAdmin = !!item.is_super_admin;

  return (
    <View style={styles.row}>
      {/* Avatar — gold if super admin */}
      <View style={[styles.avatar, { backgroundColor: isSuperAdmin ? 'rgba(201,169,110,0.85)' : `${Colors.accent.indigo}20` }]}>
        <Text style={[styles.avatarText, { color: isSuperAdmin ? '#000' : Colors.accent.indigo }]}>
          {initials(item.full_name)}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
          <View style={[styles.planBadge, { backgroundColor: `${planColor}18` }]}>
            <Text style={[styles.planText, { color: planColor }]}>
              {(item.plan ?? 'free').charAt(0).toUpperCase() + (item.plan ?? 'free').slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        <Text style={styles.lastLogin}>Last login: {fmtDate(item.last_login_at)}</Text>
      </View>

      {/* Super admin toggle */}
      <Pressable
        onPress={() => updateUser(item.id, { is_super_admin: !isSuperAdmin })}
        style={[styles.shieldBtn, isSuperAdmin && styles.shieldBtnActive]}
      >
        <Feather name="shield" size={14} color={isSuperAdmin ? Colors.accent.gold : Colors.text.subtle} />
      </Pressable>

      {/* Active toggle */}
      <Switch
        value={isActive}
        onValueChange={() => updateUser(item.id, { is_active: !isActive })}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(201,169,110,0.4)' }}
        thumbColor={isActive ? Colors.accent.gold : 'rgba(255,255,255,0.3)'}
        ios_backgroundColor="rgba(255,255,255,0.1)"
        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function UsersScreen() {
  const { users, loading, fetchUsers } = useSuperAdminStore();
  const [search, setSearch]            = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  function applySearch() {
    fetchUsers({ search });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color={Colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users…"
          placeholderTextColor={Colors.text.muted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={applySearch}
          returnKeyType="search"
        />
        {!!search && (
          <Pressable onPress={() => { setSearch(''); fetchUsers(); }}>
            <Feather name="x" size={15} color={Colors.text.muted} />
          </Pressable>
        )}
      </View>

      {/* Count */}
      {users.length > 0 && (
        <Text style={styles.countText}>{users.length} users</Text>
      )}

      {/* List */}
      <FlatList
        data={loading && !users.length ? [] : users}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <>{[0, 1, 2].map(i => <SkeletonRow key={i} />)}</>
          ) : (
            <View style={styles.empty}>
              <Feather name="users" size={32} color={Colors.text.muted} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )
        }
        renderItem={({ item }) => <UserRow item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    marginBottom:     12,
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
    fontSize:         11,
    color:            Colors.text.muted,
    paddingHorizontal: 20,
    marginBottom:     8,
    fontWeight:       '600',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 30, flexGrow: 0 },

  row: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    paddingVertical: 12,
  },
  separator: {
    height:          1,
    backgroundColor: Colors.border.subtle,
  },

  avatar: {
    width:           42,
    height:          42,
    borderRadius:    13,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: Colors.accent.indigo },

  info: { flex: 1, gap: 3 },
  nameRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    flexWrap:       'wrap',
  },
  name:  { fontSize: 13, fontWeight: '700', color: '#fff', flexShrink: 1 },
  email:     { fontSize: 11, color: Colors.text.muted },
  lastLogin: { fontSize: 10, color: Colors.text.subtle, marginTop: 2 },

  shieldBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  shieldBtnActive: {
    backgroundColor: 'rgba(201,169,110,0.15)',
    borderColor: 'rgba(201,169,110,0.35)',
  },

  planBadge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      99,
  },
  planText: { fontSize: 10, fontWeight: '800' },

  empty: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Colors.text.muted },
});
