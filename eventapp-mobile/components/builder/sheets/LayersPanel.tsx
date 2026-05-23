import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
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
  const updateSection   = useBuilderStore(s => s.updateSection);
  const reorderSections = useBuilderStore(s => s.reorderSections);

  const handleDragEnd = useCallback(({ data }: { data: Section[] }) => {
    const payload = data.map((sec, i) => ({ id: sec.id, position_order: i + 1 }));
    reorderSections(eventId, payload);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [eventId, reorderSections]);

  if (sections.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTxt}>No sections yet — add a block first</Text>
      </View>
    );
  }

  const renderItem = ({ item: sec, drag, isActive }: RenderItemParams<Section>) => {
    const accent = ACCENT[sec.section_type] ?? '#6c6fee';
    const icon   = ICONS[sec.section_type]  ?? '▣';
    const active = sec.id === selectedSectionId;
    return (
      <ScaleDecorator activeScale={0.97}>
        <View style={[s.row, active && { borderColor: accent, backgroundColor: `${accent}12` }, isActive && s.rowActive]}>

          {/* Drag handle — long-press initiates drag */}
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={120}
            hitSlop={8}
            style={s.dragHandle}
          >
            <Text style={s.drag}>⠿</Text>
          </TouchableOpacity>

          {/* Tappable content area — selects section for editing */}
          <Pressable
            style={s.rowContent}
            onPress={() => { onSectionSelect(sec); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <View style={[s.iconWrap, { backgroundColor: `${accent}20` }]}>
              <Text style={{ fontSize: 14 }}>{icon}</Text>
            </View>
            <Text style={[s.label, active && { color: '#fff' }]} numberOfLines={1}>
              {sec.section_type}
            </Text>
          </Pressable>

          <Switch
            value={sec.is_visible !== false}
            onValueChange={val => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              updateSection(eventId, sec.id, { is_visible: val });
            }}
            trackColor={{ false: '#333640', true: `${accent}80` }}
            thumbColor={sec.is_visible !== false ? accent : '#555a66'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={s.headerRow}>
        <Text style={s.header}>LAYERS</Text>
        <Text style={s.hint}>Hold ⠿ to reorder</Text>
      </View>
      <View style={{ flex: 1 }}>
        <DraggableFlatList
          data={sections}
          keyExtractor={item => item.id}
          onDragEnd={handleDragEnd}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          activationDistance={5}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
  },
  header:  { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: '#555a66' },
  hint:    { fontSize: 9, color: '#444854', fontWeight: '600' },

  list:  { paddingHorizontal: 12, paddingBottom: 120, gap: 6 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1e2026', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  rowActive: { backgroundColor: '#24272f', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },

  dragHandle: { paddingHorizontal: 2, paddingVertical: 4 },
  drag:       { fontSize: 16, color: '#555a66' },

  rowContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },

  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label:    { flex: 1, fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5 },

  empty:    { padding: 32, alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyTxt: { fontSize: 12, color: '#555a66', textAlign: 'center' },
});
