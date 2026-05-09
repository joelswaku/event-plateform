// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
// import * as Haptics from 'expo-haptics';
// import SectionPreviewCard from './SectionPreviewCard';

// interface Section { id: string; section_type: string; title?: string; body?: string; config?: any; position_order?: number; is_visible?: boolean }
// interface Props { sections: Section[]; selectedSectionId: string | null; onSectionSelect: (s: Section) => void; onReorder: (s: Section[]) => void; event?: any }

// export default function BuilderCanvas({ sections, selectedSectionId, onSectionSelect, onReorder, event }: Props) {
//   if (sections.length === 0) {
//     return (
//       <View style={s.empty}>
//         <Text style={s.emptyIcon}>✦</Text>
//         <Text style={s.emptyTitle}>Canvas is empty</Text>
//         <Text style={s.emptyBody}>Tap Add below to drop in your first block</Text>
//       </View>
//     );
//   }

//   return (
//     <DraggableFlatList
//       data={sections}
//       keyExtractor={(item) => item.id}
//       contentContainerStyle={s.list}
//       onDragEnd={({ data }) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onReorder(data); }}
//       renderItem={({ item, drag, isActive }: RenderItemParams<Section>) => (
//         <ScaleDecorator>
//           <TouchableOpacity
//             onPress={() => onSectionSelect(item)}
//             onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); drag(); }}
//             activeOpacity={0.9}
//             style={[s.card, isActive && s.cardActive]}
//           >
//             <SectionPreviewCard section={item} selected={item.id === selectedSectionId} event={event} />
//           </TouchableOpacity>
//         </ScaleDecorator>
//       )}
//     />
//   );
// }

// const s = StyleSheet.create({
//   list:       { padding: 12, gap: 8 },
//   card:       { borderRadius: 14, overflow: 'hidden' },
//   cardActive: { opacity: 0.82, transform: [{ scale: 0.98 }] },
//   empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
//   emptyIcon:  { fontSize: 36, color: 'rgba(255,255,255,0.12)' },
//   emptyTitle: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.28)' },
//   emptyBody:  { fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'center' },
// });












import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Alert, Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection, Event } from '@/types';
import SectionPreviewCard from './SectionPreviewCard';

const BG  = '#1a1b1f';
const ACC = '#6c6fee';
const MT  = '#8b8f9a';

interface Props {
  sections:         BuilderSection[];
  selectedSectionId:string | null;
  onSectionSelect:  (sec: BuilderSection) => void;
  eventId:          string;
  event:            Event | null;
  isLoading:        boolean;
}

export default function BuilderCanvas({
  sections, selectedSectionId, onSectionSelect, eventId, event, isLoading,
}: Props) {
  const deleteSection   = useBuilderStore(s => s.deleteSection);
  const reorderSections = useBuilderStore(s => s.reorderSections);
  const updateSection   = useBuilderStore(s => s.updateSection);

  const [contextSection, setContextSection] = useState<BuilderSection | null>(null);

  const handleLongPress = (sec: BuilderSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setContextSection(sec);
    const idx = sections.findIndex(s => s.id === sec.id);
    Alert.alert(
      sec.section_type,
      'Section actions',
      [
        { text: '✏️ Edit',   onPress: () => onSectionSelect(sec) },
        {
          text: '⬆️ Move Up',
          onPress: idx > 0 ? () => moveSection(idx, 'up') : undefined,
          style: idx === 0 ? 'cancel' : 'default',
        },
        {
          text: '⬇️ Move Down',
          onPress: idx < sections.length - 1 ? () => moveSection(idx, 'down') : undefined,
          style: idx === sections.length - 1 ? 'cancel' : 'default',
        },
        {
          text: sec.is_visible ? '🙈 Hide' : '👁 Show',
          onPress: () => updateSection(eventId, sec.id, { is_visible: !sec.is_visible }),
        },
        {
          text: '🗑 Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            deleteSection(eventId, sec.id);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const moveSection = async (idx: number, dir: 'up' | 'down') => {
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= sections.length) return;
    const reordered = [...sections];
    [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];
    const payload = reordered.map((s, i) => ({ id: s.id, position_order: i + 1 }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await reorderSections(eventId, payload);
  };

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={ACC} />
        <Text style={s.loadingText}>Loading builder…</Text>
      </View>
    );
  }

  if (!eventId) {
    return (
      <View style={s.center}>
        <Feather name="alert-circle" size={32} color="rgba(255,255,255,0.2)" />
        <Text style={s.emptyTitle}>No event found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.canvas}
      contentContainerStyle={[s.scroll, sections.length === 0 && s.scrollEmpty]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {sections.length === 0 ? (
        <View style={s.empty}>
          <Feather name="layers" size={40} color="rgba(255,255,255,0.1)" />
          <Text style={s.emptyTitle}>No sections yet</Text>
          <Text style={s.emptySub}>Add a block below ↓</Text>
        </View>
      ) : (
        <>
          {sections.map(sec => (
            <Pressable
              key={sec.id}
              onPress={() => onSectionSelect(sec)}
              onLongPress={() => handleLongPress(sec)}
            >
              <SectionPreviewCard
                section={sec}
                selected={sec.id === selectedSectionId}
                event={event}
              />
            </Pressable>
          ))}
          <View style={{ height: 24 }} />
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: BG },
  scroll: { paddingTop: 12 },
  scrollEmpty: { flex: 1 },
  center: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: MT },
  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  emptySub:   { fontSize: 13, color: 'rgba(255,255,255,0.25)' },
});
