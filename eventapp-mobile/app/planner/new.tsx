import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlannerStore } from '@/store/planner.store';
import { useEventStore }   from '@/store/event.store';
import { Colors }          from '@/constants/colors';

/* ── Questions (identical to web) ─────────────────────────────────────── */
const QUESTIONS = [
  {
    key:   'guestCount',
    ask:   'How many guests are you expecting at this event?',
    hint:  'e.g. 80, 150, 300+',
    parse: (v: string) => ({ guestCount: parseInt(v) || null }),
  },
  {
    key:   'totalBudget',
    ask:   'What is your estimated total budget? Please include the currency.',
    hint:  'e.g. $25,000 · €15,000 · £8,000',
    parse: (v: string) => {
      const num = parseFloat(v.replace(/[^0-9.]/g, '')) || null;
      const cur = v.match(/EUR|GBP|CAD|AUD/i)?.[0]?.toUpperCase()
        || (v.includes('€') ? 'EUR' : v.includes('£') ? 'GBP' : 'USD');
      return { totalBudget: num, currency: cur };
    },
  },
  {
    key:   'venue',
    ask:   'Do you have a venue secured, or are you still searching?',
    hint:  'Name the venue, or type "Still searching"',
    parse: (v: string) => ({ venue: v }),
  },
  {
    key:   'styleNotes',
    ask:   'How would you describe the style or atmosphere you are going for?',
    hint:  'e.g. Black-tie formal · Rustic outdoor · Modern minimalist',
    parse: (v: string) => ({ styleNotes: v }),
  },
  {
    key:   'aiNotes',
    ask:   'Any additional details you\'d like me to factor in? Type "skip" to finish.',
    hint:  'Optional — themes, special requests, constraints…',
    parse: (v: string) => ({ aiNotes: v.toLowerCase() === 'skip' ? null : v.trim() || null }),
  },
];

function fmtDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type Phase   = 'form' | 'chat' | 'creating';
type Message = { role: 'bot' | 'user'; content: string };

