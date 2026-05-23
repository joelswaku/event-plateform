import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection } from '@/types';

const BG   = '#1a1b1f';
const CARD = '#1e2026';
const MT   = '#555a66';
const TX   = 'rgba(255,255,255,0.85)';
const BD   = 'rgba(255,255,255,0.1)';
const ACC  = '#6c6fee';

const DISPLAY_STYLES = [
  { value: 'blocks',  label: 'Blocks',  sub: 'Grid of tiles with big numbers' },
  { value: 'flip',    label: 'Flip',    sub: 'Flip-clock style with divider' },
  { value: 'minimal', label: 'Minimal', sub: 'Compact colon-separated numbers' },
  { value: 'text',    label: 'Text',    sub: 'Inline sentence (45 days · 12 hrs)' },
];

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

export default function CountdownConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);

  const sectionIdRef = useRef(section.id);
  const cfgRef       = useRef<Record<string, unknown>>({ ...(section.config ?? {}) });
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [displayStyle, setDisplayStyle] = useState<string>(
    String((section.config ?? {}).display_style ?? 'blocks')
  );
  const [title, setTitle] = useState<string>(section.title ?? '');
  const [body,  setBody]  = useState<string>(section.body  ?? '');

  useEffect(() => {
    sectionIdRef.current = section.id;
    cfgRef.current = { ...(section.config ?? {}) };
    setDisplayStyle(String(cfgRef.current.display_style ?? 'blocks'));
    setTitle(section.title ?? '');
    setBody(section.body   ?? '');
  }, [section.id, section.config, section.title, section.body]);

  const pick = useCallback((value: string) => {
    setDisplayStyle(value);
    const next = { ...cfgRef.current, display_style: value };
    cfgRef.current = next;
    updateSection(eventId, sectionIdRef.current, { config: next });
  }, [eventId, updateSection]);

  const saveTextField = useCallback((field: 'title' | 'body', value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, sectionIdRef.current, { [field]: value });
    }, 400);
  }, [eventId, updateSection]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.infoBox}>
        <Text style={s.infoText}>{"Countdown uses your event's start date automatically."}</Text>
      </View>

      <Text style={s.sectionLabel}>CONTENT</Text>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Title</Text>
        <TextInput
          style={s.input}
          value={title}
          onChangeText={v => { setTitle(v); saveTextField('title', v); }}
          placeholder="The Big Day"
          placeholderTextColor={MT}
        />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>Subtitle</Text>
        <TextInput
          style={[s.input, s.inputMulti]}
          value={body}
          onChangeText={v => { setBody(v); saveTextField('body', v); }}
          placeholder="We can't wait to celebrate with you."
          placeholderTextColor={MT}
          multiline
          numberOfLines={2}
        />
      </View>

      <Text style={[s.sectionLabel, { marginTop: 8 }]}>DISPLAY STYLE</Text>
      {DISPLAY_STYLES.map(opt => {
        const active = displayStyle === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[s.optionCard, active && s.optionActive]}
            onPress={() => pick(opt.value)}
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
  infoBox: {
    padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: BD,
  },
  infoText:     { fontSize: 12, color: MT, lineHeight: 18 },
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
  inputMulti:   { minHeight: 60, textAlignVertical: 'top' },
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
