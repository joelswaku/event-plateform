import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import { pickAndUploadImage } from '@/lib/imageUpload';
import type { BuilderSection } from '@/types';

const BG  = '#1a1b1f';
const MT  = '#555a66';
const TX  = 'rgba(255,255,255,0.85)';
const BD  = 'rgba(255,255,255,0.1)';
const ACC = '#c9a96e';

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

type Partner = 'bride' | 'groom';

const LEGACY_FIELDS: Record<string, string[]> = {
  bride_image: ['partner1_photo', 'person1_image'],
  bride_name:  ['partner1_name', 'person1_name'],
  bride_role:  ['partner1_role'],
  bride_bio:   ['partner1_bio'],
  bride_quote: ['partner1_quote'],
  groom_image: ['partner2_photo', 'person2_image'],
  groom_name:  ['partner2_name', 'person2_name'],
  groom_role:  ['partner2_role'],
  groom_bio:   ['partner2_bio'],
  groom_quote: ['partner2_quote'],
};

function valueFor(config: Record<string, unknown>, key: string) {
  const value = config[key] ?? LEGACY_FIELDS[key]?.map(legacy => config[legacy]).find(Boolean) ?? '';
  return String(value);
}

export default function CoupleConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const cfgRef = useRef<Record<string, unknown>>({ ...(section.config ?? {}) });
  const sectionIdRef = useRef(section.id);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = section.config ?? {};
  const [brideImage, setBrideImage] = useState(valueFor(config, 'bride_image'));
  const [brideName, setBrideName] = useState(valueFor(config, 'bride_name'));
  const [brideRole, setBrideRole] = useState(valueFor(config, 'bride_role'));
  const [brideBio, setBrideBio] = useState(valueFor(config, 'bride_bio'));
  const [brideQuote, setBrideQuote] = useState(valueFor(config, 'bride_quote'));
  const [groomImage, setGroomImage] = useState(valueFor(config, 'groom_image'));
  const [groomName, setGroomName] = useState(valueFor(config, 'groom_name'));
  const [groomRole, setGroomRole] = useState(valueFor(config, 'groom_role'));
  const [groomBio, setGroomBio] = useState(valueFor(config, 'groom_bio'));
  const [groomQuote, setGroomQuote] = useState(valueFor(config, 'groom_quote'));

  useEffect(() => {
    sectionIdRef.current = section.id;
    const source = section.config ?? {};
    const normalized = { ...source } as Record<string, unknown>;
    let migrated = false;

    // Older Expo builds saved partner1/partner2 fields. Copy them once into
    // the canonical bride/groom fields used by the web and live event page.
    Object.entries(LEGACY_FIELDS).forEach(([canonical, legacyKeys]) => {
      if (normalized[canonical]) return;
      const legacyValue = legacyKeys.map(key => normalized[key]).find(Boolean);
      if (legacyValue) {
        normalized[canonical] = legacyValue;
        migrated = true;
      }
    });

    cfgRef.current = normalized;
    setBrideImage(valueFor(normalized, 'bride_image'));
    setBrideName(valueFor(normalized, 'bride_name'));
    setBrideRole(valueFor(normalized, 'bride_role'));
    setBrideBio(valueFor(normalized, 'bride_bio'));
    setBrideQuote(valueFor(normalized, 'bride_quote'));
    setGroomImage(valueFor(normalized, 'groom_image'));
    setGroomName(valueFor(normalized, 'groom_name'));
    setGroomRole(valueFor(normalized, 'groom_role'));
    setGroomBio(valueFor(normalized, 'groom_bio'));
    setGroomQuote(valueFor(normalized, 'groom_quote'));

    if (migrated) {
      void updateSection(eventId, section.id, { config: normalized });
    }
  }, [eventId, section.id, updateSection]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const saveField = (key: string, value: unknown) => {
    cfgRef.current = { ...cfgRef.current, [key]: value };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void updateSection(eventId, sectionIdRef.current, { config: cfgRef.current });
    }, 400);
  };

  const pickPhoto = async (partner: Partner) => {
    const url = await pickAndUploadImage(eventId);
    if (!url) return;
    if (partner === 'bride') {
      setBrideImage(url);
      saveField('bride_image', url);
    } else {
      setGroomImage(url);
      saveField('groom_image', url);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      <PartnerFields
        title="Partner One"
        photo={brideImage}
        name={brideName}
        role={brideRole}
        bio={brideBio}
        quote={brideQuote}
        onPhoto={() => pickPhoto('bride')}
        onName={value => { setBrideName(value); saveField('bride_name', value); }}
        onRole={value => { setBrideRole(value); saveField('bride_role', value); }}
        onBio={value => { setBrideBio(value); saveField('bride_bio', value); }}
        onQuote={value => { setBrideQuote(value); saveField('bride_quote', value); }}
      />

      <PartnerFields
        title="Partner Two"
        photo={groomImage}
        name={groomName}
        role={groomRole}
        bio={groomBio}
        quote={groomQuote}
        onPhoto={() => pickPhoto('groom')}
        onName={value => { setGroomName(value); saveField('groom_name', value); }}
        onRole={value => { setGroomRole(value); saveField('groom_role', value); }}
        onBio={value => { setGroomBio(value); saveField('groom_bio', value); }}
        onQuote={value => { setGroomQuote(value); saveField('groom_quote', value); }}
      />
    </ScrollView>
  );
}

