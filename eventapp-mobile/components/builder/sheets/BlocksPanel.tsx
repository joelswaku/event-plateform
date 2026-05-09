import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useBuilderStore } from '@/store/builder.store';

const BLOCKS = [
  { type: 'HERO',      icon: '🖼',  label: 'Hero',      color: '#6c6fee' },
  { type: 'ABOUT',     icon: 'ℹ️',  label: 'About',     color: '#3ecf8e' },
  { type: 'GALLERY',   icon: '📸',  label: 'Gallery',   color: '#f59e0b' },
  { type: 'FAQ',       icon: '❓',  label: 'FAQ',       color: '#f43f5e' },
  { type: 'CTA',       icon: '📣',  label: 'CTA',       color: '#8b5cf6' },
  { type: 'SPEAKERS',  icon: '👥',  label: 'Speakers',  color: '#06b6d4' },
  { type: 'VENUE',     icon: '📍',  label: 'Venue',     color: '#c9a96e' },
  { type: 'COUNTDOWN', icon: '⏱',  label: 'Countdown', color: '#ef4444' },
  { type: 'TICKETS',   icon: '🎟',  label: 'Tickets',   color: '#22c55e' },
  { type: 'COUPLE',    icon: '💑',  label: 'Couple',    color: '#ec4899' },
  { type: 'STORY',     icon: '📖',  label: 'Story',     color: '#f97316' },
  { type: 'SCHEDULE',  icon: '📅',  label: 'Schedule',  color: '#64748b' },
  { type: 'REGISTRY',  icon: '🎁',  label: 'Registry',  color: '#a78bfa' },
  { type: 'DONATIONS', icon: '❤️',  label: 'Donations', color: '#10b981' },
];

interface Props { eventId: string; onClose: () => void }

export default function BlocksPanel({ eventId, onClose }: Props) {
  const createSectionFromTemplate = useBuilderStore((s) => s.createSectionFromTemplate);

  const handleAdd = async (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await createSectionFromTemplate(eventId, type);
    onClose();
  };

  return (
    <ScrollView contentContainerStyle={s.grid}>
      <Text style={s.header}>ADD BLOCK</Text>
      <View style={s.gridInner}>
        {BLOCKS.map(({ type, icon, label, color }) => (
          <TouchableOpacity
            key={type}
            style={s.cell}
            onPress={() => handleAdd(type)}
            activeOpacity={0.75}
          >
            <View style={[s.iconWrap, { backgroundColor: color + '20' }]}>
              <Text style={s.iconTxt}>{icon}</Text>
            </View>
            <Text style={s.label}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  grid:      { padding: 14 },
  header:    { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: '#555a66', marginBottom: 12 },
  gridInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell:      { width: '29%', alignItems: 'center', gap: 6, backgroundColor: '#1e2026', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  iconWrap:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconTxt:   { fontSize: 20 },
  label:     { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
});
