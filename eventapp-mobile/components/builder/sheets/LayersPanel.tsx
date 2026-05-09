import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch } from 'react-native';
import { useBuilderStore } from '@/store/builder.store';
import * as Haptics from 'expo-haptics';

const ACCENT: Record<string, string> = {
  HERO: '#6c6fee', ABOUT: '#3ecf8e', GALLERY: '#f59e0b', FAQ: '#f43f5e',
  CTA: '#8b5cf6', SPEAKERS: '#06b6d4', VENUE: '#c9a96e', COUNTDOWN: '#ef4444',
  TICKETS: '#22c55e', COUPLE: '#ec4899', STORY: '#f97316', SCHEDULE: '#64748b',
  REGISTRY: '#a78bfa', DONATIONS: '#10b981',
};
const ICONS: Record<string, string> = {
  HERO: '🖼', ABOUT: 'ℹ️', GALLERY: '📸', FAQ: '❓', CTA: '📣',
  SPEAKERS: '👥', VENUE: '📍', COUNTDOWN: '⏱', TICKETS: '🎟',
  COUPLE: '💑', STORY: '📖', SCHEDULE: '📅', REGISTRY: '🎁', DONATIONS: '❤️',
};

interface Section { id: string; section_type: string; is_visible?: boolean }
interface Props {
  eventId: string;
  sections: Section[];
  selectedSectionId: string | null;
  onSectionSelect: (s: Section) => void;
}

export default function LayersPanel({ eventId, sections, selectedSectionId, onSectionSelect }: Props) {
  const updateSection = useBuilderStore((s) => s.updateSection);

  if (sections.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTxt}>No sections yet — add a block first</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.header}>LAYERS</Text>
      {sections.map((sec) => {
        const accent = ACCENT[sec.section_type] ?? '#6c6fee';
        const icon   = ICONS[sec.section_type]  ?? '▣';
        const active = sec.id === selectedSectionId;
        return (
          <TouchableOpacity
            key={sec.id}
            style={[s.row, active && { borderColor: accent }]}
            onPress={() => { onSectionSelect(sec); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            activeOpacity={0.8}
          >
            <Text style={s.drag}>⠿</Text>
            <View style={[s.iconWrap, { backgroundColor: accent + '20' }]}>
              <Text style={{ fontSize: 14 }}>{icon}</Text>
            </View>
            <Text style={[s.label, active && { color: '#fff' }]}>{sec.section_type}</Text>
            <Switch
              value={sec.is_visible !== false}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateSection(eventId, sec.id, { is_visible: val });
              }}
              trackColor={{ false: '#333640', true: accent + '80' }}
              thumbColor={sec.is_visible !== false ? accent : '#555a66'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap:     { padding: 14, gap: 6 },
  header:   { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: '#555a66', marginBottom: 6 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1e2026', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  drag:     { fontSize: 16, color: '#444854', marginRight: 2 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label:    { flex: 1, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty:    { padding: 32, alignItems: 'center' },
  emptyTxt: { fontSize: 12, color: '#555a66', textAlign: 'center' },
});
