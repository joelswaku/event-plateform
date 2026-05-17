import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  TextInput, Switch, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useEventStore } from '@/store/event.store';
import { Colors } from '@/constants/colors';

function toLocalIso(utcStr: string | null | undefined): string {
  if (!utcStr) return '';
  try { return new Date(utcStr).toISOString().slice(0, 16); }
  catch { return ''; }
}

export default function EditEventScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  const { dashboard, currentEvent, fetchEventDashboard, fetchEventById, updateEvent } = useEventStore();

  const [form,    setFormState] = useState<Record<string, any>>({});
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [saveErr, setSaveErr]   = useState<string | null>(null);

  const ready       = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Load */
  useEffect(() => {
    if (id) { fetchEventDashboard(id); fetchEventById(id); }
  }, [id]);

  /* Init form once */
  useEffect(() => {
    const e = dashboard?.event ?? currentEvent;
    if (!e || ready.current) return;
    setFormState({
      title:             e.title             ?? '',
      description:       e.description       ?? '',
      short_description: e.short_description ?? '',
      event_type:        e.event_type        ?? '',
      venue_name:        e.venue_name        ?? '',
      venue_address:     e.venue_address     ?? '',
      city:              e.city              ?? '',
      state:             e.state             ?? '',
      country:           e.country           ?? '',
      starts_at:         toLocalIso(e.starts_at_utc),
      ends_at:           toLocalIso(e.ends_at_utc),
      timezone:          e.timezone          ?? '',
      visibility:        e.visibility        ?? 'PRIVATE',
      allow_rsvp:        e.allow_rsvp        ?? false,
      allow_plus_ones:   e.allow_plus_ones   ?? false,
      allow_qr_checkin:  e.allow_qr_checkin  ?? false,
      allow_ticketing:   e.allow_ticketing   ?? false,
      allow_donations:   e.allow_donations   ?? false,
    });
    ready.current = true;
  }, [dashboard, currentEvent]);

  /* Auto-save (debounced 800 ms) */
  useEffect(() => {
    if (!ready.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true); setSaved(false); setSaveErr(null);
      const res = await updateEvent(id, {
        title:             form.title,
        description:       form.description,
        short_description: form.short_description,
        event_type:        form.event_type,
        venue_name:        form.venue_name,
        venue_address:     form.venue_address,
        city:              form.city,
        state:             form.state,
        country:           form.country,
        starts_at:         form.starts_at  || undefined,
        ends_at:           form.ends_at    || undefined,
        timezone:          form.timezone,
        visibility:        form.visibility,
        allow_rsvp:        form.allow_rsvp,
        allow_plus_ones:   form.allow_plus_ones,
        allow_qr_checkin:  form.allow_qr_checkin,
        allow_ticketing:   form.allow_ticketing,
        allow_donations:   form.allow_donations,
      });
      setSaving(false);
      if (res?.success === false) { setSaveErr('Failed'); }
      else { setSaved(true); }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form]);

  const change = (field: string, value: any) =>
    setFormState(prev => ({ ...prev, [field]: value }));

  if (!ready.current) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.accent.indigo} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.root, { paddingTop: insets.top }]}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
            <Feather name="arrow-left" size={17} color="#fff" />
          </Pressable>
          <Text style={s.headerTitle}>Edit Event</Text>
          <View style={s.saveSlot}>
            {saving && <ActivityIndicator size="small" color={Colors.accent.indigo} />}
            {saved && !saving && (
              <View style={s.savedRow}>
                <Feather name="check" size={11} color={Colors.accent.emerald} />
                <Text style={[s.saveText, { color: Colors.accent.emerald }]}>Saved</Text>
              </View>
            )}
            {saveErr && !saving && (
              <Text style={[s.saveText, { color: Colors.accent.red }]}>Failed</Text>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 48, gap: 8, paddingTop: 8 }}
        >
          {/* ── Basic Info ───────────────────────────────────── */}
          <Section title="Basic Info">
            <Field label="Title">
              <TextInput
                style={s.input}
                value={form.title}
                onChangeText={v => change('title', v)}
                placeholder="Event title"
                placeholderTextColor={Colors.text.subtle}
                returnKeyType="next"
              />
            </Field>
            <Field label="Short Description">
              <TextInput
                style={s.input}
                value={form.short_description}
                onChangeText={v => change('short_description', v)}
                placeholder="One-liner shown on listings"
                placeholderTextColor={Colors.text.subtle}
                returnKeyType="next"
              />
            </Field>
            <Field label="Description">
              <TextInput
                style={[s.input, s.inputMulti]}
                value={form.description}
                onChangeText={v => change('description', v)}
                placeholder="Full event description"
                placeholderTextColor={Colors.text.subtle}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Field>
            <Field label="Event Type">
              <TextInput
                style={s.input}
                value={form.event_type}
                onChangeText={v => change('event_type', v)}
                placeholder="e.g. wedding, concert, conference"
                placeholderTextColor={Colors.text.subtle}
                autoCapitalize="none"
                returnKeyType="next"
              />
            </Field>
          </Section>

          {/* ── Location ─────────────────────────────────────── */}
          <Section title="Location">
            <Field label="Venue Name">
              <TextInput
                style={s.input}
                value={form.venue_name}
                onChangeText={v => change('venue_name', v)}
                placeholder="Venue or place name"
                placeholderTextColor={Colors.text.subtle}
                returnKeyType="next"
              />
            </Field>
            <Field label="Address">
              <TextInput
                style={s.input}
                value={form.venue_address}
                onChangeText={v => change('venue_address', v)}
                placeholder="Street address"
                placeholderTextColor={Colors.text.subtle}
                returnKeyType="next"
              />
            </Field>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field label="City">
                  <TextInput
                    style={s.input}
                    value={form.city}
                    onChangeText={v => change('city', v)}
                    placeholder="City"
                    placeholderTextColor={Colors.text.subtle}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="State / Region">
                  <TextInput
                    style={s.input}
                    value={form.state}
                    onChangeText={v => change('state', v)}
                    placeholder="State"
                    placeholderTextColor={Colors.text.subtle}
                  />
                </Field>
              </View>
            </View>
            <Field label="Country">
              <TextInput
                style={s.input}
                value={form.country}
                onChangeText={v => change('country', v)}
                placeholder="Country"
                placeholderTextColor={Colors.text.subtle}
                returnKeyType="next"
              />
            </Field>
          </Section>

          {/* ── Date & Time ──────────────────────────────────── */}
          <Section title="Date & Time">
            <Field label="Start  (YYYY-MM-DD HH:MM)">
              <TextInput
                style={s.input}
                value={form.starts_at}
                onChangeText={v => change('starts_at', v)}
                placeholder="2025-09-01T18:00"
                placeholderTextColor={Colors.text.subtle}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                returnKeyType="next"
              />
            </Field>
            <Field label="End  (YYYY-MM-DD HH:MM)">
              <TextInput
                style={s.input}
                value={form.ends_at}
                onChangeText={v => change('ends_at', v)}
                placeholder="2025-09-01T23:00"
                placeholderTextColor={Colors.text.subtle}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                returnKeyType="next"
              />
            </Field>
            <Field label="Timezone">
              <TextInput
                style={s.input}
                value={form.timezone}
                onChangeText={v => change('timezone', v)}
                placeholder="America/New_York"
                placeholderTextColor={Colors.text.subtle}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>
          </Section>

          {/* ── Settings ─────────────────────────────────────── */}
          <Section title="Settings">
            <ToggleRow
              label="Public Event"
              sub="Visible to everyone"
              value={form.visibility === 'PUBLIC'}
              onChange={v => change('visibility', v ? 'PUBLIC' : 'PRIVATE')}
              color={Colors.accent.indigo}
            />
            <Divider />
            <ToggleRow
              label="Allow RSVP"
              sub="Guests can RSVP to this event"
              value={form.allow_rsvp}
              onChange={v => change('allow_rsvp', v)}
              color={Colors.accent.emerald}
            />
            <Divider />
            <ToggleRow
              label="Allow Plus Ones"
              sub="Guests can bring a companion"
              value={form.allow_plus_ones}
              onChange={v => change('allow_plus_ones', v)}
              color={Colors.accent.emerald}
            />
            <Divider />
            <ToggleRow
              label="QR Check-in"
              sub="Scan QR codes at the door"
              value={form.allow_qr_checkin}
              onChange={v => change('allow_qr_checkin', v)}
              color={Colors.accent.cyan}
            />
            <Divider />
            <ToggleRow
              label="Ticketing"
              sub="Sell free or paid tickets"
              value={form.allow_ticketing}
              onChange={v => change('allow_ticketing', v)}
              color={Colors.accent.amber}
            />
            <Divider />
            <ToggleRow
              label="Donations"
              sub="Accept optional contributions"
              value={form.allow_donations}
              onChange={v => change('allow_donations', v)}
              color="#f43f5e"
            />
          </Section>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{title.toUpperCase()}</Text>
      <View style={s.card}>{children}</View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, sub, value, onChange, color }: {
  label: string; sub: string; value: boolean;
  onChange: (v: boolean) => void; color: string;
}) {
  return (
    <View style={s.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.toggleLabel}>{label}</Text>
        <Text style={s.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: color }}
        thumbColor="#fff"
        ios_backgroundColor="rgba(255,255,255,0.1)"
      />
    </View>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

/* ── Styles ──────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  saveSlot:    { width: 56, alignItems: 'flex-end' },
  savedRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveText:    { fontSize: 11, fontWeight: '700' },

  section:      { paddingHorizontal: 16, gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: Colors.text.subtle },
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 16, gap: 14,
  },

  field:      { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.muted },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11,
    fontSize: 14, fontWeight: '500', color: '#fff',
  },
  inputMulti: { minHeight: 88, paddingTop: 11 },

  row: { flexDirection: 'row', gap: 10 },

  toggleRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleLabel:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  toggleSub:  { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  divider: { height: 1, backgroundColor: Colors.border.subtle },
});
