import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import { pickAndUploadImage } from '@/lib/imageUpload';
import type { BuilderSection } from '@/types';

const BG   = '#1a1b1f';
const CARD = '#1e2026';
const MT   = '#555a66';
const TX   = 'rgba(255,255,255,0.85)';
const BD   = 'rgba(255,255,255,0.1)';
const ACC  = '#6c6fee';

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

const IMG_POSITIONS = [
  { value: 'left',  label: 'Left',  sub: 'Image on the left side' },
  { value: 'right', label: 'Right', sub: 'Image on the right side' },
];

export default function StoryConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);

  const sectionIdRef = useRef(section.id);
  const cfgRef       = useRef<Record<string, unknown>>({ ...(section.config ?? {}) });
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title,    setTitle]    = useState(section.title ?? '');
  const [body,     setBody]     = useState(section.body  ?? '');
  const [storyImage, setStoryImage] = useState<string>(String((section.config ?? {}).story_image ?? ''));
  const [quote,    setQuote]    = useState<string>(String((section.config ?? {}).quote ?? ''));
  const [imgPos,   setImgPos]   = useState<string>(String((section.config ?? {}).image_position ?? 'left'));

  useEffect(() => {
    sectionIdRef.current = section.id;
    cfgRef.current = { ...(section.config ?? {}) };
    setTitle(section.title ?? '');
    setBody(section.body   ?? '');
    setStoryImage(String(cfgRef.current.story_image ?? ''));
    setQuote(String(cfgRef.current.quote ?? ''));
    setImgPos(String(cfgRef.current.image_position ?? 'left'));
  }, [section.id, section.config, section.title, section.body]);

  const saveTopLevel = useCallback((field: 'title' | 'body', value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, sectionIdRef.current, { [field]: value });
    }, 400);
  }, [eventId, updateSection]);

  const saveConfig = useCallback((key: string, value: unknown) => {
    const next = { ...cfgRef.current, [key]: value };
    cfgRef.current = next;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, sectionIdRef.current, { config: cfgRef.current });
    }, 400);
  }, [eventId, updateSection]);

  const pickImgPos = useCallback((value: string) => {
    setImgPos(value);
    const next = { ...cfgRef.current, image_position: value };
    cfgRef.current = next;
    updateSection(eventId, sectionIdRef.current, { config: next });
  }, [eventId, updateSection]);

  const pickStoryImage = useCallback(async () => {
    const url = await pickAndUploadImage(eventId);
    if (!url) return;
    setStoryImage(url);
    saveConfig('story_image', url);
  }, [eventId, saveConfig]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.sectionLabel}>CONTENT</Text>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Title</Text>
        <TextInput
          style={s.input}
          value={title}
          onChangeText={v => { setTitle(v); saveTopLevel('title', v); }}
          placeholder="Our Story"
          placeholderTextColor={MT}
        />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Story Text</Text>
        <TextInput
          style={[s.input, s.inputMulti]}
          value={body}
          onChangeText={v => { setBody(v); saveTopLevel('body', v); }}
          placeholder="Share the story behind this event..."
          placeholderTextColor={MT}
          multiline
          numberOfLines={5}
        />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Story Image</Text>
        <Pressable style={s.imagePicker} onPress={pickStoryImage}>
          {storyImage
            ? <Image source={{ uri: storyImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={s.imageEmpty}>
                <Feather name="image" size={22} color={MT} />
                <Text style={s.imageHint}>Tap to upload a photo</Text>
              </View>}
          <View style={s.imageOverlay}><Feather name="camera" size={13} color="#fff" /></View>
        </Pressable>
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Pull Quote (optional)</Text>
        <TextInput
          style={s.input}
          value={quote}
          onChangeText={v => { setQuote(v); saveConfig('quote', v); }}
          placeholder="A memorable line or saying..."
          placeholderTextColor={MT}
        />
      </View>

      <Text style={[s.sectionLabel, { marginTop: 8 }]}>IMAGE POSITION</Text>
      {IMG_POSITIONS.map(opt => {
        const active = imgPos === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[s.optionCard, active && s.optionActive]}
            onPress={() => pickImgPos(opt.value)}
          >
            <View style={[s.optionDot, active && s.optionDotActive]}>
              {active && <View style={s.optionDotInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.optionLabel, active && { color: ACC }]}>{opt.label}</Text>
              <Text style={s.optionSub}>{opt.sub}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: MT, letterSpacing: 1.2, marginTop: 4 },
  fieldGroup:   { gap: 6 },
  fieldLabel:   { fontSize: 12, fontWeight: '600', color: MT },
  input: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BD,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: TX,
  },
  inputMulti:   { minHeight: 100, textAlignVertical: 'top' },
  imagePicker: {
    height: 148, borderRadius: 12, overflow: 'hidden',
    backgroundColor: CARD, borderWidth: 1, borderColor: BD,
  },
  imageEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  imageHint: { fontSize: 12, color: MT },
  imageOverlay: {
    position: 'absolute', right: 9, bottom: 9, width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.66)', alignItems: 'center', justifyContent: 'center',
  },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  optionActive: {
    borderColor: 'rgba(108,111,238,0.5)',
    backgroundColor: 'rgba(108,111,238,0.08)',
  },
  optionDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: BD,
    alignItems: 'center', justifyContent: 'center',
  },
  optionDotActive: { borderColor: ACC },
  optionDotInner: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: ACC,
  },
  optionLabel:  { fontSize: 14, fontWeight: '600', color: TX },
  optionSub:    { fontSize: 11, color: MT, marginTop: 2 },
});
