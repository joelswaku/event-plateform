/**
 * eventapp-mobile/app/events/[id].tsx
 *
 * REDESIGNED — senior-grade, premium event detail screen.
 *
 * Layout:
 *   ┌─────────────────────────────────────┐
 *   │  Cover image hero (220px)           │
 *   │  ← back         ⋯ more             │
 *   │  Status pill     Event type badge   │
 *   │  Event title (large, bold)          │
 *   ├─────────────────────────────────────┤
 *   │  Countdown HRS : MIN : SEC          │
 *   │  Date + venue meta row              │
 *   ├─────────────────────────────────────┤
 *   │  Stats row: Guests · Attending      │
 *   │             Tickets · Scanned       │
 *   ├─────────────────────────────────────┤
 *   │  Quick action pills: RSVP / QR      │
 *   │  Primary CTA: Publish / Unpublish   │
 *   ├─────────────────────────────────────┤
 *   │  2×N feature grid                   │
 *   │  Builder · Guests                   │
 *   │  Tickets · Scanner                  │
 *   │  Analytics · Settings               │
 *   ├─────────────────────────────────────┤
 *   │  Delete (danger)                    │
 *   └─────────────────────────────────────┘
 *
 * All logic + API calls preserved from original.
 */

import React, {
  useEffect, useState, useCallback, useRef, useMemo,
} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, Dimensions, Animated, Easing, Modal, Share, Switch, TextInput,
} from 'react-native';
import { Image }          from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather }        from '@expo/vector-icons';
import * as Haptics       from 'expo-haptics';

import { useEventStore }  from '@/store/event.store';
import { usePlannerStore } from '@/store/planner.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { Colors }         from '@/constants/colors';
import { Config }         from '@/constants/config';
import api, { getToken }  from '@/lib/api';
import { ConfirmModal }   from '@/components/ui/ConfirmModal';
import { fmtDateTime }    from '@/lib/format';
import { DashboardPermissions } from '@/types';
import { notify, toast }  from '@/lib/toast';

const { width: SW } = Dimensions.get('window');

/* ──────────────────────────────────────────────────────────────────────────────
   EVENT REMINDERS MODAL COMPONENT
────────────────────────────────────────────────────────────────────────────── */

interface Reminder {
  id: number;
  enabled: boolean;
  timing: string;
  message: string;
  locked: boolean;
}

const TIMING_LABELS: Record<string, string> = {
  instant: 'Instant Confirmation',
  '7_days': '7 days before',
  '3_days': '3 days before',
  '24_hours': '24 hours before',
  '12_hours': '12 hours before',
  '6_hours': '6 hours before',
  '2_hours': '2 hours before',
  '1_hour': '1 hour before',
  '30_minutes': '30 minutes before',
  '15_minutes': '15 minutes before',
};

const SUGGESTED_MESSAGES: Record<string, string> = {
  instant: "Thank you for registering! We'll send you more details as the event approaches.",
  '7_days': 'Your event is 1 week away!',
  '3_days': 'Only 3 days until the event!',
  '24_hours': 'Event starts tomorrow! See you soon.',
  '12_hours': 'Event starts in 12 hours!',
  '6_hours': 'Event starts in 6 hours! Get ready.',
  '2_hours': 'Event starts in 2 hours!',
  '1_hour': 'Event starts in 1 hour!',
  '30_minutes': 'Event starts in 30 minutes!',
  '15_minutes': 'Event starts in 15 minutes!',
};

