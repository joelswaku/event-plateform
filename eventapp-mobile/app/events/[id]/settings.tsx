import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Switch,
  ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { notify } from '@/lib/toast';
import { useEventStore } from '@/store/event.store';
import { Colors } from '@/constants/colors';

/* ──────────────────────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
────────────────────────────────────────────────────────────────────────────── */

type ModuleKey = 'allow_rsvp' | 'open_rsvp' | 'allow_ticketing' | 'allow_qr_checkin' | 'allow_donations';
type SettingKey = ModuleKey | 'visibility';

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney',
  'Pacific/Auckland', 'America/Sao_Paulo', 'Africa/Johannesburg',
];

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Spain', 'Italy', 'Australia', 'Japan', 'China', 'India', 'Brazil',
  'Mexico', 'South Africa', 'Nigeria', 'Kenya', 'Other',
];

/* ──────────────────────────────────────────────────────────────────────────────
   REUSABLE UI COMPONENTS
────────────────────────────────────────────────────────────────────────────── */

function GlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[s.glassCard, style]}>
      {children}
    </View>
  );
}

function SectionHeader({ icon, label, description, color }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description?: string;
  color: string;
}) {
  return (
    <View style={s.sectionHeader}>
      <View style={[s.sectionIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionLabel}>{label}</Text>
        {description && <Text style={s.sectionDesc}>{description}</Text>}
      </View>
    </View>
  );
}

function Field({ label, hint, error, children }: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <View style={s.fieldHeader}>
        <Text style={s.fieldLabel}>{label.toUpperCase()}</Text>
        {hint && !error && <Text style={s.fieldHint}>{hint}</Text>}
      </View>
      {children}
      {error && (
        <View style={s.errorRow}>
          <Feather name="alert-triangle" size={12} color="#ef4444" />
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, multiline }: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <TextInput
      style={[s.input, multiline && s.inputMulti]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.25)"
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  );
}

function Toggle({ icon, label, description, checked, onChange, color, saving }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  color: string;
  saving?: boolean;
}) {
  return (
    <Pressable
      onPress={onChange}
      disabled={saving}
      style={[s.toggleRow, checked && { backgroundColor: `${color}08`, borderColor: `${color}30` }]}
    >
      <View style={[s.toggleIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.toggleLabel}>{label}</Text>
        <Text style={s.toggleDesc}>{description}</Text>
      </View>
      {saving ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Switch
          value={checked}
          onValueChange={onChange}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: color }}
          thumbColor="#fff"
          ios_backgroundColor="rgba(255,255,255,0.1)"
        />
      )}
    </Pressable>
  );
}

function DangerButton({ icon, label, description, onPress }: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={s.dangerRow}>
      <View style={s.dangerIcon}>
        <Feather name={icon} size={18} color="#ef4444" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.dangerLabel}>{label}</Text>
        <Text style={s.dangerDesc}>{description}</Text>
      </View>
      <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.3)" />
    </Pressable>
  );
}

