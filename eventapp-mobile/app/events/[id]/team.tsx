import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, ActivityIndicator,
} from 'react-native';
import { ConfirmModal, useConfirm } from '@/components/ui/ConfirmModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { notify } from '@/lib/toast';

import { useTeamStore, TeamMember } from '@/store/team.store';
import { Colors } from '@/constants/colors';

/* ── helpers ─────────────────────────────────────────────────────── */
function initials(name = '') {
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const ROLE_CFG = {
  OWNER: { label: 'Owner', color: Colors.accent.amber,  bg: 'rgba(245,158,11,0.14)', icon: 'award'  as const },
  ADMIN: { label: 'Admin', color: Colors.accent.indigo, bg: 'rgba(99,102,241,0.14)',  icon: 'shield' as const },
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

/* ── Avatar ─────────────────────────────────────────────────────── */
function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '22', borderColor: color + '44', borderWidth: 1 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.3, color }]}>{initials(name)}</Text>
    </View>
  );
}

/* ── MemberCard ─────────────────────────────────────────────────── */
function MemberCard({ member, isOwner, onRemove }: { member: TeamMember; isOwner: boolean; onRemove: (id: string) => void }) {
  const cfg = ROLE_CFG[member.role] ?? ROLE_CFG.ADMIN;
  const isAccepted = !!(member as any).accepted_at;

  return (
    <View style={s.memberCard}>
      <Avatar name={member.full_name || member.email} color={cfg.color} />

      <View style={s.memberInfo}>
        <Text style={s.memberName} numberOfLines={1}>{member.full_name || member.email}</Text>
        <Text style={s.memberEmail} numberOfLines={1}>{member.email}</Text>
        <View style={s.memberMeta}>
          <View style={[s.rolePill, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={8} color={cfg.color} />
            <Text style={[s.roleText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: isAccepted ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' }]}>
            <Text style={[s.statusText, { color: isAccepted ? '#10b981' : Colors.accent.amber }]}>
              {isAccepted ? '● Active' : '◌ Pending'}
            </Text>
          </View>
        </View>
      </View>

      {isOwner && member.role !== 'OWNER' && (
        <Pressable
          onPress={() => onRemove(member.user_id)}
          style={s.removeBtn}
          hitSlop={10}
        >
          <Feather name="x" size={13} color="#ef4444" />
        </Pressable>
      )}
    </View>
  );
}

/* ── InviteForm ─────────────────────────────────────────────────── */
function InviteForm({ eventId, canInvite, meta, onSuccess }: {
  eventId: string; canInvite: boolean; meta: any; onSuccess: () => void;
}) {
  const { inviteMember, isSubmitting } = useTeamStore();
  const [email, setEmail] = useState('');
  const [err,   setErr]   = useState('');
  const [notice, setNotice] = useState<'added' | 'invited' | ''>('');

  const submit = async () => {
    setErr(''); setNotice('');
    if (!email.trim()) { setErr('Enter an email address'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await inviteMember(eventId, email.trim(), '');
    if (res.success) {
      setEmail('');
      const type = res.type === 'invited' ? 'invited' : 'added';
      setNotice(type);
      setTimeout(() => setNotice(''), 4000);
      onSuccess();
      notify.memberInvited();
    } else {
      setErr(res.error || 'Failed to invite');
    }
  };

  if (!canInvite && meta) {
    const planLabel = meta.plan ? meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1) : '';
    return (
      <View style={s.limitBanner}>
        <View style={s.limitIcon}>
          <Feather name="award" size={15} color={Colors.accent.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.limitTitle}>Admin limit reached · {planLabel}</Text>
          <Text style={s.limitSub}>Upgrade your plan to invite more admins</Text>
        </View>
        <View style={s.upgradePill}>
          <Text style={s.upgradeText}>Upgrade</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.inviteForm}>
      {/* Email row */}
      <View style={s.inputRow}>
        <Feather name="mail" size={14} color="rgba(255,255,255,0.3)" style={{ marginRight: 10 }} />
        <TextInput
          style={s.textInput}
          value={email}
          onChangeText={setEmail}
          placeholder="teammate@email.com"
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </View>

      {/* Error */}
      {!!err && (
        <Text style={s.errText}>{err}</Text>
      )}

      {/* Feedback */}
      {notice !== '' && (
        <View style={[s.noticePill, { backgroundColor: notice === 'added' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)' }]}>
          <Feather name={notice === 'added' ? 'check-circle' : 'send'} size={12} color={notice === 'added' ? '#10b981' : Colors.accent.indigo} />
          <Text style={[s.noticeText, { color: notice === 'added' ? '#10b981' : Colors.accent.indigo }]}>
            {notice === 'added' ? 'Added — they can log in now.' : 'Invite sent by email.'}
          </Text>
        </View>
      )}

      {/* Send button */}
      <Pressable
        onPress={submit}
        disabled={isSubmitting}
        style={[s.sendBtn, isSubmitting && { opacity: 0.6 }]}
      >
        {isSubmitting
          ? <ActivityIndicator size="small" color="#fff" />
          : <>
              <Feather name="send" size={14} color="#fff" />
              <Text style={s.sendBtnText}>Send Invite</Text>
            </>
        }
      </Pressable>
    </View>
  );
}

/* ── Main screen ────────────────────────────────────────────────── */
export default function TeamScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    members, meta, isLoading,
    fetchMembers, inviteMember, removeMember,
  } = useTeamStore();

  useFocusEffect(useCallback(() => {
    if (eventId) fetchMembers(eventId);
  }, [eventId, fetchMembers]));

  const isOwner    = meta?.currentUserRole === 'OWNER';
  const adminCount = (meta?.current ?? 1) - 1;
  const maxAdmins  = meta?.maxAdmins ?? 0;
  const canInvite  = isOwner && meta
    ? (meta.maxAdmins === null || adminCount < maxAdmins)
    : false;
  const planLabel  = meta?.plan ? meta.plan.charAt(0).toUpperCase() + meta.plan.slice(1) : '';

  const { confirm, confirmProps } = useConfirm();

  const handleRemove = useCallback((memberId: string) => {
    confirm({
      title: 'Remove Admin',
      message: 'Remove this person from the event team?',
      confirmLabel: 'Remove',
      variant: 'danger',
      onConfirm: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const res = await removeMember(eventId!, memberId);
        if (!res.success) notify.memberFailed(res.error);
      },
    });
  }, [eventId, removeMember, confirm]);

  const owners = members.filter(m => m.role === 'OWNER');
  const admins = members.filter(m => m.role !== 'OWNER');

  return (
    <SafeAreaView style={s.root} edges={['bottom']}>

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: Math.max(insets.top + 10, 54) }]}>
        {/* Accent bar */}
        <View style={s.accentBar} />

        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={10}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Team</Text>
          <Text style={s.headerSub}>Manage event collaborators</Text>
        </View>

        {/* Plan quota chip */}
        {meta && (
          <View style={[
            s.quotaChip,
            { backgroundColor: adminCount >= maxAdmins && meta.maxAdmins !== null
                ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)' },
          ]}>
            <Text style={[
              s.quotaText,
              { color: adminCount >= maxAdmins && meta.maxAdmins !== null ? '#ef4444' : Colors.accent.indigo },
            ]}>
              {meta.maxAdmins === null
                ? `∞ · ${planLabel}`
                : `${adminCount}/${maxAdmins}`}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Invite section ── */}
        {isOwner && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIconWrap}>
                <Feather name="user-plus" size={13} color={Colors.accent.indigo} />
              </View>
              <Text style={s.sectionTitle}>Add by Email</Text>
            </View>
            <Text style={s.sectionSub}>
              They'll be added instantly if they have an account — otherwise they'll receive a signup link.
            </Text>
            <InviteForm
              eventId={eventId!}
              canInvite={canInvite}
              meta={meta}
              onSuccess={() => fetchMembers(eventId!)}
            />
          </View>
        )}

        {/* ── Members ── */}
        {isLoading ? (
          <ActivityIndicator color={Colors.accent.indigo} style={{ marginTop: 32 }} />
        ) : members.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Feather name="users" size={26} color={Colors.accent.indigo} />
            </View>
            <Text style={s.emptyTitle}>No team members yet</Text>
            <Text style={s.emptySub}>
              {isOwner ? 'Use the form above to invite an admin by email' : 'Only the event owner can add admins'}
            </Text>
          </View>
        ) : (
          <>
            {owners.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={s.groupLabel}>Owner</Text>
                <View style={s.memberList}>
                  {owners.map(m => (
                    <MemberCard key={m.user_id} member={m} isOwner={isOwner} onRemove={handleRemove} />
                  ))}
                </View>
              </View>
            )}
            {admins.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={s.groupLabel}>Team · {admins.length}</Text>
                <View style={s.memberList}>
                  {admins.map(m => (
                    <MemberCard key={m.user_id} member={m} isOwner={isOwner} onRemove={handleRemove} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── Permissions ── */}
        <View style={s.permCard}>
          <View style={s.permHeader}>
            <Feather name="shield" size={13} color={Colors.accent.indigo} />
            <Text style={s.permTitle}>Admin Permissions</Text>
          </View>
          <View style={s.permGrid}>
            {ACCESS_ROWS.map(([label, allowed]) => (
              <View key={label} style={s.permRow}>
                <View style={[s.permDot, { backgroundColor: allowed ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)' }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: allowed ? '#10b981' : '#ef4444' }}>
                    {allowed ? '✓' : '✕'}
                  </Text>
                </View>
                <Text style={[s.permLabel, { color: allowed ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)' }]}
                      numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
      <ConfirmModal {...confirmProps} />
    </SafeAreaView>
  );
}

/* ── styles ─────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg.primary },

  /* header */
  header: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: Colors.accent.indigo, opacity: 0.6,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  quotaChip: {
    borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5,
  },
  quotaText: { fontSize: 11, fontWeight: '800' },

  /* scroll */
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 0 },

  /* section card */
  section: {
    backgroundColor: Colors.bg.card, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 16, marginBottom: 20,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  sectionSub: { fontSize: 12, color: 'rgba(255,255,255,0.38)', lineHeight: 18, marginBottom: 16 },

  /* invite form */
  inviteForm:  { gap: 0 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
  },
  textInput:   { flex: 1, fontSize: 14, color: '#fff' },
  errText:     { fontSize: 12, color: '#ef4444', marginTop: 8 },
  noticePill:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginTop: 8 },
  noticeText:  { fontSize: 12, fontWeight: '600' },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent.indigo, borderRadius: 12,
    paddingVertical: 13, marginTop: 12,
  },
  sendBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  /* limit banner */
  limitBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 12, padding: 14,
  },
  limitIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  limitTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  limitSub:   { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  upgradePill: {
    backgroundColor: Colors.accent.amber, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  upgradeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  /* group label */
  groupLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
    marginBottom: 10, paddingHorizontal: 2,
  },
  memberList: { gap: 8 },

  /* member card */
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.card, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900' },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName:  { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 1 },
  memberEmail: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  memberMeta:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 9, fontWeight: '900' },
  statusPill: { borderRadius: 100, paddingHorizontal: 7, paddingVertical: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },
  removeBtn: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* empty */
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10, marginBottom: 20 },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emptySub:   { fontSize: 12, color: 'rgba(255,255,255,0.38)', textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },

  /* permissions */
  permCard: {
    backgroundColor: Colors.bg.card, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 16, marginBottom: 20,
  },
  permHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  permTitle:  { fontSize: 13, fontWeight: '800', color: '#fff' },
  permGrid:   { gap: 2 },
  permRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  permDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  permLabel: { fontSize: 13, flex: 1 },
});
