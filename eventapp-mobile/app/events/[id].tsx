import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useEventStore }  from '@/store/event.store';
import { StatusBadge, Chip } from '@/components/ui/Badge';
import { Button }            from '@/components/ui/Button';
import { StatCard }          from '@/components/ui/StatCard';
import { CountdownTimer }    from '@/components/ui/CountdownTimer';
import { ConfirmModal }      from '@/components/ui/ConfirmModal';
import { Colors }            from '@/constants/colors';
import { fmtDateTime }       from '@/lib/format';

export default function EventDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const {
    currentEvent: event, dashboard,
    fetchEventById, fetchEventDashboard,
    publishEvent, unpublishEvent, archiveEvent, restoreEvent, deleteEvent,
  } = useEventStore();

  const [loading, setLoading] = useState(false);
  const [modal, setModal]     = useState<null | {
    action: () => Promise<unknown>; title: string; desc: string; danger?: boolean;
  }>(null);

  useEffect(() => {
    if (!id) return;
    fetchEventById(id);
    fetchEventDashboard(id);
  }, [id]);

  if (!event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accent.indigo} />
      </View>
    );
  }

  const stats   = dashboard?.stats;
  const status  = event.status;
  const run = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    await fn();
    setLoading(false);
    fetchEventById(id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Hero */}
        <View style={styles.hero}>
          {event.cover_image_url ? (
            <Image source={event.cover_image_url} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.bg.elevated }]} />
          )}
          <LinearGradient
            colors={['rgba(7,7,15,0.3)', 'rgba(7,7,15,0.95)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Back */}
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          {/* Title area */}
          <View style={styles.heroContent}>
            <StatusBadge status={status} />
            <Text style={styles.heroTitle}>{event.title}</Text>
            <Chip label={event.event_type?.toUpperCase()} accent={Colors.accent.indigo} />
          </View>
        </View>

        <View style={styles.body}>

          {/* Countdown */}
          {event.starts_at_utc && (
            <View style={styles.countdownWrap}>
              <Text style={styles.sectionLabel}>Event starts in</Text>
              <CountdownTimer targetIso={event.starts_at_utc} accent={Colors.accent.indigo} />
            </View>
          )}

          {/* Date + venue */}
          {(event.starts_at_local || event.venue_name) && (
            <View style={styles.metaCard}>
              {event.starts_at_local && (
                <View style={styles.metaRow}>
                  <Feather name="clock" size={14} color={Colors.accent.indigo} />
                  <Text style={styles.metaText}>{fmtDateTime(event.starts_at_local)}</Text>
                </View>
              )}
              {event.venue_name && (
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={14} color={Colors.accent.indigo} />
                  <Text style={styles.metaText}>
                    {event.venue_name}{event.city ? `, ${event.city}` : ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Stats */}
          {stats && (
            <View style={styles.statsRow}>
              <StatCard label="Guests"    value={stats.guest_count}    icon="users"        accent={Colors.accent.indigo}  />
              <StatCard label="Attending" value={stats.attending_count} icon="user-check"   accent={Colors.accent.emerald} />
              <StatCard label="Tickets"  value={stats.ticket_count}   icon="credit-card"  accent={Colors.accent.amber}   />
              <StatCard label="Scanned"  value={stats.checkin_count}  icon="check-circle" accent={Colors.accent.violet}  />
            </View>
          )}

          {/* Feature chips */}
          <View style={styles.featuresRow}>
            {event.allow_rsvp      && <Chip label="RSVP"      icon="👥" accent={Colors.accent.emerald} />}
            {event.allow_ticketing && <Chip label="Ticketing"  icon="🎟️" accent={Colors.accent.amber}   />}
            {event.allow_qr_checkin&& <Chip label="QR Check-in"icon="📷" accent={Colors.accent.indigo}  />}
            {event.allow_donations && <Chip label="Donations"  icon="💝" accent={Colors.accent.violet}  />}
          </View>

          {/* Status actions */}
          <View style={styles.actionsSection}>
            {status === 'DRAFT' && (
              <Button
                label="🚀 Publish Event"
                onPress={() => setModal({ action: () => run(() => publishEvent(id)), title: 'Publish event?', desc: 'Your event will be publicly visible.', danger: false })}
                accent={Colors.accent.emerald}
                size="lg"
                loading={loading}
              />
            )}
            {status === 'PUBLISHED' && (
              <Button
                label="Unpublish"
                onPress={() => setModal({ action: () => run(() => unpublishEvent(id)), title: 'Unpublish?', desc: 'Event goes back to draft.', danger: false })}
                variant="outline"
                accent={Colors.accent.amber}
              />
            )}
            {(status === 'CANCELLED' || status === 'ARCHIVED') && (
              <Button
                label="Restore Event"
                onPress={() => run(() => restoreEvent(id))}
                accent={Colors.accent.indigo}
              />
            )}
          </View>

          {/* Quick links */}
          <View style={styles.linksGrid}>
            <LinkCard icon="users"       label="Guests"    sub="Manage attendees"    onPress={() => router.push(`/events/${id}/guests` as never)}    accent={Colors.accent.indigo}  />
            <LinkCard icon="credit-card" label="Tickets"   sub="Types & orders"      onPress={() => router.push(`/events/${id}/tickets` as never)}   accent={Colors.accent.amber}   />
            <LinkCard icon="camera"      label="Scanner"   sub="QR check-in"         onPress={() => router.push(`/events/${id}/scanner` as never)}   accent={Colors.accent.emerald} />
            <LinkCard icon="bar-chart-2" label="Analytics" sub="Revenue & insights"  onPress={() => router.push(`/events/${id}/analytics` as never)} accent={Colors.accent.violet}  />
          </View>

          {/* Delete */}
          <Pressable
            style={styles.deleteBtn}
            onPress={() => setModal({ action: () => run(() => deleteEvent(id)), title: 'Delete event?', desc: 'All data including guests and tickets will be permanently erased.', danger: true })}
          >
            <Feather name="trash-2" size={14} color={Colors.accent.red} />
            <Text style={styles.deleteText}>Delete Event</Text>
          </Pressable>

        </View>
      </ScrollView>

      {modal && (
        <ConfirmModal
          open
          title={modal.title}
          description={modal.desc}
          confirmText={modal.title.includes('Delete') ? 'Delete' : 'Confirm'}
          variant={modal.danger ? 'danger' : 'default'}
          onConfirm={() => modal.action()}
          onClose={() => setModal(null)}
        />
      )}
    </SafeAreaView>
  );
}

function LinkCard({ icon, label, sub, onPress, accent }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      style={[styles.linkCard, { borderColor: `${accent}25`, backgroundColor: `${accent}08` }]}
      onPress={onPress}
    >
      <View style={[styles.linkIcon, { backgroundColor: `${accent}20` }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.linkSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg.primary },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },
  content: { paddingBottom: 60 },

  hero: { height: 260, position: 'relative' },
  back: {
    position:        'absolute',
    top:             52,
    left:            16,
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
  heroContent: {
    position: 'absolute',
    bottom:   20,
    left:     16,
    right:    16,
    gap:      8,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },

  body:  { padding: 16, gap: 16 },
  countdownWrap: { gap: 8 },
  sectionLabel:  { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, letterSpacing: 1, textTransform: 'uppercase' },

  metaCard: {
    backgroundColor: Colors.bg.card,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    padding:         14,
    gap:             8,
  },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, color: Colors.text.primary, fontWeight: '500', flex: 1 },

  statsRow:    { flexDirection: 'row', gap: 8 },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  actionsSection: { gap: 8 },

  linksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  linkCard: {
    width:         '47%',
    borderRadius:  16,
    borderWidth:   1,
    padding:       14,
    gap:           6,
  },
  linkIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
  linkSub:   { fontSize: 11, color: Colors.text.muted },

  deleteBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    paddingVertical: 12,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     `${Colors.accent.red}30`,
    backgroundColor: `${Colors.accent.red}08`,
  },
  deleteText: { fontSize: 13, fontWeight: '700', color: Colors.accent.red },
});
