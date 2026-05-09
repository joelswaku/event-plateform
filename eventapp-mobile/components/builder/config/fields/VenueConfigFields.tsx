import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection } from '@/types';

const BG = '#1a1b1f';
const MT = '#555a66';
const TX = 'rgba(255,255,255,0.85)';
const BD = 'rgba(255,255,255,0.1)';

interface Props { section: BuilderSection; eventId: string }

export default function VenueConfigFields({ section, eventId }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef  = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const c = section.config ?? {};
  const [name,    setName]    = useState(String(c.venue_name    ?? ''));
  const [address, setAddress] = useState(String(c.venue_address ?? ''));
  const [mapUrl,  setMapUrl]  = useState(String(c.map_url       ?? ''));

  useEffect(() => {
    const cfg = section.config ?? {};
    cfgRef.current = cfg;
    setName(String(cfg.venue_name ?? ''));
    setAddress(String(cfg.venue_address ?? ''));
    setMapUrl(String(cfg.map_url ?? ''));
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
      showsVerticalScrollIndicator={false}
    >
      <Field label="Venue Name">
        <TextInput
          style={s.input} value={name}
          onChangeText={v => { setName(v); saveField('venue_name', v); }}
          placeholder="e.g. Grand Ballroom"
          placeholderTextColor={MT}
        />
      </Field>
      <Field label="Address">
        <TextInput
          style={[s.input, s.textarea]} value={address}
          onChangeText={v => { setAddress(v); saveField('venue_address', v); }}
          placeholder="Full address"
          placeholderTextColor={MT}
          multiline numberOfLines={3}
        />
      </Field>
      <Field label="Google Maps URL">
        <TextInput
          style={s.input} value={mapUrl}
          onChangeText={v => { setMapUrl(v); saveField('map_url', v); }}
          placeholder="https://maps.google.com/..."
          placeholderTextColor={MT}
          autoCapitalize="none"
          keyboardType="url"
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
  textarea: { minHeight: 80, textAlignVertical: 'top' },
});
