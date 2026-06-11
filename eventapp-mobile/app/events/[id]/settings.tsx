import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
  ActivityIndicator, Modal, TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { notify } from '@/lib/toast';
import { useEventStore } from '@/store/event.store';
import { Colors } from '@/constants/colors';

/* ─── Types ──────────────────────────────────────────────────── */
type ModuleKey = 'allow_rsvp' | 'open_rsvp' | 'allow_ticketing' | 'allow_qr_checkin' | 'allow_donations';
type SettingKey = ModuleKey | 'visibility';

/* ─── Confirmation copy ──────────────────────────────────────── */
interface ActionInfo {
  icon: keyof typeof Feather.glyphMap;
  color: string;
  title: string;
  message: string;
  confirmLabel: string;
}

function getActionInfo(key: SettingKey, nextValue: boolean): ActionInfo {
  switch (key) {
    case 'visibility':
      return nextValue
        ? {
            icon: 'globe',
            color: Colors.accent.indigo,
            title: 'Make event public?',
            message:
              'Your event page will be visible to everyone. Anyone with the link can view details, RSVP, or buy tickets (if enabled).',
            confirmLabel: 'Make Public',
          }
        : {
            icon: 'lock',
            color: Colors.accent.amber,
            title: 'Make event private?',
            message:
              'The public event page will be hidden. Only guests you invite directly will be able to access it.',
            confirmLabel: 'Make Private',
          };

    case 'allow_rsvp':
      return nextValue
        ? {
            icon: 'users',
            color: Colors.accent.emerald,
            title: 'Enable RSVP?',
            message:
              'Guests will be able to RSVP to your event. By default, only invited guests with a personal link can RSVP — you can open it to everyone with the "Open RSVP" sub-toggle.',
            confirmLabel: 'Enable RSVP',
          }
        : {
            icon: 'users',
            color: Colors.accent.emerald,
            title: 'Disable RSVP?',
            message:
              'The RSVP button will be removed from your event page. Existing RSVPs are kept but no new ones will be accepted.',
            confirmLabel: 'Disable RSVP',
          };

    case 'open_rsvp':
      return nextValue
        ? {
            icon: 'unlock',
            color: Colors.accent.emerald,
            title: 'Open RSVP to everyone?',
            message:
              'Anyone who visits your event page can RSVP — no invitation needed. Great for public community events or when you want maximum reach.',
            confirmLabel: 'Open to Everyone',
          }
        : {
            icon: 'mail',
            color: Colors.accent.amber,
            title: 'Switch to invitation-only RSVP?',
            message:
              'Only guests who receive a personal invitation email with their unique link can RSVP. Others can still view the event page but the RSVP button will be locked for them.',
            confirmLabel: 'Invitation Only',
          };

    case 'allow_ticketing':
      return nextValue
        ? {
            icon: 'credit-card',
            color: Colors.accent.amber,
            title: 'Enable ticketing?',
            message:
              'You can create free or paid ticket types for this event. Guests will be able to purchase or claim tickets from the event page.',
            confirmLabel: 'Enable Ticketing',
          }
        : {
            icon: 'credit-card',
            color: Colors.accent.amber,
            title: 'Disable ticketing?',
            message:
              'Ticket sales will be turned off. Existing ticket types and issued tickets are not deleted, but no new purchases will be accepted.',
            confirmLabel: 'Disable Ticketing',
          };

    case 'allow_qr_checkin':
      return nextValue
        ? {
            icon: 'camera',
            color: Colors.accent.indigo,
            title: 'Enable QR check-in?',
            message:
              'You and your team will be able to scan guest QR codes at the door using the Scanner tab to mark attendance in real time.',
            confirmLabel: 'Enable QR Check-in',
          }
        : {
            icon: 'camera',
            color: Colors.accent.indigo,
            title: 'Disable QR check-in?',
            message:
              'The scanner will no longer accept QR codes for this event. You can still mark attendance manually from the Guests tab.',
            confirmLabel: 'Disable QR Check-in',
          };

    case 'allow_donations':
      return nextValue
        ? {
            icon: 'heart',
            color: '#f43f5e',
            title: 'Enable donations?',
            message:
              'A donation option will appear on your event page. Guests can contribute any amount they choose to support your event.',
            confirmLabel: 'Enable Donations',
          }
        : {
            icon: 'heart',
            color: '#f43f5e',
            title: 'Disable donations?',
            message:
              'The donation option will be removed from your event page. Past donations are not affected.',
            confirmLabel: 'Disable Donations',
          };

    default:
      return {
        icon: 'settings',
        color: Colors.accent.indigo,
        title: 'Confirm change',
        message: 'Are you sure you want to change this setting?',
        confirmLabel: 'Confirm',
      };
  }
}

