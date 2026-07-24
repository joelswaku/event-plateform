import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { notify, showWarning } from '@/lib/toast';
import { useEventStore }        from '@/store/event.store';
import { useTicketStore }       from '@/store/ticket.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { Input }             from '@/components/ui/Input';
import { Button }           from '@/components/ui/Button';
import { DateTimePicker }   from '@/components/ui/DateTimePicker';
import { CountrySelector }   from '@/components/ui/CountrySelector';
import { Colors }           from '@/constants/colors';

const { width: SW } = Dimensions.get('window');

/* ─── Full category tree ────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'social', label: 'Social Events', icon: '🎉', color: '#8b5cf6',
    subcategories: [
      { id: 'WEDDING',       label: 'Wedding',         icon: '💍', eventType: 'WEDDING'         },
      { id: 'ENGAGEMENT',    label: 'Engagement',      icon: '💒', eventType: 'WEDDING'         },
      { id: 'BIRTHDAY',      label: 'Birthday',         icon: '🎂', eventType: 'BIRTHDAY'        },
      { id: 'ANNIVERSARY',   label: 'Anniversary',      icon: '🥂', eventType: 'BIRTHDAY'        },
      { id: 'BABY_SHOWER',   label: 'Baby Shower',      icon: '🍼', eventType: 'BIRTHDAY'        },
      { id: 'GENDER_REVEAL', label: 'Gender Reveal',   icon: '🎀', eventType: 'BIRTHDAY'        },
      { id: 'GRADUATION',    label: 'Graduation',      icon: '🎓', eventType: 'OTHER'           },
      { id: 'FUNERAL',       label: 'Funeral',          icon: '🕊️', eventType: 'FUNERAL'        },
      { id: 'PRIVATE_PARTY', label: 'Private Party',    icon: '🎈', eventType: 'BIRTHDAY'        },
      { id: 'FAMILY_REUNION',label: 'Family Reunion',   icon: '👨‍👩‍👧‍👦', eventType: 'OTHER' },
    ],
  },
  {
    id: 'corporate', label: 'Corporate & Professional', icon: '💼', color: '#0ea5e9',
    subcategories: [
      { id: 'MEETING',         label: 'Meeting',           icon: '📋', eventType: 'MEETING'          },
      { id: 'CONFERENCE',      label: 'Conference',        icon: '🎤', eventType: 'CORPORATE_EVENT' },
      { id: 'SEMINAR',         label: 'Seminar',           icon: '📚', eventType: 'CORPORATE_EVENT' },
      { id: 'WORKSHOP',        label: 'Workshop',          icon: '🛠️', eventType: 'MEETING'         },
      { id: 'NETWORKING',      label: 'Networking',        icon: '🤝', eventType: 'CORPORATE_EVENT' },
      { id: 'PRODUCT_LAUNCH', label: 'Product Launch',    icon: '🚀', eventType: 'CORPORATE_EVENT' },
      { id: 'COMPANY_PARTY',   label: 'Company Party',     icon: '🥳', eventType: 'CORPORATE_EVENT' },
      { id: 'TRAINING',        label: 'Training',          icon: '📝', eventType: 'MEETING'          },
    ],
  },
  {
    id: 'entertainment', label: 'Ticketed & Entertainment', icon: '🎟️', color: '#f59e0b',
    subcategories: [
      { id: 'CONCERT',    label: 'Concert',         icon: '🎵', eventType: 'CONCERT' },
      { id: 'FESTIVAL',   label: 'Festival',        icon: '🎪', eventType: 'CONCERT' },
      { id: 'LIVE_SHOW',   label: 'Live Show',       icon: '🎭', eventType: 'CONCERT' },
      { id: 'NIGHTCLUB',   label: 'Nightclub Event', icon: '🌙', eventType: 'CONCERT' },
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
      { id: 'FUNDRAISER',   label: 'Fundraiser',           icon: '💰', eventType: 'OTHER'   },
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
  state:            string;
  zip_code:         string;
  country:          string;
  allow_rsvp:       boolean;
  open_rsvp:        boolean;
  allow_ticketing:  boolean;
  allow_qr_checkin: boolean;
  allow_donations:  boolean;
}

const INITIAL: FormState = {
  subcategory: '', event_type: '', title: '', description: '',
  starts_at: null, ends_at: null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  venue_name: '', venue_address: '', city: '', state: '', zip_code: '', country: '',
  allow_rsvp: true, allow_ticketing: false, allow_qr_checkin: true, allow_donations: false, open_rsvp: false,
};

/* ─── Upgrade gate shown when event limit is reached ──────────────── */
function UpgradeGate({ onBack }: { onBack: () => void }) {
  const router  = useRouter();
  const prices  = useSubscriptionStore(s => s.prices);
  const plan    = useSubscriptionStore(s => s.plan);
  const isStarter = plan === 'starter';

  const heading = isStarter
    ? 'Starter Limit Reached'
    : 'Event Limit Reached';
  const sub = isStarter
    ? "You've used all 5 Starter events. Upgrade to Pro for unlimited events — no caps, ever."
    : 'Your free plan includes 1 event. Upgrade to Starter for 5 events, or Pro for unlimited.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.root}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={ug.content} showsVerticalScrollIndicator={false}>

          {/* Lock icon */}
          <View style={ug.iconWrap}>
            <LinearGradient
              colors={['rgba(245,158,11,0.20)', 'rgba(245,158,11,0.06)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <Feather name="lock" size={32} color={Colors.accent.amber} />
          </View>

          <Text style={ug.heading}>{heading}</Text>
          <Text style={ug.sub}>{sub}</Text>

          {/* Plan cards */}
          <View style={[ug.planRow, isStarter && { justifyContent: 'center' }]}>
            {/* Starter — only shown to free users */}
            {!isStarter && (
              <View style={[ug.planCard, { borderColor: 'rgba(99,102,241,0.45)' }]}>
                <View style={ug.planBadge}>
                  <Text style={ug.planBadgeTxt}>MOST POPULAR</Text>
                </View>
                <Text style={[ug.planName, { color: '#818cf8' }]}>Starter</Text>
                <Text style={[ug.planPrice, { color: '#818cf8' }]}>
                  {prices.starter?.amount != null ? `$${prices.starter.amount}` : '$19'}
                </Text>
                <Text style={ug.planPeriod}>/month</Text>
                {['5 events', '500 guests', 'All themes', 'Tickets (2% fee)', '1 reminder/guest'].map(f => (
                  <View key={f} style={ug.featureRow}>
                    <Feather name="check" size={11} color="#818cf8" />
                    <Text style={ug.featureTxt}>{f}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Pro */}
            <View style={[ug.planCard, { borderColor: 'rgba(201,169,110,0.45)', flex: isStarter ? 0 : 1, width: isStarter ? '80%' : undefined }]}>
              {isStarter && (
                <View style={[ug.planBadge, { backgroundColor: 'rgba(201,169,110,0.20)' }]}>
                  <Text style={[ug.planBadgeTxt, { color: '#C9A96E' }]}>RECOMMENDED</Text>
                </View>
              )}
              <Text style={[ug.planName, { color: '#C9A96E' }]}>Pro</Text>
              <Text style={[ug.planPrice, { color: '#C9A96E' }]}>
                {prices.pro?.amount != null ? `$${prices.pro.amount}` : '$49'}
              </Text>
              <Text style={ug.planPeriod}>/month</Text>
              {['Unlimited events', 'Unlimited guests', 'All themes', 'Tickets (1.5% fee)', '∞ reminders'].map(f => (
                <View key={f} style={ug.featureRow}>
                  <Feather name="check" size={11} color="#C9A96E" />
                  <Text style={ug.featureTxt}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CTA */}
          <Pressable
            style={ug.ctaBtn}
            onPress={() => router.replace('/profile/billing' as never)}
          >
            <LinearGradient
              colors={isStarter ? ['#c9a96e', '#f59e0b'] : [Colors.accent.indigo, '#818cf8']}
              style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Feather name="zap" size={16} fill={isStarter ? '#000' : '#fff'} color={isStarter ? '#000' : '#fff'} />
            <Text style={[ug.ctaTxt, isStarter && { color: '#000' }]}>
              {isStarter ? 'Upgrade to Pro' : 'View Plans & Upgrade'}
            </Text>
          </Pressable>

          <Pressable onPress={onBack} style={ug.laterBtn}>
            <Text style={ug.laterTxt}>Maybe later</Text>
          </Pressable>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const ug = StyleSheet.create({
  content:    { padding: 24, gap: 16, alignItems: 'center' },
  iconWrap:   { width: 88, height: 88, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(245,158,11,0.30)', marginTop: 16, marginBottom: 4 },
  heading:    { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  sub:        { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  planRow:    { flexDirection: 'row', gap: 10, width: '100%' },
  planCard:   { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 18, borderWidth: 1, padding: 14, gap: 6, marginTop: 8 },
  planBadge:  { backgroundColor: 'rgba(99,102,241,0.20)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 2 },
  planBadgeTxt:{ fontSize: 8, fontWeight: '900', color: '#818cf8', letterSpacing: 1 },
  planName:   { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  planPrice:  { fontSize: 30, fontWeight: '900', lineHeight: 34 },
  planPeriod: { fontSize: 11, color: Colors.text.muted, marginTop: -4, marginBottom: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureTxt: { fontSize: 11, color: Colors.text.secondary, fontWeight: '500', flex: 1 },
  ctaBtn:     { height: 54, width: '100%', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', marginTop: 8 },
  ctaTxt:     { fontSize: 15, fontWeight: '900', color: '#fff' },
  laterBtn:   { paddingVertical: 12 },
  laterTxt:   { fontSize: 13, color: Colors.text.muted, fontWeight: '600' },
});

export default function CreateEventScreen() {
  const router = useRouter();
  const { createEvent }       = useEventStore();
  const { createTicketType }  = useTicketStore();
  const { isAtEventLimit, fetchSubscription } = useSubscriptionStore();

  const [step,         setStep]       = useState(0);
  const [form,         setForm]       = useState<FormState>(INITIAL);
  const [expandedCat, setExpandedCat]= useState<string | null>(null);
  const [saving,      setSaving]     = useState(false);

  useEffect(() => { fetchSubscription(); }, []);

  const atLimit = isAtEventLimit();

  if (atLimit) {
    return <UpgradeGate onBack={() => router.back()} />;
  }

  const update = (key: keyof FormState, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }));

  // Mutual exclusivity for RSVP / Ticketing / Donations
  const toggleModule = (key: 'allow_rsvp' | 'allow_ticketing' | 'allow_donations', val: boolean) => {
    if (val) {
      setForm(f => ({
        ...f,
        allow_rsvp:      key === 'allow_rsvp',
        allow_ticketing: key === 'allow_ticketing',
        allow_donations: key === 'allow_donations',
        open_rsvp: false,
      }));
    } else {
      setForm(f => ({
        ...f,
        [key]: false,
        ...(key === 'allow_rsvp' ? { open_rsvp: false } : {}),
      }));
    }
  };

  const canAdvance = () => {
    if (step === 0) return !!form.subcategory;
    if (step === 1) return !!form.title.trim() && !!form.starts_at;
    if (step === 2) return !!form.venue_name.trim() && !!form.city.trim();
    return true;
  };

  const handleContinue = () => {
    if (step === 0 && !form.subcategory) {
      return showWarning('Category required', 'Please select an event type to continue.');
    }
    if (step === 1) {
      if (!form.title.trim()) return showWarning('Title required', 'Enter a title for your event.');
      if (!form.starts_at) return showWarning('Start date required', 'Select when your event starts.');
    }
    if (step === 2) {
      if (!form.venue_name.trim()) return showWarning('Venue required', 'Enter a venue name or location.');
      if (!form.city.trim()) return showWarning('City required', 'Enter the city for your event.');
    }
    setStep(s => s + 1);
  };

  const submit = async () => {
    if (!form.title.trim()) return notify.titleRequired();
    if (!form.event_type)   return showWarning('Category required', 'Select an event category to continue.');
    if (!form.starts_at) return showWarning('Start date required', 'Select a start date for your event.');
    if (!form.venue_name.trim()) return showWarning('Venue required', 'Enter a venue name or location.');
    if (!form.city.trim()) return showWarning('City required', 'Enter the city where your event takes place.');
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
      state:            form.state,
      zip_code:         form.zip_code,
      country:          form.country,
      allow_rsvp:       form.allow_rsvp,
      open_rsvp:        form.open_rsvp,
      allow_ticketing:  form.allow_ticketing,
      allow_qr_checkin: true,
      allow_donations:  form.allow_donations,
    });
    setSaving(false);
    if (!result.success) {
      if (result.code === 'PLAN_LIMIT_EVENTS') {
        router.replace('/profile/billing' as never);
        return;
      }
      notify.eventFailed(result.message);
      return;
    }
    notify.eventCreated(form.title);
    const eventId = result.event!.id;
    if (form.allow_ticketing) {
      createTicketType(eventId, {
        name: 'General Admission', kind: 'FREE', price: 0, is_active: true,
      }).catch(() => {});
    }
    router.replace(`/events/${eventId}` as never);
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
          {step === 3 && (
            <Pressable onPress={submit} hitSlop={8} disabled={saving}>
              <Text style={[styles.skipText, saving && { opacity: 0.5 }]}>Done</Text>
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

          {/* ── STEP 0: Category picker ── */}
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
                                const isTicketed = cat.id === 'entertainment';
                                setForm(f => ({
                                  ...f,
                                  subcategory:      sub.id,
                                  event_type:       sub.eventType,
                                  allow_rsvp:       !isTicketed,
                                  allow_ticketing:  isTicketed,
                                  allow_donations:  false,
                                  open_rsvp:        false,
                                }));
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

          {/* ── STEP 1: Details ── */}
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
                placeholder="Tell guests what to expect..."
                value={form.description}
                onChangeText={t => update('description', t)}
                multiline
                style={{ minHeight: 90 }}
                icon="align-left"
              />
              <DateTimePicker
                label="Start Date & Time *"
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
                label="Timezone (Auto-detected)"
                placeholder="Timezone"
                value={form.timezone}
                editable={false}
                icon="globe"
                style={{ opacity: 0.7 }}
              />
            </View>
          )}

          {/* ── STEP 2: Venue ── */}
          {step === 2 && (
            <View style={styles.fields}>
              <Text style={styles.stepHint}>Where is the event taking place?</Text>
              <Input label="Venue Name"     placeholder="Madison Square Garden" value={form.venue_name}    onChangeText={t => update('venue_name', t)}    icon="map-pin"  />
              <Input label="Street Address" placeholder="4 Pennsylvania Plaza"  value={form.venue_address} onChangeText={t => update('venue_address', t)} icon="navigation"/>
              <Input label="City"           placeholder="New York"               value={form.city}          onChangeText={t => update('city', t)}          icon="map"      />
              <Input label="State / Province" placeholder="New York"             value={form.state}         onChangeText={t => update('state', t)}         icon="map"      />
              <Input
                label="Zip / Postal"
                placeholder="10001"
                value={form.zip_code}
                onChangeText={t => update('zip_code', t.replace(/[^0-9]/g, ''))}
                icon="hash"
                keyboardType="numeric"
              />
              <View>
                <Text style={styles.label}>Country</Text>
                <CountrySelector
                  value={form.country}
                  onChange={(country) => update('country', country.code)}
                  placeholder="Select country"
                />
              </View>
            </View>
          )}

          {/* ── STEP 3: Settings ── */}
          {step === 3 && (
            <View style={styles.toggles}>
              <Text style={styles.stepHint}>Configure event features</Text>
              <ToggleRow
                icon="users"       label="RSVP"
                sub="Allow guests to RSVP to this event"
                value={form.allow_rsvp}       color={Colors.accent.emerald}
                onChange={v => toggleModule('allow_rsvp', v)}
              />
              <ToggleRow
                icon="credit-card" label="Ticketing"
                sub="Sell free or paid tickets"
                value={form.allow_ticketing}  color={Colors.accent.amber}
                onChange={v => toggleModule('allow_ticketing', v)}
              />
              <ToggleRow
                icon="heart"       label="Donations"
                sub="Accept optional donations at this event"
                value={form.allow_donations}  color={Colors.accent.violet}
                onChange={v => toggleModule('allow_donations', v)}
              />
            </View>
          )}

        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottom}>
          {step < STEPS.length - 1 ? (
            <Button
              label={step === 0 ? (form.subcategory ? `Continue with ${selectedSub?.label}` : 'Select a category') : 'Continue'}
              onPress={handleContinue}
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

/* ─── Toggle row ─── */
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

/* ─── Styles ─── */
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
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8,
    paddingTop: 8, 
    paddingHorizontal: 4, 
    paddingBottom: 4,
    justifyContent: 'center', // Centers the toggle cards when dropdown opens
  },
  subCard: {
    width: (SW - 48) / 3.2, // Slightly adjusted for better fit during centering
    alignItems: 'center', 
    gap: 5,
    paddingVertical: 12, 
    paddingHorizontal: 6,
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.bg.elevated, 
    position: 'relative',
  },
  subIcon:  { fontSize: 20 },
  subLabel: { fontSize: 10, fontWeight: '700', color: Colors.text.muted, textAlign: 'center' },
  subCheck: {
    position: 'absolute', top: 5, right: 5,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  catPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  catPillText:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  catPillChange: { fontSize: 12, fontWeight: '700' },

  fields:  { gap: 12 },
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










