import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection } from '@/types';

const BG = '#1a1b1f';
const MT = '#555a66';
const TX = 'rgba(255,255,255,0.85)';
const BD = 'rgba(255,255,255,0.1)';

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

export default function VenueConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection       = useBuilderStore(s => s.updateSection);
  const updateEventDetails  = useBuilderStore(s => s.updateEventDetails);
  const builderEvent        = useBuilderStore(s => (s.builder as any)?.event ?? null);

  const cfgRef  = useRef<Record<string, unknown>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Merge config with event data fallbacks
  const mergeConfig = (cfg: Record<string, unknown>) => ({
    venue_name:    (cfg.venue_name    ?? builderEvent?.venue_name    ?? '') as string,
    venue_address: (cfg.venue_address ?? builderEvent?.venue_address ?? '') as string,
    city:          (cfg.city          ?? builderEvent?.city          ?? '') as string,
    state:         (cfg.state         ?? builderEvent?.state         ?? '') as string,
    zip_code:      (cfg.zip_code      ?? builderEvent?.zip_code      ?? '') as string,
    country:       (cfg.country       ?? builderEvent?.country       ?? '') as string,
    directions:    (cfg.directions    ?? '') as string,
    map_url:       (cfg.map_url       ?? '') as string,
    ...cfg,
  });

  const [name,       setName]       = useState('');
  const [address,    setAddress]    = useState('');
  const [city,       setCity]       = useState('');
  const [state,      setState]      = useState('');
  const [zipCode,    setZipCode]    = useState('');
  const [country,    setCountry]    = useState('');
  const [directions, setDirections] = useState('');
  const [mapUrl,     setMapUrl]     = useState('');

  useEffect(() => {
    const merged = mergeConfig(section.config ?? {});
    cfgRef.current = { ...(section.config ?? {}), ...merged };
    setName(merged.venue_name);
    setAddress(merged.venue_address);
    setCity(merged.city);
    setState(merged.state);
    setZipCode(merged.zip_code);
    setCountry(merged.country);
    setDirections(merged.directions);
    setMapUrl(merged.map_url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id]);

  const EVENT_KEYS = ['venue_name', 'venue_address', 'city', 'state', 'zip_code', 'country'];

  const saveField = (key: string, value: unknown) => {
    cfgRef.current = { ...cfgRef.current, [key]: value };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { config: cfgRef.current });
      if (EVENT_KEYS.includes(key)) {
        updateEventDetails(eventId, { [key]: value });
      }
    }, 400);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
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

      <Field label="Street Address">
        <TextInput
          style={[s.input, s.textarea]} value={address}
          onChangeText={v => { setAddress(v); saveField('venue_address', v); }}
          placeholder="123 Main St"
          placeholderTextColor={MT}
          multiline numberOfLines={2}
        />
      </Field>

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Field label="City">
            <TextInput
              style={s.input} value={city}
              onChangeText={v => { setCity(v); saveField('city', v); }}
              placeholder="New York"
              placeholderTextColor={MT}
            />
          </Field>
        </View>
        <View style={{ width: 100 }}>
          <Field label="State / Region">
            <TextInput
              style={s.input} value={state}
              onChangeText={v => { setState(v); saveField('state', v); }}
              placeholder="NY"
              placeholderTextColor={MT}
            />
          </Field>
        </View>
      </View>

      <View style={s.row}>
        <View style={{ width: 110 }}>
          <Field label="Zip / Postal">
            <TextInput
              style={s.input} value={zipCode}
              onChangeText={v => { setZipCode(v); saveField('zip_code', v); }}
              placeholder="10001"
              placeholderTextColor={MT}
              keyboardType="numbers-and-punctuation"
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Country">
            <TextInput
              style={s.input} value={country}
              onChangeText={v => { setCountry(v); saveField('country', v); }}
              placeholder="United States"
              placeholderTextColor={MT}
            />
          </Field>
        </View>
      </View>

      <Field label="Directions Note">
        <TextInput
          style={[s.input, s.textarea]} value={directions}
          onChangeText={v => { setDirections(v); saveField('directions', v); }}
          placeholder="e.g. Enter through the main lobby…"
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
  scroll:   { padding: 16, gap: 14 },
  row:      { flexDirection: 'row', gap: 10 },
  field:    { gap: 6 },
  label:    { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: TX,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
});