/* ─── Module config ──────────────────────────────────────────── */
const MODULES: {
  key: ModuleKey;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  color: string;
}[] = [
  {
    key: 'allow_rsvp',
    icon: 'users',
    label: 'RSVP',
    sub: 'Allow guests to RSVP to this event',
    color: Colors.accent.emerald,
  },
  {
    key: 'allow_ticketing',
    icon: 'credit-card',
    label: 'Ticketing',
    sub: 'Sell free or paid tickets',
    color: Colors.accent.amber,
  },
  {
    key: 'allow_donations',
    icon: 'heart',
    label: 'Donations',
    sub: 'Accept optional donations at this event',
    color: '#f43f5e',
  },
];

/* ─── Screen ──────────────────────────────────────────────────── */
export default function EventSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentEvent, fetchEventById, updateEvent } = useEventStore();

  const [saving, setSaving] = useState<SettingKey | null>(null);

  // Pending action waiting for confirmation
  const [pending, setPending] = useState<{
    key: SettingKey;
    nextValue: boolean;
    info: ActionInfo;
  } | null>(null);

  useEffect(() => {
    if (id) fetchEventById(id);
  }, [id]);

  if (!currentEvent || currentEvent.id !== id) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <ActivityIndicator color={Colors.accent.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  /* ── Request a toggle — shows confirmation sheet ── */
  const requestToggle = (key: SettingKey, nextValue: boolean) => {
    setPending({ key, nextValue, info: getActionInfo(key, nextValue) });
  };

  /* ── User confirmed — apply the change ── */
  const confirmToggle = async () => {
    if (!pending) return;
    const { key, nextValue } = pending;
    setPending(null);
    setSaving(key);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: any;
    if (key === 'visibility') {
      payload = { visibility: nextValue ? 'PUBLIC' : 'PRIVATE' };
    } else if (nextValue && key === 'allow_rsvp') {
      payload = { allow_rsvp: true, allow_ticketing: false, allow_donations: false, open_rsvp: false };
    } else if (nextValue && key === 'allow_ticketing') {
      payload = { allow_ticketing: true, allow_rsvp: false, allow_donations: false, open_rsvp: false };
    } else if (nextValue && key === 'allow_donations') {
      payload = { allow_donations: true, allow_rsvp: false, allow_ticketing: false, open_rsvp: false };
    } else if (!nextValue && key === 'allow_rsvp') {
      payload = { allow_rsvp: false, open_rsvp: false };
    } else {
      payload = { [key]: nextValue };
    }

    const result = await updateEvent(id, payload);
    setSaving(null);

    if (!result?.success) {
      notify.settingsFailed(result?.message);
    } else {
      notify.settingsSaved();
    }
    fetchEventById(id);
  };

  const isPublic  = currentEvent.visibility === 'PUBLIC';
  const rsvpOn    = !!currentEvent.allow_rsvp;
  const openRsvp  = !!currentEvent.open_rsvp;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Settings</Text>
          <Text style={s.headerSub} numberOfLines={1}>{currentEvent.title}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Visibility section ──────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Visibility</Text>
          <Text style={s.sectionHint}>Control who can see your event</Text>

          <Pressable
            style={[
              s.visibilityCard,
              isPublic
                ? { borderColor: `${Colors.accent.indigo}40`, backgroundColor: `${Colors.accent.indigo}08` }
                : { borderColor: `${Colors.accent.amber}40`, backgroundColor: `${Colors.accent.amber}08` },
            ]}
            onPress={() => !saving && requestToggle('visibility', !isPublic)}
          >
            {/* Icon + badge */}
            <View style={[
              s.visIcon,
              { backgroundColor: isPublic ? `${Colors.accent.indigo}18` : `${Colors.accent.amber}18` },
            ]}>
              <Feather
                name={isPublic ? 'globe' : 'lock'}
                size={20}
                color={isPublic ? Colors.accent.indigo : Colors.accent.amber}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={s.visRow}>
                <Text style={s.visTitle}>{isPublic ? 'Public' : 'Private'}</Text>
                <View style={[
                  s.visBadge,
                  { backgroundColor: isPublic ? `${Colors.accent.indigo}25` : `${Colors.accent.amber}25` },
                ]}>
                  <Text style={[
                    s.visBadgeText,
                    { color: isPublic ? Colors.accent.indigo : Colors.accent.amber },
                  ]}>
                    {isPublic ? 'LIVE' : 'HIDDEN'}
                  </Text>
                </View>
              </View>
              <Text style={s.visSub}>
                {isPublic
                  ? 'Anyone with the link can view this event page.'
                  : 'Only invited guests with a direct link can access this event.'}
              </Text>
            </View>

            {saving === 'visibility'
              ? <ActivityIndicator size="small" color={Colors.accent.indigo} />
              : (
                <Switch
                  value={isPublic}
                  onValueChange={(v) => requestToggle('visibility', v)}
                  trackColor={{ false: Colors.border.DEFAULT, true: `${Colors.accent.indigo}70` }}
                  thumbColor={isPublic ? Colors.accent.indigo : Colors.text.subtle}
                />
              )
            }
          </Pressable>
        </View>

        {/* ── Modules section ─────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Active Modules</Text>
          <Text style={s.sectionHint}>Enable or disable features for this event</Text>
          <View style={s.toggleList}>
            {MODULES.map((mod) => {
              const isOn    = !!currentEvent[mod.key as keyof typeof currentEvent];
              const isSaving = saving === mod.key;
              return (
                <React.Fragment key={mod.key}>
                  <ToggleRow
                    icon={mod.icon}
                    label={mod.label}
                    sub={mod.sub}
                    value={isOn}
                    color={mod.color}
                    disabled={isSaving}
                    onChange={(v) => requestToggle(mod.key, v)}
                  />

                  {/* Open RSVP sub-row — only shown when RSVP is enabled */}
                  {mod.key === 'allow_rsvp' && rsvpOn && (
                    <View style={s.subRow}>
                      <View style={s.subRowLine} />
                      <View style={{ flex: 1 }}>
                        <ToggleRow
                          icon={openRsvp ? 'unlock' : 'mail'}
                          label={openRsvp ? 'Open to everyone' : 'Invitation only'}
                          sub={
                            openRsvp
                              ? 'Anyone on the event page can RSVP'
                              : 'Only guests with a personal email link can RSVP'
                          }
                          value={openRsvp}
                          color={openRsvp ? Colors.accent.emerald : Colors.accent.amber}
                          disabled={saving === 'open_rsvp'}
                          onChange={(v) => requestToggle('open_rsvp', v)}
                        />
                      </View>
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Confirmation bottom sheet ──────────────────────────── */}
      <ConfirmSheet
        visible={!!pending}
        info={pending?.info ?? null}
        onCancel={() => setPending(null)}
        onConfirm={confirmToggle}
        insetBottom={insets.bottom}
      />
    </SafeAreaView>
  );
}

