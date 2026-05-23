import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, ActivityIndicator, Alert, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast        from 'react-native-toast-message';

import { useTeamStore, TeamMember } from '@/store/team.store';
import { Colors }   from '@/constants/colors';

/* ── helpers ───────────────────────────────────────────── */
function initials(name = '') {
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const ROLE_CFG = {
  OWNER: { label: 'Owner', color: Colors.accent.amber,  bg: 'rgba(245,158,11,0.12)', icon: 'award'   as const },
  ADMIN: { label: 'Admin', color: Colors.accent.indigo, bg: 'rgba(99,102,241,0.12)', icon: 'shield'  as const },
} as const;

const ACCESS_ROWS: [string, boolean][] = [
  ['Manage guests & RSVPs',    true],
  ['Scan QR codes (check-in)', true],
  ['View analytics',           true],
  ['Edit event details',       true],
  ['Manage ticket types',      true],
  ['Delete event',             false],
  ['Change billing / plan',    false],
  ['Add or remove team',       false],
];

/* ── MemberCard ────────────────────────────────────────── */
function MemberCard({
  member, isOwner, onRemove,
}: { member: TeamMember; isOwner: boolean; onRemove: (id: string) => void }) {
  const cfg = ROLE_CFG[member.role] ?? ROLE_CFG.ADMIN;
  return (
    <View style={s.card}>
      <View style={[s.avatar, { backgroundColor: cfg.color }]}>
        <Text style={s.avatarText}>{initials(member.full_name)}</Text>
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardName} numberOfLines={1}>{member.full_name || member.email}</Text>
        <Text style={s.cardEmail} numberOfLines={1}>{member.email}</Text>
      </View>
      <View style={[s.roleBadge, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon} size={9} color={cfg.color} />
        <Text style={[s.roleLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      {isOwner && member.role !== 'OWNER' && (
        <Pressable onPress={() => onRemove(member.user_id)} style={s.removeBtn} hitSlop={8}>
          <Feather name="x" size={14} color="#ef4444" />
        </Pressable>
      )}
    </View>
  );
}

/* ── Main screen ───────────────────────────────────────── */
export default function TeamScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router          = useRouter();
  const insets          = useSafeAreaInsets();

  const {
    members, meta, isLoading, isSubmitting,
    fetchMembers, inviteMember, removeMember,
  } = useTeamStore();

  const [showSheet, setShowSheet] = useState(false);
  const [email,     setEmail]     = useState('');
  const [name,      setName]      = useState('');
  const [invErr,    setInvErr]    = useState('');

  useFocusEffect(useCallback(() => {
    if (eventId) fetchMembers(eventId);
  }, [eventId, fetchMembers]));

  /* ── derived ── */
  const isOwner    = meta?.currentUserRole === 'OWNER';
  const adminCount = (meta?.current ?? 1) - 1;
  const maxAdmins  = meta?.maxAdmins ?? 0;
  const canInvite  = isOwner && meta
    ? (meta.maxAdmins === null || adminCount < maxAdmins)
    : false;
  const planLabel  = meta?.plan
    ? meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1)
    : '';

  /* ── handlers ── */
  const handleInvite = useCallback(async () => {
    setInvErr('');
    if (!email.trim()) { setInvErr('Enter an email address'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await inviteMember(eventId!, email.trim(), name.trim() || undefined);
    if (res.success) {
      setEmail(''); setName('');
      setShowSheet(false);
      if (res.type === 'invited') {
        Toast.show({ type: 'success', text1: 'Invite sent!', text2: 'They\'ll get an email with a signup link.' });
      } else {
        Toast.show({ type: 'success', text1: 'Admin added', text2: 'They can log in now.' });
      }
    } else {
      setInvErr(res.error || 'Failed to invite');
    }
  }, [email, eventId, inviteMember]);

  const handleRemove = useCallback((memberId: string) => {
    Alert.alert('Remove Admin', 'Remove this person from the event team?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const res = await removeMember(eventId!, memberId);
          if (!res.success) Toast.show({ type: 'error', text1: 'Error', text2: res.error ?? 'Could not remove' });
        },
      },
    ]);
  }, [eventId, removeMember]);

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>

      {/* Header */}
      <View style={[s.header, { paddingTop: Math.max(insets.top + 8, 52) }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Team</Text>
          <Text style={s.headerSub}>Manage event admins</Text>
        </View>
        {/* Add button always visible for owner */}
        {isOwner && (
          <Pressable
            onPress={() => setShowSheet(true)}
            style={[s.addBtn, !canInvite && s.addBtnDim]}
            hitSlop={8}
          >
            <Feather name="user-plus" size={16} color="#fff" />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}>

        {/* Plan badge */}
        {meta && (
          <View style={s.planRow}>
            <View style={[
              s.planBadge,
              { backgroundColor: adminCount >= maxAdmins && maxAdmins !== null
                  ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)' },
            ]}>
              <Text style={[
                s.planBadgeText,
                { color: adminCount >= maxAdmins && maxAdmins !== null ? '#ef4444' : Colors.accent.indigo },
              ]}>
                {meta.maxAdmins === null
                  ? `Unlimited admins · ${planLabel}`
                  : `${adminCount}/${maxAdmins} admin${maxAdmins === 1 ? '' : 's'} · ${planLabel}`}
              </Text>
            </View>
          </View>
        )}

        {/* Upgrade banner when limit hit */}
        {isOwner && !canInvite && meta?.maxAdmins !== null && (
          <View style={s.limitCard}>
            <View style={s.limitIcon}>
              <Feather name="award" size={16} color={Colors.accent.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.limitTitle}>Admin limit reached</Text>
              <Text style={s.limitSub}>Upgrade your plan to add more admins</Text>
            </View>
          </View>
        )}

        {/* Members */}
        {isLoading ? (
          <ActivityIndicator color={Colors.accent.indigo} style={{ marginTop: 40 }} />
        ) : members.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Feather name="users" size={28} color={Colors.accent.indigo} />
            </View>
            <Text style={s.emptyTitle}>No team members yet</Text>
            <Text style={s.emptySub}>
              {isOwner ? 'Tap + above to invite an admin by email' : 'Only the event owner can add admins'}
            </Text>
          </View>
        ) : (
          <View style={s.memberList}>
            {members.map((m) => (
              <MemberCard key={m.user_id} member={m} isOwner={isOwner} onRemove={handleRemove} />
            ))}
          </View>
        )}

        {/* Access info */}
        <View style={s.accessCard}>
          <Text style={s.accessTitle}>ADMIN CAN DO</Text>
          {ACCESS_ROWS.map(([label, allowed]) => (
            <View key={label} style={s.accessRow}>
              <View style={[s.accessDot, { backgroundColor: allowed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: allowed ? '#10b981' : '#ef4444' }}>
                  {allowed ? '✓' : '✕'}
                </Text>
              </View>
              <Text style={[s.accessLabel, { color: allowed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Invite sheet */}
      <Modal
        visible={showSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSheet(false)}
      >
        <View style={s.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSheet(false)}>
            <View style={s.overlay} />
          </Pressable>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHandle} />

          <Text style={s.sheetTitle}>Add Admin by Email</Text>
          <Text style={s.sheetSub}>
            {canInvite
              ? "Enter your teammate's email. If they have an account they're added instantly. Otherwise they get a signup link."
              : `You've used all ${maxAdmins} admin slot${maxAdmins === 1 ? '' : 's'} for your ${planLabel} plan. Upgrade to add more.`}
          </Text>

          {canInvite ? (
            <>
              <TextInput
                style={s.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="teammate@email.com"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={handleInvite}
              />
              <TextInput
                style={[s.emailInput, { marginTop: 8 }]}
                value={name}
                onChangeText={setName}
                placeholder="Their name (optional)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleInvite}
              />
              {!!invErr && <Text style={s.invErr}>{invErr}</Text>}
              <View style={s.sheetActions}>
                <Pressable
                  onPress={() => { setShowSheet(false); setEmail(''); setName(''); setInvErr(''); }}
                  style={[s.sheetBtn, s.sheetBtnCancel]}
                >
                  <Text style={s.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleInvite}
                  disabled={isSubmitting}
                  style={[s.sheetBtn, s.sheetBtnConfirm, isSubmitting && { opacity: 0.6 }]}
                >
                  {isSubmitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.confirmText}>Send Invite</Text>}
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              onPress={() => { setShowSheet(false); }}
              style={[s.sheetBtn, { backgroundColor: Colors.accent.amber, marginTop: 8 }]}
            >
              <Text style={s.confirmText}>Upgrade Plan</Text>
            </Pressable>
          )}
        </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* ── styles ─────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#0a0a12' },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDim: { backgroundColor: Colors.accent.amber },

  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  planRow:       { marginBottom: 16 },
  planBadge:     { alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  planBadgeText: { fontSize: 11, fontWeight: '800' },

  limitCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0e0e16', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    padding: 14, marginBottom: 16,
  },
  limitIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  limitTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  limitSub:   { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  memberList: { gap: 10, marginBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0e0e16', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14,
  },
  avatar:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  cardInfo:   { flex: 1, minWidth: 0 },
  cardName:   { fontSize: 14, fontWeight: '700', color: '#fff' },
  cardEmail:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
  roleBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 4 },
  roleLabel:  { fontSize: 9, fontWeight: '800' },
  removeBtn:  {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  empty:     { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(99,102,241,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emptySub:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 24 },

  accessCard: {
    backgroundColor: '#0e0e16', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 16, gap: 4,
  },
  accessTitle: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.2, marginBottom: 8 },
  accessRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  accessDot:   { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  accessLabel: { fontSize: 12 },

  modalRoot:  { flex: 1, justifyContent: 'flex-end' },
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#13131e',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 16,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle:  { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 6 },
  sheetSub:    { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 18 },
  emailInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: '#fff', marginBottom: 8,
  },
  invErr:       { fontSize: 12, color: '#ef4444', marginBottom: 12 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  sheetBtn:     { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  sheetBtnCancel:  { backgroundColor: 'rgba(255,255,255,0.06)' },
  sheetBtnConfirm: { backgroundColor: Colors.accent.indigo },
  cancelText:  { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
