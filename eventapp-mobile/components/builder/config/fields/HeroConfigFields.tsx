import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import { pickAndUploadImage } from '@/lib/imageUpload';
import type { BuilderSection } from '@/types';

const BG  = '#1a1b1f';
const MT  = '#555a66';
const TX  = 'rgba(255,255,255,0.85)';
const BD  = 'rgba(255,255,255,0.1)';
const ACC = '#6c6fee';

interface Props { section: BuilderSection; eventId: string }

export default function HeroConfigFields({ section, eventId }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title,   setTitle]   = useState(String(cfgRef.current.title   ?? ''));
  const [body,    setBody]    = useState(String(cfgRef.current.body     ?? ''));
  const [eyebrow, setEyebrow] = useState(String(cfgRef.current.eyebrow ?? ''));
  const [bgImage, setBgImage] = useState(String(cfgRef.current.background_image ?? ''));

  useEffect(() => {
    const c = section.config ?? {};
    cfgRef.current = c;
    setTitle(String(c.title ?? ''));
    setBody(String(c.body ?? ''));
    setEyebrow(String(c.eyebrow ?? ''));
    setBgImage(String(c.background_image ?? ''));
  }, [section.id]);

  const saveField = (key: string, value: unknown) => {
    cfgRef.current = { ...cfgRef.current, [key]: value };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { config: cfgRef.current });
    }, 600);
  };

  const handlePickImage = async () => {
    const url = await pickAndUploadImage();
    if (url) { setBgImage(url); saveField('background_image', url); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Field label="Eyebrow Text">
        <TextInput
          style={s.input} value={eyebrow}
          onChangeText={v => { setEyebrow(v); saveField('eyebrow', v); }}
          placeholder="e.g. You Are Invited"
          placeholderTextColor={MT}
        />
      </Field>
      <Field label="Title">
        <TextInput
          style={s.input} value={title}
          onChangeText={v => { setTitle(v); saveField('title', v); }}
          placeholder="Event title"
          placeholderTextColor={MT}
        />
      </Field>
      <Field label="Subtitle">
        <TextInput
          style={[s.input, s.textarea]} value={body}
          onChangeText={v => { setBody(v); saveField('body', v); }}
          placeholder="A short description..."
          placeholderTextColor={MT}
          multiline numberOfLines={3}
        />
      </Field>
      <Field label="Background Image">
        <Pressable style={s.imgPicker} onPress={handlePickImage}>
          {bgImage
            ? <Image source={{ uri: bgImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={s.imgEmpty}>
                <Feather name="image" size={20} color={MT} />
                <Text style={s.imgHint}>Tap to upload image</Text>
              </View>}
          <View style={s.imgOverlay}>
            <Feather name="camera" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>
      </Field>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  scroll:  { padding: 16, gap: 16 },
  field:   { gap: 6 },
  label:   { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: TX,
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  imgPicker: {
    height: 120, borderRadius: 12, borderWidth: 1, borderColor: BD,
    backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  imgEmpty:    { alignItems: 'center', gap: 6 },
  imgHint:     { fontSize: 12, color: MT },
  imgOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
});
