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

const MAX_IMAGES  = 12;
const MIN_VISIBLE = 6; // always show at least this many slots

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

  // Tap an empty slot → pick image for that slot index
  const fillSlot = async (slotIdx: number) => {
    const url = await pickAndUploadImage(eventId);
    if (!url) return;
    const next = [...images];
    if (slotIdx < next.length) {
      next[slotIdx] = url; // replace existing
    } else {
      // fill up to slotIdx with empty (shouldn't normally happen)
      while (next.length < slotIdx) next.push('');
      next.push(url);
    }
    setImages(next);
    save({ images: next });
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    save({ images: next });
  };

  // Build slot array: real images + empty slots up to MIN_VISIBLE (or +1 to add more)
  const slotCount = Math.max(MIN_VISIBLE, images.length < MAX_IMAGES ? images.length + 1 : images.length);
  const slots: (string | null)[] = Array.from({ length: Math.min(slotCount, MAX_IMAGES) }, (_, i) => images[i] ?? null);

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
          <Pressable style={[s.seg, layout === 'grid' && s.segActive]} onPress={() => pickLayout('grid')}>
            <Feather name="grid" size={13} color={layout === 'grid' ? '#fff' : MT} />
            <Text style={[s.segTxt, layout === 'grid' && s.segTxtActive]}>Grid</Text>
          </Pressable>
          <Pressable style={[s.seg, layout === 'carousel' && s.segActive]} onPress={() => pickLayout('carousel')}>
            <Feather name="layers" size={13} color={layout === 'carousel' ? '#fff' : MT} />
            <Text style={[s.segTxt, layout === 'carousel' && s.segTxtActive]}>Carousel</Text>
          </Pressable>
        </View>
      </View>

      {/* Images — slot-based grid */}
      <View style={s.field}>
        <View style={s.imagesHeader}>
          <Text style={s.label}>IMAGES ({images.length}/{MAX_IMAGES})</Text>
          {images.length > 0 && (
            <Pressable
              style={s.clearBtn}
              onPress={() => {
                Alert.alert('Clear all photos?', 'This will remove all gallery images.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: () => { setImages([]); save({ images: [] }); } },
                ]);
              }}
            >
              <Feather name="trash-2" size={11} color="#ef4444" />
              <Text style={s.clearBtnTxt}>Clear all</Text>
            </Pressable>
          )}
        </View>
        <View style={s.grid}>
          {slots.map((uri, idx) =>
            uri ? (
              // Filled slot: show image + replace on tap + remove button
              <Pressable key={idx} style={s.cell} onPress={() => fillSlot(idx)}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                {/* Replace hint */}
                <View style={s.replaceHint}>
                  <Feather name="refresh-cw" size={10} color="rgba(255,255,255,0.7)" />
                </View>
                <Pressable style={s.removeBtn} onPress={() => removeImage(idx)} hitSlop={4}>
                  <Feather name="x" size={13} color="#fff" />
                </Pressable>
              </Pressable>
            ) : (
              // Empty slot: tap to add
              <Pressable key={idx} style={s.emptySlot} onPress={() => fillSlot(idx)}>
                <Feather name="plus" size={18} color={`${ACC}99`} />
              </Pressable>
            )
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
  segRow:   { flexDirection: 'row', gap: 8 },
  seg: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: BD,
  },
  segActive:    { backgroundColor: 'rgba(108,111,238,0.2)', borderColor: ACC },
  segTxt:       { fontSize: 13, color: MT, fontWeight: '500' },
  segTxtActive: { color: '#fff' },
  imagesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.12)' },
  clearBtnTxt:  { fontSize: 11, fontWeight: '700', color: '#ef4444' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '30%', aspectRatio: 1, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    borderWidth: 1, borderColor: BD,
  },
  removeBtn: {
    position: 'absolute', top: 5, right: 5,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
  },
  replaceHint: {
    position: 'absolute', bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptySlot: {
    width: '30%', aspectRatio: 1, borderRadius: 10,
    backgroundColor: 'rgba(108,111,238,0.06)',
    borderWidth: 1, borderColor: 'rgba(108,111,238,0.2)',
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
});
