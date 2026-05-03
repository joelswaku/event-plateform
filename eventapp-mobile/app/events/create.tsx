import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useEventStore }    from '@/store/event.store';
import { Input }            from '@/components/ui/Input';
import { Button }           from '@/components/ui/Button';
import { DateTimePicker }   from '@/components/ui/DateTimePicker';
import { Colors }           from '@/constants/colors';

const { width: SW } = Dimensions.get('window');

/* ─── Full category tree (mirrors web) ────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'social', label: 'Social Events', icon: '🎉', color: '#8b5cf6',
    subcategories: [
      { id: 'WEDDING',       label: 'Wedding',         icon: '💍', eventType: 'WEDDING'         },
      { id: 'ENGAGEMENT',    label: 'Engagement',      icon: '💒', eventType: 'WEDDING'         },
      { id: 'BIRTHDAY',      label: 'Birthday',        icon: '🎂', eventType: 'BIRTHDAY'        },
      { id: 'ANNIVERSARY',   label: 'Anniversary',     icon: '🥂', eventType: 'BIRTHDAY'        },
      { id: 'BABY_SHOWER',   label: 'Baby Shower',     icon: '🍼', eventType: 'BIRTHDAY'        },
      { id: 'GENDER_REVEAL', label: 'Gender Reveal',   icon: '🎀', eventType: 'BIRTHDAY'        },
      { id: 'GRADUATION',    label: 'Graduation',      icon: '🎓', eventType: 'OTHER'           },
      { id: 'FUNERAL',       label: 'Funeral',         icon: '🕊️', eventType: 'FUNERAL'        },
      { id: 'PRIVATE_PARTY', label: 'Private Party',   icon: '🎈', eventType: 'BIRTHDAY'        },
      { id: 'FAMILY_REUNION',label: 'Family Reunion',  icon: '👨‍👩‍👧‍👦', eventType: 'OTHER' },
    ],
  },
  {
    id: 'corporate', label: 'Corporate & Professional', icon: '💼', color: '#0ea5e9',
    subcategories: [
      { id: 'MEETING',        label: 'Meeting',          icon: '📋', eventType: 'MEETING'         },
      { id: 'CONFERENCE',     label: 'Conference',       icon: '🎤', eventType: 'CORPORATE_EVENT' },
      { id: 'SEMINAR',        label: 'Seminar',          icon: '📚', eventType: 'CORPORATE_EVENT' },
      { id: 'WORKSHOP',       label: 'Workshop',         icon: '🛠️', eventType: 'MEETING'        },
      { id: 'NETWORKING',     label: 'Networking',       icon: '🤝', eventType: 'CORPORATE_EVENT' },
      { id: 'PRODUCT_LAUNCH', label: 'Product Launch',   icon: '🚀', eventType: 'CORPORATE_EVENT' },
      { id: 'COMPANY_PARTY',  label: 'Company Party',    icon: '🥳', eventType: 'CORPORATE_EVENT' },
      { id: 'TRAINING',       label: 'Training',         icon: '📝', eventType: 'MEETING'         },
    ],
  },
  {
    id: 'entertainment', label: 'Ticketed & Entertainment', icon: '🎟️', color: '#f59e0b',
    subcategories: [
      { id: 'CONCERT',    label: 'Concert',         icon: '🎵', eventType: 'CONCERT' },
      { id: 'FESTIVAL',   label: 'Festival',        icon: '🎪', eventType: 'CONCERT' },
      { id: 'LIVE_SHOW',  label: 'Live Show',       icon: '🎭', eventType: 'CONCERT' },
      { id: 'NIGHTCLUB',  label: 'Nightclub Event', icon: '🌙', eventType: 'CONCERT' },
      { id: 'THEATER',    label: 'Theater',         icon: '🎬', eventType: 'CONCERT' },
      { id: 'COMEDY',     label: 'Comedy Show',     icon: '😂', eventType: 'CONCERT' },
      { id: 'SPORTS',     label: 'Sports Event',    icon: '🏟️', eventType: 'CONCERT' },
      { id: 'EXHIBITION', label: 'Exhibition',      icon: '🖼️', eventType: 'CORPORATE_EVENT' },
    ],
  },
  {
    id: 'religious', label: 'Religious & Cultural', icon: '🕌', color: '#10b981',
    subcategories: [
      { id: 'CHURCH_SERVICE', label: 'Church Service',       icon: '⛪', eventType: 'CHURCH' },
      { id: 'RAMADAN',        label: 'Ramadan / Iftar',      icon: '🌙', eventType: 'CHURCH' },
      { id: 'EID',            label: 'Eid Celebration',      icon: '🌟', eventType: 'CHURCH' },
      { id: 'CHRISTMAS',      label: 'Christmas Event',      icon: '🎄', eventType: 'CHURCH' },
      { id: 'CULTURAL_FEST',  label: 'Cultural Festival',    icon: '🎎', eventType: 'OTHER'  },
      { id: 'CEREMONY',       label: 'Traditional Ceremony', icon: '🎋', eventType: 'OTHER'  },
    ],
  },
  {
    id: 'education', label: 'Education & Community', icon: '📖', color: '#6366f1',
    subcategories: [
      { id: 'SCHOOL_EVENT', label: 'School Event',        icon: '🏫', eventType: 'OTHER'   },
      { id: 'WEBINAR',      label: 'Webinar',             icon: '💻', eventType: 'MEETING' },
      { id: 'CLASS',        label: 'Class',               icon: '🧑‍🏫', eventType: 'MEETING' },
      { id: 'BOOTCAMP',     label: 'Bootcamp',            icon: '⚡', eventType: 'MEETING'  },
      { id: 'COMMUNITY',    label: 'Community Gathering', icon: '🏘️', eventType: 'OTHER'  },
      { id: 'CHARITY',      label: 'Charity Event',       icon: '❤️', eventType: 'OTHER'  },
      { id: 'FUNDRAISER',   label: 'Fundraiser',          icon: '💰', eventType: 'OTHER'   },
    ],
  },
  {
    id: 'lifestyle', label: 'Lifestyle & Special Interest', icon: '✨', color: '#ec4899',
    subcategories: [
      { id: 'FITNESS',      label: 'Fitness Class', icon: '🏋️', eventType: 'OTHER'   },
      { id: 'RETREAT',      label: 'Retreat',       icon: '🧘', eventType: 'OTHER'   },
      { id: 'TRAVEL',       label: 'Travel Event',  icon: '✈️', eventType: 'OTHER'  },
      { id: 'FOOD_TASTING', label: 'Food Tasting',  icon: '🍷', eventType: 'OTHER'   },
      { id: 'FASHION_SHOW', label: 'Fashion Show',  icon: '👗', eventType: 'CONCERT' },
      { id: 'ART_GALLERY',  label: 'Art Gallery',   icon: '🎨', eventType: 'OTHER'   },
      { id: 'POPUP',        label: 'Pop-up Event',  icon: '🛍️', eventType: 'OTHER' },
    ],
  },
];

const STEPS = ['Category', 'Details', 'Venue', 'Settings'];

interface FormState {
  subcategory:      string;
  event_type:       string;
  title:            string;
  description:      string;
  starts_at:        Date | null;
  ends_at:          Date | null;
  timezone:         string;
  venue_name:       string;
  venue_address:    string;
  city:             string;
  country:          string;
  allow_rsvp:       boolean;
  allow_ticketing:  boolean;
  allow_qr_checkin: boolean;
  allow_donations:  boolean;
}

const INITIAL: FormState = {
  subcategory: '', event_type: '', title: '', description: '',
  starts_at: null, ends_at: null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  venue_name: '', venue_address: '', city: '', country: '',
  allow_rsvp: true, allow_ticketing: false, allow_qr_checkin: true, allow_donations: false,
};

export default function CreateEventScreen() {
  const router = useRouter();
  const { createEvent } = useEventStore();

  const [step,        setStep]       = useState(0);
  const [form,        setForm]       = useState<FormState>(INITIAL);
  const [expandedCat, setExpandedCat]= useState<string | null>(null);
  const [saving,      setSaving]     = useState(false);

  const update = (key: keyof FormState, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }));

  const canAdvance = () => {
    if (step === 0) return !!form.subcategory;
    if (step === 1) return !!form.title.trim();
    return true;
  };

  const submit = async () => {
    if (!form.title.trim()) return Toast.show({ type: 'error', text1: 'Title is required' });
    if (!form.event_type)   return Toast.show({ type: 'error', text1: 'Select a category' });
    setSaving(true);
    const result = await createEvent({
      event_type:       form.event_type,
      title:            form.title,
      description:      form.description,
      starts_at:        form.starts_at?.toISOString(),
      ends_at:          form.ends_at?.toISOString(),
      timezone:         form.timezone,
      venue_name:       form.venue_name,
      venue_address:    form.venue_address,
      city:             form.city,
      country:          form.country,
      allow_rsvp:       form.allow_rsvp,
      allow_ticketing:  form.allow_ticketing,
      allow_qr_checkin: form.allow_qr_checkin,
      allow_donations:  form.allow_donations,
    });
    setSaving(false);
    if (!result.success) {
      Toast.show({
        type: 'error',
        text1: result.code === 'PLAN_LIMIT_EVENTS' ? 'Free plan limit reached' : (result.message ?? 'Failed'),
        text2: result.code === 'PLAN_LIMIT_EVENTS' ? 'Upgrade to create unlimited events.' : undefined,
      });
      return;
    }
    Toast.show({ type: 'success', text1: '🎉 Event created!' });
    router.replace(`/events/${result.event!.id}` as never);
  };

  const selectedSub = CATEGORIES.flatMap(c => c.subcategories).find(s => s.id === form.subcategory);
  const selectedCat = CATEGORIES.find(c => c.subcategories.some(s => s.id === form.subcategory));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => (step === 0 ? router.back() : setStep(s => s - 1))} style={styles.back} hitSlop={8}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Create Event</Text>
            <Text style={styles.headerSub}>
              Step {step + 1}/{STEPS.length} — {STEPS[step]}
              {selectedSub ? ` · ${selectedSub.icon} ${selectedSub.label}` : ''}
            </Text>
          </View>
          {step > 0 && (
            <Pressable onPress={() => setStep(STEPS.length - 1)} hitSlop={8}>
              <Text style={styles.skipText}>Skip →</Text>
            </Pressable>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressTrack}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= step && { backgroundColor: Colors.accent.indigo },
                i === step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── STEP 0: Category picker ─────────────────────────────── */}
          {step === 0 && (
            <View style={styles.catWrap}>
              <Text style={styles.stepHint}>What kind of event are you hosting?</Text>
              {CATEGORIES.map(cat => {
                const isExpanded = expandedCat === cat.id;
                const hasSel     = cat.subcategories.some(s => s.id === form.subcategory);
                return (
                  <View key={cat.id} style={styles.catGroup}>
                    <Pressable
                      style={[
                        styles.catHeader,
                        hasSel && { borderColor: `${cat.color}50`, backgroundColor: `${cat.color}10` },
                        isExpanded && { borderColor: `${cat.color}40` },
                      ]}
                      onPress={() => setExpandedCat(isExpanded ? null : cat.id)}
                    >
                      <Text style={styles.catIcon}>{cat.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.catLabel, hasSel && { color: cat.color }]}>{cat.label}</Text>
                        {hasSel && selectedSub && (
                          <Text style={[styles.catSelected, { color: cat.color }]}>
                            {selectedSub.icon} {selectedSub.label}
                          </Text>
                        )}
                      </View>
                      {hasSel
                        ? <Feather name="check-circle" size={18} color={cat.color} />
                        : <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.text.subtle} />
                      }
                    </Pressable>

                    {isExpanded && (
                      <View style={styles.subGrid}>
                        {cat.subcategories.map(sub => {
                          const sel = form.subcategory === sub.id;
                          return (
                            <Pressable
                              key={sub.id}
                              style={[
                                styles.subCard,
                                sel && { borderColor: cat.color, backgroundColor: `${cat.color}12` },
                              ]}
                              onPress={() => {
                                update('subcategory', sub.id);
                                update('event_type', sub.eventType);
                                setExpandedCat(null);
                              }}
                            >
                              <Text style={styles.subIcon}>{sub.icon}</Text>
                              <Text style={[styles.subLabel, sel && { color: cat.color }]}>{sub.label}</Text>
                              {sel && (
                                <View style={[styles.subCheck, { backgroundColor: cat.color }]}>
                                  <Feather name="check" size={9} color="#fff" />
                                </View>
                              )}
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── STEP 1: Details ─────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.fields}>
              <Text style={styles.stepHint}>Tell guests about your event</Text>

              {selectedSub && (
                <View style={[styles.catPill, { backgroundColor: `${selectedCat?.color}15`, borderColor: `${selectedCat?.color}30` }]}>
                  <Text style={styles.catPillText}>{selectedSub.icon} {selectedSub.label}</Text>
                  <Pressable onPress={() => setStep(0)} hitSlop={8}>
                    <Text style={[styles.catPillChange, { color: selectedCat?.color }]}>Change</Text>
                  </Pressable>
                </View>
              )}

              <Input
                label="Event Title *"
                placeholder="e.g. Annual Tech Summit 2025"
                value={form.title}
                onChangeText={t => update('title', t)}
                icon="type"
              />
              <Input
                label="Description"
                placeholder="Tell guests what to expect, the agenda, dress code…"
                value={form.description}
                onChangeText={t => update('description', t)}
                multiline
                style={{ minHeight: 90 }}
                icon="align-left"
              />
              <DateTimePicker
                label="Start Date & Time"
                value={form.starts_at}
                onChange={d => update('starts_at', d)}
                minDate={new Date()}
              />
              <DateTimePicker
                label="End Date & Time"
                value={form.ends_at}
                onChange={d => update('ends_at', d)}
                minDate={form.starts_at ?? new Date()}
              />
              <Input
                label="Timezone"
                placeholder="e.g. America/New_York"
                value={form.timezone}
                onChangeText={t => update('timezone', t)}
                icon="globe"
              />
            </View>
          )}

          {/* ── STEP 2: Venue ───────────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.fields}>
              <Text style={styles.stepHint}>Where is the event taking place?</Text>
              <Input label="Venue Name"     placeholder="Madison Square Garden" value={form.venue_name}    onChangeText={t => update('venue_name', t)}    icon="map-pin"  />
              <Input label="Street Address" placeholder="4 Pennsylvania Plaza"  value={form.venue_address} onChangeText={t => update('venue_address', t)} icon="navigation"/>
              <Input label="City"           placeholder="New York"              value={form.city}          onChangeText={t => update('city', t)}          icon="map"      />
              <Input label="Country"        placeholder="US"                    value={form.country}       onChangeText={t => update('country', t)}       icon="flag"     />
            </View>
          )}

          {/* ── STEP 3: Settings ────────────────────────────────────── */}
          {step === 3 && (
            <View style={styles.toggles}>
              <Text style={styles.stepHint}>Configure event features</Text>
              <ToggleRow
                icon="users"       label="RSVP"
                sub="Allow guests to RSVP to this event"
                value={form.allow_rsvp}       color={Colors.accent.emerald}
                onChange={v => update('allow_rsvp', v)}
              />
              <ToggleRow
                icon="credit-card" label="Ticketing"
                sub="Sell free or paid tickets"
                value={form.allow_ticketing}  color={Colors.accent.amber}
                onChange={v => update('allow_ticketing', v)}
              />
              <ToggleRow
                icon="camera"      label="QR Check-in"
                sub="Enable QR code scanning at the door"
                value={form.allow_qr_checkin} color={Colors.accent.indigo}
                onChange={v => update('allow_qr_checkin', v)}
              />
              <ToggleRow
                icon="heart"       label="Donations"
                sub="Accept optional donations at this event"
                value={form.allow_donations}  color={Colors.accent.violet}
                onChange={v => update('allow_donations', v)}
              />
            </View>
          )}

        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottom}>
          {step < STEPS.length - 1 ? (
            <Button
              label={step === 0 ? (form.subcategory ? `Continue with ${selectedSub?.label}` : 'Select a category') : 'Continue'}
              onPress={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              accent={Colors.accent.indigo}
              size="lg"
            />
          ) : (
            <Button
              label={saving ? 'Creating…' : '🚀 Create Event'}
              onPress={submit}
              loading={saving}
              accent={Colors.accent.indigo}
              size="lg"
            />
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

/* ─── Toggle row ─────────────────────────────────────────────────────────── */
function ToggleRow({ icon, label, sub, value, onChange, color }: {
  icon: keyof typeof Feather.glyphMap;
  label: string; sub: string; value: boolean; color: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable
      style={[styles.toggleRow, value && { borderColor: `${color}30`, backgroundColor: `${color}06` }]}
      onPress={() => onChange(!value)}
    >
      <View style={[styles.toggleIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border.DEFAULT, true: `${color}70` }}
        thumbColor={value ? color : Colors.text.subtle}
      />
    </Pressable>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  back: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },
  skipText:    { fontSize: 12, color: Colors.accent.indigo, fontWeight: '700' },

  progressTrack: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginBottom: 4,
  },
  progressDot: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: Colors.border.DEFAULT,
  },
  progressDotActive: { height: 4 },

  content:  { padding: 16, paddingBottom: 16, gap: 12 },
  stepHint: { fontSize: 14, color: Colors.text.muted, marginBottom: 4 },

  // Category picker
  catWrap:  { gap: 8 },
  catGroup: { gap: 0 },
  catHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.card,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
    borderRadius: 14, padding: 14,
  },
  catIcon:     { fontSize: 22 },
  catLabel:    { fontSize: 14, fontWeight: '800', color: '#fff' },
  catSelected: { fontSize: 11, marginTop: 2, fontWeight: '600' },

  subGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingTop: 8, paddingHorizontal: 4, paddingBottom: 4,
  },
  subCard: {
    width: (SW - 48) / 3,
    alignItems: 'center', gap: 5,
    paddingVertical: 12, paddingHorizontal: 6,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.bg.elevated, position: 'relative',
  },
  subIcon:  { fontSize: 20 },
  subLabel: { fontSize: 10, fontWeight: '700', color: Colors.text.muted, textAlign: 'center' },
  subCheck: {
    position: 'absolute', top: 5, right: 5,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  // Selected category pill
  catPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  catPillText:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  catPillChange: { fontSize: 12, fontWeight: '700' },

  // Fields
  fields:  { gap: 12 },

  // Toggles
  toggles: { gap: 8 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.bg.card,
    borderRadius: 14, borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 14,
  },
  toggleIcon:  { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  toggleSub:   { fontSize: 11, color: Colors.text.muted, marginTop: 1 },

  bottom: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: Colors.border.subtle },
});
