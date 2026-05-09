import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import { pickAndUploadImage } from '@/lib/imageUpload';
import type { BuilderSection } from '@/types';

const BG  = '#1a1b1f';
const MT  = '#555a66';
const TX  = 'rgba(255,255,255,0.85)';
const BD  = 'rgba(255,255,255,0.1)';
const ACC = '#6c6fee';

const MAX_IMAGES = 12;

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

export default function GalleryConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef  = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const c = section.config ?? {};
  const [title,  setTitle]  = useState(String(c.title  ?? ''));
  const [body,   setBody]   = useState(String(c.body   ?? ''));
  const [layout, setLayout] = useState<'grid' | 'carousel'>((c.layout as 'grid' | 'carousel') ?? 'grid');
  const [images, setImages] = useState<string[]>((c.images as string[]) ?? []);

  useEffect(() => {
    const cfg = section.config ?? {};
    cfgRef.current = cfg;
    setTitle(String(cfg.title ?? ''));
    setBody(String(cfg.body ?? ''));
    setLayout((cfg.layout as 'grid' | 'carousel') ?? 'grid');
    setImages((cfg.images as string[]) ?? []);
  }, [section.id]);

  const save = (patch: Record<string, unknown>) => {
    cfgRef.current = { ...cfgRef.current, ...patch };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { config: cfgRef.current });
    }, 600);
  };

  const pickLayout = (l: 'grid' | 'carousel') => {
    setLayout(l);
    save({ layout: l });
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
      save({ images: next });
    }
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    save({ images: next });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      {/* Section Title */}
      <View style={s.field}>
        <Text style={s.label}>SECTION TITLE</Text>
        <TextInput
          style={s.input}
          value={title}
          onChangeText={v => { setTitle(v); save({ title: v }); }}
          placeholder="Gallery"
          placeholderTextColor={MT}
        />
      </View>

      {/* Body Text */}
      <View style={s.field}>
        <Text style={s.label}>BODY TEXT</Text>
        <TextInput
          style={[s.input, s.textarea]}
          value={body}
          onChangeText={v => { setBody(v); save({ body: v }); }}
          placeholder="Supporting text…"
          placeholderTextColor={MT}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Layout */}
      <View style={s.field}>
        <Text style={s.label}>LAYOUT</Text>
        <View style={s.segRow}>
          <Pressable
            style={[s.seg, layout === 'grid' && s.segActive]}
            onPress={() => pickLayout('grid')}
          >
            <Feather name="grid" size={13} color={layout === 'grid' ? '#fff' : MT} />
            <Text style={[s.segTxt, layout === 'grid' && s.segTxtActive]}>Grid</Text>
          </Pressable>
          <Pressable
            style={[s.seg, layout === 'carousel' && s.segActive]}
            onPress={() => pickLayout('carousel')}
          >
            <Feather name="layers" size={13} color={layout === 'carousel' ? '#fff' : MT} />
            <Text style={[s.segTxt, layout === 'carousel' && s.segTxtActive]}>Carousel</Text>
          </Pressable>
        </View>
      </View>

      {/* Images */}
      <View style={s.field}>
        <Text style={s.label}>IMAGES ({images.length}/{MAX_IMAGES})</Text>
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
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:  { padding: 16, gap: 16 },
  field:   { gap: 6 },
  label:   { fontSize: 10, fontWeight: '700', color: MT, letterSpacing: 1.2 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: TX,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  // layout toggle
  segRow:   { flexDirection: 'row', gap: 8 },
  seg: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: BD,
  },
  segActive: { backgroundColor: 'rgba(108,111,238,0.2)', borderColor: ACC },
  segTxt:    { fontSize: 13, color: MT, fontWeight: '500' },
  segTxtActive: { color: '#fff' },
  // image grid
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    backgroundColor: 'rgba(108,111,238,0.1)',
    borderWidth: 1, borderColor: 'rgba(108,111,238,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
});