function SelectField({ value, onPress, placeholder }: {
  value: string;
  onPress: () => void;
  placeholder?: string;
}) {
  return (
    <Pressable onPress={onPress} style={s.selectField}>
      <Text style={[s.selectText, !value && { color: 'rgba(255,255,255,0.25)' }]}>
        {value || placeholder}
      </Text>
      <Feather name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
    </Pressable>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   SELECT PICKER MODAL
────────────────────────────────────────────────────────────────────────────── */

function SelectModal({ visible, onClose, title, options, value, onSelect }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  value: string;
  onSelect: (val: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>

          <View style={s.searchWrap}>
            <Feather name="search" size={14} color="rgba(255,255,255,0.3)" />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search..."
              placeholderTextColor="rgba(255,255,255,0.25)"
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map(option => (
              <Pressable
                key={option}
                onPress={() => { onSelect(option); onClose(); }}
                style={[s.modalOption, value === option && s.modalOptionActive]}
              >
                <Text style={[s.modalOptionText, value === option && s.modalOptionTextActive]}>
                  {option}
                </Text>
                {value === option && <Feather name="check" size={16} color="#6366f1" />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   CONFIRM MODAL
────────────────────────────────────────────────────────────────────────────── */

function ConfirmModal({ visible, onClose, onConfirm, icon, color, title, message, confirmLabel, loading }: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.confirmOverlay}>
        <View style={s.confirmBox}>
          <View style={[s.confirmIcon, { backgroundColor: `${color}15` }]}>
            <Feather name={icon} size={32} color={color} />
          </View>
          <Text style={s.confirmTitle}>{title}</Text>
          <Text style={s.confirmMessage}>{message}</Text>
          <View style={s.confirmButtons}>
            <Pressable onPress={onClose} disabled={loading} style={[s.confirmBtn, s.confirmBtnCancel]}>
              <Text style={s.confirmBtnTextCancel}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={[s.confirmBtn, s.confirmBtnAction, { backgroundColor: color }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={s.confirmBtnTextAction}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────────────────── */

export default function EventSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentEvent, fetchEventById, updateEvent, deleteEvent } = useEventStore();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    short_description: '',
    event_type: '',
    country: '',
    venue_name: '',
    venue_address: '',
    city: '',
    state: '',
    zip_code: '',
    timezone: '',
  });

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [confirmAction, setConfirmAction] = useState<{
    type: 'visibility' | 'module' | 'delete';
    icon: keyof typeof Feather.glyphMap;
    color: string;
    title: string;
    message: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);

  useEffect(() => {
    if (id) fetchEventById(id);
  }, [id]);

  useEffect(() => {
    if (currentEvent && currentEvent.id === id) {
      setForm({
        title: currentEvent.title || '',
        description: currentEvent.description || '',
        short_description: currentEvent.short_description || '',
        event_type: currentEvent.event_type || '',
        country: currentEvent.country || '',
        venue_name: currentEvent.venue_name || '',
        venue_address: currentEvent.venue_address || '',
        city: currentEvent.city || '',
        state: currentEvent.state || '',
        zip_code: currentEvent.zip_code || '',
        timezone: currentEvent.timezone || 'America/New_York',
      });
      if (currentEvent.starts_at_utc) {
        setStartDate(new Date(currentEvent.starts_at_utc));
      }
      if (currentEvent.ends_at_utc) {
        setEndDate(new Date(currentEvent.ends_at_utc));
      }
    }
  }, [currentEvent, id]);

  if (!currentEvent || currentEvent.id !== id) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <ActivityIndicator color={Colors.accent.indigo} />
        </View>
      </SafeAreaView>
    );
  }

  const isPublic = currentEvent.visibility === 'PUBLIC';

  async function saveChanges() {
    if (!id) return;
    setSaving(true);
    const payload = {
      ...form,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
    };
    const result = await updateEvent(id, payload);
    setSaving(false);
    if (result?.success) {
      notify.settingsSaved();
      fetchEventById(id);
    } else {
      notify.settingsFailed(result?.message);
    }
  }

  function requestToggleVisibility() {
    const nextValue = !isPublic;
    setConfirmAction({
      type: 'visibility',
      icon: nextValue ? 'globe' : 'lock',
      color: nextValue ? Colors.accent.indigo : Colors.accent.amber,
      title: nextValue ? 'Make event public?' : 'Make event private?',
      message: nextValue
        ? 'Your event page will be visible to everyone. Anyone with the link can view details.'
        : 'The public event page will be hidden. Only invited guests can access it.',
      confirmLabel: nextValue ? 'Make Public' : 'Make Private',
      action: async () => {
        setSaving(true);
        await updateEvent(id!, { visibility: nextValue ? 'PUBLIC' : 'PRIVATE' });
        setSaving(false);
        setConfirmAction(null);
        notify.settingsSaved();
        fetchEventById(id!);
      },
    });
  }

  function requestToggleModule(key: ModuleKey, nextValue: boolean, icon: keyof typeof Feather.glyphMap, color: string, title: string, message: string, label: string) {
    setConfirmAction({
      type: 'module',
      icon,
      color,
      title,
      message,
      confirmLabel: label,
      action: async () => {
        setSaving(true);
        await updateEvent(id!, { [key]: nextValue });
        setSaving(false);
        setConfirmAction(null);
        notify.settingsSaved();
        fetchEventById(id!);
      },
    });
  }

  function requestDelete() {
    setConfirmAction({
      type: 'delete',
      icon: 'trash-2',
      color: '#ef4444',
      title: 'Delete event permanently?',
      message: 'This action cannot be undone. All guests, tickets, and data will be permanently deleted.',
      confirmLabel: 'Delete Forever',
      action: async () => {
        setSaving(true);
        const result = await deleteEvent(id!);
        setSaving(false);
        setConfirmAction(null);
        if (result?.success) {
          router.replace('/events');
        }
      },
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Settings</Text>
          <Text style={s.headerSub} numberOfLines={1}>{currentEvent.title}</Text>
        </View>
        <Pressable
          onPress={saveChanges}
          disabled={saving}
          style={[s.saveBtn, saving && { opacity: 0.5 }]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="save" size={14} color="#fff" />
              <Text style={s.saveBtnText}>Save</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ──────────────────────────────────────────────────────────────────────
            SECTION 1: BRANDING & IDENTITY
        ────────────────────────────────────────────────────────────────────── */}
        <GlassCard>
          <SectionHeader
            icon="info"
            label="Branding & Identity"
            description="Define how your event appears"
            color={Colors.accent.indigo}
          />

          <Field label="Event Title" hint="Required">
            <Input
              value={form.title}
              onChangeText={t => setForm({ ...form, title: t })}
              placeholder="e.g. Summer Music Festival 2026"
            />
          </Field>

          <Field label="Short Description" hint="One-liner for previews">
            <Input
              value={form.short_description}
              onChangeText={t => setForm({ ...form, short_description: t })}
              placeholder="A brief tagline..."
            />
          </Field>

          <Field label="Full Description">
            <Input
              value={form.description}
              onChangeText={t => setForm({ ...form, description: t })}
              placeholder="Full event details..."
              multiline
            />
          </Field>

          <Field label="Event Type">
            <Input
              value={form.event_type}
              onChangeText={t => setForm({ ...form, event_type: t })}
              placeholder="e.g. Conference, Wedding, Concert"
            />
          </Field>

          <Field label="Country">
            <SelectField
              value={form.country}
              onPress={() => setShowCountryPicker(true)}
              placeholder="Select country"
            />
          </Field>
        </GlassCard>

        {/* ──────────────────────────────────────────────────────────────────────
            SECTION 2: DATE & LOCATION
        ────────────────────────────────────────────────────────────────────── */}
        <GlassCard style={{ marginTop: 20 }}>
          <SectionHeader
            icon="calendar"
            label="Date & Location"
            description="Logistics for venue and scheduling"
            color={Colors.accent.amber}
          />

          <Field label="Start Date & Time">
            <Pressable onPress={() => setShowStartDate(true)} style={s.dateBtn}>
              <Feather name="calendar" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={s.dateBtnText}>{startDate.toLocaleString()}</Text>
            </Pressable>
          </Field>

          {showStartDate && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              onChange={(e, date) => {
                setShowStartDate(false);
                if (date) setStartDate(date);
              }}
            />
          )}

          <Field label="End Date & Time">
            <Pressable onPress={() => setShowEndDate(true)} style={s.dateBtn}>
              <Feather name="calendar" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={s.dateBtnText}>{endDate.toLocaleString()}</Text>
            </Pressable>
          </Field>

          {showEndDate && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              onChange={(e, date) => {
                setShowEndDate(false);
                if (date) setEndDate(date);
              }}
            />
          )}

          <Field label="Timezone">
            <SelectField
              value={form.timezone}
              onPress={() => setShowTimezonePicker(true)}
              placeholder="Select timezone"
            />
          </Field>

          <Field label="Venue Name">
            <Input
              value={form.venue_name}
              onChangeText={t => setForm({ ...form, venue_name: t })}
              placeholder="e.g. Central Park"
            />
          </Field>

          <Field label="Venue Address">
            <Input
              value={form.venue_address}
              onChangeText={t => setForm({ ...form, venue_address: t })}
              placeholder="Street address"
            />
          </Field>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="City">
                <Input
                  value={form.city}
                  onChangeText={t => setForm({ ...form, city: t })}
                  placeholder="City"
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="State">
                <Input
                  value={form.state}
                  onChangeText={t => setForm({ ...form, state: t })}
                  placeholder="State"
                />
              </Field>
            </View>
          </View>

          <Field label="Zip Code">
            <Input
              value={form.zip_code}
              onChangeText={t => setForm({ ...form, zip_code: t })}
              placeholder="10001"
            />
          </Field>
        </GlassCard>

        {/* ──────────────────────────────────────────────────────────────────────
            SECTION 3: MODULES & FEATURES
        ────────────────────────────────────────────────────────────────────── */}
        <GlassCard style={{ marginTop: 20 }}>
          <SectionHeader
            icon="zap"
            label="Modules & Features"
            description="Extend your event functionality"
            color={Colors.accent.emerald}
          />

          {/* Visibility */}
          <Toggle
            icon={isPublic ? 'globe' : 'lock'}
            label={isPublic ? 'Public Event' : 'Private Event'}
            description={isPublic ? 'Visible to everyone' : 'Invitation only'}
            checked={isPublic}
            onChange={requestToggleVisibility}
            color={isPublic ? Colors.accent.indigo : Colors.accent.amber}
            saving={saving}
          />

          <View style={s.divider} />

          {/* RSVP */}
          <Toggle
            icon="users"
            label="RSVP"
            description="Allow guests to RSVP"
            checked={!!currentEvent.allow_rsvp}
            onChange={() => requestToggleModule(
              'allow_rsvp',
              !currentEvent.allow_rsvp,
              'users',
              Colors.accent.emerald,
              currentEvent.allow_rsvp ? 'Disable RSVP?' : 'Enable RSVP?',
              currentEvent.allow_rsvp
                ? 'RSVP button will be removed from your event page.'
                : 'Guests will be able to RSVP to your event.',
              currentEvent.allow_rsvp ? 'Disable RSVP' : 'Enable RSVP'
            )}
            color={Colors.accent.emerald}
            saving={saving}
          />

          {currentEvent.allow_rsvp && (
            <>
              <View style={s.divider} />
              <Toggle
                icon="unlock"
                label="Open RSVP"
                description="Anyone can RSVP (no invitation needed)"
                checked={!!currentEvent.open_rsvp}
                onChange={() => requestToggleModule(
                  'open_rsvp',
                  !currentEvent.open_rsvp,
                  'unlock',
                  Colors.accent.emerald,
                  currentEvent.open_rsvp ? 'Switch to invitation-only?' : 'Open RSVP to everyone?',
                  currentEvent.open_rsvp
                    ? 'Only invited guests can RSVP.'
                    : 'Anyone who visits can RSVP.',
                  currentEvent.open_rsvp ? 'Invitation Only' : 'Open to Everyone'
                )}
                color={Colors.accent.emerald}
                saving={saving}
              />
            </>
          )}

          <View style={s.divider} />

          {/* Ticketing */}
          <Toggle
            icon="credit-card"
            label="Ticketing"
            description="Sell or distribute tickets"
            checked={!!currentEvent.allow_ticketing}
            onChange={() => requestToggleModule(
              'allow_ticketing',
              !currentEvent.allow_ticketing,
              'credit-card',
              Colors.accent.amber,
              currentEvent.allow_ticketing ? 'Disable ticketing?' : 'Enable ticketing?',
              currentEvent.allow_ticketing
                ? 'Ticket sales will be turned off.'
                : 'Create free or paid ticket types.',
              currentEvent.allow_ticketing ? 'Disable Ticketing' : 'Enable Ticketing'
            )}
            color={Colors.accent.amber}
            saving={saving}
          />

          <View style={s.divider} />

          {/* QR Check-in */}
          <Toggle
            icon="camera"
            label="QR Check-in"
            description="Scan QR codes at the door"
            checked={!!currentEvent.allow_qr_checkin}
            onChange={() => requestToggleModule(
              'allow_qr_checkin',
              !currentEvent.allow_qr_checkin,
              'camera',
              Colors.accent.indigo,
              currentEvent.allow_qr_checkin ? 'Disable QR check-in?' : 'Enable QR check-in?',
              currentEvent.allow_qr_checkin
                ? 'Scanner will no longer accept QR codes.'
                : 'Scan guest QR codes to mark attendance.',
              currentEvent.allow_qr_checkin ? 'Disable QR' : 'Enable QR'
            )}
            color={Colors.accent.indigo}
            saving={saving}
          />

          <View style={s.divider} />

          {/* Donations */}
          <Toggle
            icon="heart"
            label="Donations"
            description="Accept contributions from guests"
            checked={!!currentEvent.allow_donations}
            onChange={() => requestToggleModule(
              'allow_donations',
              !currentEvent.allow_donations,
              'heart',
              '#f43f5e',
              currentEvent.allow_donations ? 'Disable donations?' : 'Enable donations?',
              currentEvent.allow_donations
                ? 'Donation option will be removed.'
                : 'Guests can contribute any amount.',
              currentEvent.allow_donations ? 'Disable Donations' : 'Enable Donations'
            )}
            color="#f43f5e"
            saving={saving}
          />
        </GlassCard>

        {/* ──────────────────────────────────────────────────────────────────────
            SECTION 4: SENSITIVE ACTIONS
        ────────────────────────────────────────────────────────────────────── */}
        <GlassCard style={{ marginTop: 20 }}>
          <SectionHeader
            icon="shield-alert"
            label="Sensitive Actions"
            description="Lifecycle management and safety tools"
            color="#ef4444"
          />

          <DangerButton
            icon="trash-2"
            label="Delete Event"
            description="Permanently delete this event and all data"
            onPress={requestDelete}
          />
        </GlassCard>
      </ScrollView>

      {/* Select Modals */}
      <SelectModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        title="Select Country"
        options={COUNTRIES}
        value={form.country}
        onSelect={v => setForm({ ...form, country: v })}
      />

      <SelectModal
        visible={showTimezonePicker}
        onClose={() => setShowTimezonePicker(false)}
        title="Select Timezone"
        options={TIMEZONES}
        value={form.timezone}
        onSelect={v => setForm({ ...form, timezone: v })}
      />

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          visible
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmAction.action}
          icon={confirmAction.icon}
          color={confirmAction.color}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          loading={saving}
        />
      )}
    </SafeAreaView>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   STYLES
────────────────────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent.indigo,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  content: { padding: 16 },

  glassCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    gap: 18,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 6 },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionLabel: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  sectionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontWeight: '500' },

  field: { gap: 8 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 2 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  fieldHint: { fontSize: 9, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' },

  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  inputMulti: { minHeight: 100, paddingTop: 12, textAlignVertical: 'top' },

  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectText: { fontSize: 14, color: '#fff', fontWeight: '500' },

  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateBtnText: { fontSize: 14, color: '#fff', fontWeight: '500', flex: 1 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
  },
  toggleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  toggleDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 4 },

  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.05)',
    padding: 14,
  },
  dangerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dangerLabel: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  dangerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  errorText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },

  // Select Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: '#09090f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '80%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  modalOptionActive: { backgroundColor: 'rgba(99,102,241,0.1)' },
  modalOptionText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  modalOptionTextActive: { color: '#6366f1', fontWeight: '700' },

  // Confirm Modal
  confirmOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 24,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#09090f',
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  confirmIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  confirmMessage: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  confirmButtons: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  confirmBtnCancel: { backgroundColor: 'rgba(255,255,255,0.06)' },
  confirmBtnAction: { backgroundColor: Colors.accent.indigo },
  confirmBtnTextCancel: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  confirmBtnTextAction: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
