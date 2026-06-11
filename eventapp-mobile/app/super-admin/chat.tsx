import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/lib/api';
import { Colors } from '@/constants/colors';
import { showSuccess, showError } from '@/lib/toast';
import { useSuperAdminStore } from '@/store/superAdmin.store';

const GOLD = '#C9A96E';
const BG   = '#07070f';
const CARD = '#0d0d1a';

type Audience = 'all' | 'event';

interface BroadcastResult { reached: number; total: number; }

export default function SuperAdminChatScreen() {
  const router = useRouter();
  const events      = useSuperAdminStore(s => s.events);
  const fetchEvents = useSuperAdminStore(s => s.fetchEvents);

  const [body,      setBody]      = useState('');
  const [audience,  setAudience]  = useState<Audience>('all');
  const [eventId,   setEventId]   = useState<string | null>(null);
  const [sending,   setSending]   = useState(false);
  const [eventQuery, setEventQuery] = useState('');

  useFocusEffect(useCallback(() => {
    if (events.length === 0) fetchEvents({ status: 'PUBLISHED' });
  }, [events.length, fetchEvents]));

  const filteredEvents = events.filter(e =>
    !eventQuery || e.title.toLowerCase().includes(eventQuery.toLowerCase())
  );

  async function handleSend() {
    const text = body.trim();
    if (!text) { showError('Message is required.'); return; }
    if (audience === 'event' && !eventId) { showError('Select an event to target.'); return; }

    setSending(true);
    try {
      const payload: { body: string; audience: Audience; event_id?: string } = { body: text, audience };
      if (audience === 'event' && eventId) payload.event_id = eventId;

      const res = await api.post<{ success: boolean; data: BroadcastResult }>('/chat/broadcast', payload);
      const d = res.data?.data;
      showSuccess(
        'Broadcast sent',
        d ? `Reached ${d.reached} of ${d.total} recipient${d.total !== 1 ? 's' : ''}.` : undefined
      );
      setBody('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showError(msg ?? 'Could not send broadcast.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Open support inbox */}
          <Pressable style={s.openConvBtn} onPress={() => router.push('/chat' as never)}>
            <View style={s.openConvIcon}>
              <Feather name="life-buoy" size={16} color={Colors.accent.indigo} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.openConvTitle}>Support Inbox</Text>
              <Text style={s.openConvSub}>Read and reply to user questions</Text>
            </View>
            <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.35)" />
          </Pressable>

          {/* Broadcast composer */}
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardHeaderIcon}>
                <Feather name="radio" size={15} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>Broadcast Message</Text>
                <Text style={s.cardSub}>Send a message to many users at once</Text>
              </View>
            </View>

            {/* Audience */}
            <Text style={s.label}>Audience</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([['all', 'All Users', 'globe'], ['event', 'Specific Event', 'calendar']] as const).map(([key, lbl, ic]) => {
                const active = audience === key;
                return (
                  <Pressable key={key} onPress={() => setAudience(key)}
                    style={[s.modeBtn, active && s.modeBtnActive]}>
                    <Feather name={ic} size={13} color={active ? GOLD : 'rgba(255,255,255,0.35)'} />
                    <Text style={[s.modeBtnText, active && { color: GOLD }]}>{lbl}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Event picker */}
            {audience === 'event' && (
              <View style={{ marginTop: 12, gap: 8 }}>
                <View style={s.searchWrap}>
                  <Feather name="search" size={14} color="rgba(255,255,255,0.3)" />
                  <TextInput
                    style={s.searchInput}
                    value={eventQuery}
                    onChangeText={setEventQuery}
                    placeholder="Search events…"
                    placeholderTextColor="rgba(255,255,255,0.22)"
                    autoCapitalize="none"
                  />
                </View>
                <View style={s.eventList}>
                  {filteredEvents.length === 0 ? (
                    <Text style={s.eventEmpty}>No events found.</Text>
                  ) : filteredEvents.slice(0, 20).map(ev => {
                    const active = eventId === ev.id;
                    return (
                      <Pressable key={ev.id} onPress={() => setEventId(ev.id)}
                        style={[s.eventRow, active && s.eventRowActive]}>
                        <Feather
                          name={active ? 'check-circle' : 'circle'}
                          size={15}
                          color={active ? GOLD : 'rgba(255,255,255,0.25)'}
                        />
                        <Text style={[s.eventTitle, active && { color: '#fff' }]} numberOfLines={1}>{ev.title}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Message body */}
            <Text style={[s.label, { marginTop: 14 }]}>Message *</Text>
            <TextInput
              style={[s.inp, { height: 110, textAlignVertical: 'top' }]}
              value={body}
              onChangeText={setBody}
              placeholder="Type your announcement…"
              placeholderTextColor="rgba(255,255,255,0.22)"
              multiline
              maxLength={1000}
            />
            <Text style={s.charCount}>{body.length}/1000</Text>

            {/* Send */}
            <Pressable
              style={[s.sendBtn, (sending || !body.trim()) && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={sending || !body.trim()}
            >
              {sending
                ? <ActivityIndicator size="small" color="#000" />
                : <><Feather name="send" size={15} color="#000" /><Text style={s.sendTxt}>Send Broadcast</Text></>}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  content: { padding: 14, gap: 14, paddingBottom: 40 },

  openConvBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', padding: 14,
  },
  openConvIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${Colors.accent.indigo}18`, borderWidth: 1, borderColor: `${Colors.accent.indigo}30`,
  },
  openConvTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  openConvSub:   { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 },

  card: {
    backgroundColor: CARD, borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.18)', padding: 16, gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardHeaderIcon: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(201,169,110,0.14)',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cardSub:   { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 },

  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modeBtnActive: { backgroundColor: 'rgba(201,169,110,0.14)', borderColor: 'rgba(201,169,110,0.38)' },
  modeBtnText:   { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 11, paddingHorizontal: 12, height: 42,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13 },
  eventList:   { gap: 2 },
  eventEmpty:  { fontSize: 12, color: 'rgba(255,255,255,0.3)', padding: 10 },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10,
  },
  eventRowActive: { backgroundColor: 'rgba(201,169,110,0.10)' },
  eventTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },

  inp: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#fff',
  },
  charCount: { fontSize: 10, color: 'rgba(255,255,255,0.22)', textAlign: 'right', marginTop: 3 },

  sendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, borderRadius: 14, backgroundColor: GOLD, marginTop: 12,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  sendTxt: { fontSize: 15, fontWeight: '900', color: '#000' },
});
