import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useGuestStore } from '@/store/guest.store';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Avatar }       from '@/components/ui/Avatar';
import { Colors }       from '@/constants/colors';
import { fmtDateTime }  from '@/lib/format';

export default function GuestDetailScreen() {
  const { id: eventId, guestId } = useLocalSearchParams<{ id: string; guestId: string }>();
  const router    = useRouter();
  const { guests, sendInvitation, sendQrEmail, manualCheckIn, deleteGuest } = useGuestStore();

  const [loading,      setLoading]      = useState<string | null>(null);
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [checkinModal, setCheckinModal] = useState(false);

  const guest = guests.find(g => g.id === guestId);

  if (!guest) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent.indigo} />
      </View>
    );
  }

  const run = async (key: string, fn: () => Promise<{ success: boolean }>, msg: string) => {
    setLoading(key);
    const res = await fn();
    setLoading(null);
    if (res.success) Toast.show({ type: 'success', text1: msg });
    else             Toast.show({ type: 'error',   text1: 'Action failed' });
  };

  const statusColor =
    guest.status === 'CONFIRMED' ? Colors.accent.emerald :
    guest.status === 'DECLINED'  ? Colors.accent.red     : Colors.accent.amber;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={18} color="#fff" />
          <Text style={styles.backText}>Guests</Text>
        </Pressable>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[Colors.bg.elevated, Colors.bg.card]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <Avatar
            name={guest.full_name}
            size={72}
            accent={guest.is_vip ? Colors.accent.gold : Colors.accent.indigo}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{guest.full_name}</Text>
              {guest.is_vip && <Text style={styles.vipBadge}>👑 VIP</Text>}
            </View>
            {guest.email && <Text style={styles.email}>{guest.email}</Text>}
            {guest.phone && <Text style={styles.phone}>{guest.phone}</Text>}
          </View>

          {/* Status */}
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}35` }]}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {guest.status.charAt(0) + guest.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>

        {/* Check-in status */}
        {guest.checked_in_at ? (
          <View style={styles.checkinCard}>
            <Feather name="check-circle" size={18} color={Colors.accent.emerald} />
            <View>
              <Text style={styles.checkinTitle}>Checked In</Text>
              <Text style={styles.checkinTime}>{fmtDateTime(guest.checked_in_at)}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.checkinCard, { borderColor: `${Colors.accent.amber}30`, backgroundColor: `${Colors.accent.amber}08` }]}>
            <Feather name="clock" size={18} color={Colors.accent.amber} />
            <Text style={[styles.checkinTitle, { color: Colors.accent.amber }]}>Not yet checked in</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="mail"
            label="Send Invitation"
            sub="Email guest with event details"
            accent={Colors.accent.indigo}
            loading={loading === 'invite'}
            onPress={() => run('invite', () => sendInvitation(eventId!, guestId!), 'Invitation sent!')}
          />
          <ActionCard
            icon="grid"
            label="Send QR Code"
            sub="Email QR ticket to guest"
            accent={Colors.accent.emerald}
            loading={loading === 'qr'}
            onPress={() => run('qr', () => sendQrEmail(eventId!, guestId!), 'QR sent!')}
          />
          {!guest.checked_in_at && (
            <ActionCard
              icon="user-check"
              label="Manual Check-in"
              sub="Mark as checked in"
              accent={Colors.accent.amber}
              loading={loading === 'checkin'}
              onPress={() => setCheckinModal(true)}
            />
          )}
        </View>

        {/* Delete */}
        <Pressable style={styles.deleteBtn} onPress={() => setDeleteModal(true)}>
          <Feather name="trash-2" size={14} color={Colors.accent.red} />
          <Text style={styles.deleteText}>Remove Guest</Text>
        </Pressable>

      </ScrollView>

      <ConfirmModal
        open={checkinModal}
        title="Manual check-in?"
        description={`Mark ${guest.full_name} as checked in right now.`}
        confirmText="Check In"
        onConfirm={() => run('checkin', () => manualCheckIn(eventId!, guestId!), 'Checked in!')}
        onClose={() => setCheckinModal(false)}
      />
      <ConfirmModal
        open={deleteModal}
        title="Remove guest?"
        description={`${guest.full_name} will be permanently removed from this event.`}
        confirmText="Remove"
        variant="danger"
        onConfirm={async () => {
          await deleteGuest(eventId!, guestId!);
          router.back();
        }}
        onClose={() => setDeleteModal(false)}
      />
    </SafeAreaView>
  );
}

function ActionCard({ icon, label, sub, accent, loading, onPress }: {
  icon: keyof typeof Feather.glyphMap;
  label: string; sub: string; accent: string;
  loading?: boolean; onPress: () => void;
}) {
  return (
    <Pressable style={[styles.actionCard, { borderColor: `${accent}25`, backgroundColor: `${accent}08` }]} onPress={onPress} disabled={loading}>
      <View style={[styles.actionIcon, { backgroundColor: `${accent}20` }]}>
        {loading ? <ActivityIndicator size={16} color={accent} /> : <Feather name={icon} size={16} color={accent} />}
      </View>
      <Text style={[styles.actionLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.actionSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },
  content: { padding: 16, gap: 14, paddingBottom: 40 },

  back:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  profileCard: { borderRadius: 20, borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 20, gap: 12, overflow: 'hidden', alignItems: 'center' },
  profileInfo: { alignItems: 'center', gap: 4 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name:        { fontSize: 20, fontWeight: '900', color: '#fff' },
  vipBadge:    { fontSize: 12, fontWeight: '800', color: Colors.accent.gold },
  email:       { fontSize: 13, color: Colors.text.muted },
  phone:       { fontSize: 13, color: Colors.text.muted },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  dot:         { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 12, fontWeight: '700' },

  checkinCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, borderColor: `${Colors.accent.emerald}30`,
    backgroundColor: `${Colors.accent.emerald}08`, padding: 14,
  },
  checkinTitle: { fontSize: 14, fontWeight: '700', color: Colors.accent.emerald },
  checkinTime:  { fontSize: 12, color: Colors.text.muted, marginTop: 2 },

  actionsGrid: { gap: 10 },
  actionCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  actionIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  actionSub:   { fontSize: 11, color: Colors.text.muted, flex: 1 },

  deleteBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: `${Colors.accent.red}30`, backgroundColor: `${Colors.accent.red}08` },
  deleteText: { fontSize: 13, fontWeight: '700', color: Colors.accent.red },
});
