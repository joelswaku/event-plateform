import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput, Switch, Modal, ActivityIndicator,
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

type GrantPlan = 'free' | 'starter' | 'pro';

const PLAN_OPTIONS: Array<{
  id: GrantPlan;
  title: string;
  description: string;
  color: string;
  icon: keyof typeof Feather.glyphMap;
}> = [
  {
    id: 'starter',
    title: 'Grant Starter',
    description: 'Give manual access to Starter features.',
    color: '#6366f1',
    icon: 'zap',
  },
  {
    id: 'pro',
    title: 'Grant Pro',
    description: 'Give manual access to all Pro features.',
    color: '#a78bfa',
    icon: 'star',
  },
  {
    id: 'free',
    title: 'Remove manual grant',
    description: 'Restore the customer’s normal Stripe plan, if any.',
    color: Colors.text.muted,
    icon: 'rotate-ccw',
  },
];

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

function UserRow({ item, onChangePlan }: { item: SAUser; onChangePlan: (user: SAUser) => void }) {
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
          <Pressable
            onPress={() => onChangePlan(item)}
            style={[styles.planBadge, styles.planSelector, { backgroundColor: `${planColor}18` }]}
            accessibilityRole="button"
            accessibilityLabel={`Change ${item.full_name}'s plan`}
          >
            <Text style={[styles.planText, { color: planColor }]}>
              {(item.plan ?? 'free').charAt(0).toUpperCase() + (item.plan ?? 'free').slice(1)}
            </Text>
            <Feather name="chevron-down" size={11} color={planColor} />
          </Pressable>
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
  const { users, loading, fetchUsers, updateUserPlan } = useSuperAdminStore();
  const [search, setSearch]            = useState('');
  const [selectedUser, setSelectedUser] = useState<SAUser | null>(null);
  const [updatingPlan, setUpdatingPlan] = useState<GrantPlan | null>(null);
  const [planError, setPlanError]       = useState('');

  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  function applySearch() {
    fetchUsers({ search });
  }

  async function changePlan(plan: GrantPlan) {
    if (!selectedUser || updatingPlan) return;
    setPlanError('');
    setUpdatingPlan(plan);
    const result = await updateUserPlan(selectedUser.id, plan);
    setUpdatingPlan(null);

    if (!result.success) {
      setPlanError(result.message ?? 'Could not update this user’s plan.');
      return;
    }

    setSelectedUser(null);
  }

  function openPlanPicker(user: SAUser) {
    setPlanError('');
    setSelectedUser(user);
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
        renderItem={({ item }) => <UserRow item={item} onChangePlan={openPlanPicker} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Modal
        transparent
        visible={!!selectedUser}
        animationType="slide"
        onRequestClose={() => !updatingPlan && setSelectedUser(null)}
      >
        <Pressable
          style={styles.planSheetBackdrop}
          onPress={() => !updatingPlan && setSelectedUser(null)}
        >
          <Pressable style={styles.planSheet} onPress={event => event.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetIcon}>
                <Feather name="award" size={19} color={Colors.accent.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Manage plan</Text>
                <Text style={styles.sheetSub} numberOfLines={1}>
                  {selectedUser?.full_name || selectedUser?.email}
                </Text>
              </View>
            </View>

            <Text style={styles.sheetNotice}>
              This is a complimentary manual grant. It does not create, cancel, or charge a Stripe subscription.
            </Text>

            <View style={styles.planOptions}>
              {PLAN_OPTIONS.map(option => {
                const busy = updatingPlan === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => changePlan(option.id)}
                    disabled={!!updatingPlan}
                    style={[styles.planOption, busy && styles.planOptionBusy]}
                  >
                    <View style={[styles.planOptionIcon, { backgroundColor: `${option.color}20` }]}>
                      {busy
                        ? <ActivityIndicator size="small" color={option.color} />
                        : <Feather name={option.icon} size={17} color={option.color} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planOptionTitle, { color: option.color }]}>{option.title}</Text>
                      <Text style={styles.planOptionSub}>{option.description}</Text>
                    </View>
                    <Feather name="chevron-right" size={17} color={Colors.text.subtle} />
                  </Pressable>
                );
              })}
            </View>

            {!!planError && <Text style={styles.planError}>{planError}</Text>}

            <Pressable
              onPress={() => setSelectedUser(null)}
              disabled={!!updatingPlan}
              style={styles.cancelPlanButton}
            >
              <Text style={styles.cancelPlanText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  planSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  planText: { fontSize: 10, fontWeight: '800' },

  planSheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  planSheet: {
    backgroundColor: '#10101c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIcon: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(201,169,110,0.14)',
    borderWidth: 1, borderColor: 'rgba(201,169,110,0.28)',
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  sheetSub: { fontSize: 12, color: Colors.text.muted, marginTop: 2 },
  sheetNotice: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.58)',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  planOptions: { marginTop: 14, gap: 8 },
  planOption: {
    minHeight: 66,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planOptionBusy: { opacity: 0.68 },
  planOptionIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  planOptionTitle: { fontSize: 13, fontWeight: '800' },
  planOptionSub: { fontSize: 10, color: Colors.text.muted, marginTop: 2 },
  planError: { color: Colors.accent.red, fontSize: 12, marginTop: 12, textAlign: 'center' },
  cancelPlanButton: {
    marginTop: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cancelPlanText: { fontSize: 13, fontWeight: '700', color: Colors.text.muted },

  empty: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: Colors.text.muted },
});
