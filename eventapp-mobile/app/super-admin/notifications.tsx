import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  Modal, KeyboardAvoidingView, Platform, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ConfirmModal, useConfirm } from '@/components/ui/ConfirmModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSuperAdminStore, SABroadcast } from '@/store/superAdmin.store';
import { notify, showSuccess, showError } from '@/lib/toast';
import { Colors } from '@/constants/colors';

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = '#C9A96E';

const AUDIENCE_CFG: Record<string, { label: string; icon: keyof typeof Feather.glyphMap; color: string; desc: string }> = {
  all:        { label: 'All Users',     icon: 'globe',        color: '#6366f1', desc: 'Everyone with the app' },
  organizers: { label: 'Organizers',    icon: 'users',        color: '#10b981', desc: 'Event creators' },
  attendees:  { label: 'Attendees',     icon: 'tag',          color: '#f59e0b', desc: 'Ticket holders' },
  vendors:    { label: 'Vendors',       icon: 'shopping-bag', color: '#06b6d4', desc: 'Vendor portal users' },
  premium:    { label: 'Premium',       icon: 'star',         color: GOLD,      desc: 'Paid subscribers' },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',      color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  scheduled: { label: 'Scheduled',  color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  sending:   { label: 'Sending…',   color: '#6366f1', bg: 'rgba(99,102,241,0.15)'  },
  sent:      { label: 'Sent',       color: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
  failed:    { label: 'Failed',     color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
};

const DEEP_LINKS = [
  { label: 'Home',        route: '/(tabs)'                },
  { label: 'Events',      route: '/(tabs)/events'         },
  { label: 'Planner',     route: '/(tabs)/planner'        },
  { label: 'Tickets',     route: '/(tabs)/tickets'        },
  { label: 'Billing',     route: '/profile/billing'       },
  { label: 'Notifications', route: '/notifications'       },
];

const AUTOMATED = [
  { emoji: '🎟️', title: 'Ticket Purchased',       trigger: 'On purchase',      to: 'Attendee'  },
  { emoji: '⏰', title: 'Event in 24 Hours',       trigger: '24h before event', to: 'Attendee'  },
  { emoji: '🚀', title: 'Event in 1 Hour',         trigger: '1h before event',  to: 'Attendee'  },
  { emoji: '👥', title: 'New RSVP',                trigger: 'On RSVP',          to: 'Organizer' },
  { emoji: '💰', title: 'New Donation',             trigger: 'On donation',      to: 'Organizer' },
  { emoji: '✅', title: 'Guest Checked In',         trigger: 'On scan',          to: 'Organizer' },
  { emoji: '🎉', title: 'Welcome to LiteEvent',    trigger: '1 min after signup', to: 'New User'},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60)    return `${d}s ago`;
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function fmtSchedule(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Compose Sheet ────────────────────────────────────────────────────────────

interface ComposeProps {
  initial?: SABroadcast | null;
  onClose: () => void;
  onSaved: () => void;
}

function ComposeSheet({ initial, onClose, onSaved }: ComposeProps) {
  const { createBroadcast, updateBroadcast, sendBroadcast } = useSuperAdminStore();
  const insets = useSafeAreaInsets();
  const isEdit = !!initial?.id;

  const [title,        setTitle]        = useState(initial?.title        ?? '');
  const [body,         setBody]         = useState(initial?.body         ?? '');
  const [audience,     setAudience]     = useState(initial?.audience     ?? 'all');
  const [deepLink,     setDeepLink]     = useState(initial?.deep_link    ?? '/(tabs)');
  const [mode,         setMode]         = useState<'now' | 'schedule'>(initial?.scheduled_at ? 'schedule' : 'now');
  const [scheduleDate, setScheduleDate] = useState(
    initial?.scheduled_at ? new Date(initial.scheduled_at).toISOString().slice(0, 16) : ''
  );
  const [saving,   setSaving]   = useState(false);
  const [sending,  setSending]  = useState(false);
  const [showAuto, setShowAuto] = useState(false);

  async function handleSave(andSend = false) {
    if (!title.trim() || !body.trim()) {
      showError('Title and body are required.');
      return;
    }
    andSend ? setSending(true) : setSaving(true);

    const payload = {
      title: title.trim(), body: body.trim(),
      audience, deep_link: deepLink || null,
      scheduled_at: mode === 'schedule' && scheduleDate ? new Date(scheduleDate).toISOString() : null,
    };

    try {
      let id: string | undefined = initial?.id;

      if (isEdit) {
        await updateBroadcast(initial!.id, payload);
      } else {
        const res = await createBroadcast(payload);
        if (!res.success) { showError(res.message ?? 'Failed to create'); return; }
        id = res.broadcast?.id;
      }

      if (andSend && id) {
        const res = await sendBroadcast(id);
        if (res.success) {
          showSuccess(`Sent to ${res.sent_count ?? 0} device${(res.sent_count ?? 0) !== 1 ? 's' : ''}`);
        } else {
          showError(res.message ?? 'Send failed');
        }
      } else {
        showSuccess(isEdit ? 'Updated' : mode === 'schedule' ? 'Scheduled' : 'Draft saved');
      }

      onSaved();
      onClose();
    } finally {
      setSaving(false); setSending(false);
    }
  }

  const busy = saving || sending;

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={cs.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[cs.sheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={cs.handle} />

            {/* Header */}
            <View style={cs.header}>
              <View style={cs.headerIcon}>
                <Feather name="bell" size={15} color="#818cf8" />
              </View>
              <Text style={cs.headerTitle}>{isEdit ? 'Edit Notification' : 'Create Notification'}</Text>
              <Pressable onPress={onClose} style={cs.closeBtn} hitSlop={8}>
                <Feather name="x" size={17} color="rgba(255,255,255,0.45)" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 14, padding: 16 }}>

              {/* Title */}
              <View>
                <Text style={cs.label}>Title *</Text>
                <TextInput style={cs.inp} placeholderTextColor="rgba(255,255,255,0.22)"
                  placeholder="🎉 New feature launched" value={title} onChangeText={setTitle}
                  maxLength={100} />
                <Text style={cs.charCount}>{title.length}/100</Text>
              </View>

              {/* Body */}
              <View>
                <Text style={cs.label}>Message *</Text>
                <TextInput style={[cs.inp, { height: 80, textAlignVertical: 'top' }]}
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  placeholder="Describe what's happening…" value={body}
                  onChangeText={setBody} multiline maxLength={250} />
                <Text style={cs.charCount}>{body.length}/250</Text>
              </View>

              {/* Audience */}
              <View>
                <Text style={cs.label}>Audience</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(AUDIENCE_CFG).map(([key, cfg]) => {
                    const active = audience === key;
                    return (
                      <Pressable key={key} onPress={() => setAudience(key)}
                        style={[cs.chip, active && { backgroundColor: `${cfg.color}18`, borderColor: `${cfg.color}45` }]}>
                        <Feather name={cfg.icon} size={11} color={active ? cfg.color : 'rgba(255,255,255,0.35)'} />
                        <Text style={[cs.chipText, active && { color: cfg.color }]}>{cfg.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={cs.hint}>{AUDIENCE_CFG[audience]?.desc ?? ''}</Text>
              </View>

              {/* Deep link */}
              <View>
                <Text style={cs.label}>Deep Link</Text>
                <TextInput style={cs.inp} placeholderTextColor="rgba(255,255,255,0.22)"
                  placeholder="/(tabs)" value={deepLink} onChangeText={setDeepLink} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {DEEP_LINKS.map(dl => (
                      <Pressable key={dl.route} onPress={() => setDeepLink(dl.route)}
                        style={[cs.dlChip, deepLink === dl.route && cs.dlChipActive]}>
                        <Text style={[cs.dlChipText, deepLink === dl.route && { color: '#818cf8' }]}>
                          {dl.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Send mode */}
              <View>
                <Text style={cs.label}>When to Send</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {([['now', 'Send Now', 'zap'], ['schedule', 'Schedule', 'calendar']] as const).map(([m, l, ic]) => (
                    <Pressable key={m} onPress={() => setMode(m)}
                      style={[cs.modeBtn, mode === m && cs.modeBtnActive]}>
                      <Feather name={ic} size={13} color={mode === m ? '#818cf8' : 'rgba(255,255,255,0.35)'} />
                      <Text style={[cs.modeBtnText, mode === m && { color: '#818cf8' }]}>{l}</Text>
                    </Pressable>
                  ))}
                </View>
                {mode === 'schedule' && (
                  <TextInput style={[cs.inp, { marginTop: 8 }]} placeholderTextColor="rgba(255,255,255,0.22)"
                    placeholder="YYYY-MM-DDTHH:MM (e.g. 2025-12-25T09:00)"
                    value={scheduleDate} onChangeText={setScheduleDate} />
                )}
              </View>

              {/* Automated info */}
              <Pressable onPress={() => setShowAuto(v => !v)} style={cs.autoRow}>
                <Feather name="zap" size={13} color="#818cf8" />
                <Text style={cs.autoRowText}>Automated Notifications ({AUTOMATED.length})</Text>
                <Feather name={showAuto ? 'chevron-up' : 'chevron-down'} size={13} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {showAuto && (
                <View style={{ gap: 6 }}>
                  {AUTOMATED.map((a, i) => (
                    <View key={i} style={cs.autoCard}>
                      <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={cs.autoTitle}>{a.title}</Text>
                        <Text style={cs.autoMeta}>{a.trigger} · {a.to}</Text>
                      </View>
                      <View style={cs.autoBadge}><Text style={cs.autoBadgeText}>AUTO</Text></View>
                    </View>
                  ))}
                </View>
              )}

            </ScrollView>

            {/* Actions */}
            <View style={[cs.actions, { borderTopColor: 'rgba(255,255,255,0.07)' }]}>
              <Pressable onPress={() => handleSave(false)} disabled={busy}
                style={[cs.draftBtn, busy && { opacity: 0.5 }]}>
                {saving ? <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
                  : <Text style={cs.draftBtnText}>Save Draft</Text>}
              </Pressable>
              <Pressable onPress={() => handleSave(mode === 'now')} disabled={busy}
                style={[cs.sendBtn, mode === 'schedule' && cs.scheduleBtn, busy && { opacity: 0.5 }]}>
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Feather name={mode === 'now' ? 'send' : 'calendar'} size={14} color={mode === 'now' ? '#fff' : '#fbbf24'} />
                }
                <Text style={[cs.sendBtnText, mode === 'schedule' && { color: '#fbbf24' }]}>
                  {mode === 'now' ? 'Send Now' : 'Schedule'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Broadcast Row ────────────────────────────────────────────────────────────

function BroadcastRow({ item, onSend, onEdit, onDelete, sending }: {
  item: SABroadcast;
  onSend: () => void;
  onEdit: () => void;
  onDelete: () => void;
  sending: boolean;
}) {
  const s   = STATUS_CFG[item.status] ?? STATUS_CFG.draft;
  const aud = AUDIENCE_CFG[item.audience] ?? AUDIENCE_CFG.all;
  const canSend = item.status === 'draft' || item.status === 'scheduled';
  const canEdit = item.status !== 'sent';

  return (
    <View style={br.row}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={br.title} numberOfLines={1}>{item.title}</Text>
        <Text style={br.body} numberOfLines={1}>{item.body}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Audience */}
          <View style={[br.badge, { backgroundColor: `${aud.color}18` }]}>
            <Feather name={aud.icon} size={9} color={aud.color} />
            <Text style={[br.badgeText, { color: aud.color }]}>{aud.label}</Text>
          </View>
          {/* Status */}
          <View style={[br.badge, { backgroundColor: s.bg }]}>
            {item.status === 'sending' && <ActivityIndicator size={8} color={s.color} />}
            <Text style={[br.badgeText, { color: s.color }]}>{s.label}</Text>
          </View>
          {/* Sent count */}
          {item.sent_count > 0 && (
            <Text style={br.meta}>{item.sent_count.toLocaleString()} sent</Text>
          )}
          {/* Date */}
          <Text style={br.meta}>
            {item.sent_at ? timeAgo(item.sent_at) : item.scheduled_at ? fmtSchedule(item.scheduled_at) : ''}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
        {canSend && (
          <Pressable onPress={onSend} disabled={sending} style={br.actionBtn} hitSlop={6}>
            {sending
              ? <ActivityIndicator size="small" color="#818cf8" />
              : <Feather name="play" size={14} color="#818cf8" />
            }
          </Pressable>
        )}
        {canEdit && (
          <Pressable onPress={onEdit} style={br.actionBtn} hitSlop={6}>
            <Feather name="edit-2" size={14} color="rgba(255,255,255,0.4)" />
          </Pressable>
        )}
        <Pressable onPress={onDelete} style={br.actionBtn} hitSlop={6}>
          <Feather name="trash-2" size={14} color="rgba(239,68,68,0.55)" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationCenterScreen() {
  const {
    broadcasts, broadcastStats,
    fetchBroadcasts, fetchBroadcastStats,
    sendBroadcast, deleteBroadcast,
    loading,
  } = useSuperAdminStore();

  const [compose,     setCompose]     = useState(false);
  const [editTarget,  setEditTarget]  = useState<SABroadcast | null>(null);
  const [sendingId,   setSendingId]   = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<'all'|'sent'|'scheduled'|'draft'>('all');
  const { confirm, confirmProps } = useConfirm();

  const load = useCallback(async () => {
    await Promise.all([fetchBroadcasts(), fetchBroadcastStats()]);
  }, [fetchBroadcasts, fetchBroadcastStats]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSend(id: string) {
    setSendingId(id);
    const res = await sendBroadcast(id);
    setSendingId(null);
    if (res.success) {
      showSuccess(`Sent to ${res.sent_count ?? 0} device${(res.sent_count ?? 0) !== 1 ? 's' : ''}`);
    } else {
      showError(res.message ?? 'Send failed');
    }
  }

  function confirmDelete(id: string) {
    confirm({
      title: 'Delete notification?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteBroadcast(id),
    });
  }

  const t = broadcastStats?.totals;
  const STATS = [
    { label: 'Sent',      value: t?.sent            ?? '0', color: '#6366f1', icon: 'send'     as const },
    { label: 'Delivered', value: t?.total_delivered ?? '0', color: '#10b981', icon: 'check-circle' as const },
    { label: 'Scheduled', value: t?.scheduled       ?? '0', color: '#f59e0b', icon: 'clock'    as const },
    { label: 'Drafts',    value: t?.draft            ?? '0', color: '#6b7280', icon: 'file-text' as const },
  ];

  const TABS: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'all',       label: 'All'       },
    { id: 'sent',      label: 'Sent'      },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'draft',     label: 'Drafts'    },
  ];

  const filtered = broadcasts.filter(b => {
    if (activeTab === 'all')       return true;
    if (activeTab === 'sent')      return b.status === 'sent';
    if (activeTab === 'scheduled') return b.status === 'scheduled';
    if (activeTab === 'draft')     return b.status === 'draft';
    return true;
  });

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GOLD} />}
      >
        {/* Stats grid */}
        <View style={s.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: `${stat.color}15` }]}>
                <Feather name={stat.icon} size={14} color={stat.color} />
              </View>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Create button */}
        <Pressable onPress={() => { setEditTarget(null); setCompose(true); }} style={s.createBtn}>
          <Feather name="plus" size={15} color="#fff" />
          <Text style={s.createBtnText}>Create Notification</Text>
        </Pressable>

        {/* Tabs */}
        <View style={s.tabs}>
          {TABS.map(tab => (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)}
              style={[s.tab, activeTab === tab.id && s.tabActive]}>
              <Text style={[s.tabText, activeTab === tab.id && s.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* List */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}><Feather name="bell-off" size={24} color="#6366f1" /></View>
            <Text style={s.emptyTitle}>No notifications</Text>
            <Text style={s.emptySub}>Tap "Create Notification" to get started</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map(b => (
              <BroadcastRow
                key={b.id}
                item={b}
                sending={sendingId === b.id}
                onSend={() => handleSend(b.id)}
                onEdit={() => { setEditTarget(b); setCompose(true); }}
                onDelete={() => confirmDelete(b.id)}
              />
            ))}
          </View>
        )}

        {/* Automated section */}
        <View style={s.autoSection}>
          <View style={s.autoHeader}>
            <Feather name="zap" size={13} color="#818cf8" />
            <Text style={s.autoHeaderText}>Automated System Notifications</Text>
            <View style={s.autoPill}><Text style={s.autoPillText}>{AUTOMATED.length} active</Text></View>
          </View>
          <Text style={s.autoDesc}>These fire automatically — no admin action needed.</Text>
          {AUTOMATED.map((a, i) => (
            <View key={i} style={s.autoRow}>
              <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.autoTitle}>{a.title}</Text>
                <Text style={s.autoMeta}>{a.trigger} · → {a.to}</Text>
              </View>
              <View style={s.autoActiveBadge}><Text style={s.autoActiveBadgeText}>AUTO</Text></View>
            </View>
          ))}
        </View>
      </ScrollView>

      {compose && (
        <ComposeSheet
          initial={editTarget}
          onClose={() => { setCompose(false); setEditTarget(null); }}
          onSaved={load}
        />
      )}
      <ConfirmModal {...confirmProps} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BG = '#07070f';
const CARD = '#0d0d1a';

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: BG },
  content: { padding: 14, gap: 12, paddingBottom: 40 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard:  { flex: 1, minWidth: '45%', backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 12, gap: 6 },
  statIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },

  createBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: '#6366f1', shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  tabs:         { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 3, gap: 2 },
  tab:          { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive:    { backgroundColor: 'rgba(255,255,255,0.10)' },
  tabText:      { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)' },
  tabTextActive:{ color: '#fff', fontWeight: '700' },

  list:  { gap: 8 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(99,102,241,0.12)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.22)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emptySub:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },

  autoSection: { backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.18)', padding: 14, gap: 8 },
  autoHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  autoHeaderText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#fff' },
  autoPill:    { backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  autoPillText:{ fontSize: 10, fontWeight: '800', color: '#818cf8' },
  autoDesc:    { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  autoRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  autoTitle:   { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  autoMeta:    { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  autoActiveBadge: { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  autoActiveBadgeText: { fontSize: 8, fontWeight: '900', color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 },
});

const br = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 12 },
  title:     { fontSize: 13, fontWeight: '700', color: '#fff' },
  body:      { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '700' },
  meta:      { fontSize: 10, color: 'rgba(255,255,255,0.25)' },
  actionBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
});

const cs = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet:      { backgroundColor: '#0a0a18', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', maxHeight: '95%' },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  headerIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:{ flex: 1, fontSize: 15, fontWeight: '800', color: '#fff' },
  closeBtn:   { padding: 6, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.07)' },

  label:     { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inp:       { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#fff' },
  charCount: { fontSize: 10, color: 'rgba(255,255,255,0.22)', textAlign: 'right', marginTop: 3 },
  hint:      { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 },

  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  chipText:  { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },

  dlChip:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dlChipActive:{ backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.35)' },
  dlChipText:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },

  modeBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modeBtnActive:{ backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.38)' },
  modeBtnText:  { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },

  autoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.07)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.18)' },
  autoRowText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#818cf8' },
  autoCard:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  autoTitle:   { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  autoMeta:    { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 },
  autoBadge:   { backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  autoBadgeText:{ fontSize: 8, fontWeight: '900', color: '#10b981', textTransform: 'uppercase' },

  actions:   { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  draftBtn:  { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  draftBtnText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  sendBtn:   { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderRadius: 12, backgroundColor: '#6366f1', shadowColor: '#6366f1', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  scheduleBtn: { backgroundColor: 'rgba(245,158,11,0.18)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)', shadowColor: 'transparent', elevation: 0 },
  sendBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
