import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, Image, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import { pickAndUploadImage } from '@/lib/imageUpload';
import type { BuilderSection } from '@/types';

const BG  = '#1a1b1f';
const MT  = '#555a66';
const TX  = 'rgba(255,255,255,0.85)';
const BD  = 'rgba(255,255,255,0.1)';
const ACC = '#6c6fee';
const CARD = '#1e2026';

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

const EMPTY = { full_name: '', title: '', bio: '', avatar_url: '', social_links: {} as Record<string, string> };

export default function SpeakersConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection = useBuilderStore(s => s.updateSection);
  const speakers      = useBuilderStore(s => s.builder?.speakers ?? []);
  const createSpeaker = useBuilderStore(s => s.createSpeaker);
  const updateSpeaker = useBuilderStore(s => s.updateSpeaker);
  const deleteSpeaker = useBuilderStore(s => s.deleteSpeaker);

  // Section title saved top-level on the section record (same as HERO)
  const [sectionTitle, setSectionTitle] = useState(section.title ?? '');
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when a different section is selected
  React.useEffect(() => {
    setSectionTitle(section.title ?? '');
  }, [section.id]);
  const saveSectionTitle = (value: string) => {
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      updateSection(eventId, section.id, { title: value });
    }, 400);
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts,     setDrafts]     = useState<Record<string, Partial<typeof EMPTY>>>({});
  const [newForm,    setNewForm]    = useState<typeof EMPTY | null>(null);
  const [saving,     setSaving]     = useState(false);

  const getDraft = (sp: typeof speakers[0]) => ({ ...sp, ...(drafts[sp.id] ?? {}) });

  const setDraftField = (id: string, key: string, val: string) =>
    setDrafts(p => ({ ...p, [id]: { ...(p[id] ?? {}), [key]: val } }));

  const setSocialField = (id: string, key: string, val: string) =>
    setDrafts(p => {
      const prev = p[id] ?? {};
      const spData = speakers.find(s => s.id === id);
      const prevLinks = (prev as any).social_links ?? (spData as any)?.social_links ?? {};
      return { ...p, [id]: { ...prev, social_links: { ...prevLinks, [key]: val } } };
    });

  const handleSave = async (sp: typeof speakers[0]) => {
    const d = getDraft(sp);
    if (!d.full_name?.trim()) return;
    setSaving(true);
    await updateSpeaker(eventId, sp.id, {
      full_name:    d.full_name,
      title:        (d as any).title        || null,
      bio:          (d as any).bio          || null,
      avatar_url:   (d as any).avatar_url   || null,
      social_links: (d as any).social_links || {},
    });
    setDrafts(p => { const n = { ...p }; delete n[sp.id]; return n; });
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newForm?.full_name?.trim()) return;
    setSaving(true);
    await createSpeaker(eventId, {
      full_name:    newForm.full_name,
      title:        newForm.title        || null,
      bio:          newForm.bio          || null,
      avatar_url:   newForm.avatar_url   || null,
      social_links: newForm.social_links || {},
    });
    setNewForm(null);
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Speaker', 'Remove this speaker from the event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteSpeaker(eventId, id) },
    ]);
  };

  const handlePickImage = async (onUrl: (url: string) => void) => {
    const url = await pickAndUploadImage(eventId);
    if (url) onUrl(url);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={s.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={iosKeyboardInsets}
      showsVerticalScrollIndicator={false}
    >
      {/* Section title */}
      <Field label="Section Title">
        <TextInput
          style={s.input}
          value={sectionTitle}
          onChangeText={v => { setSectionTitle(v); saveSectionTitle(v); }}
          placeholder="Our Speakers"
          placeholderTextColor={MT}
        />
      </Field>

      {speakers.map((sp) => {
        const d        = getDraft(sp);
        const expanded = expandedId === sp.id;
        const initials = (sp.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const links    = (d as any).social_links ?? {};

        return (
          <View key={sp.id} style={s.card}>
            {/* Header */}
            <Pressable style={s.cardHeader} onPress={() => setExpandedId(expanded ? null : sp.id)}>
              <View style={s.avatar}>
                {(d as any).avatar_url
                  ? <Image source={{ uri: (d as any).avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <Text style={s.avatarText}>{initials}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.speakerName} numberOfLines={1}>{sp.full_name}</Text>
                {(sp as any).title ? <Text style={s.speakerRole} numberOfLines={1}>{(sp as any).title}</Text> : null}
              </View>
              <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={MT} />
            </Pressable>

            {expanded && (
              <View style={s.form}>
                {/* Avatar upload */}
                <Pressable
                  style={s.imgPicker}
                  onPress={() => handlePickImage(url => setDraftField(sp.id, 'avatar_url', url))}
                >
                  {(d as any).avatar_url
                    ? <Image source={{ uri: (d as any).avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <View style={s.imgEmpty}><Feather name="user" size={20} color={MT} /><Text style={s.imgHint}>Tap to upload photo</Text></View>}
                  <View style={s.imgOverlay}><Feather name="camera" size={12} color="rgba(255,255,255,0.8)" /></View>
                </Pressable>

                <Field label="Full Name *">
                  <TextInput style={s.input} value={(d as any).full_name ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setDraftField(sp.id, 'full_name', v)} placeholder="Jane Doe" />
                </Field>
                <Field label="Role / Company">
                  <TextInput style={s.input} value={(d as any).title ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setDraftField(sp.id, 'title', v)} placeholder="CEO at Acme" />
                </Field>
                <Field label="Bio">
                  <TextInput style={[s.input, s.textarea]} value={(d as any).bio ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setDraftField(sp.id, 'bio', v)} placeholder="Short bio…" multiline numberOfLines={3} />
                </Field>
                <Field label="Website">
                  <TextInput style={s.input} value={links.website ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setSocialField(sp.id, 'website', v)} placeholder="https://…" autoCapitalize="none" keyboardType="url" />
                </Field>
                <Field label="LinkedIn">
                  <TextInput style={s.input} value={links.linkedin ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setSocialField(sp.id, 'linkedin', v)} placeholder="linkedin.com/in/…" autoCapitalize="none" />
                </Field>
                <Field label="Twitter / X">
                  <TextInput style={s.input} value={links.twitter ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setSocialField(sp.id, 'twitter', v)} placeholder="@handle" autoCapitalize="none" />
                </Field>

                <View style={s.actions}>
                  <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={() => handleSave(sp)} disabled={saving}>
                    <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
                  </Pressable>
                  <Pressable style={s.deleteBtn} onPress={() => handleDelete(sp.id)}>
                    <Feather name="trash-2" size={14} color="#f87171" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* New speaker form */}
      {newForm !== null ? (
        <View style={[s.card, { borderColor: `${ACC}44` }]}>
          <Text style={s.newLabel}>New Speaker</Text>
          <View style={s.form}>
            <Pressable style={s.imgPicker} onPress={() => handlePickImage(url => setNewForm(p => p ? { ...p, avatar_url: url } : p))}>
              {newForm.avatar_url
                ? <Image source={{ uri: newForm.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <View style={s.imgEmpty}><Feather name="user" size={20} color={MT} /><Text style={s.imgHint}>Tap to upload photo</Text></View>}
              <View style={s.imgOverlay}><Feather name="camera" size={12} color="rgba(255,255,255,0.8)" /></View>
            </Pressable>
            <Field label="Full Name *">
              <TextInput style={s.input} value={newForm.full_name} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, full_name: v } : p)} placeholder="Jane Doe" />
            </Field>
            <Field label="Role / Company">
              <TextInput style={s.input} value={newForm.title} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, title: v } : p)} placeholder="CEO at Acme" />
            </Field>
            <Field label="Bio">
              <TextInput style={[s.input, s.textarea]} value={newForm.bio} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, bio: v } : p)} placeholder="Short bio…" multiline numberOfLines={3} />
            </Field>
            <Field label="Website">
              <TextInput style={s.input} value={newForm.social_links.website ?? ''} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, social_links: { ...p.social_links, website: v } } : p)}
                placeholder="https://…" autoCapitalize="none" keyboardType="url" />
            </Field>
            <Field label="LinkedIn">
              <TextInput style={s.input} value={newForm.social_links.linkedin ?? ''} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, social_links: { ...p.social_links, linkedin: v } } : p)}
                placeholder="linkedin.com/in/…" autoCapitalize="none" />
            </Field>
            <Field label="Twitter / X">
              <TextInput style={s.input} value={newForm.social_links.twitter ?? ''} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, social_links: { ...p.social_links, twitter: v } } : p)}
                placeholder="@handle" autoCapitalize="none" />
            </Field>
            <View style={s.actions}>
              <Pressable
                style={[s.saveBtn, (saving || !newForm.full_name.trim()) && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={saving || !newForm.full_name.trim()}
              >
                <Text style={s.saveBtnText}>{saving ? 'Adding…' : 'Add Speaker'}</Text>
              </Pressable>
              <Pressable style={s.deleteBtn} onPress={() => setNewForm(null)}>
                <Feather name="x" size={14} color={MT} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <Pressable style={s.addBtn} onPress={() => setNewForm({ ...EMPTY, social_links: {} })}>
          <Feather name="plus" size={14} color={MT} />
          <Text style={s.addBtnText}>Add Speaker</Text>
        </Pressable>
      )}
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
  scroll:   { padding: 16, gap: 12 },
  card: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1,
    borderColor: BD, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17, flexShrink: 0,
    backgroundColor: 'rgba(108,111,238,0.15)', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '700', color: ACC },
  speakerName: { fontSize: 13, fontWeight: '600', color: TX },
  speakerRole: { fontSize: 11, color: MT, marginTop: 1 },

  form: {
    borderTopWidth: 1, borderTopColor: BD,
    padding: 12, gap: 12,
  },
  newLabel: {
    fontSize: 10, fontWeight: '700', color: ACC,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 12, paddingTop: 10,
  },

  imgPicker: {
    height: 100, borderRadius: 10, borderWidth: 1, borderColor: BD,
    backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  imgEmpty:   { alignItems: 'center', gap: 4 },
  imgHint:    { fontSize: 11, color: MT },
  imgOverlay: {
    position: 'absolute', bottom: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },

  field:    { gap: 6 },
  label:    { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 13, color: TX,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },

  actions:   { flexDirection: 'row', gap: 8, marginTop: 4 },
  saveBtn: {
    flex: 1, height: 36, borderRadius: 8, backgroundColor: ACC,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  addBtn: {
    height: 40, borderRadius: 10, borderWidth: 1,
    borderColor: BD, borderStyle: 'dashed',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  addBtnText: { fontSize: 12, fontWeight: '600', color: MT },
});
