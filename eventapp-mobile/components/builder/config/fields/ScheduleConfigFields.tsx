import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, Modal, Platform, TouchableOpacity,
} from 'react-native';
import { ConfirmModal, useConfirm } from '@/components/ui/ConfirmModal';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useBuilderStore } from '@/store/builder.store';
import type { BuilderSection } from '@/types';

const BG   = '#1a1b1f';
const MT   = '#555a66';
const TX   = 'rgba(255,255,255,0.85)';
const BD   = 'rgba(255,255,255,0.1)';
const ACC  = '#6c6fee';
const CARD = '#1e2026';

interface Props { section: BuilderSection; eventId: string; iosKeyboardInsets?: boolean }

const EMPTY = { title: '', description: '', starts_at: '', ends_at: '', location: '' };

/* ─── DateTimePickerField ──────────────────────────────────────────────────── */

interface DTPFieldProps {
  label: string;
  value: string;           // ISO string or ''
  onChange: (iso: string) => void;
  optional?: boolean;
}

function DateTimePickerField({ label, value, onChange, optional }: DTPFieldProps) {
  const date = value ? new Date(value) : null;

  // Android: two-step (date then time)
  const [androidStep, setAndroidStep] = useState<'date' | 'time' | null>(null);
  const [androidDate, setAndroidDate] = useState<Date | null>(null);

  // iOS: modal with inline picker
  const [iosVisible, setIosVisible] = useState(false);
  const [iosDraft,   setIosDraft]   = useState<Date>(date ?? new Date());

  const fmtDisplay = (d: Date) =>
    d.toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const openPicker = () => {
    if (Platform.OS === 'ios') {
      setIosDraft(date ?? new Date());
      setIosVisible(true);
    } else {
      setAndroidDate(date ?? new Date());
      setAndroidStep('date');
    }
  };

  const handleAndroidChange = (evt: DateTimePickerEvent, selected?: Date) => {
    if (evt.type === 'dismissed' || !selected) {
      setAndroidStep(null);
      setAndroidDate(null);
      return;
    }
    if (androidStep === 'date') {
      setAndroidDate(selected);
      setAndroidStep('time');
    } else {
      // combine date part from androidDate + time part from selected
      const combined = new Date(androidDate!);
      combined.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(combined.toISOString());
      setAndroidStep(null);
      setAndroidDate(null);
    }
  };

  const clearValue = () => onChange('');

  return (
    <View style={dtp.wrap}>
      <Text style={dtp.label}>{label}{optional ? '' : ' *'}</Text>
      <View style={dtp.row}>
        <Pressable style={[dtp.trigger, !!date && dtp.triggerFilled]} onPress={openPicker}>
          <Feather name="calendar" size={13} color={date ? ACC : MT} />
          <Text style={[dtp.triggerText, { color: date ? TX : MT }]} numberOfLines={1}>
            {date ? fmtDisplay(date) : 'Select date & time'}
          </Text>
        </Pressable>
        {!!date && optional && (
          <Pressable style={dtp.clearBtn} onPress={clearValue}>
            <Feather name="x" size={12} color={MT} />
          </Pressable>
        )}
      </View>

      {/* Android: render as system dialog — key forces remount when switching date→time */}
      {Platform.OS === 'android' && androidStep === 'date' && androidDate !== null && (
        <DateTimePicker
          key="android-date"
          value={androidDate}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
        />
      )}
      {Platform.OS === 'android' && androidStep === 'time' && androidDate !== null && (
        <DateTimePicker
          key="android-time"
          value={androidDate}
          mode="time"
          display="default"
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS: bottom-sheet modal with spinner picker */}
      {Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="slide"
          statusBarTranslucent
          visible={iosVisible}
          onRequestClose={() => setIosVisible(false)}
        >
          {/* flex container so sheet sits at the bottom */}
          <View style={dtp.modalContainer}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIosVisible(false)}
            />
            <View style={dtp.sheet}>
              <View style={dtp.sheetHeader}>
                <Pressable onPress={() => setIosVisible(false)}>
                  <Text style={dtp.sheetCancel}>Cancel</Text>
                </Pressable>
                <Text style={dtp.sheetTitle}>{label}</Text>
                <Pressable onPress={() => { onChange(iosDraft.toISOString()); setIosVisible(false); }}>
                  <Text style={dtp.sheetDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode="datetime"
                display="spinner"
                onChange={(_, d) => { if (d) setIosDraft(d); }}
                themeVariant="dark"
                style={dtp.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const dtp = StyleSheet.create({
  wrap:         { gap: 6 },
  label:        { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  row:          { flexDirection: 'row', gap: 8 },
  trigger: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BD,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9,
  },
  triggerFilled: { borderColor: `${ACC}55` },
  triggerText:   { fontSize: 13, flex: 1 },
  clearBtn: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: BD,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  // iOS modal layout — container fills screen, sheet sticks to bottom
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1e2026', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 40, borderTopWidth: 1, borderTopColor: BD,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: BD,
  },
  sheetTitle:  { fontSize: 14, fontWeight: '600', color: TX },
  sheetCancel: { fontSize: 14, color: MT },
  sheetDone:   { fontSize: 14, fontWeight: '700', color: ACC },
  iosPicker:   { height: 216 },
});

/* ─── Main component ───────────────────────────────────────────────────────── */

export default function ScheduleConfigFields({ section, eventId, iosKeyboardInsets }: Props) {
  const updateSection      = useBuilderStore(s => s.updateSection);
  const scheduleItems      = useBuilderStore(s => (s.builder as any)?.schedule_items ?? []);
  const createScheduleItem = useBuilderStore(s => s.createScheduleItem);
  const updateScheduleItem = useBuilderStore(s => s.updateScheduleItem);
  const deleteScheduleItem = useBuilderStore(s => s.deleteScheduleItem);

  const [sectionTitle, setSectionTitle] = useState(section.title ?? '');
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const { confirm, confirmProps } = useConfirm();

  const getDraft = (item: any) => ({ ...item, ...(drafts[item.id] ?? {}) });

  const setDraftField = (id: string, key: string, val: string) =>
    setDrafts(p => ({ ...p, [id]: { ...(p[id] ?? {}), [key]: val } }));

  const fmtTime = (iso: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
  };

  const handleSave = async (item: any) => {
    const d = getDraft(item);
    if (!d.title?.trim() || !(d as any).starts_at) return;
    setSaving(true);
    await updateScheduleItem(eventId, item.id, {
      title:          d.title,
      description:    (d as any).description || null,
      starts_at:      (d as any).starts_at,
      ends_at:        (d as any).ends_at || null,
      location:       (d as any).location || null,
      position_order: item.position_order ?? 0,
    });
    setDrafts(p => { const n = { ...p }; delete n[item.id]; return n; });
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!newForm?.title?.trim() || !newForm.starts_at) return;
    setSaving(true);
    await createScheduleItem(eventId, {
      title:          newForm.title,
      description:    newForm.description || null,
      starts_at:      newForm.starts_at,
      ends_at:        newForm.ends_at || null,
      location:       newForm.location || null,
      position_order: scheduleItems.length,
    });
    setNewForm(null);
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: 'Remove Item',
      message: 'Remove this schedule item?',
      confirmLabel: 'Remove',
      variant: 'danger',
      onConfirm: () => deleteScheduleItem(eventId, id),
    });
  };

  return (
    <>
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
          placeholder="Schedule"
          placeholderTextColor={MT}
        />
      </Field>

      {scheduleItems.map((item: any, idx: number) => {
        const d        = getDraft(item);
        const expanded = expandedId === item.id;

        return (
          <View key={item.id} style={s.card}>
            <Pressable style={s.cardHeader} onPress={() => setExpandedId(expanded ? null : item.id)}>
              <View style={s.badge}>
                <Text style={s.badgeText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                {item.starts_at ? (
                  <Text style={s.itemTime} numberOfLines={1}>
                    {fmtTime(item.starts_at)}{item.ends_at ? ` – ${fmtTime(item.ends_at)}` : ''}
                  </Text>
                ) : null}
              </View>
              <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={MT} />
            </Pressable>

            {expanded && (
              <View style={s.form}>
                <Field label="Title *">
                  <TextInput style={s.input} value={(d as any).title ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setDraftField(item.id, 'title', v)} placeholder="Session title" />
                </Field>

                <DateTimePickerField
                  label="Start Time"
                  value={(d as any).starts_at ?? ''}
                  onChange={v => setDraftField(item.id, 'starts_at', v)}
                />
                <DateTimePickerField
                  label="End Time"
                  value={(d as any).ends_at ?? ''}
                  onChange={v => setDraftField(item.id, 'ends_at', v)}
                  optional
                />

                <Field label="Location">
                  <TextInput style={s.input} value={(d as any).location ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setDraftField(item.id, 'location', v)} placeholder="Room / stage name" />
                </Field>
                <Field label="Description">
                  <TextInput style={[s.input, s.textarea]} value={(d as any).description ?? ''} placeholderTextColor={MT}
                    onChangeText={v => setDraftField(item.id, 'description', v)} placeholder="Short description…"
                    multiline numberOfLines={3} />
                </Field>

                <View style={s.actions}>
                  <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={() => handleSave(item)} disabled={saving}>
                    <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
                  </Pressable>
                  <Pressable style={s.deleteBtn} onPress={() => handleDelete(item.id)}>
                    <Feather name="trash-2" size={14} color="#f87171" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* New item form */}
      {newForm !== null ? (
        <View style={[s.card, { borderColor: `${ACC}44` }]}>
          <Text style={s.newLabel}>New Item</Text>
          <View style={s.form}>
            <Field label="Title *">
              <TextInput style={s.input} value={newForm.title} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, title: v } : p)} placeholder="Session title" />
            </Field>

            <DateTimePickerField
              label="Start Time"
              value={newForm.starts_at}
              onChange={v => setNewForm(p => p ? { ...p, starts_at: v } : p)}
            />
            <DateTimePickerField
              label="End Time"
              value={newForm.ends_at}
              onChange={v => setNewForm(p => p ? { ...p, ends_at: v } : p)}
              optional
            />

            <Field label="Location">
              <TextInput style={s.input} value={newForm.location} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, location: v } : p)} placeholder="Room / stage name" />
            </Field>
            <Field label="Description">
              <TextInput style={[s.input, s.textarea]} value={newForm.description} placeholderTextColor={MT}
                onChangeText={v => setNewForm(p => p ? { ...p, description: v } : p)} placeholder="Short description…"
                multiline numberOfLines={3} />
            </Field>

            <View style={s.actions}>
              <Pressable
                style={[s.saveBtn, (saving || !newForm.title.trim() || !newForm.starts_at) && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={saving || !newForm.title.trim() || !newForm.starts_at}
              >
                <Text style={s.saveBtnText}>{saving ? 'Adding…' : 'Add Item'}</Text>
              </Pressable>
              <Pressable style={s.deleteBtn} onPress={() => setNewForm(null)}>
                <Feather name="x" size={14} color={MT} />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <Pressable style={s.addBtn} onPress={() => setNewForm({ ...EMPTY })}>
          <Feather name="plus" size={14} color={MT} />
          <Text style={s.addBtnText}>Add Item</Text>
        </Pressable>
      )}
    </ScrollView>
    <ConfirmModal {...confirmProps} />
    </>
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
  badge: {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    backgroundColor: 'rgba(108,111,238,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText:  { fontSize: 11, fontWeight: '700', color: ACC },
  itemTitle:  { fontSize: 13, fontWeight: '600', color: TX },
  itemTime:   { fontSize: 11, color: MT, marginTop: 1 },

  form: {
    borderTopWidth: 1, borderTopColor: BD,
    padding: 12, gap: 12,
  },
  newLabel: {
    fontSize: 10, fontWeight: '700', color: ACC,
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 12, paddingTop: 10,
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