export default function NewPlannerScreen() {
  const router       = useRouter();
  const { eventId: preEventId } = useLocalSearchParams<{ eventId?: string }>();
  const { createProject, generateAITasks, projects, fetchProjects } = usePlannerStore();
  const { events: allEvents, fetchEvents, loading: eventsLoading } = useEventStore();

  // Only owned events — team-managed events should not get a planner here
  const events = (allEvents as any[]).filter(e => !e.user_role || e.user_role === 'OWNER');

  const [phase,       setPhase]       = useState<Phase>('form');
  const [selectedId,  setSelectedId]  = useState(preEventId || '');
  const [title,       setTitle]       = useState('');
  const [formError,   setFormError]   = useState('');
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [qIdx,        setQIdx]        = useState(0);
  const [answers,     setAnswers]     = useState<Record<string, any>>({});
  const [typing,      setTyping]      = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef  = useRef<TextInput>(null);

  useEffect(() => { fetchEvents(); fetchProjects(); }, []);

  // Redirect if planner already exists for this event
  useEffect(() => {
    if (!preEventId || !projects.length) return;
    const existing = (projects as any[]).find(p => (p.event_id ?? p.eventId) === preEventId);
    if (existing) router.replace(`/planner/${existing.id}`);
  }, [projects, preEventId]);

  // Pre-fill title when coming from event quick-link
  useEffect(() => {
    if (preEventId && events.length > 0 && !title) {
      const ev = events.find(e => e.id === preEventId);
      if (ev) setTitle(`${(ev as any).title} — Planner`);
    }
  }, [events, preEventId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [messages, typing]);

  const selectedEvent = events.find(e => e.id === selectedId) as any;

  function pushBot(content: string) { setMessages(m => [...m, { role: 'bot', content }]); }
  function pushUser(content: string) { setMessages(m => [...m, { role: 'user', content }]); }

  function startChat() {
    setFormError('');
    if (!selectedId)      { setFormError('Please select an event.'); return; }
    if (!title.trim())    { setFormError('Please enter a planner title.'); return; }

    setPhase('chat');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushBot(
        `Great — I'll be your planning assistant for "${selectedEvent?.title || 'your event'}". ` +
        `I have a few questions to build a tailored plan. Let's start.\n\n${QUESTIONS[0].ask}`
      );
      setQIdx(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }, 900);
  }

  async function handleAnswer() {
    const text = input.trim();
    if (!text) return;

    pushUser(text);
    setInput('');

    const parsed     = QUESTIONS[qIdx].parse(text);
    const newAnswers = { ...answers, ...parsed };
    setAnswers(newAnswers);
    const next = qIdx + 1;

    if (next < QUESTIONS.length) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setQIdx(next);
        pushBot(QUESTIONS[next].ask);
        inputRef.current?.focus();
      }, 700);
    } else {
      setTyping(true);
      setTimeout(async () => {
        setTyping(false);
        pushBot('Perfect — I have everything I need. Building your event plan now…');
        setPhase('creating');

        const res = await createProject({
          title:       title.trim(),
          eventId:     selectedId,
          eventType:   selectedEvent?.event_type   || null,
          eventDate:   selectedEvent?.starts_at     || null,
          guestCount:  newAnswers.guestCount        || null,
          totalBudget: newAnswers.totalBudget       || null,
          currency:    newAnswers.currency          || 'USD',
          venue:       newAnswers.venue             || null,
          styleNotes:  newAnswers.styleNotes        || null,
          aiNotes:     newAnswers.aiNotes           || null,
        });

        if (!res.success) {
          pushBot(`Sorry, something went wrong: ${(res as any).error || 'Failed to create plan'}. Please go back and try again.`);
          setPhase('chat');
          return;
        }

        await generateAITasks((res as any).data.id);
        router.replace(`/planner/${(res as any).data.id}`);
      }, 1000);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => phase === 'form' ? router.back() : setPhase('form')}
          >
            <Feather name="arrow-left" size={18} color={Colors.text.muted} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {phase === 'form' ? 'New Planner' : title || 'AI Setup'}
            </Text>
            {phase !== 'form' && selectedEvent && (
              <Text style={s.headerSub} numberOfLines={1}>{selectedEvent.title}</Text>
            )}
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Indigo gradient strip with progress dots */}
        <LinearGradient
          colors={['#4f46e5', '#7c3aed']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.strip}
        >
          <View style={s.stripLeft}>
            <Feather name="clipboard" size={12} color="rgba(255,255,255,0.65)" />
            <Text style={s.stripLabel}>AI PLANNER</Text>
          </View>
          {phase !== 'form' && (
            <View style={s.progressRow}>
              {QUESTIONS.map((_, i) => (
                <View
                  key={i}
                  style={[s.progressDot, {
                    backgroundColor:
                      i < qIdx        ? '#fff'
                      : i === qIdx    ? 'rgba(255,255,255,0.55)'
                      :                 'rgba(255,255,255,0.18)',
                  }]}
                />
              ))}
            </View>
          )}
        </LinearGradient>

        {/* ══ FORM PHASE ══════════════════════════════════════════════════ */}
        {phase === 'form' && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.sectionLabel}>Link to Event</Text>

            {eventsLoading ? (
              <View style={s.loadingRow}>
                <ActivityIndicator size="small" color={Colors.accent.indigo} />
                <Text style={s.loadingText}>Loading your events…</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={s.noEventsBanner}>
                <Feather name="alert-circle" size={14} color={Colors.accent.amber} />
                <View style={{ flex: 1 }}>
                  <Text style={s.noEventsTitle}>No events yet</Text>
                  <Text style={s.noEventsSub}>Create an event first to attach this planner.</Text>
                </View>
                <TouchableOpacity style={s.createBtn} onPress={() => router.push('/events/create' as never)}>
                  <Text style={s.createBtnText}>Create</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 10 }}
                contentContainerStyle={{ gap: 8, paddingRight: 4 }}
              >
                {events.map((ev: any) => (
                  <TouchableOpacity
                    key={ev.id}
                    style={[s.chip, selectedId === ev.id && s.chipActive]}
                    onPress={() => {
                      setSelectedId(ev.id);
                      if (!title) setTitle(`${ev.title} — Planner`);
                    }}
                  >
                    <Text style={[s.chipText, selectedId === ev.id && s.chipTextActive]} numberOfLines={1}>
                      {ev.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedEvent && (
              <View style={s.selectedRow}>
                <Feather name="check-circle" size={13} color={Colors.accent.indigo} />
                <Text style={s.selectedText} numberOfLines={1}>
                  {selectedEvent.title}{selectedEvent.starts_at ? ` · ${fmtDate(selectedEvent.starts_at)}` : ''}
                </Text>
              </View>
            )}

            <Text style={[s.sectionLabel, { marginTop: 22 }]}>Planner title *</Text>
            <TextInput
              style={s.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Summer Gala 2025 — Master Plan"
              placeholderTextColor={Colors.text.subtle}
              returnKeyType="done"
              onSubmitEditing={startChat}
            />

            {!!formError && (
              <View style={s.errorRow}>
                <Feather name="alert-circle" size={12} color="#f87171" />
                <Text style={s.errorText}>{formError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.continueBtn, (!selectedId || !title.trim()) && s.dimmed]}
              onPress={startChat}
              disabled={!selectedId || !title.trim()}
            >
              <LinearGradient
                colors={['#4f46e5', '#7c3aed']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Feather name="zap" size={16} color="#fff" />
              <Text style={s.continueBtnText}>Continue with AI Setup</Text>
            </TouchableOpacity>

            <View style={{ height: 60 }} />
          </ScrollView>
        )}

        {/* ══ CHAT / CREATING PHASE ══════════════════════════════════════ */}
        {(phase === 'chat' || phase === 'creating') && (
          <>
            <ScrollView
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={s.messageList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m, i) => (
                <View key={i} style={[s.msgRow, m.role === 'user' ? s.msgRowUser : s.msgRowBot]}>
                  {m.role === 'bot' && (
                    <View style={s.botAvatar}>
                      <Feather name="cpu" size={12} color={Colors.accent.indigo} />
                    </View>
                  )}
                  <View style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleBot]}>
                    <Text style={[s.bubbleText, m.role === 'user' ? s.bubbleTextUser : s.bubbleTextBot]}>
                      {m.content}
                    </Text>
                  </View>
                  {m.role === 'user' && (
                    <View style={s.userAvatar}>
                      <Feather name="user" size={12} color="rgba(255,255,255,0.6)" />
                    </View>
                  )}
                </View>
              ))}

              {/* Typing indicator */}
              {typing && (
                <View style={[s.msgRow, s.msgRowBot]}>
                  <View style={s.botAvatar}>
                    <Feather name="cpu" size={12} color={Colors.accent.indigo} />
                  </View>
                  <View style={[s.bubble, s.bubbleBot]}>
                    <View style={s.typingDots}>
                      <View style={s.typingDot} />
                      <View style={[s.typingDot, { opacity: 0.55 }]} />
                      <View style={[s.typingDot, { opacity: 0.25 }]} />
                    </View>
                  </View>
                </View>
              )}

              {/* Creating spinner */}
              {phase === 'creating' && !typing && (
                <View style={s.creatingRow}>
                  <ActivityIndicator size="small" color={Colors.accent.indigo} />
                  <Text style={s.creatingText}>Generating your personalised plan…</Text>
                </View>
              )}

              <View style={{ height: 8 }} />
            </ScrollView>

            {/* Hint text */}
            {phase === 'chat' && qIdx < QUESTIONS.length && (
              <Text style={s.hint}>{QUESTIONS[qIdx].hint}</Text>
            )}

            {/* Input row */}
            {phase === 'chat' && (
              <View style={s.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={s.chatInput}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type your answer…"
                  placeholderTextColor={Colors.text.subtle}
                  editable={!typing}
                  returnKeyType="send"
                  onSubmitEditing={handleAnswer}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[s.sendBtn, (typing || !input.trim()) && s.dimmed]}
                  onPress={handleAnswer}
                  disabled={typing || !input.trim()}
                >
                  <Feather name="send" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle:  { fontSize: 15, fontWeight: '800', color: Colors.text.primary },
  headerSub:    { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  /* Gradient strip */
  strip:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  stripLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripLabel:  { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2 },
  progressRow: { flex: 1, flexDirection: 'row', gap: 4 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },

  /* Form */
  formScroll:   { padding: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Colors.text.subtle, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  loadingRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: 12 },
  loadingText:  { fontSize: 13, color: Colors.text.subtle },
  noEventsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)', borderRadius: 14,
    padding: 14, marginBottom: 14,
  },
  noEventsTitle: { fontSize: 13, fontWeight: '700', color: Colors.text.primary },
  noEventsSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 2 },
  createBtn:     { backgroundColor: Colors.accent.indigo, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  createBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    backgroundColor: 'rgba(255,255,255,0.04)', maxWidth: 200,
  },
  chipActive:     { backgroundColor: `${Colors.accent.indigo}20`, borderColor: Colors.accent.indigo },
  chipText:       { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
  chipTextActive: { color: Colors.accent.indigo },
  selectedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    padding: 10, borderRadius: 10, marginBottom: 14,
    backgroundColor: `${Colors.accent.indigo}12`,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}25`,
  },
  selectedText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.accent.indigo },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1,
    borderColor: Colors.border.DEFAULT, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: Colors.text.primary, marginBottom: 14,
  },
  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  errorText: { fontSize: 12, color: '#f87171' },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, overflow: 'hidden', paddingVertical: 15, marginTop: 4,
  },
  continueBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  dimmed: { opacity: 0.45 },

  /* Chat */
  messageList: { padding: 14, gap: 14 },
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowBot:  { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 28, height: 28, borderRadius: 14, flexShrink: 0,
    backgroundColor: `${Colors.accent.indigo}18`,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}30`,
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatar: {
    width: 28, height: 28, borderRadius: 14, flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble:        { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot:     { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.border.subtle, borderBottomLeftRadius: 4 },
  bubbleUser:    { backgroundColor: Colors.accent.indigo, borderBottomRightRadius: 4 },
  bubbleText:    { fontSize: 14, lineHeight: 21 },
  bubbleTextBot: { color: 'rgba(255,255,255,0.85)' },
  bubbleTextUser:{ color: '#fff' },
  typingDots:    { flexDirection: 'row', gap: 5, paddingVertical: 3 },
  typingDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent.indigo },
  creatingRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  creatingText:  { fontSize: 13, fontWeight: '600', color: Colors.accent.indigo },
  hint:          { paddingHorizontal: 20, paddingBottom: 5, fontSize: 11, color: Colors.text.subtle, fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border.subtle,
    backgroundColor: Colors.bg.primary,
  },
  chatInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: Colors.text.primary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center', justifyContent: 'center',
  },
});
