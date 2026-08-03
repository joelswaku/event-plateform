import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection } from '@/types';

const BG = '#1a1b1f';
const MT = '#555a66';
const TX = 'rgba(255,255,255,0.85)';
const BD = 'rgba(255,255,255,0.1)';

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

// CTA uses the normal section title/body plus config.button_text. Keeping them
// separate matches the live web renderer exactly.
export default function CTAConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const configRef = useRef<Record<string, unknown>>({ ...(section.config ?? {}) });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionIdRef = useRef(section.id);

  const [title, setTitle] = useState(section.title ?? '');
  const [body, setBody] = useState(section.body ?? '');
  const [buttonText, setButtonText] = useState(String((section.config ?? {}).button_text ?? ''));

  useEffect(() => {
    sectionIdRef.current = section.id;
    configRef.current = { ...(section.config ?? {}) };
    setTitle(section.title ?? '');
    setBody(section.body ?? '');
    setButtonText(String(configRef.current.button_text ?? ''));
  }, [section.id, section.title, section.body, section.config]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const save = (patch: Record<string, unknown>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void updateSection(eventId, sectionIdRef.current, patch);
    }, 400);
  };

  const saveButtonText = (value: string) => {
    configRef.current = { ...configRef.current, button_text: value };
    save({ config: configRef.current });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <Field label="Section Title">
        <TextInput
          style={s.input} value={title}
          onChangeText={value => { setTitle(value); save({ title: value }); }}
          placeholder="Join us"
          placeholderTextColor={MT}
        />
      </Field>
      <Field label="Body Text">
        <TextInput
          style={[s.input, s.textarea]} value={body}
          onChangeText={value => { setBody(value); save({ body: value }); }}
          placeholder="Add a short invitation…"
          placeholderTextColor={MT}
          multiline numberOfLines={4}
        />
      </Field>
      <Field label="Button Text">
        <TextInput
          style={s.input} value={buttonText}
          onChangeText={value => { setButtonText(value); saveButtonText(value); }}
          placeholder="RSVP Now"
          placeholderTextColor={MT}
        />
      </Field>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text>{children}</View>;
}

const s = StyleSheet.create({
  scroll: { padding: 16, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: TX,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
});
