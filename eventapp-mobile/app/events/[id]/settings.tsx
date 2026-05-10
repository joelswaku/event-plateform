import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useEventStore } from '@/store/event.store';
import { Colors } from '@/constants/colors';

/* ─── Module config ──────────────────────────────────────────── */
type ModuleKey = 'allow_rsvp' | 'allow_ticketing' | 'allow_qr_checkin' | 'allow_donations';

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
    key: 'allow_qr_checkin',
    icon: 'camera',
    label: 'QR Check-in',
    sub: 'Enable QR code scanning at the door',
    color: Colors.accent.indigo,
  },
  {
    key: 'allow_donations',
    icon: 'heart',
    label: 'Donations',
    sub: 'Accept optional donations at this event',
    color: Colors.accent.violet,
  },
];

/* ─── Screen ──────────────────────────────────────────────────── */
export default function EventSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentEvent, fetchEventById, updateEvent } = useEventStore();

  const [saving, setSaving] = useState<ModuleKey | null>(null);

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

  const handleToggle = async (key: ModuleKey, value: boolean) => {
    setSaving(key);
    const result = await updateEvent(id, { [key]: value });
    setSaving(null);
    if (!result.success) {
      Toast.show({ type: 'error', text1: result.message ?? 'Failed to update' });
    }
    // Refresh event to sync state
    fetchEventById(id);
  };

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
        {/* Modules section */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Active Modules</Text>
          <Text style={s.sectionHint}>Enable or disable features for this event</Text>
          <View style={s.toggleList}>
            {MODULES.map((mod) => {
              const isOn = !!currentEvent[mod.key as keyof typeof currentEvent];
              const isSaving = saving === mod.key;
              return (
                <ToggleRow
                  key={mod.key}
                  icon={mod.icon}
                  label={mod.label}
                  sub={mod.sub}
                  value={isOn}
                  color={mod.color}
                  disabled={isSaving}
                  onChange={(v) => handleToggle(mod.key, v)}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
        <Feather name={icon} size={16} color={color} />
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
  sectionLabel: { fontSize: 13, fontWeight: '800', color: Colors.text.subtle, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionHint:  { fontSize: 12, color: Colors.text.muted, marginTop: -6 },

  toggleList: { gap: 8 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.card,
    borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 14,
  },
  toggleIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  toggleSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
});