function EventRemindersModal({ visible, onClose, eventId, eventTitle }: {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { plan, isSubscribed, fetchSubscription } = useSubscriptionStore();
  const isPro = isSubscribed && (plan === 'pro' || plan === 'enterprise');
  const isStarter = isSubscribed && plan === 'starter';

  const defaultReminders: Reminder[] = [
    { id: 1, enabled: true, timing: 'instant', message: "Thank you for registering! We'll send you more details as the event approaches.", locked: true },
    { id: 2, enabled: false, timing: '1_hour', message: 'Event starts in 1 hour!', locked: false },
  ];

  // Free and Starter start with the two plan-included cards. Pro keeps any
  // additional saved custom reminders, while retaining the two base cards.
  const getRemindersForPlan = (saved: any[] = []): { visible: Reminder[]; hidden: Reminder[] } => {
    const toReminder = (reminder: any, id: number, fallback: Reminder): Reminder => ({
      id,
      enabled: reminder?.enabled ?? fallback.enabled,
      timing: reminder?.timing ?? fallback.timing,
      message: reminder?.message ?? fallback.message,
      locked: fallback.locked,
    });

    const instant = saved.find((reminder) => reminder.timing === 'instant');
    // The first scheduled reminder remains the included Starter reminder even
    // after the owner changes it from the default one-hour timing.
    const primaryCustom = saved.find((reminder) => reminder.timing === '1_hour')
      ?? saved.find((reminder) => reminder.timing !== 'instant');

    const baseReminders = [
      { ...toReminder(instant, 1, defaultReminders[0]), enabled: true, locked: true },
      {
        ...toReminder(primaryCustom, 2, defaultReminders[1]),
        // A downgraded Free account must never display a scheduled reminder as active.
        enabled: isStarter || isPro ? (primaryCustom?.enabled ?? defaultReminders[1].enabled) : false,
      },
    ];

    const extraReminders = saved
      .filter((reminder) => reminder.timing !== 'instant' && reminder !== primaryCustom)
      .map((reminder, index) => toReminder(reminder, index + 3, defaultReminders[1]));

    return isPro
      ? { visible: [...baseReminders, ...extraReminders], hidden: [] }
      : { visible: baseReminders, hidden: extraReminders };
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(defaultReminders);
  const [hiddenReminders, setHiddenReminders] = useState<Reminder[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [showTimingPicker, setShowTimingPicker] = useState<number | null>(null);
  const [upgradeTier, setUpgradeTier] = useState<'starter' | 'pro' | null>(null);

  useEffect(() => {
    if (visible && eventId) {
      void fetchSubscription();
      fetchReminders();
    }
  }, [visible, eventId, isStarter, isPro, fetchSubscription]);

  async function fetchReminders() {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await api.get<{ success?: boolean; data?: Reminder[] }>(`/events/${eventId}/reminders`);
      const data = res.data;
      const planReminders = getRemindersForPlan(data.success && Array.isArray(data.data) ? data.data : []);
      setReminders(planReminders.visible);
      setHiddenReminders(planReminders.hidden);
    } catch (error) {
      console.error('Failed to fetch reminders:', error);
      const planReminders = getRemindersForPlan();
      setReminders(planReminders.visible);
      setHiddenReminders(planReminders.hidden);
    } finally {
      setLoading(false);
    }
  }

  async function saveReminders() {
    if (!eventId) return;
    setSaving(true);
    try {
      // Preserve older Pro reminders as disabled when a user has downgraded.
      // The API replaces the reminder list on save, so omitting them would
      // permanently delete their configuration.
      const remindersToSave = isPro
        ? reminders
        : [...reminders, ...hiddenReminders.map(reminder => ({ ...reminder, enabled: false, locked: false }))];
      const cleanReminders = remindersToSave.map(r => ({
        timing: r.timing,
        message: r.message,
        enabled: r.enabled,
        locked: r.locked || false,
      }));

      const res = await api.post<{ success?: boolean; error?: string; message?: string }>(`/events/${eventId}/reminders`, {
        reminders: cleanReminders,
      });
      const data = res.data;
      if (data.success) {
        toast.success('Reminders saved successfully!');
        onClose();
      } else {
        toast.error(data.error || data.message || 'Failed to save reminders');
      }
    } catch (error) {
      console.error('Failed to save reminders:', error);
      toast.error('Failed to save reminders');
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(reminder: Reminder) {
    if (reminder.locked) return;
    if (!reminder.enabled && !isStarter && !isPro) {
      setUpgradeTier('starter');
      return;
    }
    setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, enabled: !r.enabled } : r));
  }

  function handleRemove(id: number) {
    // Keep the included scheduled-reminder card visible for every plan.
    if (id === 2) return;
    setReminders(prev => prev.filter(r => r.id !== id || r.locked));
  }

  function handleAddReminder() {
    if (!isPro) {
      setUpgradeTier(isStarter ? 'pro' : 'starter');
      return;
    }
    // Pro plan limit: 5 total reminders maximum
    if (reminders.length >= 5) {
      toast.error('You have reached the maximum of 5 reminders for Pro plan.');
      return;
    }
    const newId = Math.max(...reminders.map(r => r.id), 0) + 1;
    const timing = Object.keys(TIMING_LABELS).find(
      option => !reminders.some(reminder => reminder.timing === option),
    ) ?? '1_hour';
    setReminders(prev => [...prev, {
      id: newId,
      enabled: false,
      timing,
      message: SUGGESTED_MESSAGES[timing] || 'Reminder about your upcoming event.',
      locked: false,
    }]);
    toast.success('Custom reminder added!');
  }

  function handleEditStart(reminder: Reminder) {
    setEditingId(reminder.id);
    setEditMessage(reminder.message);
  }

  function handleEditSave(id: number) {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, message: editMessage } : r));
    setEditingId(null);
    setEditMessage('');
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditMessage('');
  }

  function handleTimingChange(id: number, newTiming: string) {
    if (reminders.some(reminder => reminder.id !== id && reminder.timing === newTiming)) {
      toast.error('A reminder already uses this timing. Choose another time.');
      return;
    }
    setReminders(prev => prev.map(r => {
      if (r.id === id) {
        const suggestedMessage = SUGGESTED_MESSAGES[newTiming] || 'Reminder about your upcoming event.';
        return { ...r, timing: newTiming, message: suggestedMessage };
      }
      return r;
    }));
    setShowTimingPicker(null);
  }


  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={rms.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[rms.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={rms.handle} />

          {/* Header */}
          <View style={rms.header}>
            <View style={rms.headerIcon}>
              <Feather name="bell" size={20} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={rms.title}>Event Reminders</Text>
              {!!eventTitle && <Text style={rms.eventTitle}>{eventTitle}</Text>}
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
          ) : (
            <>
              <ScrollView style={rms.scrollView} showsVerticalScrollIndicator={false}>
                <View style={rms.content}>
                  <Text style={rms.introText}>
                    Automatically send email reminders to your guests. Customize timing and messages below.
                  </Text>

                  {/* Reminder Cards */}
                  {reminders.map((reminder) => (
                    <View key={reminder.id} style={rms.reminderCard}>
                      {/* Header with timing and toggle */}
                      <View style={rms.cardHeader}>
                        <View style={{ flex: 1 }}>
                          {/* Timing - clickable if not locked */}
                          {reminder.locked ? (
                            <Text style={rms.cardTitle}>{TIMING_LABELS[reminder.timing]}</Text>
                          ) : (
                            <Pressable style={rms.timingTrigger} onPress={() => setShowTimingPicker(reminder.id)}>
                              <Text style={rms.cardTitle}>
                                {TIMING_LABELS[reminder.timing]}
                              </Text>
                              <Feather name="chevron-down" size={16} color="#a5b4fc" />
                            </Pressable>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <View style={[rms.badge, reminder.enabled ? rms.badgeActive : rms.badgeInactive]}>
                              <Text style={[rms.badgeText, reminder.enabled && rms.badgeTextActive]}>
                                {reminder.enabled ? 'Active' : 'Inactive'}
                              </Text>
                            </View>
                            {reminder.locked && (
                              <View style={[rms.badge, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                                <Text style={[rms.badgeText, { color: '#f59e0b' }]}>Required</Text>
                              </View>
                            )}
                            {!reminder.locked && !isStarter && !isPro && (
                              <View style={[rms.badge, rms.badgeLocked]}>
                                <Feather name="lock" size={10} color="#f59e0b" />
                                <Text style={[rms.badgeText, rms.badgeTextLocked]}>Starter</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Switch
                          value={reminder.enabled}
                          onValueChange={() => handleToggle(reminder)}
                          disabled={reminder.locked}
                          trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#6366f1' }}
                          thumbColor="#fff"
                          ios_backgroundColor="rgba(255,255,255,0.1)"
                        />
                      </View>

                      {/* Message */}
                      <Text style={rms.cardMessage}>{reminder.message}</Text>

                      {/* Actions - only show edit inline if not in edit mode */}
                      {editingId === reminder.id ? (
                        <View style={{ gap: 8 }}>
                          <TextInput
                            style={[rms.editInput, { minHeight: 60 }]}
                            value={editMessage}
                            onChangeText={setEditMessage}
                            placeholder="Enter reminder message..."
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            multiline
                          />
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Pressable
                              style={[rms.editBtn, { flex: 1, backgroundColor: '#6366f1' }]}
                              onPress={() => handleEditSave(reminder.id)}
                            >
                              <Feather name="check" size={14} color="#fff" />
                              <Text style={[rms.editBtnText, { color: '#fff' }]}>Save</Text>
                            </Pressable>
                            <Pressable
                              style={[rms.editBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}
                              onPress={handleEditCancel}
                            >
                              <Feather name="x" size={14} color="rgba(255,255,255,0.6)" />
                              <Text style={[rms.editBtnText, { color: 'rgba(255,255,255,0.6)' }]}>Cancel</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={rms.cardActions}>
                          <Pressable
                            style={rms.editBtn}
                            onPress={() => handleEditStart(reminder)}
                          >
                            <Feather name="edit-2" size={12} color="#6366f1" />
                            <Text style={rms.editBtnText}>Edit</Text>
                          </Pressable>
                          {!reminder.locked && reminder.id !== 2 && (
                            <Pressable
                              style={rms.deleteBtn}
                              onPress={() => handleRemove(reminder.id)}
                            >
                              <Feather name="trash-2" size={12} color="#ef4444" />
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Add Custom Reminder */}
                  <Pressable style={rms.addBtn} onPress={handleAddReminder}>
                    <Feather name={isPro ? 'plus' : 'lock'} size={16} color="#6366f1" />
                    <Text style={rms.addBtnText}>{isPro ? 'Add Custom Reminder' : isStarter ? 'Upgrade to Pro for More Reminders' : 'Upgrade to Add Custom Reminders'}</Text>
                  </Pressable>

                  {/* Info Box */}
                  <View style={rms.infoBox}>
                    <Feather name="info" size={14} color="#6366f1" />
                    <View style={{ flex: 1 }}>
                      <Text style={rms.infoTitle}>Automatic Reminders</Text>
                      <Text style={rms.infoText}>
                        Reminders are sent automatically via email to all confirmed guests based on your schedule.
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={[rms.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <Pressable style={rms.cancelBtn} onPress={onClose} disabled={saving}>
                  <Text style={rms.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[rms.saveBtn, saving && { opacity: 0.5 }]}
                  onPress={saveReminders}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="save" size={14} color="#fff" />
                      <Text style={rms.saveText}>Save Reminders</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>

      {/* In-sheet timing picker — visible above the reminder sheet. */}
      {showTimingPicker !== null && (
        <View style={rms.timingOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTimingPicker(null)} />
          <View style={[rms.timingSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={rms.timingSheetHeader}>
              <Text style={rms.editTitle}>Select reminder time</Text>
              <Pressable onPress={() => setShowTimingPicker(null)} hitSlop={10}>
                <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>
            <ScrollView style={rms.timingList} showsVerticalScrollIndicator={false}>
              {Object.entries(TIMING_LABELS).map(([key, label]) => {
                const selected = reminders.find(reminder => reminder.id === showTimingPicker)?.timing === key;
                const inUse = reminders.some(reminder => reminder.id !== showTimingPicker && reminder.timing === key);
                return (
                  <Pressable
                    key={key}
                    style={[rms.timingOption, selected && rms.timingOptionSelected, inUse && rms.timingOptionDisabled]}
                    onPress={() => !inUse && handleTimingChange(showTimingPicker, key)}
                    disabled={inUse}
                  >
                    <Text style={[rms.timingOptionText, inUse && rms.timingOptionTextDisabled]}>{label}</Text>
                    {selected && <Feather name="check" size={16} color="#a5b4fc" />}
                    {inUse && <Text style={rms.timingUsedText}>In use</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {upgradeTier !== null && (
        <View style={rms.upgradeOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setUpgradeTier(null)} />
          <View style={rms.upgradeCard}>
            <View style={rms.upgradeIcon}>
              <Feather name={upgradeTier === 'starter' ? 'bell' : 'zap'} size={22} color="#fff" />
            </View>
            <Text style={rms.upgradeTitle}>
              {upgradeTier === 'starter' ? 'Enable email reminders' : 'More reminders need Pro'}
            </Text>
            <Text style={rms.upgradeText}>
              {upgradeTier === 'starter'
                ? 'Instant Confirmation is included free. Upgrade to Starter to turn on the 1-hour reminder.'
                : 'Starter includes one custom reminder. Upgrade to Pro to add more reminder times.'}
            </Text>
            <View style={rms.upgradeActions}>
              <Pressable style={rms.upgradeCancel} onPress={() => setUpgradeTier(null)}>
                <Text style={rms.upgradeCancelText}>Not now</Text>
              </Pressable>
              <Pressable
                style={rms.upgradeButton}
                onPress={() => {
                  const tier = upgradeTier;
                  setUpgradeTier(null);
                  onClose();
                  router.push(`/profile/billing?plan=${tier}` as never);
                }}
              >
                <Text style={rms.upgradeButtonText}>View {upgradeTier === 'starter' ? 'Starter' : 'Pro'} plan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </Modal>
  );
}

const rms = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: '#09090f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  eventTitle: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 },
  scrollView: { maxHeight: 550 },
  content: { padding: 20, gap: 16 },
  introText: { fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 19, marginBottom: 2 },

  // Reminder Card
  reminderCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timingTrigger: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(148,163,184,0.1)',
    borderColor: 'rgba(148,163,184,0.2)',
  },
  badgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  badgeTextActive: { color: '#10b981' },
  badgeTextLocked: { color: '#f59e0b' },
  cardMessage: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 19 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#6366f1' },
  deleteBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },

  // Add Button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(99,102,241,0.3)',
    backgroundColor: 'rgba(99,102,241,0.05)',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#6366f1' },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(99,102,241,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  infoTitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  infoText: { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 16 },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366f1',
  },
  saveText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Timing picker
  timingOverlay: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.56)',
  },
  timingSheet: {
    width: '100%',
    maxHeight: '72%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#09090f',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  timingSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  timingList: { maxHeight: 410 },
  timingOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  timingOptionSelected: { backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(129,140,248,0.65)' },
  timingOptionDisabled: { opacity: 0.45 },
  timingOptionText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
  timingOptionTextDisabled: { color: 'rgba(255,255,255,0.55)' },
  timingUsedText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.42)' },

  // Upgrade paywall
  upgradeOverlay: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    paddingHorizontal: 24,
  },
  upgradeCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    backgroundColor: '#11121a',
    padding: 24,
  },
  upgradeIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#6366f1',
    marginBottom: 14,
  },
  upgradeTitle: { fontSize: 19, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8 },
  upgradeText: { fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.62)', textAlign: 'center', marginBottom: 22 },
  upgradeActions: { width: '100%', flexDirection: 'row', gap: 10 },
  upgradeCancel: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 13, backgroundColor: 'rgba(255,255,255,0.07)' },
  upgradeCancelText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.68)' },
  upgradeButton: { flex: 1.45, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 13, backgroundColor: '#6366f1' },
  upgradeButtonText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  editTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 16 },
  editInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

/* ── Fallback images per event type ─────────────────────────────── */
const TYPE_IMG: Record<string, string> = {
  wedding:         'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  concert:         'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
  conference:      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  birthday:        'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80',
  corporate_event: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  festival:        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
  networking:      'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
  charity:         'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80';

function coverImg(event: any): string {
  if (event?.cover_image_url) return event.cover_image_url;
  return TYPE_IMG[event?.event_type?.toLowerCase() ?? ''] ?? DEFAULT_IMG;
}

/* ── Status config ───────────────────────────────────────────────── */
const STATUS: Record<string, { color: string; bg: string; dot: string; label: string }> = {
  PUBLISHED: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', dot: '#10b981', label: 'Published'  },
  DRAFT:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', dot: '#f59e0b', label: 'Draft'      },
  ARCHIVED:  { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', dot: '#9ca3af', label: 'Archived'  },
  CANCELLED: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  dot: '#ef4444', label: 'Cancelled'  },
};

/* ── Live countdown ──────────────────────────────────────────────── */
function useLiveCountdown(iso?: string | null) {
  const [diff, setDiff] = useState({ d: 0, h: 0, m: 0, s: 0, past: false });

  useEffect(() => {
    if (!iso) return;
    const tick = () => {
      const ms = new Date(iso).getTime() - Date.now();
      if (ms <= 0) { setDiff({ d: 0, h: 0, m: 0, s: 0, past: true }); return; }
      const tot = Math.floor(ms / 1000);
      setDiff({
        d: Math.floor(tot / 86400),
        h: Math.floor((tot % 86400) / 3600),
        m: Math.floor((tot % 3600) / 60),
        s: tot % 60,
        past: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);

  return diff;
}

/* ── Active modules strip ────────────────────────────────────────── */
const MODULE_CFG = [
  { key: 'allow_rsvp',       icon: 'users'       as const, label: 'RSVP',       color: Colors.accent.emerald },
  { key: 'allow_ticketing',  icon: 'credit-card' as const, label: 'Ticketing',  color: Colors.accent.amber   },
  { key: 'allow_qr_checkin', icon: 'camera'      as const, label: 'QR Check-in',color: '#06b6d4'             },
  { key: 'allow_donations',  icon: 'heart'       as const, label: 'Donations',  color: '#f43f5e'             },
];

function ActiveModulesStrip({ event }: { event: any }) {
  const active = MODULE_CFG.filter(m => !!event[m.key]);
  if (!active.length) return null;
  return (
    <View style={am.row}>
      {active.map(m => (
        <View key={m.key} style={[am.chip, { backgroundColor: `${m.color}14`, borderColor: `${m.color}35` }]}>
          <View style={[am.dot, { backgroundColor: m.color }]} />
          <Feather name={m.icon} size={11} color={m.color} />
          <Text style={[am.label, { color: m.color }]}>{m.label}</Text>
        </View>
      ))}
    </View>
  );
}
const am = StyleSheet.create({
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  dot:   { width: 5, height: 5, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});

/* ── Ticket hero card ────────────────────────────────────────────── */
function TicketHeroCard({ eventId, ticketCount, checkinCount, router }: {
  eventId: string; ticketCount: number; checkinCount: number; router: any;
}) {
  const scanY    = useRef(new Animated.Value(0)).current;
  const glowOpac = useRef(new Animated.Value(0.55)).current;
  const [cardH,  setCardH] = useState(170);

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 3500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpac, { toValue: 0.95, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowOpac, { toValue: 0.45, duration: 1400, useNativeDriver: true }),
      ])
    );

    scanLoop.start();
    glowLoop.start();

    // Ticket cards are mounted every time an event is opened. Stop both
    // infinite loops on exit so Android does not accumulate native animations
    // after visiting several event and ticket pages.
    return () => {
      scanLoop.stop();
      glowLoop.stop();
      scanY.stopAnimation();
      glowOpac.stopAnimation();
    };
  }, [glowOpac, scanY]);

  const scanTranslate = scanY.interpolate({ inputRange: [0, 1], outputRange: [-2, cardH] });
  const pct = ticketCount > 0 && checkinCount > 0 ? Math.min((checkinCount / ticketCount) * 100, 100) : 0;

  return (
    <Pressable
      style={tc.card}
      onLayout={e => setCardH(e.nativeEvent.layout.height)}
      onPress={() => router.push(`/events/${eventId}/tickets` as never)}
    >
      {/* Glowing accent top bar */}
      <Animated.View style={[tc.accentBar, { opacity: glowOpac }]} />

      {/* Sweeping scan line */}
      <Animated.View style={[tc.scanLine, { transform: [{ translateY: scanTranslate }] }]} />

      {/* Header */}
      <View style={tc.header}>
        <View style={tc.badge}>
          <Text style={tc.badgeTxt}>🎟 Tickets</Text>
        </View>
        <View style={tc.livePill}>
          <View style={tc.liveDot} />
          <Text style={tc.liveTxt}>LIVE</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={tc.stats}>
        <View style={tc.statItem}>
          <Text style={tc.statNum}>{ticketCount}</Text>
          <Text style={tc.statLabel}>Issued</Text>
        </View>
        <View style={tc.statDivider} />
        <View style={tc.statItem}>
          <Text style={[tc.statNum, { color: Colors.accent.emerald }]}>{checkinCount}</Text>
          <Text style={tc.statLabel}>Checked In</Text>
        </View>
        <View style={tc.statDivider} />
        <View style={tc.statItem}>
          <Text style={[tc.statNum, { color: Colors.accent.amber }]}>
            {Math.round(pct)}<Text style={{ fontSize: 14 }}>%</Text>
          </Text>
          <Text style={tc.statLabel}>Check-in Rate</Text>
        </View>
      </View>

      {/* Progress bar */}
      {ticketCount > 0 && (
        <View style={tc.progWrap}>
          <View style={tc.progBg}>
            <LinearGradient
              colors={[Colors.accent.indigo, Colors.accent.violet]}
              style={[tc.progFill, { width: `${pct}%` as `${number}%` }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
        </View>
      )}

      {/* CTA row */}
      <View style={tc.cta}>
        <Text style={tc.ctaTxt}>View all tickets</Text>
        <Feather name="arrow-right" size={13} color={Colors.accent.indigo} />
      </View>
    </Pressable>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCREEN
══════════════════════════════════════════════════════════════════ */
export default function EventDetailScreen() {
  const { id }    = useLocalSearchParams<{ id: string }>();
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const scrollY   = useRef(new Animated.Value(0)).current;

  const {
    events, currentEvent, dashboard,
    fetchEvents, fetchEventById, fetchEventDashboard,
    publishEvent, unpublishEvent, archiveEvent, restoreEvent, deleteEvent, updateEvent,
  } = useEventStore();

  const { projects: plannerProjects, fetchProjects: fetchPlannerProjects } = usePlannerStore();
  useEffect(() => { fetchPlannerProjects(); }, []);

  const [loading,  setLoading]  = useState(false);
  const [modal,    setModal]    = useState<{
    action: () => Promise<any>; title: string; desc: string; danger: boolean;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  /* ── Module toggle state ── */
  const [modLocal, setModLocal] = useState({
    allow_rsvp:      false,
    allow_ticketing: false,
    allow_donations: false,
  });
  const [modSaving,     setModSaving]     = useState<Record<string, boolean>>({});
  const [pendingModule, setPendingModule] = useState<{
    key: string; next: boolean; title: string; msg: string;
    color: string; icon: keyof typeof Feather.glyphMap;
    afterConfirm?: () => void;
  } | null>(null);

  const EXCL_MODS = ['allow_rsvp', 'allow_ticketing', 'allow_donations'];
  const MOD_LABEL: Record<string, string> = {
    allow_rsvp: 'RSVP', allow_ticketing: 'Ticketing', allow_donations: 'Donations',
  };
  const MOD_COLOR: Record<string, string> = {
    allow_rsvp: Colors.accent.emerald, allow_ticketing: Colors.accent.amber, allow_donations: '#f43f5e',
  };
  const MOD_ICON: Record<string, keyof typeof Feather.glyphMap> = {
    allow_rsvp: 'users', allow_ticketing: 'credit-card', allow_donations: 'heart',
  };

  const refresh = useCallback(() => {
    fetchEvents();
    if (id) {
      fetchEventById(id);
      fetchEventDashboard(id);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [id]);

  // Re-fetch every time this screen gains focus (e.g. coming back from Settings)
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Merge: individual event (has all flags) + dashboard stats (has live counts)
  const baseEvent   = (currentEvent?.id === id ? currentEvent : null) ?? events.find(e => e.id === id);
  const dashStats   = dashboard?.event?.id === id ? dashboard.stats : null;
  const userRole    = dashboard?.event?.id === id ? (dashboard.userRole ?? 'OWNER') : 'OWNER';
  const permissions = dashboard?.event?.id === id ? dashboard.permissions : null;

  // Default full permissions for owners (or when dashboard hasn't loaded yet)
  const perms: DashboardPermissions = permissions ?? {
    canEdit: true, canDelete: true, canManageTeam: true,
    canManageGuests: true, canCheckin: true, canViewAnalytics: true, canPublish: true,
  };

  const isOwner = !userRole || userRole === 'OWNER';

  const event: any  = useMemo(() => {
    if (!baseEvent) return null;
    return {
      ...baseEvent,
      guest_count:    dashStats?.guest_count    ?? (baseEvent as any).guest_count    ?? 0,
      attending_count:dashStats?.attending_count?? (baseEvent as any).attending_count?? 0,
      ticket_count:   dashStats?.ticket_count   ?? (baseEvent as any).ticket_count   ?? 0,
      checkin_count:  dashStats?.checkin_count  ?? (baseEvent as any).checkin_count  ?? 0,
    };
  }, [baseEvent, dashStats]);
  const status = event?.status ?? 'DRAFT';
  const statusCfg = STATUS[status] ?? STATUS.DRAFT;
  const countdown = useLiveCountdown(event?.starts_at_utc);

  /* Sync modLocal whenever event data updates */
  useEffect(() => {
    if (event) {
      setModLocal({
        allow_rsvp:      !!event.allow_rsvp,
        allow_ticketing: !!event.allow_ticketing,
        allow_donations: !!event.allow_donations,
      });
    }
  }, [event?.allow_rsvp, event?.allow_ticketing, event?.allow_donations]);

  const requestModule = useCallback((key: string, afterConfirm?: () => void) => {
    if (modSaving[key]) return;
    const next = !modLocal[key as keyof typeof modLocal];
    const conflicts = EXCL_MODS
      .filter(k => k !== key && modLocal[k as keyof typeof modLocal])
      .map(k => MOD_LABEL[k])
      .filter(Boolean);
    const label = MOD_LABEL[key] ?? key;
    const msg = (next && conflicts.length)
      ? `Enabling ${label} will turn off ${conflicts.join(' & ')}. Only one module can be active at a time.`
      : next
      ? `Enable ${label} for this event.`
      : `Disable ${label} for this event.`;
    setPendingModule({
      key, next,
      title: next ? `Enable ${label}?` : `Disable ${label}?`,
      msg,
      color: MOD_COLOR[key],
      icon:  MOD_ICON[key],
      afterConfirm,
    });
  }, [modLocal, modSaving]);

  const confirmModule = useCallback(async () => {
    if (!pendingModule) return;
    const { key, next, afterConfirm } = pendingModule;
    setPendingModule(null);
    let payload: any;
    let newLocal: typeof modLocal;
    if (next && EXCL_MODS.includes(key)) {
      payload  = { allow_rsvp: key === 'allow_rsvp', allow_ticketing: key === 'allow_ticketing', allow_donations: key === 'allow_donations', open_rsvp: false };
      newLocal = { ...modLocal, allow_rsvp: key === 'allow_rsvp', allow_ticketing: key === 'allow_ticketing', allow_donations: key === 'allow_donations' };
    } else if (!next && key === 'allow_rsvp') {
      payload  = { allow_rsvp: false, open_rsvp: false };
      newLocal = { ...modLocal, allow_rsvp: false };
    } else {
      payload  = { [key]: next };
      newLocal = { ...modLocal, [key]: next };
    }
    setModLocal(newLocal);
    const affected = Object.keys(payload);
    setModSaving(s => ({ ...s, ...Object.fromEntries(affected.map(k => [k, true])) }));
    await updateEvent(id, payload);
    setModSaving(s => ({ ...s, ...Object.fromEntries(affected.map(k => [k, false])) }));
    await refresh();
    if (afterConfirm) afterConfirm();
  }, [pendingModule, modLocal, updateEvent, id, refresh]);

  const handleFeaturePress = useCallback((route: string, label: string) => {
    if (label === 'Reminders') {
      setRemindersModalOpen(true);
      return;
    }
    if (label === 'Guests' && !modLocal.allow_rsvp) {
      requestModule('allow_rsvp', () => router.push(route as never));
      return;
    }
    if (label === 'Tickets' && !modLocal.allow_ticketing) {
      requestModule('allow_ticketing', () => router.push(route as never));
      return;
    }
    if (label === 'Donations' && !modLocal.allow_donations) {
      requestModule('allow_donations', () => router.push(route as never));
      return;
    }
    router.push(route as never);
  }, [modLocal.allow_rsvp, modLocal.allow_ticketing, modLocal.allow_donations, requestModule, router]);

  const run = useCallback(async (fn: () => Promise<any>) => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await fn();
      await refresh();
    } catch (error) {
      console.error('Run error:', error);
      notify.error('Action failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const openMenu = useCallback(() => {
    menuAnim.setValue(0);
    setMenuOpen(true);
    Animated.spring(menuAnim, { toValue: 1, useNativeDriver: true, bounciness: 3 }).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [menuAnim]);

  const closeMenu = useCallback(() => {
    Animated.timing(menuAnim, { toValue: 0, duration: 220, useNativeDriver: true })
      .start(() => setMenuOpen(false));
  }, [menuAnim]);

  /* ── Topbar opacity on scroll ── */
  const headerBg = scrollY.interpolate({
    inputRange: [120, 180], outputRange: ['rgba(14,15,17,0)', 'rgba(14,15,17,0.98)'], extrapolate: 'clamp',
  });

  if (!event) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.accent.indigo} />
      </View>
    );
  }

  const img  = coverImg(event);
  const date = event.starts_at_local ?? event.starts_at_utc;

  /* Feature grid */
  const plannerProject = plannerProjects.find(p => (p as any).event_id === id || (p as any).eventId === id);
  const plannerRoute   = plannerProject ? `/planner/${plannerProject.id}` : `/planner/new?eventId=${id}`;

  const ALL_FEATURES = [
    { icon: 'layout'      as const, label: 'Builder',   sub: 'Design event page',        accent: Colors.accent.indigo,  grad: ['#4f46e5','#6366f1'] as const, route: `/events/${id}/builder`,   show: perms.canEdit           },
    { icon: 'clipboard'   as const, label: 'Planner',   sub: 'AI-powered event plan',    accent: '#8b5cf6',             grad: ['#7c3aed','#8b5cf6'] as const, route: plannerRoute,              show: perms.canEdit           },
    { icon: 'users'       as const, label: 'Guests',    sub: 'Manage attendees',         accent: Colors.accent.emerald, grad: ['#059669','#10b981'] as const, route: `/events/${id}/guests`,    show: perms.canManageGuests   },
    { icon: 'bell'        as const, label: 'Reminders', sub: 'Automated notifications',  accent: '#ec4899',             grad: ['#db2777','#ec4899'] as const, route: 'reminders',                show: perms.canManageGuests   },
    { icon: 'credit-card' as const, label: 'Tickets',   sub: 'Types & orders',           accent: Colors.accent.amber,   grad: ['#d97706','#f59e0b'] as const, route: `/events/${id}/tickets`,   show: perms.canEdit           },
    { icon: 'grid'        as const, label: 'Seating',   sub: 'Seat assignments',         accent: '#06b6d4',             grad: ['#0891b2','#06b6d4'] as const, route: `/events/${id}/seating`,   show: perms.canEdit           },
    { icon: 'bar-chart-2' as const, label: 'Analytics', sub: 'Revenue & insights',       accent: Colors.accent.violet,  grad: ['#7c3aed','#8b5cf6'] as const, route: `/events/${id}/analytics`, show: perms.canViewAnalytics  },
    { icon: 'heart'       as const, label: 'Donations', sub: 'Track contributions',      accent: '#f43f5e',             grad: ['#be185d','#f43f5e'] as const, route: `/events/${id}/donations`, show: perms.canEdit           },
    { icon: 'user-plus'   as const, label: 'Team',      sub: 'Manage admins',            accent: '#06b6d4',             grad: ['#0891b2','#06b6d4'] as const, route: `/events/${id}/team`,      show: perms.canManageTeam     },
    { icon: 'settings'    as const, label: 'Settings',  sub: 'Edit event details',       accent: '#6b7280',             grad: ['#374151','#4b5563'] as const, route: `/events/${id}/settings`,  show: perms.canEdit           },
  ];
  const FEATURES = ALL_FEATURES.filter(f => f.show);

  const ALL_STAT_ITEMS = [
    { icon: 'users'       as const, label: 'Guests',    value: event.guest_count    ?? 0, accent: Colors.accent.indigo,  modules: ['allow_rsvp'] },
    { icon: 'user-check'  as const, label: 'Attending', value: event.attending_count ?? 0, accent: Colors.accent.emerald, modules: ['allow_rsvp'] },
    { icon: 'user-x'      as const, label: 'Pending',   value: (event.guest_count ?? 0) - (event.attending_count ?? 0), accent: Colors.accent.amber, modules: ['allow_rsvp'] },
    { icon: 'credit-card' as const, label: 'Types',     value: event.ticket_count   ?? 0, accent: Colors.accent.indigo,  modules: ['allow_ticketing'] },
    { icon: 'shopping-bag'as const, label: 'Sold',      value: event.checkin_count  ?? 0, accent: Colors.accent.amber,   modules: ['allow_ticketing'] },
    { icon: 'check-circle'as const, label: 'Scanned',   value: event.checkin_count  ?? 0, accent: Colors.accent.emerald, modules: ['allow_ticketing'] },
    { icon: 'heart'       as const, label: 'Donations', value: 0,                          accent: '#f43f5e',             modules: ['allow_donations'] },
    { icon: 'users'       as const, label: 'Donors',    value: 0,                          accent: Colors.accent.violet,  modules: ['allow_donations'] },
    { icon: 'dollar-sign' as const, label: 'Total',     value: 0,                          accent: Colors.accent.emerald, modules: ['allow_donations'] },
  ];
  // Filter stats based on active modules
  const STAT_ITEMS = ALL_STAT_ITEMS.filter(stat =>
    stat.modules.some(module => event[module as keyof typeof event])
  );

  type MenuItem = {
    icon: React.ComponentProps<typeof Feather>['name'];
    label: string; sub: string; accent: string;
    danger?: boolean; onPress: () => void;
  };
  const MENU_ITEMS: MenuItem[] = [];
  if (perms.canEdit) {
    MENU_ITEMS.push({
      icon: 'edit-2', label: 'Edit Event', sub: 'Update details & settings',
      accent: Colors.accent.indigo,
      onPress: () => { closeMenu(); router.push(`/events/${id}/edit` as never); },
    });
  }
  if (event?.slug) {
    MENU_ITEMS.push({
      icon: 'globe', label: 'See Website',
      sub: status === 'PUBLISHED' ? 'View live event page' : 'Preview your event page',
      accent: '#06b6d4',
      onPress: () => {
        closeMenu();
        router.push(`/events/${id}/preview` as never);
      },
    });
    MENU_ITEMS.push({
      icon: 'share-2', label: 'Share Event', sub: 'Copy or share the link',
      accent: Colors.accent.emerald,
      onPress: async () => {
        closeMenu();
        await new Promise(r => setTimeout(r, 300));
        try {
          await Share.share({
            message: `${Config.WEB_URL}/e/${event.slug}`,
            url: `${Config.WEB_URL}/e/${event.slug}`,
          });
        } catch { /* user cancelled */ }
      },
    });
  }
  if (perms.canPublish && status === 'DRAFT') {
    MENU_ITEMS.push({
      icon: 'send', label: 'Publish Event', sub: 'Make it publicly visible',
      accent: Colors.accent.indigo,
      onPress: () => {
        closeMenu();
        setModal({ action: () => run(() => publishEvent(id)), title: 'Publish this event?', desc: 'Your event will be publicly visible.', danger: false });
      },
    });
  }
  if (perms.canPublish && status === 'PUBLISHED') {
    MENU_ITEMS.push({
      icon: 'eye-off', label: 'Unpublish', sub: 'Move back to draft',
      accent: Colors.accent.amber,
      onPress: () => {
        closeMenu();
        setModal({ action: () => run(() => unpublishEvent(id)), title: 'Unpublish?', desc: 'Event goes back to draft.', danger: false });
      },
    });
  }
  if (perms.canDelete && (status === 'DRAFT' || status === 'PUBLISHED')) {
    MENU_ITEMS.push({
      icon: 'archive', label: 'Archive', sub: 'Hide from dashboard, restorable later',
      accent: Colors.text.subtle,
      onPress: () => {
        closeMenu();
        setModal({ action: () => run(() => archiveEvent(id)), title: 'Archive event?', desc: 'Hidden from dashboard but restorable anytime.', danger: false });
      },
    });
  }
  if (perms.canDelete) {
    MENU_ITEMS.push({
      icon: 'trash-2', label: 'Delete Event', sub: 'Permanently erase all data',
      accent: Colors.accent.red, danger: true,
      onPress: () => {
        closeMenu();
        setModal({ action: () => run(async () => { await deleteEvent(id); router.back(); }), title: 'Delete permanently?', desc: 'All guests, tickets, and data will be erased. This cannot be undone.', danger: true });
      },
    });
  }

  return (
    <View style={s.root}>

      {/* ── Floating transparent topbar ──────────────────────────── */}
      <Animated.View style={[s.floatingBar, { backgroundColor: headerBg, paddingTop: insets.top }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={17} color="#fff" />
        </Pressable>
        <Pressable style={s.moreBtn} hitSlop={10} onPress={openMenu}>
          <Feather name="more-horizontal" size={19} color="#fff" />
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >

        {/* ══ HERO ══════════════════════════════════════════════════ */}
        <View style={s.hero}>
          <Image source={img} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['rgba(14,15,17,0.12)', 'rgba(14,15,17,0.5)', 'rgba(14,15,17,0.97)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          />

          {/* Hero content */}
          <View style={[s.heroContent, { paddingBottom: 24 + insets.top }]}>
            {/* Status pill + role badge row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[s.statusPill, { backgroundColor: statusCfg.bg }]}>
                <View style={[s.statusDot, { backgroundColor: statusCfg.dot }]} />
                <Text style={[s.statusTxt, { color: statusCfg.color }]}>{statusCfg.label}</Text>
              </View>
              {!isOwner && (
                <View style={s.roleBadge}>
                  <Feather name="shield" size={10} color="#a78bfa" />
                  <Text style={s.roleBadgeTxt}>{userRole.replace(/_/g, ' ')}</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={s.heroTitle}>{event.title}</Text>

            {/* Type chip */}
            <View style={s.typeChip}>
              <Text style={s.typeTxt}>
                {event.event_type?.replace(/_/g, ' ').toUpperCase() ?? 'EVENT'}
              </Text>
            </View>

            {/* Active modules row — overlaid on hero image */}
            <ActiveModulesStrip event={event} />
          </View>
        </View>

        {/* ══ BODY ══════════════════════════════════════════════════ */}
        <View style={s.body}>

          {/* ── Countdown ──────────────────────────────────────────── */}
          {event.starts_at_utc && !countdown.past && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>EVENT STARTS IN</Text>
              <View style={s.cntRow}>
                {(countdown.d > 0
                  ? [{ v: countdown.d, l: 'DAYS' }, { v: countdown.h, l: 'HRS' }, { v: countdown.m, l: 'MIN' }, { v: countdown.s, l: 'SEC' }]
                  : [{ v: countdown.h, l: 'HRS' }, { v: countdown.m, l: 'MIN' }, { v: countdown.s, l: 'SEC' }]
                ).map((u, i) => (
                  <React.Fragment key={u.l}>
                    {i > 0 && <Text style={s.cntColon}>:</Text>}
                    <View style={s.cntBox}>
                      <LinearGradient
                        colors={['rgba(108,111,238,0.12)', 'rgba(108,111,238,0.04)']}
                        style={StyleSheet.absoluteFill}
                      />
                      <Text style={s.cntNum}>{String(u.v).padStart(2, '0')}</Text>
                      <Text style={s.cntUnit}>{u.l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          {/* ── Ticket hero card ───────────────────────────────────── */}
          {event.allow_ticketing && (
            <TicketHeroCard
              eventId={id}
              ticketCount={event.ticket_count ?? 0}
              checkinCount={event.checkin_count ?? 0}
              router={router}
            />
          )}

          {/* ── Date + venue meta card ─────────────────────────────── */}
          <View style={s.metaCard}>
            {date && (
              <View style={s.metaRow}>
                <View style={[s.metaIcon, { backgroundColor: `${Colors.accent.indigo}18` }]}>
                  <Feather name="clock" size={14} color={Colors.accent.indigo} />
                </View>
                <Text style={s.metaText}>{fmtDateTime(date)}</Text>
              </View>
            )}
            {event.venue_name && (
              <>
                <View style={s.metaDivider} />
                <View style={s.metaRow}>
                  <View style={[s.metaIcon, { backgroundColor: `${Colors.accent.emerald}18` }]}>
                    <Feather name="map-pin" size={14} color={Colors.accent.emerald} />
                  </View>
                  <Text style={s.metaText} numberOfLines={1}>
                    {event.venue_name}{event.city ? ` · ${event.city}` : ''}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* ── Stats row ──────────────────────────────────────────── */}
          <View style={s.statsGrid}>
            {STAT_ITEMS.map(st => (
              <View key={st.label} style={s.statCard}>
                <LinearGradient
                  colors={[`${st.accent}14`, `${st.accent}06`]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[s.statIcon, { backgroundColor: `${st.accent}20` }]}>
                  <Feather name={st.icon} size={15} color={st.accent} />
                </View>
                <Text style={[s.statNum, { color: st.accent }]}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Quick-action pills ─────────────────────────────────── */}
          <View style={s.pillRow}>
            <Pressable
              style={[s.pill, { borderColor: `${Colors.accent.indigo}40`, backgroundColor: `${Colors.accent.indigo}12` }]}
              onPress={() => router.push(`/events/${id}/guests` as never)}
            >
              <Feather name="users" size={14} color={Colors.accent.indigo} />
              <Text style={[s.pillTxt, { color: Colors.accent.indigo }]}>RSVP</Text>
            </Pressable>

            <Pressable
              style={[s.pill, { borderColor: `${Colors.accent.emerald}40`, backgroundColor: `${Colors.accent.emerald}12` }]}
              onPress={() => router.push(`/events/${id}/scanner` as never)}
            >
              <Feather name="camera" size={14} color={Colors.accent.emerald} />
              <Text style={[s.pillTxt, { color: Colors.accent.emerald }]}>QR CHECK-IN</Text>
            </Pressable>

            {event.allow_ticketing && (
              <Pressable
                style={[s.pill, { borderColor: `${Colors.accent.amber}40`, backgroundColor: `${Colors.accent.amber}12` }]}
                onPress={() => router.push(`/events/${id}/buy-tickets` as never)}
              >
                <Feather name="credit-card" size={14} color={Colors.accent.amber} />
                <Text style={[s.pillTxt, { color: Colors.accent.amber }]}>BUY TICKETS</Text>
              </Pressable>
            )}

            {event.slug && (
              <Pressable
                style={[s.pill, { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)' }]}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `${Config.WEB_URL}/e/${event.slug}`,
                      url: `${Config.WEB_URL}/e/${event.slug}`,
                    });
                  } catch { /* user cancelled */ }
                }}
              >
                <Feather name="share-2" size={14} color={Colors.text.muted} />
                <Text style={[s.pillTxt, { color: Colors.text.muted }]}>SHARE</Text>
              </Pressable>
            )}
          </View>

          {/* ── Primary CTA ────────────────────────────────────────── */}
          <View style={s.ctaWrap}>
            {perms.canPublish && status === 'DRAFT' && (
              <Pressable
                style={s.ctaBtn}
                onPress={() => setModal({
                  action: () => run(() => publishEvent(id)),
                  title: 'Publish this event?',
                  desc: 'Your event will be publicly visible.',
                  danger: false,
                })}
              >
                <LinearGradient
                  colors={[Colors.accent.indigo, Colors.accent.violet]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Feather name="send" size={16} color="#fff" />
                      <Text style={s.ctaBtnTxt}>Publish Event</Text>
                    </>
                }
              </Pressable>
            )}

            {perms.canPublish && status === 'PUBLISHED' && (
              <Pressable
                style={[s.ctaBtn, s.ctaBtnOutline, { borderColor: `${Colors.accent.amber}55` }]}
                onPress={() => setModal({
                  action: () => run(() => unpublishEvent(id)),
                  title: 'Unpublish?',
                  desc: 'Event goes back to draft.',
                  danger: false,
                })}
              >
                {loading
                  ? <ActivityIndicator color={Colors.accent.amber} />
                  : <>
                      <Feather name="eye-off" size={16} color={Colors.accent.amber} />
                      <Text style={[s.ctaBtnTxt, { color: Colors.accent.amber }]}>Unpublish</Text>
                    </>
                }
              </Pressable>
            )}

            {perms.canDelete && (status === 'ARCHIVED' || status === 'CANCELLED') && (
              <Pressable
                style={s.ctaBtn}
                onPress={() => run(() => restoreEvent(id))}
              >
                <LinearGradient
                  colors={[Colors.accent.indigo, Colors.accent.violet]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <Feather name="rotate-ccw" size={16} color="#fff" />
                <Text style={s.ctaBtnTxt}>Restore Event</Text>
              </Pressable>
            )}
          </View>

          {/* ── See Your Website ───────────────────────────────────── */}
          {event?.slug && (
            <Pressable
              style={s.websiteBtn}
              onPress={() => router.push(`/events/${id}/preview` as never)}
            >
              <Feather name="globe" size={14} color={Colors.accent.indigo} />
              <Text style={s.websiteBtnTxt}>See Your Website</Text>
              <Feather name="external-link" size={13} color={Colors.text.muted} style={{ marginLeft: 'auto' }} />
            </Pressable>
          )}

          {/* ── Divider ────────────────────────────────────────────── */}
          <View style={s.divider} />

          {/* ── Feature grid ───────────────────────────────────────── */}
          <Text style={s.sectionLabel}>MANAGE</Text>
          <View style={s.featGrid}>
            {FEATURES.map(f => (
              <Pressable
                key={f.label}
                style={s.featCard}
                onPress={() => handleFeaturePress(f.route, f.label)}
              >
                {/* Subtle gradient bg */}
                <LinearGradient
                  colors={[`${f.accent}14`, 'transparent']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />

                {/* Icon */}
                <LinearGradient
                  colors={f.grad}
                  style={s.featIconWrap}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Feather name={f.icon} size={18} color="#fff" />
                </LinearGradient>

                {/* Text */}
                <Text style={s.featLabel}>{f.label}</Text>
                <Text style={s.featSub}>{f.sub}</Text>

                {/* Arrow */}
                <View style={s.featArrow}>
                  <Feather name="chevron-right" size={13} color="rgba(255,255,255,0.2)" />
                </View>
              </Pressable>
            ))}
          </View>

          {/* ── Archive / Delete (owner/admin only) ───────────────── */}
          {perms.canDelete && (
            <View style={s.dangerRow}>
              {(status === 'DRAFT' || status === 'PUBLISHED') && (
                <Pressable
                  style={s.archiveBtn}
                  onPress={() => setModal({
                    action: () => run(() => archiveEvent(id)),
                    title: 'Archive event?',
                    desc: 'Hidden from dashboard but restorable anytime.',
                    danger: false,
                  })}
                >
                  <Feather name="archive" size={13} color={Colors.text.subtle} />
                  <Text style={s.archiveTxt}>Archive</Text>
                </Pressable>
              )}

              <Pressable
                style={s.deleteBtn}
                onPress={() => setModal({
                  action: () => run(async () => { await deleteEvent(id); router.back(); }),
                  title: 'Delete permanently?',
                  desc: 'All guests, tickets, and data will be erased. This cannot be undone.',
                  danger: true,
                })}
              >
                <Feather name="trash-2" size={13} color={Colors.accent.red} />
                <Text style={s.deleteTxt}>Delete Event</Text>
              </Pressable>
            </View>
          )}

        </View>
      </Animated.ScrollView>

      {modal && (
        <ConfirmModal
          open
          title={modal.title}
          description={modal.desc}
          confirmText={modal.title.includes('Delete') ? 'Delete' : 'Confirm'}
          variant={modal.danger ? 'danger' : 'warning'}
          onConfirm={async () => {
            try {
              await modal.action();
              setModal(null);
            } catch (error) {
              setModal(null);
              console.error('Modal action error:', error);
              notify.error('Action failed', 'Please try again.');
            }
          }}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Module confirmation sheet ─────────────────────── */}
      {pendingModule && (
        <ConfirmModal
          visible
          onClose={() => setPendingModule(null)}
          onConfirm={confirmModule}
          icon={pendingModule.icon}
          color={pendingModule.color}
          title={pendingModule.title}
          message={pendingModule.msg}
          confirmLabel={pendingModule.title.replace('?', '')}
          loading={Object.values(modSaving).some(Boolean)}
        />
      )}

      {/* ── 3-dot action sheet ─────────────────────────────── */}
      <Modal visible={menuOpen} transparent animationType="none" statusBarTranslucent onRequestClose={closeMenu}>
        <View style={ms.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          <Animated.View
            style={[ms.sheet, {
              opacity: menuAnim,
              transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [350, 0] }) }],
            }]}
          >
            <View style={ms.handle} />
            <Text style={ms.sheetTitle} numberOfLines={1}>{event.title}</Text>
            <Text style={ms.sheetSub}>{statusCfg.label}</Text>

            <View style={ms.itemList}>
              {MENU_ITEMS.map((item, i) => (
                <React.Fragment key={item.label}>
                  {item.danger && i > 0 && <View style={ms.separator} />}
                  <Pressable style={ms.item} onPress={item.onPress}>
                    <View style={[ms.itemIcon, { backgroundColor: `${item.accent}18` }]}>
                      <Feather name={item.icon} size={17} color={item.accent} />
                    </View>
                    <View style={ms.itemText}>
                      <Text style={[ms.itemLabel, item.danger && { color: item.accent }]}>{item.label}</Text>
                      <Text style={ms.itemSub}>{item.sub}</Text>
                    </View>
                    <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.15)" />
                  </Pressable>
                </React.Fragment>
              ))}
            </View>

            <Pressable style={ms.cancelBtn} onPress={closeMenu}>
              <Text style={ms.cancelTxt}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Event Reminders Modal */}
      <EventRemindersModal
        visible={remindersModalOpen}
        onClose={() => setRemindersModalOpen(false)}
        eventId={id ?? ''}
        eventTitle={event?.title ?? ''}
      />
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────── */
const FEAT_W = (SW - 48) / 2;

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0e0f11' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e0f11' },

  /* Floating topbar */
  floatingBar: {
    position:      'absolute',
    top:           0, left: 0, right: 0,
    zIndex:        20,
    flexDirection: 'row',
    alignItems:    'flex-end',
    justifyContent:'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  moreBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Hero */
  hero:        { height: 320, position: 'relative' },
  heroContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, gap: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 99,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(167,139,250,0.18)',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.35)',
  },
  roleBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#a78bfa', textTransform: 'capitalize', letterSpacing: 0.5 },
  heroTitle: {
    fontSize: 32, fontWeight: '900', color: '#fff',
    letterSpacing: -0.8, lineHeight: 36,
  },
  typeChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
  },
  typeTxt: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.5 },

  /* Body */
  body: { paddingHorizontal: 16, paddingTop: 24, gap: 16 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.text.subtle,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },

  /* Countdown */
  section: { gap: 10 },
  cntRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cntColon:{ fontSize: 24, fontWeight: '300', color: 'rgba(255,255,255,0.2)', marginBottom: 10 },
  cntBox: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(108,111,238,0.25)',
    backgroundColor: Colors.bg.card,
    overflow: 'hidden', gap: 2,
  },
  cntNum:  { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  cntUnit: { fontSize: 9, fontWeight: '700', color: Colors.text.subtle, letterSpacing: 1.5 },

  /* Meta card */
  metaCard: {
    backgroundColor: Colors.bg.card,
    borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 16, gap: 0,
  },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  metaDivider: { height: 1, backgroundColor: Colors.border.subtle, marginVertical: 8 },
  metaIcon:    { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metaText:    { fontSize: 14, color: '#fff', fontWeight: '500', flex: 1 },

  /* Stats */
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: Colors.bg.card,
    gap: 4, overflow: 'hidden',
  },
  statIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statNum:   { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, letterSpacing: 0.5 },

  /* Pills */
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1,
  },
  pillTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },

  /* CTA */
  ctaWrap: { gap: 8 },
  ctaBtn: {
    height: 52, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 9, overflow: 'hidden',
  },
  ctaBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, overflow: 'visible',
  },
  ctaBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  websiteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 14, marginTop: 8,
    backgroundColor: `${Colors.accent.indigo}10`,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}30`,
  },
  websiteBtnTxt: { fontSize: 14, fontWeight: '700', color: Colors.accent.indigo },

  /* Divider */
  divider: { height: 1, backgroundColor: Colors.border.subtle },

  /* Feature grid */
  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featCard: {
    width: FEAT_W, minHeight: 120,
    backgroundColor: Colors.bg.card,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16, gap: 6,
    overflow: 'hidden', position: 'relative',
  },
  featIconWrap: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  featLabel: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  featSub:   { fontSize: 11, color: Colors.text.muted, fontWeight: '500' },
  featArrow: { position: 'absolute', bottom: 14, right: 14 },

  /* Danger row */
  dangerRow: { flexDirection: 'row', gap: 10, paddingBottom: 20 },
  archiveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
  },
  archiveTxt: { fontSize: 13, fontWeight: '700', color: Colors.text.subtle },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 44, borderRadius: 12,
    backgroundColor: `${Colors.accent.red}10`,
    borderWidth: 1, borderColor: `${Colors.accent.red}30`,
  },
  deleteTxt: { fontSize: 13, fontWeight: '700', color: Colors.accent.red },
});

/* ── Action sheet (3-dot menu) styles ───────────────────────────── */
const ms = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1b1f',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 36, overflow: 'hidden',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15, fontWeight: '800', color: '#fff',
    textAlign: 'center', paddingHorizontal: 20,
  },
  sheetSub: {
    fontSize: 11, color: Colors.text.muted,
    textAlign: 'center', marginTop: 2, marginBottom: 12,
  },
  itemList: { paddingHorizontal: 12 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 13, borderRadius: 14,
  },
  itemIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  itemText: { flex: 1, gap: 1 },
  itemLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  itemSub:   { fontSize: 11, color: Colors.text.muted, fontWeight: '500' },
  separator: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 12, marginVertical: 6,
  },
  cancelBtn: {
    marginHorizontal: 12, marginTop: 8,
    height: 50, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: Colors.text.muted },
});

/* ── Module confirmation sheet styles ───────────────────────────── */
const mcs = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0e0e16',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36,
    alignItems: 'center', gap: 12,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 4 },
  iconBubble: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  title:   { fontSize: 18, fontWeight: '800', color: '#fff', textAlign: 'center' },
  message: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 19, paddingHorizontal: 4, marginBottom: 4 },
  confirmBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  cancelBtn:   { width: '100%', paddingVertical: 12, alignItems: 'center' },
  cancelText:  { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
});

/* ── Ticket card styles ──────────────────────────────────────────── */
const tc = StyleSheet.create({
  card: {
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.28)',
    backgroundColor: 'rgba(12,12,22,0.88)',
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    height: 4,
    backgroundColor: Colors.accent.indigo,
  },
  scanLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: 2,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: `${Colors.accent.indigo}50`,
    zIndex: 5,
    pointerEvents: 'none' as any,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  badge: {
    backgroundColor: `${Colors.accent.indigo}22`,
    borderWidth: 1, borderColor: `${Colors.accent.indigo}45`,
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeTxt: { fontSize: 11, fontWeight: '800', color: Colors.accent.indigo, letterSpacing: 0.5 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: `${Colors.accent.emerald}15`,
    borderWidth: 1, borderColor: `${Colors.accent.emerald}35`,
    borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.accent.emerald,
  },
  liveTxt: { fontSize: 9, fontWeight: '900', color: Colors.accent.emerald, letterSpacing: 1 },

  stats: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  statNum:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.8 },
  statLabel:{ fontSize: 10, fontWeight: '600', color: Colors.text.subtle, letterSpacing: 0.4 },

  progWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  progBg:   { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  progFill: { height: 4, borderRadius: 2 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  ctaTxt: { fontSize: 13, fontWeight: '700', color: Colors.accent.indigo },
});






// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { Image } from 'expo-image';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Feather } from '@expo/vector-icons';
// import { useEventStore }  from '@/store/event.store';
// import { StatusBadge, Chip } from '@/components/ui/Badge';
// import { Button }            from '@/components/ui/Button';
// import { StatCard }          from '@/components/ui/StatCard';
// import { CountdownTimer }    from '@/components/ui/CountdownTimer';
// import { ConfirmModal }      from '@/components/ui/ConfirmModal';
// import { Colors }            from '@/constants/colors';
// import { fmtDateTime }       from '@/lib/format';

// export default function EventDetailScreen() {
//   const { id }   = useLocalSearchParams<{ id: string }>();
//   const router   = useRouter();
//   const {
//     currentEvent: event, dashboard,
//     fetchEventById, fetchEventDashboard,
//     publishEvent, unpublishEvent, archiveEvent, restoreEvent, deleteEvent,
//   } = useEventStore();

//   const [loading, setLoading] = useState(false);
//   const [modal, setModal]     = useState<null | {
//     action: () => Promise<unknown>; title: string; desc: string; danger?: boolean;
//   }>(null);

//   useEffect(() => {
//     if (!id) return;
//     fetchEventById(id);
//     fetchEventDashboard(id);
//   }, [id]);

//   if (!event) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator color={Colors.accent.indigo} />
//       </View>
//     );
//   }

//   const stats   = dashboard?.stats;
//   const status  = event.status;
//   const run = async (fn: () => Promise<unknown>) => {
//     setLoading(true);
//     await fn();
//     setLoading(false);
//     fetchEventById(id);
//   };

//   return (
//     <SafeAreaView style={styles.safe} edges={[]}>
//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

//         {/* Hero */}
//         <View style={styles.hero}>
//           {event.cover_image_url ? (
//             <Image source={event.cover_image_url} style={StyleSheet.absoluteFill} contentFit="cover" />
//           ) : (
//             <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.bg.elevated }]} />
//           )}
//           <LinearGradient
//             colors={['rgba(7,7,15,0.3)', 'rgba(7,7,15,0.95)']}
//             style={StyleSheet.absoluteFill}
//           />
//           {/* Back */}
//           <Pressable style={styles.back} onPress={() => router.back()}>
//             <Feather name="arrow-left" size={18} color="#fff" />
//           </Pressable>
//           {/* Title area */}
//           <View style={styles.heroContent}>
//             <StatusBadge status={status} />
//             <Text style={styles.heroTitle}>{event.title}</Text>
//             <Chip label={event.event_type?.toUpperCase()} accent={Colors.accent.indigo} />
//           </View>
//         </View>

//         <View style={styles.body}>

//           {/* Countdown */}
//           {event.starts_at_utc && (
//             <View style={styles.countdownWrap}>
//               <Text style={styles.sectionLabel}>Event starts in</Text>
//               <CountdownTimer targetIso={event.starts_at_utc} accent={Colors.accent.indigo} />
//             </View>
//           )}

//           {/* Date + venue */}
//           {(event.starts_at_local || event.venue_name) && (
//             <View style={styles.metaCard}>
//               {event.starts_at_local && (
//                 <View style={styles.metaRow}>
//                   <Feather name="clock" size={14} color={Colors.accent.indigo} />
//                   <Text style={styles.metaText}>{fmtDateTime(event.starts_at_local)}</Text>
//                 </View>
//               )}
//               {event.venue_name && (
//                 <View style={styles.metaRow}>
//                   <Feather name="map-pin" size={14} color={Colors.accent.indigo} />
//                   <Text style={styles.metaText}>
//                     {event.venue_name}{event.city ? `, ${event.city}` : ''}
//                   </Text>
//                 </View>
//               )}
//             </View>
//           )}

//           {/* Stats */}
//           {stats && (
//             <View style={styles.statsRow}>
//               <StatCard label="Guests"    value={stats.guest_count}    icon="users"        accent={Colors.accent.indigo}  />
//               <StatCard label="Attending" value={stats.attending_count} icon="user-check"   accent={Colors.accent.emerald} />
//               <StatCard label="Tickets"  value={stats.ticket_count}   icon="credit-card"  accent={Colors.accent.amber}   />
//               <StatCard label="Scanned"  value={stats.checkin_count}  icon="check-circle" accent={Colors.accent.violet}  />
//             </View>
//           )}

//           {/* Feature chips */}
//           <View style={styles.featuresRow}>
//             {event.allow_rsvp      && <Chip label="RSVP"      icon="👥" accent={Colors.accent.emerald} />}
//             {event.allow_ticketing && <Chip label="Ticketing"  icon="🎟️" accent={Colors.accent.amber}   />}
//             {event.allow_qr_checkin&& <Chip label="QR Check-in"icon="📷" accent={Colors.accent.indigo}  />}
//             {event.allow_donations && <Chip label="Donations"  icon="💝" accent={Colors.accent.violet}  />}
//           </View>

//           {/* Status actions */}
//           <View style={styles.actionsSection}>
//             {status === 'DRAFT' && (
//               <Button
//                 label="🚀 Publish Event"
//                 onPress={() => setModal({ action: () => run(() => publishEvent(id)), title: 'Publish event?', desc: 'Your event will be publicly visible.', danger: false })}
//                 accent={Colors.accent.emerald}
//                 size="lg"
//                 loading={loading}
//               />
//             )}
//             {status === 'PUBLISHED' && (
//               <Button
//                 label="Unpublish"
//                 onPress={() => setModal({ action: () => run(() => unpublishEvent(id)), title: 'Unpublish?', desc: 'Event goes back to draft.', danger: false })}
//                 variant="outline"
//                 accent={Colors.accent.amber}
//               />
//             )}
//             {(status === 'CANCELLED' || status === 'ARCHIVED') && (
//               <Button
//                 label="Restore Event"
//                 onPress={() => run(() => restoreEvent(id))}
//                 accent={Colors.accent.indigo}
//               />
//             )}
//           </View>

//           {/* Quick links */}
//           <View style={styles.linksGrid}>
//             <LinkCard icon="layout"      label="Builder"   sub="Design event page"   onPress={() => router.push(`/events/${id}/builder` as never)}   accent={'#6c6fee'}             />
//             <LinkCard icon="users"       label="Guests"    sub="Manage attendees"    onPress={() => router.push(`/events/${id}/guests` as never)}    accent={Colors.accent.indigo}  />
//             <LinkCard icon="credit-card" label="Tickets"   sub="Types & orders"      onPress={() => router.push(`/events/${id}/tickets` as never)}   accent={Colors.accent.amber}   />
//             <LinkCard icon="camera"      label="Scanner"   sub="QR check-in"         onPress={() => router.push(`/events/${id}/scanner` as never)}   accent={Colors.accent.emerald} />
//             <LinkCard icon="bar-chart-2" label="Analytics" sub="Revenue & insights"  onPress={() => router.push(`/events/${id}/analytics` as never)} accent={Colors.accent.violet}  />
//           </View>

//           {/* Delete */}
//           <Pressable
//             style={styles.deleteBtn}
//             onPress={() => setModal({ action: () => run(() => deleteEvent(id)), title: 'Delete event?', desc: 'All data including guests and tickets will be permanently erased.', danger: true })}
//           >
//             <Feather name="trash-2" size={14} color={Colors.accent.red} />
//             <Text style={styles.deleteText}>Delete Event</Text>
//           </Pressable>

//         </View>
//       </ScrollView>

//       {modal && (
//         <ConfirmModal
//           open
//           title={modal.title}
//           description={modal.desc}
//           confirmText={modal.title.includes('Delete') ? 'Delete' : 'Confirm'}
//           variant={modal.danger ? 'danger' : 'warning'}
//           onConfirm={() => modal.action()}
//           onClose={() => setModal(null)}
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// function LinkCard({ icon, label, sub, onPress, accent }: {
//   icon: keyof typeof Feather.glyphMap;
//   label: string;
//   sub: string;
//   onPress: () => void;
//   accent: string;
// }) {
//   return (
//     <Pressable
//       style={[styles.linkCard, { borderColor: `${accent}25`, backgroundColor: `${accent}08` }]}
//       onPress={onPress}
//     >
//       <View style={[styles.linkIcon, { backgroundColor: `${accent}20` }]}>
//         <Feather name={icon} size={18} color={accent} />
//       </View>
//       <Text style={styles.linkLabel}>{label}</Text>
//       <Text style={styles.linkSub}>{sub}</Text>
//     </Pressable>
//   );
// }

// const styles = StyleSheet.create({
//   safe:    { flex: 1, backgroundColor: Colors.bg.primary },
//   center:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg.primary },
//   content: { paddingBottom: 60 },

//   hero: { height: 260, position: 'relative' },
//   back: {
//     position:        'absolute',
//     top:             52,
//     left:            16,
//     width:           40,
//     height:          40,
//     borderRadius:    12,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     alignItems:      'center',
//     justifyContent:  'center',
//     zIndex:          10,
//   },
//   heroContent: {
//     position: 'absolute',
//     bottom:   20,
//     left:     16,
//     right:    16,
//     gap:      8,
//   },
//   heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },

//   body:  { padding: 16, gap: 16 },
//   countdownWrap: { gap: 8 },
//   sectionLabel:  { fontSize: 10, fontWeight: '700', color: Colors.text.subtle, letterSpacing: 1, textTransform: 'uppercase' },

//   metaCard: {
//     backgroundColor: Colors.bg.card,
//     borderRadius:    14,
//     borderWidth:     1,
//     borderColor:     Colors.border.DEFAULT,
//     padding:         14,
//     gap:             8,
//   },
//   metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   metaText: { fontSize: 13, color: Colors.text.primary, fontWeight: '500', flex: 1 },

//   statsRow:    { flexDirection: 'row', gap: 8 },
//   featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

//   actionsSection: { gap: 8 },

//   linksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
//   linkCard: {
//     width:         '47%',
//     borderRadius:  16,
//     borderWidth:   1,
//     padding:       14,
//     gap:           6,
//   },
//   linkIcon:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
//   linkLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
//   linkSub:   { fontSize: 11, color: Colors.text.muted },

//   deleteBtn: {
//     flexDirection:   'row',
//     alignItems:      'center',
//     justifyContent:  'center',
//     gap:             6,
//     paddingVertical: 12,
//     borderRadius:    12,
//     borderWidth:     1,
//     borderColor:     `${Colors.accent.red}30`,
//     backgroundColor: `${Colors.accent.red}08`,
//   },
//   deleteText: { fontSize: 13, fontWeight: '700', color: Colors.accent.red },
// });
