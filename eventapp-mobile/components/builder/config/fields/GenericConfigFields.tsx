import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection } from '@/types';

const BG = '#1a1b1f';
const MT = '#555a66';
const TX = 'rgba(255,255,255,0.85)';
const BD = 'rgba(255,255,255,0.1)';

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

export default function GenericConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef  = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const c = section.config ?? {};
  const [title, setTitle] = useState(String(c.title ?? ''));
  const [body,  setBody]  = useState(String(c.body  ?? ''));

  useEffect(() => {
    const cfg = section.config ?? {};
    cfgRef.current = cfg;
    setTitle(String(cfg.title ?? ''));
    setBody(String(cfg.body ?? ''));
  }, [section.id]);

  const saveField = (key: string, value: unknown) => {
    cfgRef.current = { ...cfgRef.current, [key]: value };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { config: cfgRef.current });
    }, 600);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <Field label="Title">
        <TextInput
          style={s.input} value={title}
          onChangeText={v => { setTitle(v); saveField('title', v); }}
          placeholder="Section title"
          placeholderTextColor={MT}
        />
      </Field>
      <Field label="Body">
        <TextInput
          style={[s.input, s.textarea]} value={body}
          onChangeText={v => { setBody(v); saveField('body', v); }}
          placeholder="Section content..."
          placeholderTextColor={MT}
          multiline numberOfLines={4}
        />
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
  scroll:   { padding: 16, gap: 16 },
  field:    { gap: 6 },
  label:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: TX,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
});
