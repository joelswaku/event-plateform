import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection } from '@/types';

const BG   = '#1a1b1f';
const CARD = '#1e2026';
const MT   = '#555a66';
const TX   = 'rgba(255,255,255,0.85)';
const BD   = 'rgba(255,255,255,0.1)';
const ACC  = '#6c6fee';

interface FaqItem { question: string; answer: string }

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

export default function FAQConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef  = useRef<Record<string, unknown>>(section.config ?? {});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [faqs, setFaqs] = useState<FaqItem[]>(
    ((cfgRef.current.items ?? cfgRef.current.faqs) as FaqItem[]) ?? []
  );

  useEffect(() => {
    const c = section.config ?? {};
    cfgRef.current = c;
    setFaqs(((c.items ?? c.faqs) as FaqItem[]) ?? []);
  }, [section.id]);

  const save = (items: FaqItem[]) => {
    cfgRef.current = { ...cfgRef.current, items };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { config: cfgRef.current });
    }, 400);
  };

  const addFaq = () => {
    const next = [...faqs, { question: '', answer: '' }];
    setFaqs(next);
    save(next);
  };

  const updateFaq = (idx: number, key: keyof FaqItem, value: string) => {
    const next = faqs.map((f, i) => i === idx ? { ...f, [key]: value } : f);
    setFaqs(next);
    save(next);
  };

  const removeFaq = (idx: number) => {
    const next = faqs.filter((_, i) => i !== idx);
    setFaqs(next);
    save(next);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.sectionLabel}>FAQ ITEMS ({faqs.length})</Text>
      {faqs.map((faq, idx) => (
        <View key={idx} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardNum}>#{idx + 1}</Text>
            <Pressable onPress={() => removeFaq(idx)} hitSlop={8}>
              <Feather name="trash-2" size={14} color="rgba(248,113,113,0.7)" />
            </Pressable>
          </View>
          <TextInput
            style={s.input}
            value={faq.question}
            onChangeText={v => updateFaq(idx, 'question', v)}
            placeholder="Question"
            placeholderTextColor={MT}
          />
          <TextInput
            style={[s.input, s.textarea]}
            value={faq.answer}
            onChangeText={v => updateFaq(idx, 'answer', v)}
            placeholder="Answer"
            placeholderTextColor={MT}
            multiline numberOfLines={3}
          />
        </View>
      ))}
      <Pressable style={s.addBtn} onPress={addFaq}>
        <Feather name="plus" size={14} color={ACC} />
        <Text style={s.addText}>Add FAQ Item</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: MT, letterSpacing: 1.2 },
  card: {
    padding: 12, borderRadius: 12, backgroundColor: CARD,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNum:    { fontSize: 11, fontWeight: '700', color: MT },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: TX,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 42, borderRadius: 10, borderWidth: 1,
    borderColor: `rgba(108,111,238,0.3)`, borderStyle: 'dashed',
    backgroundColor: `rgba(108,111,238,0.06)`,
  },
  addText: { fontSize: 13, fontWeight: '600', color: ACC },
});
