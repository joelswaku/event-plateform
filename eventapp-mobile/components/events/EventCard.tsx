/**
 * eventapp-mobile/components/events/EventCard.tsx
 *
 * REDESIGNED — ProEventCard.
 *
 * Layout (top→bottom):
 *   ┌────────────────────────────────────┐
 *   │  Cover image (160px)               │
 *   │  ┌ Status badge    [● active ring] │
 *   │  └ Accent top bar                  │
 *   ├────────────────────────────────────┤
 *   │  EVENT_TYPE  •  date               │
 *   │  Event Title (bold, 18px)          │
 *   │  📍 Venue (if any)                 │
 *   ├────────────────────────────────────┤
 *   │  [Primary action]  [Archive]  ⚙ 🗑 │
 *   └────────────────────────────────────┘
 *
 * Improvements vs original:
 *  ✅ Card background uses event accent color tint (not flat dark)
 *  ✅ Cover image fills top area with real gradient overlay
 *  ✅ Accent top-bar color matches status (green/amber/grey/red)
 *  ✅ Action buttons are smaller, pill-shaped with icon + label
 *  ✅ Settings button navigates inline
 *  ✅ Active-event check ring in top-right
 *  ✅ All existing logic preserved (publish/unpublish/archive/restore/delete)
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { Image }          from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter }      from 'expo-router';
import { Feather }        from '@expo/vector-icons';
import * as Haptics       from 'expo-haptics';
import { Event }          from '@/types';
import { Colors }         from '@/constants/colors';
import { ConfirmModal }   from '@/components/ui/ConfirmModal';
import { useEventStore }  from '@/store/event.store';
import { fmtDate }        from '@/lib/format';

/* ── Fallback cover images per event type ───────────────────────── */
const TYPE_IMG: Record<string, string> = {
  wedding:         'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70',
  concert:         'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=70',
  conference:      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=70',
  birthday:        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=70',
  corporate_event: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=70',
  festival:        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=70',
  networking:      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=70',
  charity:         'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&q=70',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=70';

function coverImg(event: Event): string {
  if (event.cover_image_url) return event.cover_image_url;
  const k = event.event_type?.toLowerCase() ?? '';
  return TYPE_IMG[k] ?? DEFAULT_IMG;
}

/* ── Status config ───────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { color: string; label: string; dot: string }> = {
  PUBLISHED: { color: Colors.accent.emerald, label: 'Published', dot: '#10b981' },
  DRAFT:     { color: Colors.accent.amber,   label: 'Draft',     dot: '#f59e0b' },
  ARCHIVED:  { color: '#6b7280',             label: 'Archived',  dot: '#9ca3af' },
  CANCELLED: { color: Colors.accent.red,     label: 'Cancelled', dot: '#ef4444' },
};

type ActionKey = 'publish' | 'unpublish' | 'archive' | 'restore' | 'delete';

interface Props {
  event:      Event;
  onRefresh?: () => void;
  isActive?:  boolean;
  onSetActive?:() => void;
}

export function ProEventCard({ event, onRefresh, isActive, onSetActive }: Props) {
  const router  = useRouter();
  const { publishEvent, unpublishEvent, archiveEvent, restoreEvent, deleteEvent } = useEventStore();
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [modal,   setModal]   = useState<{
    action:  () => Promise<void>;
    title:   string;
    desc:    string;
    confirm: string;
    danger:  boolean;
  } | null>(null);

  const status = event.status;
  const cfg    = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
  const img    = coverImg(event);

  const run = async (key: ActionKey, fn: () => Promise<{ success: boolean }>) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLoading(key);
      const result = await fn();
      setLoading(null);
      if (result?.success) onRefresh?.();
    } catch (error) {
      setLoading(null);
      console.error('EventCard run error:', error);
    }
  };

  const date = event.starts_at_local || event.starts_at_utc;

  return (
    <>
      <Pressable
        style={[s.card, { borderColor: `${cfg.color}30` }]}
        onPress={() => router.push(`/events/${event.id}` as never)}
        activeOpacity={0.95}
      >
        {/* Subtle card background glow */}
        <LinearGradient
          colors={[`${cfg.color}10`, 'transparent']}
          style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.5 }}
        />

        {/* ── Cover image ────────────────────────────────────── */}
        <View style={s.imageWrap}>
          <Image
            source={img}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
          {/* Gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(7,7,15,0.72)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.3 }} end={{ x: 0, y: 1 }}
          />

          {/* Accent top bar */}
          <View style={[s.accentBar, { backgroundColor: cfg.color }]} />

          {/* Status badge */}
          <View style={[s.statusBadge, { backgroundColor: `${cfg.color}22` }]}>
            <View style={[s.statusDot, { backgroundColor: cfg.dot }]} />
            <Text style={[s.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          {/* Active ring toggle — top right */}
          <Pressable
            style={s.activeToggle}
            onPress={e => { e.stopPropagation?.(); onSetActive?.(); }}
            hitSlop={10}
          >
            {isActive ? (
              <View style={[s.activeOn, { backgroundColor: Colors.accent.indigo }]}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            ) : (
              <View style={s.activeOff} />
            )}
          </Pressable>

          {/* Event type + date row — overlaid at bottom of image */}
          <View style={s.imageBottom}>
            <Text style={s.typeTag}>
              {event.event_type?.replace(/_/g, ' ').toUpperCase() ?? 'EVENT'}
            </Text>
            {date && (
              <View style={s.datePill}>
                <Feather name="clock" size={10} color="rgba(255,255,255,0.7)" />
                <Text style={s.dateTxt}>{fmtDate(date)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Body ───────────────────────────────────────────── */}
        <View style={s.body}>
          <Text style={s.title} numberOfLines={2}>{event.title}</Text>

          {event.venue_name ? (
            <View style={s.venueRow}>
              <Feather name="map-pin" size={11} color={Colors.text.subtle} />
              <Text style={s.venueTxt} numberOfLines={1}>{event.venue_name}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Action bar ─────────────────────────────────────── */}
        <View style={s.actions}>

          {/* Primary action */}
          {status === 'DRAFT' && (
            <SmallAction
              icon="send" label="Publish"
              color={Colors.accent.emerald}
              loading={loading === 'publish'}
              onPress={() => setModal({
                action:  () => run('publish', () => publishEvent(event.id)),
                title:   'Publish this event?',
                desc:    'It will be publicly visible to everyone.',
                confirm: 'Publish', danger: false,
              })}
            />
          )}
          {status === 'PUBLISHED' && (
            <SmallAction
              icon="eye-off" label="Unpublish"
              color={Colors.accent.amber}
              loading={loading === 'unpublish'}
              onPress={() => setModal({
                action:  () => run('unpublish', () => unpublishEvent(event.id)),
                title:   'Unpublish this event?',
                desc:    'Event goes back to draft.',
                confirm: 'Unpublish', danger: false,
              })}
            />
          )}
          {(status === 'CANCELLED' || status === 'ARCHIVED') && (
            <SmallAction
              icon="rotate-ccw" label="Restore"
              color={Colors.accent.indigo}
              loading={loading === 'restore'}
              onPress={() => run('restore', () => restoreEvent(event.id))}
            />
          )}

          {/* Archive */}
          {(status === 'DRAFT' || status === 'PUBLISHED') && (
            <SmallAction
              icon="archive" label="Archive"
              color={Colors.text.muted}
              loading={loading === 'archive'}
              ghost
              onPress={() => setModal({
                action:  () => run('archive', () => archiveEvent(event.id)),
                title:   'Archive this event?',
                desc:    'Hidden from dashboard but restorable.',
                confirm: 'Archive', danger: false,
              })}
            />
          )}

          <View style={s.actionSpacer} />

          {/* Settings */}
          <Pressable
            style={s.iconBtn}
            onPress={() => router.push(`/events/${event.id}` as never)}
            hitSlop={8}
          >
            <Feather name="settings" size={14} color={Colors.text.subtle} />
          </Pressable>

          {/* Delete */}
          <Pressable
            style={[s.iconBtn, s.deleteBtn]}
            onPress={() => setModal({
              action:  () => run('delete', () => deleteEvent(event.id)),
              title:   'Delete permanently?',
              desc:    'All guests, tickets, and data will be erased. Cannot be undone.',
              confirm: 'Delete', danger: true,
            })}
            hitSlop={8}
          >
            {loading === 'delete'
              ? <ActivityIndicator size="small" color={Colors.accent.red} />
              : <Feather name="trash-2" size={14} color={Colors.accent.red} />
            }
          </Pressable>
        </View>
      </Pressable>

      {modal && (
        <ConfirmModal
          open
          title={modal.title}
          description={modal.desc}
          confirmText={modal.confirm}
          variant={modal.danger ? 'danger' : 'warning'}
          onConfirm={async () => {
            try {
              await modal.action();
              setModal(null);
            } catch (error) {
              setModal(null);
              console.error('EventCard modal action error:', error);
            }
          }}
          onCancel={() => setModal(null)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

/* ── Small pill action button ────────────────────────────────────── */
function SmallAction({
  icon, label, color, loading, onPress, ghost = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string; color: string; loading: boolean;
  onPress: () => void; ghost?: boolean;
}) {
  return (
    <Pressable
      style={[
        sa.btn,
        ghost
          ? { backgroundColor: Colors.bg.elevated, borderWidth: 1, borderColor: Colors.border.DEFAULT }
          : { backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}40` },
      ]}
      onPress={onPress}
      hitSlop={4}
    >
      {loading
        ? <ActivityIndicator size="small" color={ghost ? Colors.text.muted : color} />
        : <Feather name={icon} size={13} color={ghost ? Colors.text.muted : color} />
      }
      <Text style={[sa.txt, { color: ghost ? Colors.text.muted : color }]}>{label}</Text>
    </Pressable>
  );
}

const sa = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, height: 32, borderRadius: 99,
  },
  txt: { fontSize: 12, fontWeight: '700' },
});

/* ── Keep old EventCard export for backward compat ─────────────── */
export { ProEventCard as EventCard };

/* ── Styles ──────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  card: {
    borderRadius:    20,
    backgroundColor: Colors.bg.card,
    borderWidth:     1,
    borderColor:     Colors.border.DEFAULT,
    overflow:        'hidden',
  },

  /* Image */
  imageWrap: {
    height:          170,
    backgroundColor: Colors.bg.elevated,
    position:        'relative',
  },
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 2 },
  statusBadge: {
    position:        'absolute',
    bottom:          10,
    left:            12,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:    99,
    zIndex:          3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 11, fontWeight: '800' },
  activeToggle: {
    position: 'absolute', top: 12, right: 12, zIndex: 3,
  },
  activeOn: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  activeOff: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  imageBottom: {
    position:      'absolute',
    bottom:        10,
    right:         12,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    zIndex:        3,
  },
  typeTag: {
    fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dateTxt: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  /* Body */
  body: { padding: 14, gap: 6 },
  title: {
    fontSize: 18, fontWeight: '900', color: '#fff',
    letterSpacing: -0.4, lineHeight: 23,
  },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  venueTxt: { fontSize: 12, color: Colors.text.muted, flex: 1 },

  /* Actions */
  actions: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    paddingHorizontal: 14,
    paddingVertical:   12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  actionSpacer: { flex: 1 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    borderColor: `${Colors.accent.red}30`,
    backgroundColor: `${Colors.accent.red}10`,
  },
});





// import React, { useState } from 'react';
// import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
// import { Image } from 'expo-image';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useRouter } from 'expo-router';
// import { Feather } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics';
// import { Event } from '@/types';
// import { Colors } from '@/constants/colors';
// import { StatusBadge } from '@/components/ui/Badge';
// import { ConfirmModal } from '@/components/ui/ConfirmModal';
// import { useEventStore } from '@/store/event.store';
// import { fmtDate } from '@/lib/format';

// interface EventCardProps {
//   event:        Event;
//   onRefresh?:   () => void;
//   isActive?:    boolean;
//   onSetActive?: () => void;
// }

// type ActionKey = 'publish' | 'unpublish' | 'archive' | 'restore' | 'delete';

// export function EventCard({ event, onRefresh, isActive, onSetActive }: EventCardProps) {
//   const router = useRouter();
//   const { publishEvent, unpublishEvent, archiveEvent, restoreEvent, deleteEvent } = useEventStore();
//   const [loading, setLoading] = useState<ActionKey | null>(null);
//   const [modal,   setModal]   = useState<{
//     action: () => Promise<void>;
//     title:  string;
//     desc:   string;
//     confirm:string;
//     danger: boolean;
//   } | null>(null);

//   const status = event.status;

//   const run = async (key: ActionKey, fn: () => Promise<{ success: boolean }>) => {
//     await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     setLoading(key);
//     await fn();
//     setLoading(null);
//     onRefresh?.();
//   };

//   const accentColor =
//     status === 'PUBLISHED' ? Colors.accent.emerald :
//     status === 'DRAFT'     ? Colors.accent.amber   :
//     status === 'CANCELLED' ? Colors.accent.red      :
//                              '#6b7280';

//   return (
//     <>
//       <Pressable
//         style={[styles.card, isActive && styles.cardActive]}
//         onPress={() => router.push(`/events/${event.id}`)}
//       >
//         {/* Cover image */}
//         <View style={styles.imageWrap}>
//           {event.cover_image_url ? (
//             <Image
//               source={event.cover_image_url}
//               style={StyleSheet.absoluteFill}
//               contentFit="cover"
//             />
//           ) : (
//             <View style={[styles.placeholder, { backgroundColor: `${accentColor}18` }]}>
//               <Feather name="calendar" size={28} color={accentColor} />
//             </View>
//           )}
//           <LinearGradient
//             colors={['transparent', 'rgba(7,7,15,0.85)']}
//             style={StyleSheet.absoluteFill}
//           />
//           <View style={styles.imageFooter}>
//             <StatusBadge status={status} />
//           </View>
//           {/* Active / set-active toggle */}
//           <Pressable
//             style={styles.activeToggle}
//             onPress={e => { e.stopPropagation?.(); onSetActive?.(); }}
//             hitSlop={8}
//           >
//             {isActive ? (
//               <View style={styles.activeOn}>
//                 <Feather name="check" size={10} color="#fff" />
//               </View>
//             ) : (
//               <View style={styles.activeOff} />
//             )}
//           </Pressable>
//           {/* Accent top bar */}
//           <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
//         </View>

//         {/* Body */}
//         <View style={styles.body}>
//           <Text style={styles.type} numberOfLines={1}>{event.event_type?.toUpperCase()}</Text>
//           <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
//           <View style={styles.meta}>
//             {event.starts_at_local && (
//               <View style={styles.metaRow}>
//                 <Feather name="clock" size={11} color={Colors.text.subtle} />
//                 <Text style={styles.metaText}>{fmtDate(event.starts_at_local)}</Text>
//               </View>
//             )}
//             {event.venue_name && (
//               <View style={styles.metaRow}>
//                 <Feather name="map-pin" size={11} color={Colors.text.subtle} />
//                 <Text style={styles.metaText} numberOfLines={1}>{event.venue_name}</Text>
//               </View>
//             )}
//           </View>
//         </View>

//         {/* Action bar — ALWAYS VISIBLE */}
//         <View style={styles.actions}>
//           {/* Primary action */}
//           {status === 'DRAFT' && (
//             <ActionBtn
//               icon="send"
//               label="Publish"
//               accent={Colors.accent.emerald}
//               loading={loading === 'publish'}
//               onPress={() => setModal({
//                 action:  () => run('publish', () => publishEvent(event.id)),
//                 title:   'Publish this event?',
//                 desc:    'It will be publicly visible to everyone.',
//                 confirm: 'Publish',
//                 danger:  false,
//               })}
//             />
//           )}
//           {status === 'PUBLISHED' && (
//             <ActionBtn
//               icon="eye-off"
//               label="Unpublish"
//               accent={Colors.accent.amber}
//               loading={loading === 'unpublish'}
//               onPress={() => setModal({
//                 action:  () => run('unpublish', () => unpublishEvent(event.id)),
//                 title:   'Unpublish this event?',
//                 desc:    'The event will go back to draft.',
//                 confirm: 'Unpublish',
//                 danger:  false,
//               })}
//             />
//           )}
//           {(status === 'CANCELLED' || status === 'ARCHIVED') && (
//             <ActionBtn
//               icon="rotate-ccw"
//               label="Restore"
//               accent={Colors.accent.indigo}
//               loading={loading === 'restore'}
//               onPress={() => run('restore', () => restoreEvent(event.id))}
//             />
//           )}
//           {/* Archive (DRAFT/PUBLISHED) */}
//           {(status === 'DRAFT' || status === 'PUBLISHED') && (
//             <ActionBtn
//               icon="archive"
//               label="Archive"
//               accent={Colors.text.muted}
//               loading={loading === 'archive'}
//               onPress={() => setModal({
//                 action:  () => run('archive', () => archiveEvent(event.id)),
//                 title:   'Archive this event?',
//                 desc:    'Hidden but restorable anytime.',
//                 confirm: 'Archive',
//                 danger:  false,
//               })}
//             />
//           )}
//           {/* Settings */}
//           <Pressable
//             style={styles.settingsBtn}
//             onPress={() => { router.push(`/events/${event.id}/settings` as never); }}
//           >
//             <Feather name="settings" size={13} color={Colors.text.muted} />
//           </Pressable>
//           {/* Delete */}
//           <ActionBtn
//             icon="trash-2"
//             label=""
//             accent={Colors.accent.red}
//             loading={loading === 'delete'}
//             iconOnly
//             onPress={() => setModal({
//               action:  () => run('delete', () => deleteEvent(event.id)),
//               title:   'Delete permanently?',
//               desc:    'All guests, tickets, and data will be erased. This cannot be undone.',
//               confirm: 'Delete',
//               danger:  true,
//             })}
//           />
//         </View>
//       </Pressable>

//       {modal && (
//         <ConfirmModal
//           open
//           title={modal.title}
//           description={modal.desc}
//           confirmText={modal.confirm}
//           variant={modal.danger ? 'danger' : 'default'}
//           onConfirm={() => modal.action()}
//           onClose={() => setModal(null)}
//         />
//       )}
//     </>
//   );
// }

// // ─── Small inline action button ───────────────────────────────────────────────
// function ActionBtn({
//   icon, label, accent, loading, onPress, iconOnly = false,
// }: {
//   icon: keyof typeof Feather.glyphMap;
//   label: string;
//   accent: string;
//   loading?: boolean;
//   onPress: () => void;
//   iconOnly?: boolean;
// }) {
//   return (
//     <Pressable
//       style={[styles.actionBtn, { backgroundColor: `${accent}18`, borderColor: `${accent}35` }]}
//       onPress={onPress}
//       disabled={loading}
//     >
//       {loading
//         ? <ActivityIndicator size={12} color={accent} />
//         : <Feather name={icon} size={12} color={accent} />
//       }
//       {!iconOnly && label && (
//         <Text style={[styles.actionLabel, { color: accent }]}>{label}</Text>
//       )}
//     </Pressable>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: Colors.bg.card,
//     borderRadius:    20,
//     borderWidth:     1,
//     borderColor:     Colors.border.DEFAULT,
//     overflow:        'hidden',
//     marginBottom:    12,
//   },
//   cardActive: {
//     borderColor:   `${Colors.accent.indigo}70`,
//     borderWidth:   2,
//     shadowColor:   Colors.accent.indigo,
//     shadowOffset:  { width: 0, height: 0 },
//     shadowOpacity: 0.30,
//     shadowRadius:  14,
//     elevation:     8,
//   },
//   activeToggle: {
//     position: 'absolute',
//     top:      10,
//     right:    10,
//     zIndex:   10,
//   },
//   activeOn: {
//     width:           24,
//     height:          24,
//     borderRadius:    12,
//     backgroundColor: Colors.accent.indigo,
//     alignItems:      'center',
//     justifyContent:  'center',
//     borderWidth:     2,
//     borderColor:     '#fff',
//     shadowColor:     Colors.accent.indigo,
//     shadowOffset:    { width: 0, height: 0 },
//     shadowOpacity:   0.9,
//     shadowRadius:    8,
//     elevation:       6,
//   },
//   activeOff: {
//     width:           24,
//     height:          24,
//     borderRadius:    12,
//     borderWidth:     2,
//     borderColor:     'rgba(255,255,255,0.42)',
//     backgroundColor: 'rgba(0,0,0,0.28)',
//   },
//   accentBar: {
//     position: 'absolute',
//     top:      0,
//     left:     0,
//     right:    0,
//     height:   3,
//   },
//   imageWrap: {
//     height:          140,
//     backgroundColor: Colors.bg.elevated,
//     overflow:        'hidden',
//   },
//   placeholder: {
//     ...StyleSheet.absoluteFillObject,
//     alignItems:      'center',
//     justifyContent:  'center',
//   },
//   imageFooter: {
//     position: 'absolute',
//     bottom:   10,
//     left:     12,
//   },
//   body: {
//     padding: 14,
//     gap:     4,
//   },
//   type: {
//     fontSize:      9,
//     fontWeight:    '800',
//     color:         Colors.accent.indigo,
//     letterSpacing: 1.2,
//   },
//   title: {
//     fontSize:   16,
//     fontWeight: '800',
//     color:      Colors.text.primary,
//     letterSpacing: -0.3,
//   },
//   meta: { gap: 3, marginTop: 4 },
//   metaRow: {
//     flexDirection: 'row',
//     alignItems:    'center',
//     gap:           5,
//   },
//   metaText: {
//     fontSize: 11,
//     color:    Colors.text.subtle,
//   },
//   actions: {
//     flexDirection:   'row',
//     alignItems:      'center',
//     gap:             6,
//     paddingHorizontal: 12,
//     paddingBottom:   12,
//     flexWrap:        'wrap',
//   },
//   actionBtn: {
//     flexDirection:     'row',
//     alignItems:        'center',
//     gap:               5,
//     paddingHorizontal: 10,
//     paddingVertical:   6,
//     borderRadius:      99,
//     borderWidth:       1,
//   },
//   actionLabel: {
//     fontSize:   11,
//     fontWeight: '700',
//   },
//   settingsBtn: {
//     marginLeft: 'auto',
//     padding:    6,
//     borderRadius: 99,
//     borderWidth:  1,
//     borderColor:  Colors.border.DEFAULT,
//   },
// });
