import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types';
import { Colors } from '@/constants/colors';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useEventStore } from '@/store/event.store';
import { fmtDate } from '@/lib/format';

interface EventCardProps {
  event: Event;
  onRefresh?: () => void;
}

type ActionKey = 'publish' | 'unpublish' | 'archive' | 'restore' | 'delete';

export function EventCard({ event, onRefresh }: EventCardProps) {
  const router = useRouter();
  const { publishEvent, unpublishEvent, archiveEvent, restoreEvent, deleteEvent } = useEventStore();
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [modal,   setModal]   = useState<{
    action: () => Promise<void>;
    title:  string;
    desc:   string;
    confirm:string;
    danger: boolean;
  } | null>(null);

  const status = event.status;

  const run = async (key: ActionKey, fn: () => Promise<{ success: boolean }>) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(key);
    await fn();
    setLoading(null);
    onRefresh?.();
  };

  const accentColor =
    status === 'PUBLISHED' ? Colors.accent.emerald :
    status === 'DRAFT'     ? Colors.accent.amber   :
    status === 'CANCELLED' ? Colors.accent.red      :
                             '#6b7280';

  return (
    <>
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/events/${event.id}`)}
      >
        {/* Cover image */}
        <View style={styles.imageWrap}>
          {event.cover_image_url ? (
            <Image
              source={event.cover_image_url}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: `${accentColor}18` }]}>
              <Feather name="calendar" size={28} color={accentColor} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(7,7,15,0.85)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.imageFooter}>
            <StatusBadge status={status} />
          </View>
          {/* Accent top bar */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.type} numberOfLines={1}>{event.event_type?.toUpperCase()}</Text>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.meta}>
            {event.starts_at_local && (
              <View style={styles.metaRow}>
                <Feather name="clock" size={11} color={Colors.text.subtle} />
                <Text style={styles.metaText}>{fmtDate(event.starts_at_local)}</Text>
              </View>
            )}
            {event.venue_name && (
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={11} color={Colors.text.subtle} />
                <Text style={styles.metaText} numberOfLines={1}>{event.venue_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action bar — ALWAYS VISIBLE */}
        <View style={styles.actions}>
          {/* Primary action */}
          {status === 'DRAFT' && (
            <ActionBtn
              icon="send"
              label="Publish"
              accent={Colors.accent.emerald}
              loading={loading === 'publish'}
              onPress={() => setModal({
                action:  () => run('publish', () => publishEvent(event.id)),
                title:   'Publish this event?',
                desc:    'It will be publicly visible to everyone.',
                confirm: 'Publish',
                danger:  false,
              })}
            />
          )}
          {status === 'PUBLISHED' && (
            <ActionBtn
              icon="eye-off"
              label="Unpublish"
              accent={Colors.accent.amber}
              loading={loading === 'unpublish'}
              onPress={() => setModal({
                action:  () => run('unpublish', () => unpublishEvent(event.id)),
                title:   'Unpublish this event?',
                desc:    'The event will go back to draft.',
                confirm: 'Unpublish',
                danger:  false,
              })}
            />
          )}
          {(status === 'CANCELLED' || status === 'ARCHIVED') && (
            <ActionBtn
              icon="rotate-ccw"
              label="Restore"
              accent={Colors.accent.indigo}
              loading={loading === 'restore'}
              onPress={() => run('restore', () => restoreEvent(event.id))}
            />
          )}
          {/* Archive (DRAFT/PUBLISHED) */}
          {(status === 'DRAFT' || status === 'PUBLISHED') && (
            <ActionBtn
              icon="archive"
              label="Archive"
              accent={Colors.text.muted}
              loading={loading === 'archive'}
              onPress={() => setModal({
                action:  () => run('archive', () => archiveEvent(event.id)),
                title:   'Archive this event?',
                desc:    'Hidden but restorable anytime.',
                confirm: 'Archive',
                danger:  false,
              })}
            />
          )}
          {/* Settings */}
          <Pressable
            style={styles.settingsBtn}
            onPress={() => { router.push(`/events/${event.id}/settings` as never); }}
          >
            <Feather name="settings" size={13} color={Colors.text.muted} />
          </Pressable>
          {/* Delete */}
          <ActionBtn
            icon="trash-2"
            label=""
            accent={Colors.accent.red}
            loading={loading === 'delete'}
            iconOnly
            onPress={() => setModal({
              action:  () => run('delete', () => deleteEvent(event.id)),
              title:   'Delete permanently?',
              desc:    'All guests, tickets, and data will be erased. This cannot be undone.',
              confirm: 'Delete',
              danger:  true,
            })}
          />
        </View>
      </Pressable>

      {modal && (
        <ConfirmModal
          open
          title={modal.title}
          description={modal.desc}
          confirmText={modal.confirm}
          variant={modal.danger ? 'danger' : 'default'}
          onConfirm={() => modal.action()}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ─── Small inline action button ───────────────────────────────────────────────
function ActionBtn({
  icon, label, accent, loading, onPress, iconOnly = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  accent: string;
  loading?: boolean;
  onPress: () => void;
  iconOnly?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: `${accent}18`, borderColor: `${accent}35` }]}
      onPress={onPress}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator size={12} color={accent} />
        : <Feather name={icon} size={12} color={accent} />
      }
      {!iconOnly && label && (
        <Text style={[styles.actionLabel, { color: accent }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    overflow:        'hidden',
    marginBottom:    12,
  },
  accentBar: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   3,
  },
  imageWrap: {
    height:          140,
    backgroundColor: Colors.bg.elevated,
    overflow:        'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems:      'center',
    justifyContent:  'center',
  },
  imageFooter: {
    position: 'absolute',
    bottom:   10,
    left:     12,
  },
  body: {
    padding: 14,
    gap:     4,
  },
  type: {
    fontSize:      9,
    fontWeight:    '800',
    color:         Colors.accent.indigo,
    letterSpacing: 1.2,
  },
  title: {
    fontSize:   16,
    fontWeight: '800',
    color:      Colors.text.primary,
    letterSpacing: -0.3,
  },
  meta: { gap: 3, marginTop: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  metaText: {
    fontSize: 11,
    color:    Colors.text.subtle,
  },
  actions: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    paddingHorizontal: 12,
    paddingBottom:   12,
    flexWrap:        'wrap',
  },
  actionBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      99,
    borderWidth:       1,
  },
  actionLabel: {
    fontSize:   11,
    fontWeight: '700',
  },
  settingsBtn: {
    marginLeft: 'auto',
    padding:    6,
    borderRadius: 99,
    borderWidth:  1,
    borderColor:  Colors.border.DEFAULT,
  },
});