interface PartnerFieldsProps {
  title: string;
  photo: string;
  name: string;
  role: string;
  bio: string;
  quote: string;
  onPhoto: () => void;
  onName: (value: string) => void;
  onRole: (value: string) => void;
  onBio: (value: string) => void;
  onQuote: (value: string) => void;
}

function PartnerFields({ title, photo, name, role, bio, quote, onPhoto, onName, onRole, onBio, onQuote }: PartnerFieldsProps) {
  return (
    <View style={s.partnerSection}>
      <Text style={s.partnerTitle}>{title}</Text>
      <PhotoBox label="Photo" photoUri={photo} onPick={onPhoto} />
      <Field label="Name">
        <TextInput style={s.input} value={name} onChangeText={onName} placeholder={title === 'Partner One' ? 'e.g. Sarah' : 'e.g. James'} placeholderTextColor={MT} />
      </Field>
      <Field label="Role / Title">
        <TextInput style={s.input} value={role} onChangeText={onRole} placeholder={title === 'Partner One' ? 'e.g. Bride' : 'e.g. Groom'} placeholderTextColor={MT} />
      </Field>
      <Field label="Short Bio">
        <TextInput style={[s.input, s.textarea]} value={bio} onChangeText={onBio} placeholder="A sentence or two about them…" placeholderTextColor={MT} multiline numberOfLines={3} />
      </Field>
      <Field label="Personal Quote (flip card)">
        <TextInput style={s.input} value={quote} onChangeText={onQuote} placeholder="Something meaningful…" placeholderTextColor={MT} />
      </Field>
    </View>
  );
}

function PhotoBox({ label, photoUri, onPick }: { label: string; photoUri: string; onPick: () => void }) {
  return (
    <Pressable style={s.photoBox} onPress={onPick}>
      {photoUri
        ? <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        : <View style={s.photoEmpty}><Feather name="user" size={28} color={MT} /></View>}
      <View style={s.photoOverlay}><Feather name="camera" size={13} color="#fff" /></View>
      <Text style={s.photoLabel}>{photoUri ? 'Change photo' : label}</Text>
    </Pressable>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text>{children}</View>;
}

const s = StyleSheet.create({
  scroll: { padding: 16, gap: 20, paddingBottom: 34 },
  partnerSection: {
    gap: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  partnerTitle: { fontSize: 11, fontWeight: '800', color: ACC, letterSpacing: 1.2, textTransform: 'uppercase' },
  photoBox: {
    height: 132, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: BD,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  photoEmpty: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  photoOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.68)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoLabel: {
    position: 'absolute', bottom: 12, left: 10,
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.82)',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
  },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.48)', letterSpacing: 0.4 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: TX,
  },
  textarea: { minHeight: 82, textAlignVertical: 'top' },
});
