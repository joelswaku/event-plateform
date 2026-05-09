import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection } from '@/types';

const BG = '#1a1b1f';
const MT = '#555a66';
const TX = 'rgba(255,255,255,0.85)';
const BD = 'rgba(255,255,255,0.1)';

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

export default function CountdownConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef  = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [eventDate, setEventDate] = useState(String((section.config ?? {}).event_date ?? ''));

  useEffect(() => {
    const c = section.config ?? {};
    cfgRef.current = c;
    setEventDate(String(c.event_date ?? ''));
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
      <View style={s.field}>
        <Text style={s.label}>Event Date & Time</Text>
        <TextInput
          style={s.input}
          value={eventDate}
          onChangeText={v => { setEventDate(v); saveField('event_date', v); }}
          placeholder="YYYY-MM-DDTHH:MM:SS"
          placeholderTextColor={MT}
          autoCapitalize="none"
        />
        <Text style={s.hint}>ISO 8601 format, e.g. 2025-12-31T18:00:00</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, gap: 16 },
  field:  { gap: 6 },
  label:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: TX,
  },
  hint: { fontSize: 11, color: MT },
});