/* ─── Confirmation bottom sheet ───────────────────────────────── */
function ConfirmSheet({
  visible, info, onCancel, onConfirm, insetBottom,
}: {
  visible: boolean;
  info: ActionInfo | null;
  onCancel: () => void;
  onConfirm: () => void;
  insetBottom: number;
}) {
  if (!info) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={cs.backdrop} onPress={onCancel} />
      <View style={[cs.sheet, { paddingBottom: insetBottom + 16 }]}>
        {/* Drag handle */}
        <View style={cs.handle} />

        {/* Icon */}
        <View style={[cs.iconBubble, { backgroundColor: `${info.color}18` }]}>
          <Feather name={info.icon} size={26} color={info.color} />
        </View>

        {/* Text */}
        <Text style={cs.title}>{info.title}</Text>
        <Text style={cs.message}>{info.message}</Text>

        {/* Buttons */}
        <TouchableOpacity
          style={[cs.confirmBtn, { backgroundColor: info.color }]}
          onPress={onConfirm}
          activeOpacity={0.85}
        >
          <Text style={cs.confirmText}>{info.confirmLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={cs.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={cs.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

/* ─── Toggle row ──────────────────────────────────────────────── */
function ToggleRow({
  icon, label, sub, value, color, disabled, onChange,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  value: boolean;
  color: string;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      style={[s.toggleRow, value && { borderColor: `${color}30`, backgroundColor: `${color}06` }]}
      onPress={() => !disabled && onChange(!value)}
    >
      <View style={[s.toggleIcon, { backgroundColor: `${color}15` }]}>
        {disabled
          ? <ActivityIndicator size="small" color={color} />
          : <Feather name={icon} size={16} color={color} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.toggleLabel}>{label}</Text>
        <Text style={s.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: Colors.border.DEFAULT, true: `${color}70` }}
        thumbColor={value ? color : Colors.text.subtle}
      />
    </Pressable>
  );
}

/* ─── Styles ──────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  content: { padding: 16, gap: 24, paddingBottom: 48 },

  section: { gap: 12 },
  sectionLabel: {
    fontSize: 13, fontWeight: '800', color: Colors.text.subtle,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  sectionHint: { fontSize: 12, color: Colors.text.muted, marginTop: -6 },

  // Visibility card
  visibilityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
  },
  visIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  visRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  visTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  visBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  visBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  visSub: { fontSize: 11, color: Colors.text.muted, lineHeight: 15 },

  // Module toggles
  toggleList: { gap: 8 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#2a1d00',
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.20)',
    padding: 14,
  },
  toggleIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  toggleSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  subRow: {
    flexDirection: 'row', alignItems: 'stretch',
    paddingLeft: 14,
  },
  subRowLine: {
    width: 2, borderRadius: 2, marginRight: 12, marginTop: 6, marginBottom: 6,
    backgroundColor: `${Colors.accent.emerald}40`,
  },
});

const cs = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0e0e16',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24, paddingTop: 12,
    alignItems: 'center', gap: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 4,
  },
  iconBubble: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  title:   { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  message: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: 19,
    paddingHorizontal: 4, marginBottom: 4,
  },
  confirmBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cancelBtn:   { width: '100%', paddingVertical: 12, alignItems: 'center' },
  cancelText:  { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
});
