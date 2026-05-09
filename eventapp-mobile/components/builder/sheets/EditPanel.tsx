import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import SectionConfigPanel from '@/components/builder/config/SectionConfigPanel';

const ACCENT: Record<string, string> = {
  HERO: '#6c6fee', ABOUT: '#3ecf8e', GALLERY: '#f59e0b', FAQ: '#f43f5e',
  CTA: '#8b5cf6', SPEAKERS: '#06b6d4', VENUE: '#c9a96e', COUNTDOWN: '#ef4444',
  TICKETS: '#22c55e', COUPLE: '#ec4899', STORY: '#f97316', SCHEDULE: '#64748b',
};

interface Props { eventId: string; section: any; onDeselect: () => void }

export default function EditPanel({ eventId, section, onDeselect }: Props) {
  if (!section) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyIcon}>✏️</Text>
        <Text style={s.emptyTxt}>Tap a section in the canvas to edit it</Text>
      </View>
    );
  }

  const accent = ACCENT[section.section_type] ?? '#6c6fee';

  return (
    <View style={s.root}>
      {/* Fixed header — not part of any scroll */}
      <View style={s.header}>
        <View style={[s.typeBadge, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
          <Text style={[s.typeLabel, { color: accent }]}>{section.section_type}</Text>
        </View>
        <Text style={s.editLabel}>Edit Section</Text>
        <TouchableOpacity style={s.closeBtn} onPress={onDeselect} activeOpacity={0.7}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Config panel owns the scroll — avoids nested ScrollView */}
      <View style={s.body}>
        <SectionConfigPanel
          section={section}
          eventId={eventId}
          iosKeyboardInsets={Platform.OS === 'ios'}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 12 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  typeLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  editLabel: { fontSize: 13, fontWeight: '600', color: '#f0f1f3', flex: 1 },
  closeBtn:  { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  closeTxt:  { fontSize: 12, color: '#8b8f9a' },
  body:      { flex: 1 },
  empty:     { padding: 40, alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 28, opacity: 0.3 },
  emptyTxt:  { fontSize: 12, color: '#555a66', textAlign: 'center' },
});
