import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import { pickAndUploadImage } from '@/lib/imageUpload';
import type { BuilderSection } from '@/types';

const BG  = '#1a1b1f';
const MT  = '#555a66';
const TX  = 'rgba(255,255,255,0.85)';
const BD  = 'rgba(255,255,255,0.1)';
const ACC = '#6c6fee';

const MAX_IMAGES = 9;

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

export default function GalleryConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef  = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [images, setImages] = useState<string[]>((cfgRef.current.images as string[]) ?? []);

  useEffect(() => {
    const c = section.config ?? {};
    cfgRef.current = c;
    setImages((c.images as string[]) ?? []);
  }, [section.id]);

  const save = (imgs: string[]) => {
    cfgRef.current = { ...cfgRef.current, images: imgs };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { config: cfgRef.current });
    }, 600);
  };

  const addImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const url = await pickAndUploadImage(eventId);
    if (url) {
      const next = [...images, url];
      setImages(next);
      save(next);
    }
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    save(next);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.label}>GALLERY IMAGES ({images.length}/{MAX_IMAGES})</Text>
      <View style={s.grid}>
        {images.map((uri, idx) => (
          <View key={idx} style={s.cell}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Pressable style={s.removeBtn} onPress={() => removeImage(idx)} hitSlop={4}>
              <Feather name="x" size={10} color="#fff" />
            </Pressable>
          </View>
        ))}
        {images.length < MAX_IMAGES && (
          <Pressable style={s.addCell} onPress={addImage}>
            <Feather name="plus" size={22} color={ACC} />
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, gap: 12 },
  label:  { fontSize: 10, fontWeight: '700', color: MT, letterSpacing: 1.2 },
  grid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '30%', aspectRatio: 1, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    borderWidth: 1, borderColor: BD,
  },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  addCell: {
    width: '30%', aspectRatio: 1, borderRadius: 10,
    backgroundColor: `rgba(108,111,238,0.1)`,
    borderWidth: 1, borderColor: `rgba(108,111,238,0.35)`,
    alignItems: 'center', justifyContent: 'center',
  },
});
