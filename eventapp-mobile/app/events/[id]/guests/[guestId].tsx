import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, TextInput, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useGuestStore }  from '@/store/guest.store';
import { BottomSheet }    from '@/components/ui/BottomSheet';
import { ConfirmModal }   from '@/components/ui/ConfirmModal';
import { Colors }         from '@/constants/colors';
import { fmtDateTime }    from '@/lib/format';

/* ── Helpers ───────────────────────────────────────────────────── */
function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const STATUS_CFG = {
  CONFIRMED: { color: Colors.accent.emerald, bg: `${Colors.accent.emerald}18`, dot: Colors.accent.emerald, label: 'Confirmed' },
  PENDING:   { color: Colors.accent.amber,   bg: `${Colors.accent.amber}18`,   dot: Colors.accent.amber,   label: 'Pending'   },
  DECLINED:  { color: '#ef4444',             bg: 'rgba(239,68,68,0.12)',        dot: '#ef4444',             label: 'Declined'  },
};

/* ── Section header ────────────────────────────────────────────── */
function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

/* ── Action row ────────────────────────────────────────────────── */
function ActionRow({
  icon, label, sub, accent, loading, onPress, danger = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string; sub?: string; accent: string;
  loading?: boolean; onPress: () => void; danger?: boolean;
}) {
  return (
    <Pressable
      style={[s.actionRow, danger && s.actionRowDanger]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={[s.actionIcon, { backgroundColor: `${accent}18` }]}>
        {loading
          ? <ActivityIndicator size={15} color={accent} />
          : <Feather name={icon} size={15} color={accent} />
        }
      </View>
      <View style={s.actionText}>
        <Text style={[s.actionLabel, danger && { color: '#ef4444' }]}>{label}</Text>
        {sub ? <Text style={s.actionSub}>{sub}</Text> : null}
      </View>
      <Feather name="chevron-right" size={14} color={danger ? '#ef444440' : 'rgba(255,255,255,0.12)'} />
    </Pressable>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN
══════════════════════════════════════════════════════════════════ */
export default function GuestDetailScreen() {
  const { id: eventId, guestId } = useLocalSearchParams<{ id: string; guestId: string }>();
  const router = useRouter();
  const {
    guests, getGuestById, getAttendance, updateGuest, deleteGuest,
    sendInvitation, sendQrEmail, manualCheckIn, submitGuestRsvp,
  } = useGuestStore();

  const [busy,         setBusy]         = useState<string | null>(null);
  const [editOpen,     setEditOpen]     = useState(false);
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [checkinModal, setCheckinModal] = useState(false);

  /* Edit form state */
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    is_vip: false, plus_one_allowed: false, plus_one_count: 0,
  });

  const guest = guests.find(g => g.id === guestId);

  useFocusEffect(
    useCallback(() => {
      if (eventId && guestId) {
        getGuestById(eventId, guestId);
        getAttendance(eventId);
      }

      // Poll every 15 s while screen is focused so web check-ins appear automatically
      const interval = setInterval(() => {
        if (eventId && guestId) {
          getGuestById(eventId, guestId);
          getAttendance(eventId);
        }
      }, 15000);
      return () => clearInterval(interval);
    }, [eventId, guestId])
  );

  // Sync form when guest loads or edit opens
  useEffect(() => {
    if (guest) {
      setForm({
        full_name:        guest.full_name ?? '',
        email:            guest.email     ?? '',
        phone:            guest.phone     ?? '',
        is_vip:           guest.is_vip,
        plus_one_allowed: guest.plus_one_allowed,
        plus_one_count:   guest.plus_one_count,
      });
    }
  }, [guest?.id, editOpen]);

  if (!guest) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.accent.indigo} size="large" />
      </View>
    );
  }

  const run = async (key: string, fn: () => Promise<{ success: boolean; error?: string }>, msg: string) => {
    setBusy(key);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await fn();
    setBusy(null);
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: msg });
    } else {
      Toast.show({ type: 'error', text1: res.error ?? 'Action failed' });
    }
  };

  const handleSaveEdit = async () => {
    if (!form.full_name.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required' });
      return;
    }
    setBusy('save');
    const res = await updateGuest(eventId!, guestId!, {
      full_name:        form.full_name.trim(),
      email:            form.email.trim() || null,
      phone:            form.phone.trim() || null,
      is_vip:           form.is_vip,
      plus_one_allowed: form.plus_one_allowed,
      plus_one_count:   form.plus_one_count,
    } as any);
    setBusy(null);
    if (res.success) {
      Toast.show({ type: 'success', text1: 'Guest updated' });
      setEditOpen(false);
    } else {
      Toast.show({ type: 'error', text1: 'Failed to update guest' });
    }
  };

  const handleRsvp = async (status: string) => {
    setBusy(`rsvp_${status}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await submitGuestRsvp(eventId!, { guest_id: guestId, rsvp_status: status });
    setBusy(null);
    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: `Marked as ${status.toLowerCase()}` });
    } else {
      Toast.show({ type: 'error', text1: 'RSVP update failed' });
    }
  };

  const cfg = (STATUS_CFG as any)[guest.status] ?? STATUS_CFG.PENDING;
  const initials = getInitials(guest.full_name);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{guest.full_name}</Text>
        <Pressable style={s.editBtn} onPress={() => setEditOpen(true)} hitSlop={8}>
          <Feather name="edit-2" size={15} color={Colors.accent.indigo} />
          <Text style={s.editBtnTxt}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        {/* ── Profile card ─────────────────────────────────────── */}
        <View style={s.profileCard}>
          <LinearGradient
            colors={[`${cfg.color}18`, `${cfg.color}06`]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          {/* Avatar */}
          <View style={[s.avatar, { backgroundColor: `${cfg.color}22`, borderColor: `${cfg.color}44` }]}>
            {guest.is_vip && <Text style={s.crownOverlay}>👑</Text>}
            <Text style={[s.avatarTxt, { color: cfg.color }]}>{initials}</Text>
          </View>

          <Text style={s.profileName}>{guest.full_name}</Text>

          <View style={s.contactRow}>
            {guest.email && (
              <View style={s.contactPill}>
                <Feather name="mail" size={11} color={Colors.text.subtle} />
                <Text style={s.contactTxt}>{guest.email}</Text>
              </View>
            )}
            {guest.phone && (
              <View style={s.contactPill}>
                <Feather name="phone" size={11} color={Colors.text.subtle} />
                <Text style={s.contactTxt}>{guest.phone}</Text>
              </View>
            )}
          </View>

          {/* Badges row */}
          <View style={s.badgesRow}>
            <View style={[s.statusBadge, { backgroundColor: cfg.bg, borderColor: `${cfg.color}35` }]}>
              <View style={[s.badgeDot, { backgroundColor: cfg.dot }]} />
              <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {guest.is_vip && (
              <View style={[s.statusBadge, { backgroundColor: `${Colors.accent.amber}15`, borderColor: `${Colors.accent.amber}35` }]}>
                <Text style={[s.badgeTxt, { color: Colors.accent.amber }]}>👑 VIP</Text>
              </View>
            )}
            {guest.plus_one_allowed && (
              <View style={[s.statusBadge, { backgroundColor: `${Colors.accent.violet}15`, borderColor: `${Colors.accent.violet}35` }]}>
                <Feather name="users" size={9} color={Colors.accent.violet} />
                <Text style={[s.badgeTxt, { color: Colors.accent.violet }]}>+{guest.plus_one_count || 1}</Text>
              </View>
            )}
            {guest.checked_in_at && (
              <View style={[s.statusBadge, { backgroundColor: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.35)' }]}>
                <Feather name="check-circle" size={9} color="#06b6d4" />
                <Text style={[s.badgeTxt, { color: '#06b6d4' }]}>Checked In</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Check-in status ──────────────────────────────────── */}
        {guest.checked_in_at ? (
          <View style={[s.checkinBanner, { borderColor: 'rgba(6,182,212,0.25)', backgroundColor: 'rgba(6,182,212,0.07)' }]}>
            <Feather name="check-circle" size={18} color="#06b6d4" />
            <View>
              <Text style={[s.checkinTitle, { color: '#06b6d4' }]}>Checked In</Text>
              <Text style={s.checkinTime}>{fmtDateTime(guest.checked_in_at)}</Text>
            </View>
          </View>
        ) : (
          <View style={[s.checkinBanner, { borderColor: `${Colors.accent.amber}25`, backgroundColor: `${Colors.accent.amber}07` }]}>
            <Feather name="clock" size={18} color={Colors.accent.amber} />
            <Text style={[s.checkinTitle, { color: Colors.accent.amber }]}>Not yet checked in</Text>
          </View>
        )}

        {/* ── RSVP Status ──────────────────────────────────────── */}
        <SectionLabel label="RSVP STATUS" />
        <View style={s.rsvpRow}>
          {(['CONFIRMED', 'PENDING', 'DECLINED'] as const).map(st => {
            const c = STATUS_CFG[st];
            const isActive = guest.status === st;
            return (
              <Pressable
                key={st}
                style={[s.rsvpBtn, isActive && { backgroundColor: `${c.color}20`, borderColor: `${c.color}55` }]}
                onPress={() => !isActive && handleRsvp(st)}
                disabled={isActive || busy?.startsWith('rsvp')}
              >
                {busy === `rsvp_${st}`
                  ? <ActivityIndicator size={12} color={c.color} />
                  : <View style={[s.rsvpDot, { backgroundColor: isActive ? c.dot : Colors.border.DEFAULT }]} />
                }
                <Text style={[s.rsvpTxt, isActive && { color: c.color, fontWeight: '800' }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Communication ─────────────────────────────────────── */}
        <SectionLabel label="COMMUNICATION" />
        <View style={s.actionGroup}>
          <ActionRow
            icon="mail"
            label="Send Invitation"
            sub="Email event details & RSVP link"
            accent={Colors.accent.indigo}
            loading={busy === 'invite'}
            onPress={() => run('invite', () => sendInvitation(eventId!, guestId!), 'Invitation sent!')}
          />
          <View style={s.sep} />
          <ActionRow
            icon="grid"
            label="Send QR Code"
            sub="Email QR check-in ticket"
            accent={Colors.accent.emerald}
            loading={busy === 'qr'}
            onPress={() => run('qr', () => sendQrEmail(eventId!, guestId!), 'QR code sent!')}
          />
        </View>

        {/* ── Check-in ──────────────────────────────────────────── */}
        {!guest.checked_in_at && (
          <>
            <SectionLabel label="CHECK-IN" />
            <View style={s.actionGroup}>
              <ActionRow
                icon="user-check"
                label="Manual Check-In"
                sub="Mark this guest as arrived"
                accent={Colors.accent.amber}
                loading={busy === 'checkin'}
                onPress={() => setCheckinModal(true)}
              />
            </View>
          </>
        )}

        {/* ── Details ───────────────────────────────────────────── */}
        <SectionLabel label="DETAILS" />
        <View style={s.detailsCard}>
          <DetailRow icon="hash"       label="Guest ID"    value={guest.id.slice(0, 12) + '…'} />
          <View style={s.sep} />
          <DetailRow icon="calendar"   label="Added"       value={fmtDateTime(guest.created_at)} />
          {guest.group_id && <>
            <View style={s.sep} />
            <DetailRow icon="layers" label="Group" value={guest.group_id.slice(0, 12) + '…'} />
          </>}
        </View>

        {/* ── Danger zone ───────────────────────────────────────── */}
        <SectionLabel label="DANGER ZONE" />
        <View style={s.actionGroup}>
          <ActionRow
            icon="trash-2"
            label="Remove Guest"
            sub="Permanently delete from this event"
            accent="#ef4444"
            danger
            onPress={() => setDeleteModal(true)}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Edit bottom sheet ─────────────────────────────────────── */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit Guest">
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={ef.wrap}>
            <View style={ef.field}>
              <Text style={ef.label}>FULL NAME *</Text>
              <TextInput
                style={ef.input}
                value={form.full_name}
                onChangeText={v => setForm(f => ({ ...f, full_name: v }))}
                placeholder="Guest name"
                placeholderTextColor={Colors.text.subtle}
              />
            </View>

            <View style={ef.field}>
              <Text style={ef.label}>EMAIL</Text>
              <TextInput
                style={ef.input}
                value={form.email}
                onChangeText={v => setForm(f => ({ ...f, email: v }))}
                placeholder="guest@email.com"
                placeholderTextColor={Colors.text.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={ef.field}>
              <Text style={ef.label}>PHONE</Text>
              <TextInput
                style={ef.input}
                value={form.phone}
                onChangeText={v => setForm(f => ({ ...f, phone: v }))}
                placeholder="+1 555 000 0000"
                placeholderTextColor={Colors.text.subtle}
                keyboardType="phone-pad"
              />
            </View>

            <View style={ef.toggleRow}>
              <View style={ef.toggleInfo}>
                <Text style={ef.toggleLabel}>VIP Guest</Text>
                <Text style={ef.toggleSub}>Crown badge + priority treatment</Text>
              </View>
              <Switch
                value={form.is_vip}
                onValueChange={v => setForm(f => ({ ...f, is_vip: v }))}
                trackColor={{ false: Colors.border.DEFAULT, true: `${Colors.accent.amber}60` }}
                thumbColor={form.is_vip ? Colors.accent.amber : Colors.text.subtle}
              />
            </View>

            <View style={ef.toggleRow}>
              <View style={ef.toggleInfo}>
                <Text style={ef.toggleLabel}>Allow Plus Ones</Text>
                <Text style={ef.toggleSub}>Guest can bring additional people</Text>
              </View>
              <Switch
                value={form.plus_one_allowed}
                onValueChange={v => setForm(f => ({ ...f, plus_one_allowed: v, plus_one_count: v ? (f.plus_one_count || 1) : 0 }))}
                trackColor={{ false: Colors.border.DEFAULT, true: `${Colors.accent.violet}60` }}
                thumbColor={form.plus_one_allowed ? Colors.accent.violet : Colors.text.subtle}
              />
            </View>

            {form.plus_one_allowed && (
              <View style={ef.field}>
                <Text style={ef.label}>PLUS ONE COUNT</Text>
                <View style={ef.counter}>
                  <Pressable
                    style={ef.counterBtn}
                    onPress={() => setForm(f => ({ ...f, plus_one_count: Math.max(1, f.plus_one_count - 1) }))}
                  >
                    <Feather name="minus" size={16} color={Colors.text.muted} />
                  </Pressable>
                  <Text style={ef.counterVal}>{form.plus_one_count}</Text>
                  <Pressable
                    style={ef.counterBtn}
                    onPress={() => setForm(f => ({ ...f, plus_one_count: Math.min(10, f.plus_one_count + 1) }))}
                  >
                    <Feather name="plus" size={16} color={Colors.text.muted} />
                  </Pressable>
                </View>
              </View>
            )}

            <Pressable style={ef.saveBtn} onPress={handleSaveEdit} disabled={busy === 'save'}>
              <LinearGradient
                colors={[Colors.accent.indigo, Colors.accent.violet]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              {busy === 'save'
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={ef.saveTxt}>Save Changes</Text>
                  </>
              }
            </Pressable>
          </View>
        </ScrollView>
      </BottomSheet>

      <ConfirmModal
        open={checkinModal}
        title="Manual check-in?"
        description={`Mark ${guest.full_name} as checked in right now.`}
        confirmText="Check In"
        onConfirm={() => { setCheckinModal(false); run('checkin', () => manualCheckIn(eventId!, guestId!), 'Checked in!'); }}
        onClose={() => setCheckinModal(false)}
      />
      <ConfirmModal
        open={deleteModal}
        title="Remove guest?"
        description={`${guest.full_name} will be permanently removed from this event.`}
        confirmText="Remove"
        variant="danger"
        onConfirm={async () => { await deleteGuest(eventId!, guestId!); router.back(); }}
        onClose={() => setDeleteModal(false)}
      />
    </SafeAreaView>
  );
}

/* ── Detail row ────────────────────────────────────────────────── */
function DetailRow({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Feather name={icon} size={13} color={Colors.text.subtle} />
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

/* ── Styles ────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },
  content:{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 10 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '900', color: '#fff' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: `${Colors.accent.indigo}14`, borderWidth: 1, borderColor: `${Colors.accent.indigo}30`,
  },
  editBtnTxt: { fontSize: 12, fontWeight: '700', color: Colors.accent.indigo },

  profileCard: {
    alignItems: 'center', gap: 10, padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border.DEFAULT, overflow: 'hidden',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  crownOverlay: { position: 'absolute', top: -4, right: -4, fontSize: 14 },
  avatarTxt:    { fontSize: 22, fontWeight: '900' },
  profileName:  { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },

  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  contactPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.subtle,
  },
  contactTxt: { fontSize: 11, color: Colors.text.muted, fontWeight: '600' },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },

  checkinBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  checkinTitle: { fontSize: 14, fontWeight: '700' },
  checkinTime:  { fontSize: 12, color: Colors.text.muted, marginTop: 2 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.text.subtle,
    textTransform: 'uppercase', letterSpacing: 1.5,
    marginTop: 6, marginBottom: 2,
  },

  rsvpRow: { flexDirection: 'row', gap: 8 },
  rsvpBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 12,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.subtle,
  },
  rsvpDot: { width: 7, height: 7, borderRadius: 4 },
  rsvpTxt: { fontSize: 11, fontWeight: '700', color: Colors.text.muted },

  actionGroup: {
    backgroundColor: Colors.bg.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border.subtle, overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  actionRowDanger: { backgroundColor: 'rgba(239,68,68,0.04)' },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1 },
  actionLabel:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  actionSub:  { fontSize: 11, color: Colors.text.subtle, marginTop: 1 },

  sep: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: 62 },

  detailsCard: {
    backgroundColor: Colors.bg.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border.subtle, overflow: 'hidden',
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  detailLabel: { fontSize: 12, color: Colors.text.subtle, fontWeight: '600', width: 70 },
  detailValue: { flex: 1, fontSize: 12, color: Colors.text.muted, textAlign: 'right' },
});

/* ── Edit form styles ──────────────────────────────────────────── */
const ef = StyleSheet.create({
  wrap:  { padding: 16, gap: 14, paddingBottom: 32 },
  field: { gap: 6 },
  label: { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, letterSpacing: 1.2 },
  input: {
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  toggleSub:   { fontSize: 11, color: Colors.text.subtle, marginTop: 2 },

  counter: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  counterBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    borderRadius: 10,
  },
  counterVal: { width: 48, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#fff' },

  saveBtn: {
    height: 50, borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6,
  },
  saveTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
