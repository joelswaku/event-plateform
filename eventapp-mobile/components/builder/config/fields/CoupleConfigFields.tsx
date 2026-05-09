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

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

export default function CoupleConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef  = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const c = section.config ?? {};
  const [p1Name,  setP1Name]  = useState(String(c.partner1_name  ?? ''));
  const [p2Name,  setP2Name]  = useState(String(c.partner2_name  ?? ''));
  const [p1Photo, setP1Photo] = useState(String(c.partner1_photo ?? ''));
  const [p2Photo, setP2Photo] = useState(String(c.partner2_photo ?? ''));
  const [story,   setStory]   = useState(String(c.story          ?? ''));

  useEffect(() => {
    const cfg = section.config ?? {};
    cfgRef.current = cfg;
    setP1Name(String(cfg.partner1_name ?? ''));
    setP2Name(String(cfg.partner2_name ?? ''));
    setP1Photo(String(cfg.partner1_photo ?? ''));
    setP2Photo(String(cfg.partner2_photo ?? ''));
    setStory(String(cfg.story ?? ''));
  }, [section.id]);

  const saveField = (key: string, value: unknown) => {
    cfgRef.current = { ...cfgRef.current, [key]: value };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { config: cfgRef.current });
    }, 600);
  };

  const pickPhoto = async (partner: 1 | 2) => {
    const url = await pickAndUploadImage(eventId);
    if (!url) return;
    if (partner === 1) { setP1Photo(url); saveField('partner1_photo', url); }
    else               { setP2Photo(url); saveField('partner2_photo', url); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.partners}>
        <PhotoBox label="Partner 1" photoUri={p1Photo} onPick={() => pickPhoto(1)} />
        <PhotoBox label="Partner 2" photoUri={p2Photo} onPick={() => pickPhoto(2)} />
      </View>
      <Field label="Partner 1 Name">
        <TextInput
          style={s.input} value={p1Name}
          onChangeText={v => { setP1Name(v); saveField('partner1_name', v); }}
          placeholder="Name"
          placeholderTextColor={MT}
        />
      </Field>
      <Field label="Partner 2 Name">
        <TextInput
          style={s.input} value={p2Name}
          onChangeText={v => { setP2Name(v); saveField('partner2_name', v); }}
          placeholder="Name"
          placeholderTextColor={MT}
        />
      </Field>
      <Field label="Our Story">
        <TextInput
          style={[s.input, s.textarea]} value={story}
          onChangeText={v => { setStory(v); saveField('story', v); }}
          placeholder="Tell your story..."
          placeholderTextColor={MT}
          multiline numberOfLines={4}
        />
      </Field>
    </ScrollView>
  );
}

function PhotoBox({ label, photoUri, onPick }: { label: string; photoUri: string; onPick: () => void }) {
  return (
    <Pressable style={s.photoBox} onPress={onPick}>
      {photoUri
        ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <View style={s.photoEmpty}>
            <Feather name="user" size={22} color="#555a66" />
          </View>}
      <View style={s.photoOverlay}>
        <Feather name="camera" size={12} color="rgba(255,255,255,0.7)" />
      </View>
      <Text style={s.photoLabel}>{label}</Text>
    </Pressable>
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
  scroll:   { padding: 16, gap: 16 },
  partners: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  photoBox: {
    flex: 1, height: 100, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  photoEmpty:   { alignItems: 'center', justifyContent: 'center', flex: 1 },
  photoOverlay: {
    position: 'absolute', bottom: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoLabel: {
    position: 'absolute', bottom: 6, left: 8,
    fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)',
  },
  field:    { gap: 6 },
  label:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: 'rgba(255,255,255,0.85)',
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
});
