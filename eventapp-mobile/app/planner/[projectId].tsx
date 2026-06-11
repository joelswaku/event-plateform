import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  Platform, Animated, Pressable, TextInput, Modal, KeyboardAvoidingView,
} from 'react-native';
import { ConfirmModal, useConfirm } from '@/components/ui/ConfirmModal';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePlannerStore } from '@/store/planner.store';
import { useSubscriptionStore } from '@/store/subscription.store';
import { Colors } from '@/constants/colors';
import { TimelineSection } from '@/components/planner/TimelineSection';
import { notify } from '@/lib/toast';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UpgradeNotificationModal } from '@/components/planner/UpgradeNotificationModal';

/* ── Constants ─────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'overview',  label: 'Overview',  icon: 'grid'         as const },
  { id: 'tasks',     label: 'Tasks',     icon: 'check-square' as const },
  { id: 'timeline',  label: 'Timeline',  icon: 'clock'        as const },
  { id: 'vendors',   label: 'Vendors',   icon: 'shopping-bag' as const },
  { id: 'budget',    label: 'Budget',    icon: 'dollar-sign'  as const },
  { id: 'team',      label: 'Team',      icon: 'users'        as const },
  { id: 'notes',     label: 'Notes',     icon: 'file-text'    as const },
  { id: 'files',     label: 'Files',     icon: 'folder'       as const },
  { id: 'ai-brief',  label: 'AI Brief',  icon: 'zap'          as const },
  { id: 'settings',  label: 'Settings',  icon: 'settings'     as const },
] as const;
type SectionId = typeof SECTIONS[number]['id'];

const PHASES = [
  { id: 'planning',  label: 'Planning & Admin',      color: '#6366f1', keywords: ['plan','venue','budget','timeline','permit','licens','insur','admin','book','confirm','contract','negotiat','schedule','coordinat','organiz'] },
  { id: 'vendors',   label: 'Vendors & Bookings',    color: '#8b5cf6', keywords: ['cater','photo','video','music','band','dj','florist','flower','transport','hotel','accomm','vendor','hire','service','suppli','provider'] },
  { id: 'design',    label: 'Design & Styling',      color: '#ec4899', keywords: ['design','style','decor','invit','stationary','stationery','theme','color','dress','suit','attire','gown','jewel','ring','floral','table','linen','seating'] },
  { id: 'guests',    label: 'Guests & Experience',   color: '#f59e0b', keywords: ['guest','rsvp','seat','menu','food','drink','cake','gift','favor','program','speech','toast','entertainment','reception','welcome'] },
  { id: 'logistics', label: 'Day-of Logistics',      color: '#10b981', keywords: ['setup','rehearsal','ceremony','arrival','depart','parking','security','tech','av','sound','light','signage','staff','final','run','checklist','morning'] },
];

const CAT_PALETTE = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#06b6d4','#3b82f6','#a78bfa','#fb923c'];

const PAYMENT_META: Record<string, { label: string; color: string }> = {
  UNPAID:  { label: 'Unpaid',  color: 'rgba(255,255,255,0.3)' },
  PARTIAL: { label: 'Partial', color: '#f59e0b' },
  PAID:    { label: 'Paid',    color: '#10b981' },
};

const ROLE_META: Record<string, { color: string; bg: string }> = {
  OWNER:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  ADMIN:  { color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
  EDITOR: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'  },
  VIEWER: { color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};

const FOLDERS = ['general','contracts','venue','vendors','design','media'];
const EVENT_TYPES = ['wedding','conference','concert','birthday','corporate','festival','party','gala','networking','other'];
const CURRENCIES  = ['USD','EUR','GBP','CAD','AUD','CHF','JPY','SGD'];
const COLOR_SWATCHES = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6'];

const EMOJI: Record<string, string> = {
  wedding:'💍', conference:'🎤', concert:'🎵', birthday:'🎂',
  corporate:'💼', festival:'🎪', party:'🎉', gala:'✨', networking:'🤝',
};
function getEmoji(t?: string) { return EMOJI[t?.toLowerCase() ?? ''] ?? '📋'; }

const STATUS_COLOR: Record<string, string> = {
  todo:'rgba(255,255,255,0.25)', in_progress:Colors.accent.indigo, done:'#10b981', blocked:'#ef4444',
  TODO:'rgba(255,255,255,0.25)', IN_PROGRESS:Colors.accent.indigo, DONE:'#10b981', BLOCKED:'#ef4444',
};
const VENDOR_COLOR: Record<string, string> = {
  researching:'rgba(255,255,255,0.25)', contacted:'#6366f1',
  quoted:'#f59e0b', booked:'#10b981', rejected:'#ef4444',
};

function fmt(n: any) { return Number(n || 0).toLocaleString(); }
function initials(name = '') { return (name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase(); }
function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function assignPhase(task: any) {
  const text = `${task.title} ${task.category || ''}`.toLowerCase();
  for (const phase of PHASES) {
    if (phase.keywords.some(kw => text.includes(kw))) return phase;
  }
  return { id: 'other', label: 'Other Tasks', color: '#6b7280' };
}

/* ── Shared primitives ─────────────────────────────────────────────── */

function SectionEmpty({ icon, title, desc, onGenerate, generating, hideBtn }: {
  icon: any; title: string; desc: string; onGenerate?: () => void; generating?: boolean; hideBtn?: boolean;
}) {
  return (
    <View style={s.emptyState}>
      <View style={s.emptyIcon}><Feather name={icon} size={24} color={Colors.accent.indigo} /></View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{desc}</Text>
      {onGenerate && !hideBtn && (
        <TouchableOpacity style={s.genBtn} onPress={onGenerate} disabled={generating}>
          {generating ? <ActivityIndicator size="small" color="#fff" /> : <><Feather name="zap" size={13} color="#fff" /><Text style={s.genBtnText}>Generate with AI</Text></>}
        </TouchableOpacity>
      )}
    </View>
  );
}

function Card({ children, style }: any) {
  return <View style={[s.card, style]}>{children}</View>;
}

function CardTitle({ children }: any) {
  return <Text style={s.cardTitle}>{children}</Text>;
}

/* ── Activity metadata (mirrors web ACTION_LABELS / ACTION_ICON) ────── */
const ACTIVITY_LABELS: Record<string, string> = {
  task_created:     'Created task',
  task_updated:     'Updated task',
  task_deleted:     'Deleted task',
  vendor_created:   'Added vendor',
  vendor_updated:   'Updated vendor',
  timeline_created: 'Added timeline item',
  budget_created:   'Added budget item',
  budget_updated:   'Updated budget item',
  project_created:  'Created project',
  project_updated:  'Updated project',
  note_created:     'Added note',
  note_updated:     'Updated note',
  team_invited:     'Invited team member',
  ai_generated:     'AI generated content',
};
const ACTIVITY_META: Record<string, { icon: any; color: string; bg: string }> = {
  task_created:     { icon: 'check-square', color: '#818cf8', bg: 'rgba(99,102,241,0.15)'  },
  task_updated:     { icon: 'check-square', color: '#60a5fa', bg: 'rgba(59,130,246,0.15)'  },
  vendor_created:   { icon: 'shopping-bag', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)'  },
  vendor_updated:   { icon: 'shopping-bag', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)'  },
  timeline_created: { icon: 'clock',        color: '#a78bfa', bg: 'rgba(139,92,246,0.15)'  },
  budget_created:   { icon: 'dollar-sign',  color: '#34d399', bg: 'rgba(16,185,129,0.15)'  },
  budget_updated:   { icon: 'dollar-sign',  color: '#34d399', bg: 'rgba(16,185,129,0.15)'  },
  project_created:  { icon: 'zap',          color: '#818cf8', bg: 'rgba(99,102,241,0.15)'  },
  project_updated:  { icon: 'zap',          color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' },
  note_created:     { icon: 'file-text',    color: '#f472b6', bg: 'rgba(236,72,153,0.15)'  },
  note_updated:     { icon: 'file-text',    color: '#f472b6', bg: 'rgba(236,72,153,0.15)'  },
  team_invited:     { icon: 'users',        color: '#2dd4bf', bg: 'rgba(20,184,166,0.15)'  },
  ai_generated:     { icon: 'zap',          color: '#a78bfa', bg: 'rgba(139,92,246,0.15)'  },
};

/* ── Section: Overview ─────────────────────────────────────────────── */
function OverviewSection({ project, onGenerate, generating, onNavigate, projectId }: {
  project: any; onGenerate: (t: string) => void; generating: boolean;
  onNavigate: (s: SectionId) => void; projectId: string;
}) {
  const router    = useRouter();
  const tasks     = project.tasks    || [];
  const vendors   = (project.vendors || []).filter((v: any) => !v.ai_suggested);
  const timeline  = project.timeline || [];
  const budget    = project.budgetSummary || {};
  const team      = project.team     || [];
  const activity  = project.activity || [];

  // ── Task metrics ──────────────────────────────────────────────────
  const done    = tasks.filter((t: any) => ['done','DONE'].includes(t.status)).length;
  const inProg  = tasks.filter((t: any) => ['in_progress','IN_PROGRESS'].includes(t.status)).length;
  const blocked = tasks.filter((t: any) => ['blocked','BLOCKED'].includes(t.status)).length;
  const todo    = tasks.filter((t: any) => ['todo','TODO'].includes(t.status)).length;
  const total   = tasks.length;
  const taskPct = total > 0 ? Math.round((done / total) * 100) : 0;
  const overdue = tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && !['done','DONE'].includes(t.status)).length;

  // ── Budget metrics ────────────────────────────────────────────────
  const totalBudget = Number(budget.total_budget ?? project.total_budget ?? 0);
  const totalActual = Number(budget.total_actual ?? 0);
  const totalEst    = Number(budget.total_estimated ?? 0);
  const spendPct    = totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : 0;

  // ── Vendor metrics ────────────────────────────────────────────────
  const confirmed = vendors.filter((v: any) => ['booked','confirmed','BOOKED','CONFIRMED'].includes(v.booking_status)).length;
  const vendorPct = vendors.length > 0 ? Math.round((confirmed / vendors.length) * 100) : 0;

  // ── Health / Days ─────────────────────────────────────────────────
  const health      = project.health_score ?? 0;
  const healthColor = health >= 70 ? '#10b981' : health >= 40 ? '#f59e0b' : '#ef4444';
  const daysLeft    = project.event_date ? Math.ceil((new Date(project.event_date).getTime() - Date.now()) / 86_400_000) : null;
  const daysColor   = daysLeft !== null && daysLeft <= 14 ? '#ef4444' : daysLeft !== null && daysLeft <= 30 ? '#f59e0b' : Colors.accent.indigo;

  const upcomingTasks = tasks
    .filter((t: any) => !['done','DONE'].includes(t.status) && t.due_date)
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 6);

  const nextTimeline = [...timeline]
    .sort((a: any, b: any) => (a.position_order ?? 0) - (b.position_order ?? 0))
    .slice(0, 5);

  let parsedBrief: any = null;
  try { parsedBrief = project.ai_brief ? JSON.parse(project.ai_brief) : null; } catch {}

  // ── SVG progress ring ─────────────────────────────────────────────
  function Ring({ pct, color }: { pct: number; color: string }) {
    const r = 13; const C = 2 * Math.PI * r;
    const dash = Math.min(1, pct / 100) * C;
    return (
      <Svg width={32} height={32} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={16} cy={16} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={3.5} fill="none" />
        <Circle cx={16} cy={16} r={r} stroke={color} strokeWidth={3.5} fill="none"
          strokeDasharray={`${dash} ${C}`} strokeLinecap="round" />
      </Svg>
    );
  }

  // ── 6 KPI definitions ─────────────────────────────────────────────
  const kpis = [
    { title: 'Task Progress', value: `${taskPct}%`, sub: `${done} of ${total} done`,
      color: taskPct >= 70 ? '#10b981' : taskPct >= 40 ? Colors.accent.indigo : '#f59e0b',
      icon: 'check-square' as const, ring: taskPct, tab: 'tasks' as SectionId },
    { title: 'Budget Used', value: `${spendPct}%`,
      sub: totalBudget > 0 ? `$${fmt(totalActual)} of $${fmt(totalBudget)}` : 'No budget set',
      color: spendPct > 90 ? '#ef4444' : spendPct > 70 ? '#f59e0b' : '#10b981',
      icon: 'dollar-sign' as const, ring: spendPct, tab: 'budget' as SectionId },
    { title: 'Vendors', value: String(vendors.length), sub: `${confirmed} confirmed`,
      color: '#f59e0b', icon: 'shopping-bag' as const, ring: vendorPct, tab: null as any },
    { title: 'Health Score', value: health > 0 ? String(health) : '—',
      sub: health >= 70 ? 'Healthy' : health >= 40 ? 'Needs attention' : health > 0 ? 'At risk' : 'Not calculated',
      color: healthColor, icon: 'heart' as const, ring: undefined, tab: null as any },
    { title: 'Overdue', value: String(overdue), sub: `${blocked} blocked`,
      color: overdue > 0 ? '#ef4444' : '#10b981',
      icon: 'alert-triangle' as const, ring: undefined, tab: 'tasks' as SectionId },
    { title: 'Days Left',
      value: daysLeft !== null ? (daysLeft > 0 ? String(daysLeft) : 'Past') : '—',
      sub: project.event_date ? new Date(project.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set',
      color: daysColor, icon: 'calendar' as const, ring: undefined, tab: null as any },
  ];

  return (
    <View style={s.sectionContent}>

      {/* ── 6-KPI grid: 2 rows × 3 cols ── */}
      <View style={{ gap: 10 }}>
        {[[kpis[0], kpis[1], kpis[2]], [kpis[3], kpis[4], kpis[5]]].map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 10 }}>
            {row.map(({ title, value, sub, color, icon, ring, tab }) => (
              <TouchableOpacity key={title} activeOpacity={tab ? 0.7 : 1}
                onPress={() => tab && onNavigate(tab)}
                style={[s.kpiCard, { flex: 1, borderColor: color + '22', padding: 11 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <View style={[s.kpiIconWrap, { backgroundColor: color + '18', width: 28, height: 28, borderRadius: 8 }]}>
                    <Feather name={icon} size={12} color={color} />
                  </View>
                  {ring !== undefined && <Ring pct={ring} color={color} />}
                </View>
                <Text style={[s.kpiVal, { color, fontSize: 17 }]}>{value}</Text>
                <Text style={[s.kpiLabel, { fontSize: 9 }]} numberOfLines={1}>{title}</Text>
                <Text style={[s.kpiSub, { fontSize: 9 }]} numberOfLines={2}>{sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* ── Task breakdown bar ── */}
      {total > 0 && (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={s.cardTitle}>Task Breakdown</Text>
            <TouchableOpacity onPress={() => onNavigate('tasks')}>
              <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>Manage →</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', gap: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 10 }}>
            {[{ n: done, c: '#10b981' }, { n: inProg, c: Colors.accent.indigo }, { n: blocked, c: '#ef4444' }, { n: todo, c: 'rgba(255,255,255,0.15)' }]
              .map(({ n, c }, i) => {
                const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                return pct > 0 ? <View key={i} style={{ flex: pct, height: '100%', backgroundColor: c }} /> : null;
              })}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[['Done', done, '#10b981'], ['In Progress', inProg, Colors.accent.indigo], ['Blocked', blocked, '#ef4444'], ['To Do', todo, 'rgba(255,255,255,0.3)']].map(([label, count, dot]) => (
              <View key={label as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot as string }} />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{label as string}</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>{count as number}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* ── Upcoming Tasks ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(99,102,241,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="check-square" size={13} color={Colors.accent.indigo} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Upcoming Tasks</Text>
            {overdue > 0 && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100, backgroundColor: 'rgba(239,68,68,0.18)' }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#f87171' }}>{overdue} overdue</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => onNavigate('tasks')}>
            <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>View all →</Text>
          </TouchableOpacity>
        </View>
        {upcomingTasks.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 22, gap: 6 }}>
            <Feather name="check-square" size={20} color="rgba(255,255,255,0.1)" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.3)' }}>No upcoming tasks</Text>
            <TouchableOpacity onPress={() => onNavigate('tasks')}>
              <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>Go to Tasks →</Text>
            </TouchableOpacity>
          </View>
        ) : upcomingTasks.map((t: any) => {
          const isOver = t.due_date && new Date(t.due_date) < new Date() && !['done','DONE'].includes(t.status);
          const pDot: Record<string,string> = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#6b7280' };
          const dot = pDot[t.priority?.toUpperCase()] ?? '#6b7280';
          return (
            <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot, flexShrink: 0 }} />
              <Text style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }} numberOfLines={1}>{t.title}</Text>
              {t.category && (
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: 'rgba(99,102,241,0.15)' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#818cf8', textTransform: 'uppercase' }}>{t.category}</Text>
                </View>
              )}
              {t.due_date && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  {isOver && <Feather name="alert-triangle" size={9} color="#ef4444" />}
                  <Text style={{ fontSize: 10, fontWeight: '600', color: isOver ? '#ef4444' : 'rgba(255,255,255,0.35)' }}>
                    {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </Card>

      {/* ── Event Timeline preview ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(139,92,246,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="clock" size={13} color="#8b5cf6" />
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Event Timeline</Text>
            {timeline.length > 0 && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100, backgroundColor: 'rgba(139,92,246,0.15)' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#a78bfa' }}>{timeline.length} items</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => onNavigate('timeline')}>
            <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>View all →</Text>
          </TouchableOpacity>
        </View>
        {nextTimeline.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 22, gap: 6 }}>
            <Feather name="clock" size={20} color="rgba(255,255,255,0.1)" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.3)' }}>Timeline is empty</Text>
            <TouchableOpacity onPress={() => onNavigate('timeline')}>
              <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>Generate Timeline →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 14, paddingVertical: 14, position: 'relative' }}>
            <View style={{ position: 'absolute', left: 21, top: 20, bottom: 14, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} />
            <View style={{ gap: 16 }}>
              {nextTimeline.map((item: any) => {
                const t = item.start_time || item.item_time;
                return (
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 3, flexShrink: 0, zIndex: 1, backgroundColor: item.is_milestone ? '#f59e0b' : Colors.accent.indigo }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }} numberOfLines={1}>{item.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                        {t && <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.accent.indigo }}>{String(t).slice(0, 5)}</Text>}
                        {item.duration_minutes && <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.duration_minutes}min</Text>}
                        {item.location && <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {item.location}</Text>}
                        {item.category && <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>· {item.category}</Text>}
                      </View>
                    </View>
                    {item.is_milestone && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.15)' }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: '#f59e0b' }}>Milestone</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            {timeline.length > 5 && (
              <TouchableOpacity onPress={() => onNavigate('timeline')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12 }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>+{timeline.length - 5} more items</Text>
                <Feather name="arrow-right" size={11} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>

      {/* ── Recent Activity ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(107,114,128,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="activity" size={13} color="#9ca3af" />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Recent Activity</Text>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' }} />
        </View>
        {activity.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 22 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>No activity yet — actions appear here as you build</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 }}>
            {activity.slice(0, 8).map((a: any) => {
              const m = ACTIVITY_META[a.action] ?? { icon: 'activity', color: '#9ca3af', bg: 'rgba(107,114,128,0.15)' };
              const label = ACTIVITY_LABELS[a.action] ?? a.action.replace(/_/g, ' ');
              return (
                <View key={a.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Feather name={m.icon} size={12} color={m.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 17 }}>
                      <Text style={{ fontWeight: '700', color: '#fff' }}>{label}</Text>
                      {a.entity_title ? <Text style={{ color: '#818cf8' }}> "{a.entity_title}"</Text> : ''}
                    </Text>
                    {a.actor_name && <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{a.actor_name}</Text>}
                  </View>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', flexShrink: 0 }}>{timeAgo(a.created_at)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* ── Project Details ── */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={s.cardTitle}>Project Details</Text>
          <TouchableOpacity onPress={() => onNavigate('settings')}>
            <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>Edit →</Text>
          </TouchableOpacity>
        </View>
        {([
          ['Type',     project.event_type],
          ['Venue',    project.venue],
          ['Guests',   project.guest_count ? `${fmt(project.guest_count)} expected` : null],
          ['Location', [project.city, project.country].filter(Boolean).join(', ') || null],
          ['Currency', project.currency],
          ['Budget',   project.total_budget ? `${project.currency || 'USD'} ${fmt(project.total_budget)}` : null],
        ] as [string, string | null][]).filter(([, v]) => v).map(([label, value]) => (
          <View key={label} style={s.detailRow}>
            <Text style={s.detailLabel}>{label}</Text>
            <Text style={s.detailValue} numberOfLines={1}>{value}</Text>
          </View>
        ))}
        {project.style_notes && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Style Notes</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18 }} numberOfLines={3}>{project.style_notes}</Text>
          </View>
        )}
      </Card>

      {/* ── Budget mini ── */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Feather name="dollar-sign" size={13} color="#10b981" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Budget</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('budget')}>
            <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>View →</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
          <View style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, spendPct)}%` as any, backgroundColor: spendPct > 90 ? '#ef4444' : spendPct > 70 ? '#f59e0b' : '#10b981' }} />
        </View>
        {([
          ['Total Budget', `$${fmt(totalBudget)}`,                                   '#fff'],
          ['Estimated',    `$${fmt(totalEst)}`,                                       'rgba(255,255,255,0.55)'],
          ['Spent',        `$${fmt(totalActual)}`,                                    '#f59e0b'],
          ['Remaining',    `$${fmt(Math.max(0, totalBudget - totalActual))}`, totalBudget >= totalActual ? '#10b981' : '#ef4444'],
        ] as [string,string,string][]).map(([l, v, c]) => (
          <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>{l}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: c }}>{v}</Text>
          </View>
        ))}
      </Card>

      {/* ── Vendors mini ── */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Feather name="shopping-bag" size={13} color="#f59e0b" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Vendors</Text>
          </View>
          <TouchableOpacity onPress={() => router.push(`/planner/vendors/${projectId}`)}>
            <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>View →</Text>
          </TouchableOpacity>
        </View>
        {vendors.length === 0 ? (
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', textAlign: 'center', paddingVertical: 10 }}>No vendors yet</Text>
        ) : (
          <>
            {vendors.slice(0, 5).map((v: any) => {
              const st = (v.booking_status || '').toLowerCase();
              const isConf = ['booked','confirmed'].includes(st);
              const c = isConf ? '#10b981' : st === 'quoted' ? '#f59e0b' : st === 'contacted' ? '#3b82f6' : '#6b7280';
              const bg = isConf ? 'rgba(16,185,129,0.15)' : st === 'quoted' ? 'rgba(245,158,11,0.15)' : st === 'contacted' ? 'rgba(59,130,246,0.15)' : 'rgba(107,114,128,0.15)';
              return (
                <View key={v.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', flex: 1 }} numberOfLines={1}>{v.name}</Text>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100, backgroundColor: bg }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: c }}>{st || 'new'}</Text>
                  </View>
                </View>
              );
            })}
            {vendors.length > 5 && (
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', textAlign: 'center', marginTop: 4 }}>+{vendors.length - 5} more</Text>
            )}
          </>
        )}
      </Card>

      {/* ── Team mini (conditional) ── */}
      {team.length > 0 && (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Feather name="users" size={13} color="#14b8a6" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Team</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate('team')}>
              <Text style={{ fontSize: 11, color: Colors.accent.indigo, fontWeight: '700' }}>View →</Text>
            </TouchableOpacity>
          </View>
          {team.slice(0, 4).map((m: any) => (
            <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(99,102,241,0.22)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.28)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#818cf8' }}>{initials(m.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }} numberOfLines={1}>{m.name}</Text>
                {m.role && <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', textTransform: 'capitalize' }}>{m.role}</Text>}
              </View>
            </View>
          ))}
          {team.length > 4 && <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>+{team.length - 4} more members</Text>}
        </Card>
      )}

      {/* ── AI Brief widget ── */}
      <View style={{ backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', padding: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Feather name="zap" size={13} color={Colors.accent.indigo} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>AI Brief</Text>
          </View>
          <TouchableOpacity onPress={() => onGenerate('brief')} disabled={generating}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.18)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.32)' }}>
            {generating
              ? <ActivityIndicator size="small" color={Colors.accent.indigo} />
              : <Feather name="zap" size={11} color={Colors.accent.indigo} />}
            <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.accent.indigo }}>{parsedBrief ? 'Refresh' : 'Generate'}</Text>
          </TouchableOpacity>
        </View>
        {generating ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 16 }}>
            {[0,1,2].map(i => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accent.indigo, opacity: 0.6 + i * 0.2 }} />)}
          </View>
        ) : !parsedBrief ? (
          <View style={{ alignItems: 'center', paddingVertical: 12, gap: 6 }}>
            <Feather name="star" size={28} color="rgba(99,102,241,0.3)" />
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', textAlign: 'center', lineHeight: 18 }}>
              Generate an executive AI brief with risk analysis, critical path, and action plan.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {parsedBrief.executiveSummary && (
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 18 }} numberOfLines={4}>{parsedBrief.executiveSummary}</Text>
            )}
            {(parsedBrief.risks || []).slice(0, 2).map((r: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 8, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)' }}>
                <Feather name="alert-triangle" size={11} color="#f59e0b" style={{ marginTop: 1 }} />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', lineHeight: 16, flex: 1 }} numberOfLines={2}>{typeof r === 'string' ? r : r.risk || r.description || ''}</Text>
              </View>
            ))}
            {(parsedBrief.priorities || []).slice(0, 2).map((p: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 8, borderRadius: 8, backgroundColor: 'rgba(99,102,241,0.08)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.15)' }}>
                <Feather name="target" size={11} color={Colors.accent.indigo} style={{ marginTop: 1 }} />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.58)', lineHeight: 16, flex: 1 }} numberOfLines={1}>{typeof p === 'string' ? p : p.action || p.title || ''}</Text>
              </View>
            ))}
            <TouchableOpacity onPress={() => onNavigate('ai-brief')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: Colors.accent.indigo, fontWeight: '700' }}>Full brief</Text>
              <Feather name="arrow-right" size={11} color={Colors.accent.indigo} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── AI Generate row ── */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: 1 }}>AI Generate</Text>
        <View style={s.aiActionsRow}>
          {[['Tasks','tasks'],['Timeline','timeline'],['Vendors','vendors'],['Budget','budget']].map(([label, key]) => (
            <TouchableOpacity key={key} style={[s.aiActionBtn, generating && { opacity: 0.5 }]} onPress={() => onGenerate(key)} disabled={generating}>
              <Feather name="zap" size={11} color={Colors.accent.indigo} />
              <Text style={s.aiActionText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </View>
  );
}

/* ── Section: Tasks (web-parity design) ────────────────────────────── */

const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  HIGH:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
  MEDIUM: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
  LOW:    { label: 'Low',    color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
};
const STATUS_META: Record<string, { label: string; color: string }> = {
  TODO:        { label: 'To Do',       color: '#6b7280' },
  todo:        { label: 'To Do',       color: '#6b7280' },
  IN_PROGRESS: { label: 'In Progress', color: Colors.accent.indigo },
  in_progress: { label: 'In Progress', color: Colors.accent.indigo },
  DONE:        { label: 'Done',        color: '#10b981' },
  done:        { label: 'Done',        color: '#10b981' },
  BLOCKED:     { label: 'Blocked',     color: '#ef4444' },
  blocked:     { label: 'Blocked',     color: '#ef4444' },
};

function isDone(status: string) { return status === 'done' || status === 'DONE'; }
function isOverdue(task: any) {
  return task.due_date && new Date(task.due_date) < new Date() && !isDone(task.status);
}
function dueFmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── Task Detail Sheet — mirrors web DetailPanel ───────────────────── */
const TDS_STATUSES = [
  { id: 'TODO',        label: 'To Do',      color: '#6b7280' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: Colors.accent.indigo },
  { id: 'DONE',        label: 'Done',        color: '#10b981' },
  { id: 'BLOCKED',     label: 'Blocked',     color: '#ef4444' },
];
const TDS_PRIORITIES = [
  { id: 'HIGH',   label: 'High',   color: '#ef4444' },
  { id: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
  { id: 'LOW',    label: 'Low',    color: '#6b7280' },
];

function TaskDetailSheet({ task, projectId, onClose, onDelete }: {
  task: any; projectId: string; onClose: () => void; onDelete: (id: string) => void;
}) {
  const { updateTask } = usePlannerStore();
  const [form, setForm] = useState({
    title:          task.title          || '',
    description:    task.description    || '',
    status:         (task.status        || 'TODO').toUpperCase(),
    priority:       task.priority?.toUpperCase() || 'MEDIUM',
    due_date:       task.due_date       ? task.due_date.slice(0, 10) : '',
    category:       task.category       || '',
    estimated_cost: task.estimated_cost ? String(task.estimated_cost) : '',
    assignee_name:  task.assignee_name  || '',
  });
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const f = (k: string) => (v: string) => { setForm(p => ({ ...p, [k]: v })); setSaved(false); };
  const over = isOverdue(task);

  async function save() {
    setSaving(true);
    const res = await updateTask(projectId, task.id, {
      ...form,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
    });
    setSaving(false);
    if (res.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    else notify.projectFailed(res.error);
  }

  async function doDelete() {
    setDeleting(true);
    await onDelete(task.id);
    setDeleting(false);
    onClose();
  }

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.modalBackdrop} onPress={onClose} />
        <View style={[s.modalSheet, { maxHeight: '93%', padding: 0 }]}>
          <View style={s.modalHandle} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="edit-3" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Task Details</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {over && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#f87171' }}>Overdue</Text>
                </View>
              )}
              <TouchableOpacity onPress={onClose} style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 14 }}>

            {/* Title */}
            <View>
              <Text style={tds.label}>Title</Text>
              <TextInput style={[tds.inp, { height: 64, textAlignVertical: 'top' }]} multiline
                value={form.title} onChangeText={f('title')} placeholder="Task title" placeholderTextColor="rgba(255,255,255,0.25)" />
            </View>

            {/* Description */}
            <View>
              <Text style={tds.label}>Description</Text>
              <TextInput style={[tds.inp, { height: 72, textAlignVertical: 'top' }]} multiline
                value={form.description} onChangeText={f('description')} placeholder="Add a description…" placeholderTextColor="rgba(255,255,255,0.25)" />
            </View>

            {/* Status chips */}
            <View>
              <Text style={tds.label}>Status</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {TDS_STATUSES.map(st => {
                  const active = form.status === st.id;
                  return (
                    <TouchableOpacity key={st.id} onPress={() => f('status')(st.id)}
                      style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
                               backgroundColor: active ? st.color + '22' : 'rgba(255,255,255,0.04)',
                               borderColor: active ? st.color + '55' : 'rgba(255,255,255,0.1)' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? st.color : 'rgba(255,255,255,0.45)' }}>{st.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Priority chips */}
            <View>
              <Text style={tds.label}>Priority</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TDS_PRIORITIES.map(pr => {
                  const active = form.priority === pr.id;
                  return (
                    <TouchableOpacity key={pr.id} onPress={() => f('priority')(pr.id)}
                      style={{ flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, alignItems: 'center',
                               backgroundColor: active ? pr.color + '22' : 'rgba(255,255,255,0.04)',
                               borderColor: active ? pr.color + '55' : 'rgba(255,255,255,0.1)' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? pr.color : 'rgba(255,255,255,0.45)' }}>{pr.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Due Date + Assignee */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={tds.label}>Due Date</Text>
                <TextInput style={tds.inp} value={form.due_date} onChangeText={f('due_date')}
                  placeholder="YYYY-MM-DD" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numbers-and-punctuation" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={tds.label}>Assignee</Text>
                <TextInput style={tds.inp} value={form.assignee_name} onChangeText={f('assignee_name')}
                  placeholder="Name" placeholderTextColor="rgba(255,255,255,0.25)" />
              </View>
            </View>

            {/* Category + Cost */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={tds.label}>Category</Text>
                <TextInput style={tds.inp} value={form.category} onChangeText={f('category')}
                  placeholder="e.g. Venue" placeholderTextColor="rgba(255,255,255,0.25)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={tds.label}>Est. Cost</Text>
                <TextInput style={tds.inp} value={form.estimated_cost} onChangeText={f('estimated_cost')}
                  placeholder="0.00" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numeric" />
              </View>
            </View>

            {/* AI badge */}
            {task.ai_generated && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.18)' }}>
                <Feather name="zap" size={13} color="#a78bfa" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#a78bfa' }}>AI generated task</Text>
              </View>
            )}

            {/* Metadata */}
            <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: 4 }}>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                Created {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              {task.completed_at && (
                <Text style={{ fontSize: 10, color: '#10b981' }}>
                  Completed {new Date(task.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: 8 }}>
            <TouchableOpacity onPress={save} disabled={saving}
              style={[s.modalSaveBtn, saving && { opacity: 0.6 }]}>
              {saving ? <ActivityIndicator color="#fff" size="small" />
                : saved ? <><Feather name="check" size={16} color="#34d399" /><Text style={[s.modalSaveBtnText, { color: '#34d399' }]}>Saved!</Text></>
                : <Text style={s.modalSaveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            {confirmDel ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setConfirmDel(false)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={doDelete} disabled={deleting}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}>
                  {deleting ? <ActivityIndicator size="small" color="#ef4444" />
                    : <><Feather name="trash-2" size={13} color="#f87171" /><Text style={{ fontSize: 13, fontWeight: '700', color: '#f87171' }}>Delete</Text></>}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setConfirmDel(true)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 }}>
                <Feather name="trash-2" size={13} color="rgba(239,68,68,0.5)" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(239,68,68,0.5)' }}>Delete task</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const tds = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inp:   { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#fff' },
});

/* ── TaskCard — rich card matching web SortableCard ─────────────────── */
function TaskCard({ task, onToggle, onOpen, onDrag }: any) {
  const done = isDone(task.status);
  const pm   = PRIORITY_META[task.priority?.toUpperCase()] ?? PRIORITY_META.MEDIUM;
  const over = isOverdue(task);
  const days = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86_400_000) : null;

  return (
    <TouchableOpacity onPress={() => onOpen(task)} activeOpacity={0.75}
      style={[s.taskCard, done && { opacity: 0.55 }, { borderLeftWidth: 2, borderLeftColor: pm.color }]}>
      {/* Drag handle — long press to drag */}
      {onDrag && (
        <TouchableOpacity onLongPress={onDrag} delayLongPress={200} hitSlop={8}
          style={{ padding: 4, marginRight: -4 }}>
          <Feather name="menu" size={13} color="rgba(255,255,255,0.18)" />
        </TouchableOpacity>
      )}
      {/* Checkbox */}
      <TouchableOpacity onPress={() => onToggle(task)} hitSlop={8} style={[s.taskCheck, done && s.taskCheckDone]}>
        {done && <Feather name="check" size={11} color="#fff" />}
      </TouchableOpacity>

      {/* Body */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.taskCardTitle, done && s.taskDone]} numberOfLines={2}>{task.title}</Text>
        {task.description && !done && (
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 5, lineHeight: 15 }} numberOfLines={1}>{task.description}</Text>
        )}
        <View style={s.taskBadgeRow}>
          {task.category && (
            <View style={[s.taskBadge, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
              <Text style={[s.taskBadgeText, { color: '#818cf8', textTransform: 'uppercase', letterSpacing: 0.3 }]}>{task.category}</Text>
            </View>
          )}
          <View style={[s.taskBadge, { backgroundColor: pm.bg }]}>
            <Text style={[s.taskBadgeText, { color: pm.color }]}>{pm.label}</Text>
          </View>
          {task.due_date && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              {over && <Feather name="alert-triangle" size={9} color="#ef4444" />}
              <Text style={[s.taskDueText, over && { color: '#ef4444' }, days !== null && days <= 3 && !over && { color: '#f59e0b' }]}>
                {dueFmt(task.due_date)}{over ? ' · overdue' : ''}
              </Text>
            </View>
          )}
          {task.estimated_cost > 0 && (
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: '600' }}>${Number(task.estimated_cost).toLocaleString()}</Text>
          )}
        </View>
        {task.progress > 0 && (
          <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1, marginTop: 6, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${task.progress}%` as any, backgroundColor: Colors.accent.indigo, borderRadius: 1 }} />
          </View>
        )}
      </View>

      <Feather name="chevron-right" size={13} color="rgba(255,255,255,0.15)" style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

function PhaseGroup({ phase, tasks, onToggle, onOpen, onReorder, projectId }: any) {
  const [open,  setOpen]  = useState(true);
  const [items, setItems] = useState<any[]>(tasks);

  // Keep local items in sync when parent tasks change
  React.useEffect(() => { setItems(tasks); }, [tasks]);

  if (tasks.length === 0) return null;
  const doneN = items.filter((t: any) => isDone(t.status)).length;

  function handleDragEnd({ data }: { data: any[] }) {
    setItems(data);
    onReorder(projectId, data.map((t: any) => t.id));
  }

  return (
    <View style={[s.phaseGroup, { borderColor: phase.color + '20', backgroundColor: phase.color + '04' }]}>
      <TouchableOpacity style={s.phaseHeader} onPress={() => setOpen(o => !o)}>
        <View style={[s.phaseDot, { backgroundColor: phase.color }]} />
        <Text style={[s.phaseLabel, { color: phase.color }]}>{phase.label}</Text>
        <View style={[s.phaseCount, { backgroundColor: phase.color + '20' }]}>
          <Text style={[s.phaseCountText, { color: phase.color }]}>{items.length}</Text>
        </View>
        {doneN > 0 && <Text style={{ fontSize: 9, color: '#10b981', fontWeight: '700' }}>{doneN} done</Text>}
        <Feather name={open ? 'chevron-down' : 'chevron-right'} size={14} color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {open && (
        <DraggableFlatList
          data={items}
          keyExtractor={(t: any) => t.id}
          onDragEnd={handleDragEnd}
          scrollEnabled={false}
          renderItem={({ item, drag, isActive }: RenderItemParams<any>) => (
            <ScaleDecorator activeScale={1.02}>
              <View style={[
                items.indexOf(item) < items.length - 1 && s.taskCardBorder,
                isActive && { backgroundColor: 'rgba(99,102,241,0.06)' },
              ]}>
                <TaskCard task={item} onToggle={onToggle} onOpen={onOpen} onDrag={drag} />
              </View>
            </ScaleDecorator>
          )}
        />
      )}
    </View>
  );
}

function TasksSection({ project, projectId, onGenerate, generating }: { project: any; projectId: string; onGenerate: () => void; generating: boolean }) {
  const { updateTask, deleteTask, createTask, reorderTasks } = usePlannerStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [priFilter,    setPriFilter]    = useState('all');
  const [sortBy,       setSortBy]       = useState('default');
  const [search,       setSearch]       = useState('');
  const [newTitle,     setNewTitle]     = useState('');
  const [adding,       setAdding]       = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const allTasks   = project.tasks || [];
  const doneCount  = allTasks.filter((t: any) => isDone(t.status)).length;
  const inProg     = allTasks.filter((t: any) => ['in_progress','IN_PROGRESS'].includes(t.status)).length;
  const blockedN   = allTasks.filter((t: any) => ['blocked','BLOCKED'].includes(t.status)).length;
  const todoN      = allTasks.filter((t: any) => ['todo','TODO'].includes(t.status)).length;
  const donePct    = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;
  const overdueCount = allTasks.filter((t: any) => isOverdue(t)).length;

  const liveSelected = selectedTask ? allTasks.find((t: any) => t.id === selectedTask.id) : null;

  const filtered = allTasks.filter((t: any) => {
    const st = (t.status || '').toUpperCase();
    if (statusFilter !== 'all' && st !== statusFilter) return false;
    if (priFilter !== 'all' && (t.priority?.toUpperCase() || 'MEDIUM') !== priFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.category || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortBy === 'priority') {
      const ord: Record<string,number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (ord[a.priority?.toUpperCase() ?? 'MEDIUM'] ?? 1) - (ord[b.priority?.toUpperCase() ?? 'MEDIUM'] ?? 1);
    }
    if (sortBy === 'due') return new Date(a.due_date || '9999').getTime() - new Date(b.due_date || '9999').getTime();
    if (sortBy === 'status') {
      const ord: Record<string,number> = { TODO: 0, IN_PROGRESS: 1, BLOCKED: 2, DONE: 3 };
      return (ord[a.status] ?? 0) - (ord[b.status] ?? 0);
    }
    return 0;
  });

  const groups = (() => {
    const map = new Map<string, any>();
    for (const task of sorted) {
      const phase = assignPhase(task);
      if (!map.has(phase.id)) map.set(phase.id, { phase, tasks: [] });
      map.get(phase.id).tasks.push(task);
    }
    return [...PHASES.map(p => p.id), 'other'].map(id => map.get(id)).filter(Boolean);
  })();

  async function toggle(task: any) {
    await updateTask(projectId, task.id, { status: isDone(task.status) ? 'TODO' : 'DONE' });
  }
  async function remove(id: string) {
    const res = await deleteTask(projectId, id);
    if (!res.success) notify.taskFailed();
    if (selectedTask?.id === id) setSelectedTask(null);
  }
  async function addTask() {
    if (!newTitle.trim()) return;
    setSaving(true);
    await createTask(projectId, { title: newTitle.trim(), status: 'TODO' });
    setNewTitle(''); setSaving(false); setAdding(false);
  }

  const R = 15; const C = 2 * Math.PI * R;
  const dash = (donePct / 100) * C;

  const COL_DOTS = [
    { id: 'DONE',        label: 'Done',        count: doneCount, dot: '#10b981' },
    { id: 'IN_PROGRESS', label: 'In Progress', count: inProg,    dot: Colors.accent.indigo },
    { id: 'BLOCKED',     label: 'Blocked',     count: blockedN,  dot: '#ef4444' },
    { id: 'TODO',        label: 'To Do',       count: todoN,     dot: 'rgba(255,255,255,0.3)' },
  ];

  return (
    <View style={s.sectionContent}>

      {/* ── 4-KPI strip ── */}
      <View style={s.taskKpiGrid}>
        <View style={[s.taskKpiCard, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.taskKpiVal}>{donePct}%</Text>
            <Text style={s.taskKpiLabel}>Complete</Text>
          </View>
          <Svg width={40} height={40} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={20} cy={20} r={R} stroke="rgba(255,255,255,0.06)" strokeWidth={4} fill="none" />
            <Circle cx={20} cy={20} r={R} stroke={Colors.accent.indigo} strokeWidth={4} fill="none"
              strokeDasharray={`${dash} ${C}`} strokeLinecap="round" />
          </Svg>
        </View>
        <View style={s.taskKpiCard}>
          <Text style={s.taskKpiVal}>{allTasks.length}</Text>
          <Text style={s.taskKpiLabel}>Total Tasks</Text>
        </View>
        <View style={s.taskKpiCard}>
          <Text style={[s.taskKpiVal, { color: Colors.accent.indigo }]}>{inProg}</Text>
          <Text style={s.taskKpiLabel}>In Progress</Text>
        </View>
        <View style={s.taskKpiCard}>
          <Text style={[s.taskKpiVal, { color: overdueCount > 0 ? '#ef4444' : 'rgba(255,255,255,0.3)' }]}>{overdueCount}</Text>
          <Text style={s.taskKpiLabel}>Overdue</Text>
        </View>
      </View>

      {/* ── Status breakdown bar ── */}
      {allTasks.length > 0 && (
        <Card>
          <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', gap: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 10 }}>
            {COL_DOTS.map(({ count, dot }) => {
              const pct = allTasks.length > 0 ? Math.round((count / allTasks.length) * 100) : 0;
              return pct > 0 ? <View key={dot} style={{ flex: pct, height: '100%', backgroundColor: dot }} /> : null;
            })}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {COL_DOTS.map(({ id, label, count, dot }) => count > 0 ? (
              <TouchableOpacity key={id} onPress={() => setStatusFilter(p => p === id ? 'all' : id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, opacity: statusFilter !== 'all' && statusFilter !== id ? 0.4 : 1 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{label}</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>{count}</Text>
              </TouchableOpacity>
            ) : null)}
          </View>
        </Card>
      )}

      {/* ── Search ── */}
      <View style={s.taskSearchWrap}>
        <Feather name="search" size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: 12, zIndex: 1 }} />
        <TextInput style={s.taskSearchInput} value={search} onChangeText={setSearch}
          placeholder="Search tasks…" placeholderTextColor="rgba(255,255,255,0.25)" />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ position: 'absolute', right: 12 }}>
            <Feather name="x" size={13} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter + sort chips ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 2 }}>
          {/* Status */}
          {[['all','All'],['TODO','To Do'],['IN_PROGRESS','Active'],['DONE','Done'],['BLOCKED','Blocked']].map(([val, label]) => (
            <TouchableOpacity key={val} style={[s.filterChip, statusFilter === val && s.filterChipActive]} onPress={() => setStatusFilter(val)}>
              <Text style={[s.filterChipText, statusFilter === val && s.filterChipTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 2 }} />
          {/* Priority */}
          {[['all','★ All'],['HIGH','High'],['MEDIUM','Med'],['LOW','Low']].map(([val, label]) => {
            const active = priFilter === val;
            const c = val !== 'all' ? PRIORITY_META[val]?.color : Colors.accent.indigo;
            return (
              <TouchableOpacity key={`p_${val}`} onPress={() => setPriFilter(val)}
                style={[s.filterChip, active && { backgroundColor: c + '22', borderColor: c + '55' }]}>
                <Text style={[s.filterChipText, active && { color: c }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
          <View style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 2 }} />
          {/* Sort */}
          {[['default','Default'],['priority','Priority'],['due','Due'],['status','Status']].map(([val, label]) => (
            <TouchableOpacity key={`s_${val}`} style={[s.filterChip, sortBy === val && s.filterChipActive]} onPress={() => setSortBy(val)}>
              <Text style={[s.filterChipText, sortBy === val && s.filterChipTextActive]}>↕ {label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── Add task / AI row ── */}
      {adding ? (
        <View style={s.addTaskRow}>
          <TextInput style={s.addTaskInput} value={newTitle} onChangeText={setNewTitle}
            placeholder="Task title…" placeholderTextColor="rgba(255,255,255,0.25)"
            autoFocus returnKeyType="done" onSubmitEditing={addTask} />
          <TouchableOpacity style={s.addTaskSave} onPress={addTask} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="check" size={16} color="#fff" />}
          </TouchableOpacity>
          <TouchableOpacity style={s.addTaskCancel} onPress={() => setAdding(false)}>
            <Feather name="x" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.row2}>
          <TouchableOpacity style={s.addBtn} onPress={() => setAdding(true)}>
            <Feather name="plus" size={13} color="#fff" /><Text style={s.addBtnText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.addBtn, { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.35)' }]} onPress={onGenerate} disabled={generating}>
            {generating ? <ActivityIndicator size="small" color={Colors.accent.indigo} /> : <Feather name="zap" size={13} color={Colors.accent.indigo} />}
            <Text style={[s.addBtnText, { color: Colors.accent.indigo }]}>{generating ? 'Generating…' : 'AI Generate'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Phase-grouped task list (drag-to-reorder per group) ── */}
      {sorted.length === 0
        ? <SectionEmpty icon="check-square"
            title={search || statusFilter !== 'all' || priFilter !== 'all' ? 'No tasks match' : 'No tasks yet'}
            desc={search || statusFilter !== 'all' || priFilter !== 'all' ? 'Try adjusting your filters.' : 'Generate a full AI task checklist tailored to your event type.'}
            onGenerate={search || statusFilter !== 'all' || priFilter !== 'all' ? undefined : onGenerate}
            generating={generating} />
        : (
          <GestureHandlerRootView style={{ gap: 8 }}>
            {groups.map(({ phase, tasks: pt }) => (
              <PhaseGroup key={phase.id} phase={phase} tasks={pt}
                onToggle={toggle} onOpen={setSelectedTask}
                onReorder={reorderTasks} projectId={projectId} />
            ))}
          </GestureHandlerRootView>
        )
      }

      {/* ── Task Detail Sheet ── */}
      {liveSelected && (
        <TaskDetailSheet task={liveSelected} projectId={projectId}
          onClose={() => setSelectedTask(null)} onDelete={remove} />
      )}
    </View>
  );
}

/* TimelineSection is imported from @/components/planner/TimelineSection */

/* ── Vendor constants ──────────────────────────────────────────────── */
const VENDOR_STATUSES = ['researching', 'contacted', 'quoted', 'booked', 'rejected'] as const;
const VENDOR_CATEGORIES = [
  'Catering','Photography','Videography','Flowers & Décor','Music & DJ',
  'Venue','Transportation','Security','Lighting','Sound & AV',
  'Hair & Makeup','Officiant','Cake & Desserts','Invitations','Rentals','Other',
];
const VSTATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  researching: { label: 'Researching', color: 'rgba(107,114,128,0.8)', dot: '#6b7280' },
  contacted:   { label: 'Contacted',   color: '#3b82f6',               dot: '#3b82f6' },
  quoted:      { label: 'Quoted',      color: '#f59e0b',               dot: '#f59e0b' },
  booked:      { label: 'Booked',      color: '#10b981',               dot: '#10b981' },
  rejected:    { label: 'Rejected',    color: '#ef4444',               dot: '#ef4444' },
};
function normalizeVStatus(s: string) {
  if (!s) return 'researching';
  const l = s.toLowerCase();
  return VSTATUS_META[l] ? l : 'researching';
}

/* ── Vendor Form Modal (add + edit) ────────────────────────────────── */
function VendorFormModal({ projectId, vendor, onClose }: { projectId: string; vendor?: any; onClose: () => void }) {
  const { createVendor, updateVendor } = usePlannerStore();
  const editing = !!vendor;
  const [form, setForm] = useState({
    name:           vendor?.name           || '',
    category:       vendor?.category       || '',
    booking_status: normalizeVStatus(vendor?.booking_status) || 'researching',
    contact_name:   vendor?.contact_name   || '',
    contact_email:  vendor?.contact_email  || '',
    contact_phone:  vendor?.contact_phone  || '',
    website_url:    vendor?.website_url    || '',
    quoted_price:   vendor?.quoted_price   ? String(vendor.quoted_price)   : '',
    confirmed_price:vendor?.confirmed_price? String(vendor.confirmed_price): '',
    currency:       vendor?.currency       || 'USD',
    notes:          vendor?.notes          || '',
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      quoted_price:    form.quoted_price    ? Number(form.quoted_price)    : null,
      confirmed_price: form.confirmed_price ? Number(form.confirmed_price) : null,
    };
    const res = editing
      ? await updateVendor(projectId, vendor.id, payload)
      : await createVendor(projectId, payload);
    setSaving(false);
    if (res.success) {
      editing ? notify.vendorUpdated() : notify.vendorAdded();
      onClose();
    } else {
      notify.vendorFailed(res.error);
    }
  }

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.modalBackdrop} onPress={onClose} />
        <View style={[s.modalSheet, { maxHeight: '90%' }]}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? 'Edit Vendor' : 'Add Vendor'}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ padding: 16, gap: 10 }}>
              <TextInput style={s.inp} placeholder="Vendor name *" placeholderTextColor="rgba(255,255,255,0.25)" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />

              {/* Category */}
              <Text style={vs.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {VENDOR_CATEGORIES.map(cat => {
                    const active = form.category === cat;
                    return (
                      <TouchableOpacity key={cat}
                        style={[vs.chip, active && { backgroundColor: 'rgba(99,102,241,0.25)', borderColor: Colors.accent.indigo }]}
                        onPress={() => setForm(p => ({ ...p, category: p.category === cat ? '' : cat }))}>
                        <Text style={[vs.chipText, active && { color: Colors.accent.indigo }]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Status */}
              <Text style={vs.fieldLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {VENDOR_STATUSES.map(st => {
                    const meta = VSTATUS_META[st];
                    const active = form.booking_status === st;
                    return (
                      <TouchableOpacity key={st}
                        style={[vs.chip, active && { backgroundColor: meta.dot + '28', borderColor: meta.dot }]}
                        onPress={() => setForm(p => ({ ...p, booking_status: st }))}>
                        <View style={[vs.statusDot, { backgroundColor: meta.dot }]} />
                        <Text style={[vs.chipText, active && { color: meta.dot }]}>{meta.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <TextInput style={s.inp} placeholder="Contact name" placeholderTextColor="rgba(255,255,255,0.25)" value={form.contact_name} onChangeText={v => setForm(p => ({ ...p, contact_name: v }))} />
              <TextInput style={s.inp} placeholder="Contact email" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="email-address" autoCapitalize="none" value={form.contact_email} onChangeText={v => setForm(p => ({ ...p, contact_email: v }))} />
              <TextInput style={s.inp} placeholder="Phone" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="phone-pad" value={form.contact_phone} onChangeText={v => setForm(p => ({ ...p, contact_phone: v }))} />
              <TextInput style={s.inp} placeholder="Website URL" placeholderTextColor="rgba(255,255,255,0.25)" autoCapitalize="none" value={form.website_url} onChangeText={v => setForm(p => ({ ...p, website_url: v }))} />

              {/* Pricing row */}
              <Text style={vs.fieldLabel}>Pricing</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[s.inp, { flex: 1 }]} placeholder="Quoted" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numeric" value={form.quoted_price} onChangeText={v => setForm(p => ({ ...p, quoted_price: v }))} />
                <TextInput style={[s.inp, { flex: 1 }]} placeholder="Confirmed" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numeric" value={form.confirmed_price} onChangeText={v => setForm(p => ({ ...p, confirmed_price: v }))} />
                <TextInput style={[s.inp, { width: 64 }]} placeholder="USD" placeholderTextColor="rgba(255,255,255,0.25)" autoCapitalize="characters" value={form.currency} onChangeText={v => setForm(p => ({ ...p, currency: v }))} />
              </View>

              <TextInput style={[s.inp, { height: 80, textAlignVertical: 'top' }]} placeholder="Notes…" placeholderTextColor="rgba(255,255,255,0.25)" multiline value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} />
            </View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, padding: 16 }}>
            <TouchableOpacity style={[vs.cancelBtn]} onPress={onClose}>
              <Text style={vs.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modalSaveBtn, { flex: 1 }, (!form.name.trim() || saving) && { opacity: 0.5 }]} onPress={submit} disabled={!form.name.trim() || saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalSaveBtnText}>{editing ? 'Save Changes' : 'Add Vendor'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ── Vendor Detail Sheet ────────────────────────────────────────────── */
function VendorDetailSheet({ vendor, projectId, onClose, onEdit }: { vendor: any; projectId: string; onClose: () => void; onEdit: (v: any) => void }) {
  const { updateVendor, deleteVendor } = usePlannerStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savingStatus,  setSavingStatus]  = useState('');

  const status = normalizeVStatus(vendor.booking_status);
  const meta   = VSTATUS_META[status];
  const displayPrice = vendor.confirmed_price > 0 ? vendor.confirmed_price : vendor.quoted_price > 0 ? vendor.quoted_price : null;
  const priceLabel   = vendor.confirmed_price > 0 ? 'Confirmed' : 'Quoted';
  const priceColor   = vendor.confirmed_price > 0 ? '#10b981' : '#f59e0b';
  const initial      = (vendor.name || '?').charAt(0).toUpperCase();

  async function changeStatus(st: string) {
    setSavingStatus(st);
    await updateVendor(projectId, vendor.id, { booking_status: st });
    setSavingStatus('');
  }

  async function handleDelete() {
    const res = await deleteVendor(projectId, vendor.id);
    if (res.success) { notify.vendorRemoved(); onClose(); }
    else notify.vendorFailed(res.error);
  }

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose} />
      <View style={[s.modalSheet, { maxHeight: '88%' }]}>
        <View style={s.modalHandle} />

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle }}>
          <View style={[vs.vendorAvatar, { backgroundColor: meta.dot + '28', borderColor: meta.dot + '40' }]}>
            <Text style={[vs.vendorAvatarText, { color: meta.dot }]}>{initial}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={vs.detailName} numberOfLines={1}>{vendor.name}</Text>
            {vendor.category && <Text style={vs.detailCategory}>{vendor.category}</Text>}
            <View style={[vs.statusPill, { backgroundColor: meta.dot + '22', borderColor: meta.dot + '44' }]}>
              <View style={[vs.statusDot, { backgroundColor: meta.dot }]} />
              <Text style={[vs.statusPillText, { color: meta.dot }]}>{meta.label}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity style={vs.iconBtn} onPress={() => { onClose(); setTimeout(() => onEdit(vendor), 200); }}>
              <Feather name="edit-3" size={15} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
            <TouchableOpacity style={vs.iconBtn} onPress={onClose}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Price */}
          {displayPrice && (
            <View style={vs.detailSection}>
              <Text style={vs.detailSectionLabel}>{priceLabel} Price</Text>
              <Text style={[vs.detailPrice, { color: priceColor }]}>{vendor.currency || 'USD'} {Number(displayPrice).toLocaleString()}</Text>
              {vendor.confirmed_price > 0 && vendor.quoted_price > 0 && vendor.confirmed_price !== vendor.quoted_price && (
                <Text style={vs.detailMeta}>Quoted: {vendor.currency} {Number(vendor.quoted_price).toLocaleString()}</Text>
              )}
            </View>
          )}

          {/* Contact */}
          {(vendor.contact_name || vendor.contact_email || vendor.contact_phone || vendor.website_url) && (
            <View style={vs.detailSection}>
              <Text style={vs.detailSectionLabel}>Contact</Text>
              {vendor.contact_name && (
                <View style={vs.detailRow}>
                  <Feather name="user" size={13} color="rgba(255,255,255,0.35)" />
                  <Text style={vs.detailRowText}>{vendor.contact_name}</Text>
                </View>
              )}
              {vendor.contact_email && (
                <View style={vs.detailRow}>
                  <Feather name="mail" size={13} color="#3b82f6" />
                  <Text style={[vs.detailRowText, { color: '#60a5fa' }]} numberOfLines={1}>{vendor.contact_email}</Text>
                </View>
              )}
              {vendor.contact_phone && (
                <View style={vs.detailRow}>
                  <Feather name="phone" size={13} color="#10b981" />
                  <Text style={[vs.detailRowText, { color: '#34d399' }]}>{vendor.contact_phone}</Text>
                </View>
              )}
              {vendor.website_url && (
                <View style={vs.detailRow}>
                  <Feather name="globe" size={13} color={Colors.accent.indigo} />
                  <Text style={[vs.detailRowText, { color: '#818cf8' }]} numberOfLines={1}>{vendor.website_url}</Text>
                </View>
              )}
            </View>
          )}

          {/* Pipeline Stage */}
          <View style={vs.detailSection}>
            <Text style={vs.detailSectionLabel}>Pipeline Stage</Text>
            <View style={{ gap: 6 }}>
              {VENDOR_STATUSES.map(st => {
                const m = VSTATUS_META[st];
                const active = status === st;
                return (
                  <TouchableOpacity key={st}
                    style={[vs.pipelineBtn, active && { backgroundColor: m.dot + '1a', borderColor: m.dot + '55' }]}
                    onPress={() => changeStatus(st)}
                    disabled={!!savingStatus}>
                    {savingStatus === st
                      ? <ActivityIndicator size="small" color={m.dot} style={{ marginRight: 8 }} />
                      : <View style={[vs.statusDot, { backgroundColor: m.dot, marginRight: 8 }]} />}
                    <Text style={[vs.pipelineBtnText, active && { color: m.dot }]}>{m.label}</Text>
                    {active && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m.dot, marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          {vendor.notes && (
            <View style={vs.detailSection}>
              <Text style={vs.detailSectionLabel}>Notes</Text>
              <Text style={vs.detailNotes}>{vendor.notes}</Text>
            </View>
          )}

          {/* Delete */}
          <View style={[vs.detailSection, { paddingBottom: 24 }]}>
            {confirmDelete ? (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                  Remove <Text style={{ color: '#fff', fontWeight: '700' }}>{vendor.name}</Text>?
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[vs.cancelBtn, { flex: 1 }]} onPress={() => setConfirmDelete(false)}>
                    <Text style={vs.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[vs.deleteBtn, { flex: 1 }]} onPress={handleDelete}>
                    <Text style={vs.deleteBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={vs.deleteBtn} onPress={() => setConfirmDelete(true)}>
                <Feather name="trash-2" size={13} color="#f87171" />
                <Text style={vs.deleteBtnText}>Remove Vendor</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ── Section: Vendors ──────────────────────────────────────────────── */
/* ── Marketplace Browser Modal ──────────────────────────────────────── */
const MKT_CATS = ['All','Catering','Photography','Videography','Music & DJ',
  'Flowers & Décor','Venue','Transportation','Lighting','Sound & AV',
  'Hair & Makeup','Officiant','Cake & Desserts','Rentals','Entertainment'];

function MarketplaceBrowserModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { createVendor } = usePlannerStore();
  const [vendors,  setVendors]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [cat,      setCat]      = useState('All');
  const [adding,   setAdding]   = useState<string | null>(null);

  const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '30', sort: 'rating' });
    if (search.trim()) params.set('search', search.trim());
    if (cat !== 'All') params.set('category', cat);
    fetch(`${API_BASE}/vendors?${params}`)
      .then(r => r.json())
      .then(d => setVendors(d.data?.vendors || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, [search, cat]);

  async function handleAdd(v: any) {
    setAdding(v.id);
    const res = await createVendor(projectId, {
      name:          v.business_name,
      category:      v.category,
      image_url:     v.logo_url    || '',
      website_url:   v.website_url || '',
      contact_email: v.email       || '',
      contact_phone: v.phone       || '',
      notes:         v.tagline     || '',
      booking_status: 'researching',
    });
    setAdding(null);
    if (res.success) notify.vendorAdded(v.business_name);
    else notify.vendorFailed();
  }

  return (
    <Modal visible animationType="slide" statusBarTranslucent presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0f0f1e' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>Browse Marketplace</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Tap a vendor to add to your project</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 10 }}>
            <Feather name="search" size={13} color="rgba(255,255,255,0.3)" />
            <TextInput
              value={search} onChangeText={setSearch}
              placeholder="Search vendors…" placeholderTextColor="rgba(255,255,255,0.25)"
              style={{ flex: 1, fontSize: 13, color: '#fff' }}
            />
            {!!search && <TouchableOpacity onPress={() => setSearch('')}><Feather name="x" size={12} color="rgba(255,255,255,0.3)" /></TouchableOpacity>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {MKT_CATS.map(c => (
                <TouchableOpacity key={c} onPress={() => setCat(c)}
                  style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: cat === c ? '#6366f1' : 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: cat === c ? '#6366f1' : 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: cat === c ? '#fff' : 'rgba(255,255,255,0.5)' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* List */}
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#6366f1" size="large" />
          </View>
        ) : vendors.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="shopping-bag" size={32} color="rgba(255,255,255,0.15)" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>No vendors found</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 8 }}>
            {vendors.map((v: any) => (
              <View key={v.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 8 }}>
                {/* Avatar */}
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#818cf8' }}>{v.business_name?.[0]?.toUpperCase()}</Text>
                </View>
                {/* Info */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{v.business_name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#818cf8' }}>{v.category}</Text>
                    {v.rating > 0 && <Text style={{ fontSize: 10, color: '#f59e0b' }}>★ {Number(v.rating).toFixed(1)}</Text>}
                    {v.city && <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }} numberOfLines={1}>{v.city}</Text>}
                  </View>
                  {v.base_price && <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>From ${Number(v.base_price).toLocaleString()}</Text>}
                </View>
                {/* Add button */}
                <TouchableOpacity
                  onPress={() => handleAdd(v)}
                  disabled={adding === v.id}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: adding === v.id ? 'rgba(99,102,241,0.4)' : '#6366f1', flexShrink: 0 }}
                >
                  {adding === v.id
                    ? <ActivityIndicator size="small" color="#fff" style={{ width: 14, height: 14 }} />
                    : <Feather name="plus" size={14} color="#fff" />
                  }
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function VendorsSection({ project, projectId, onGenerate, generating }: { project: any; projectId: string; onGenerate: () => void; generating: boolean }) {
  const vendors: any[] = project.vendors || [];
  const router = useRouter();
  const [showForm,    setShowForm]    = useState(false);
  const [editVendor,  setEditVendor]  = useState<any>(null);
  const [selVendor,   setSelVendor]   = useState<any>(null);
  const [search,         setSearch]         = useState('');
  const [filterSt,       setFilterSt]       = useState('all');
  const [showMarketplace, setShowMarketplace] = useState(false);

  // Stats
  const confirmed   = vendors.filter(v => normalizeVStatus(v.booking_status) === 'booked').length;
  const totalQuoted = vendors.reduce((acc, v) => acc + Number(v.quoted_price || 0), 0);
  const totalConf   = vendors.reduce((acc, v) => acc + Number(v.confirmed_price || 0), 0);

  // Filtered list
  const displayed = vendors.filter(v => {
    if (filterSt !== 'all' && normalizeVStatus(v.booking_status) !== filterSt) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return v.name?.toLowerCase().includes(q)
        || v.category?.toLowerCase().includes(q)
        || v.contact_name?.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by category
  const grouped: Record<string, any[]> = {};
  displayed.forEach(v => {
    const cat = v.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(v);
  });

  // Keep detail sheet in sync with store
  const liveSelVendor = selVendor ? vendors.find(v => v.id === selVendor.id) : null;

  function openAdd()       { setEditVendor(null); setShowForm(true); }
  function openEdit(v: any){ setEditVendor(v);   setShowForm(true); }

  return (
    <View style={s.sectionContent}>

      {/* ── Stats row ── */}
      {vendors.length > 0 && (
        <View style={vs.statsRow}>
          <View style={vs.statTile}>
            <Text style={vs.statVal}>{vendors.length}</Text>
            <Text style={vs.statLabel}>Total</Text>
          </View>
          <View style={[vs.statTile, confirmed > 0 && { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }]}>
            <Text style={[vs.statVal, confirmed > 0 && { color: '#10b981' }]}>{confirmed}</Text>
            <Text style={vs.statLabel}>Booked</Text>
          </View>
          <View style={[vs.statTile, { backgroundColor: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.18)' }]}>
            <Text style={[vs.statVal, { color: '#f59e0b', fontSize: 13 }]} numberOfLines={1}>
              {totalConf > 0 ? `$${Number(totalConf).toLocaleString()}` : `$${Number(totalQuoted).toLocaleString()}`}
            </Text>
            <Text style={vs.statLabel}>{totalConf > 0 ? 'Committed' : 'Quoted'}</Text>
          </View>
        </View>
      )}

      {/* ── Status progress bar ── */}
      {vendors.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <View style={vs.progressBar}>
            {VENDOR_STATUSES.map(st => {
              const count = vendors.filter(v => normalizeVStatus(v.booking_status) === st).length;
              const pct = Math.round((count / vendors.length) * 100);
              return pct > 0 ? (
                <View key={st} style={{ flex: pct, height: '100%', backgroundColor: VSTATUS_META[st].dot }} />
              ) : null;
            })}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {VENDOR_STATUSES.map(st => {
                const count = vendors.filter(v => normalizeVStatus(v.booking_status) === st).length;
                if (!count) return null;
                return (
                  <TouchableOpacity key={st} onPress={() => setFilterSt(p => p === st ? 'all' : st)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: filterSt !== 'all' && filterSt !== st ? 0.3 : 1 }}>
                    <View style={[vs.statusDot, { backgroundColor: VSTATUS_META[st].dot }]} />
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>
                      {VSTATUS_META[st].label} <Text style={{ color: '#fff' }}>{count}</Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Toolbar ── */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        {vendors.length > 0 && (
          <View style={vs.searchBox}>
            <Feather name="search" size={13} color="rgba(255,255,255,0.3)" />
            <TextInput
              style={vs.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search vendors…"
              placeholderTextColor="rgba(255,255,255,0.25)"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x" size={12} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          </View>
        )}
        <TouchableOpacity style={[s.addBtn, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }]} onPress={onGenerate} disabled={generating}>
          <Feather name="zap" size={13} color="#f59e0b" />
          <Text style={[s.addBtnText, { color: '#f59e0b' }]}>{generating ? 'Suggesting…' : 'AI Suggest'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.35)' }]}
          onPress={() => router.push(`/planner/vendors/${projectId}`)}>
          <Feather name="map-pin" size={13} color="#818cf8" />
          <Text style={[s.addBtnText, { color: '#818cf8' }]}>Find</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Feather name="plus" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {showMarketplace && (
        <MarketplaceBrowserModal projectId={projectId} onClose={() => setShowMarketplace(false)} />
      )}

      {/* ── Content ── */}
      {vendors.length === 0 ? (
        <SectionEmpty icon="shopping-bag" title="No vendors yet"
          desc="AI can suggest vendors based on your event type — caterers, photographers, florists and more."
          onGenerate={onGenerate} generating={generating} hideBtn />
      ) : displayed.length === 0 ? (
        <View style={[s.emptyState, { paddingVertical: 24 }]}>
          <Text style={s.emptyTitle}>No vendors found</Text>
          <TouchableOpacity onPress={() => { setSearch(''); setFilterSt('all'); }}>
            <Text style={{ fontSize: 12, color: Colors.accent.indigo, fontWeight: '700', marginTop: 6 }}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        Object.entries(grouped).map(([cat, catVendors]) => (
          <View key={cat} style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Text style={vs.catLabel}>{cat}</Text>
              <Text style={vs.catCount}>{catVendors.length}</Text>
            </View>
            <View style={{ gap: 8 }}>
              {catVendors.map((v: any) => {
                const st    = normalizeVStatus(v.booking_status);
                const meta  = VSTATUS_META[st];
                const price = v.confirmed_price > 0 ? v.confirmed_price : v.quoted_price > 0 ? v.quoted_price : null;
                return (
                  <TouchableOpacity key={v.id} style={vs.vendorCard} onPress={() => setSelVendor(v)} activeOpacity={0.75}>
                    {/* Status accent bar */}
                    <View style={[vs.accentBar, { backgroundColor: meta.dot }]} />
                    <View style={{ flex: 1, paddingLeft: 12, paddingRight: 8, paddingVertical: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        {/* Avatar */}
                        <View style={[vs.vendorAvatar, { backgroundColor: meta.dot + '22', borderColor: meta.dot + '35' }]}>
                          <Text style={[vs.vendorAvatarText, { color: meta.dot }]}>{(v.name || '?').charAt(0).toUpperCase()}</Text>
                        </View>
                        {/* Info */}
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={vs.vendorName} numberOfLines={1}>{v.name}</Text>
                          {v.contact_name && <Text style={vs.vendorContact} numberOfLines={1}>{v.contact_name}</Text>}
                          {price && (
                            <Text style={[vs.vendorPrice, { color: v.confirmed_price > 0 ? '#10b981' : '#f59e0b' }]}>
                              {v.currency || 'USD'} {Number(price).toLocaleString()}
                              <Text style={{ fontSize: 9, fontWeight: '500', opacity: 0.65 }}> {v.confirmed_price > 0 ? 'confirmed' : 'quoted'}</Text>
                            </Text>
                          )}
                        </View>
                        {/* Status badge */}
                        <View style={[vs.statusPill, { backgroundColor: meta.dot + '1a', borderColor: meta.dot + '35' }]}>
                          <View style={[vs.statusDot, { backgroundColor: meta.dot }]} />
                          <Text style={[vs.statusPillText, { color: meta.dot }]}>{meta.label}</Text>
                        </View>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.2)" style={{ marginRight: 10, alignSelf: 'center' }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))
      )}

      {/* Modals */}
      {showForm && (
        <VendorFormModal
          projectId={projectId}
          vendor={editVendor ?? undefined}
          onClose={() => { setShowForm(false); setEditVendor(null); }}
        />
      )}
      {liveSelVendor && (
        <VendorDetailSheet
          vendor={liveSelVendor}
          projectId={projectId}
          onClose={() => setSelVendor(null)}
          onEdit={(v) => { setSelVendor(null); setEditVendor(v); setShowForm(true); }}
        />
      )}
    </View>
  );
}

/* ── Vendor styles ─────────────────────────────────────────────────── */
const vs = StyleSheet.create({
  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statTile:    { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.subtle, padding: 12, alignItems: 'center' },
  statVal:     { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  statLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row' },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: Colors.border.DEFAULT, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#fff', padding: 0 },
  catLabel:    { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.7 },
  catCount:    { fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  vendorCard:  { flexDirection: 'row', alignItems: 'stretch', backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.subtle, overflow: 'hidden' },
  accentBar:   { width: 3 },
  vendorAvatar:{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  vendorAvatarText: { fontSize: 14, fontWeight: '800' },
  vendorName:  { fontSize: 13, fontWeight: '800', color: '#fff', marginBottom: 1 },
  vendorContact:{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  vendorPrice: { fontSize: 12, fontWeight: '800' },
  statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 99, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
  statusDot:   { width: 5, height: 5, borderRadius: 3 },
  statusPillText: { fontSize: 9, fontWeight: '800' },
  chip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border.DEFAULT, backgroundColor: 'rgba(255,255,255,0.04)' },
  chipText:    { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  fieldLabel:  { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
  cancelBtn:   { paddingVertical: 13, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: Colors.border.DEFAULT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  deleteBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#f87171' },
  detailName:  { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  detailCategory: { fontSize: 10, fontWeight: '700', color: Colors.accent.indigo, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  detailSection:  { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border.subtle },
  detailSectionLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 },
  detailPrice: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  detailMeta:  { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailRowText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1 },
  detailNotes: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },
  pipelineBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'transparent' },
  pipelineBtnText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  iconBtn:     { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
});

/* ── Section: Budget (full) ────────────────────────────────────────── */
function AddBudgetModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { createBudgetItem } = usePlannerStore();
  const [form, setForm] = useState({ title: '', category: '', vendor_name: '', estimated_cost: '', actual_cost: '', paid_amount: '', payment_status: 'UNPAID', due_date: '', notes: '' });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await createBudgetItem(projectId, form);
    setSaving(false);
    if (res.success) { notify.budgetItemAdded(); onClose(); }
    else notify.budgetItemFailed(res.error);
  }

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.modalBackdrop} onPress={onClose} />
        <View style={s.modalSheet}>
          <View style={s.modalHandle} />
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Budget Item</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            <TextInput style={s.inp} placeholder="Title *" placeholderTextColor="rgba(255,255,255,0.25)" value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} />
            <View style={s.row2}>
              <TextInput style={[s.inp, { flex: 1 }]} placeholder="Category" placeholderTextColor="rgba(255,255,255,0.25)" value={form.category} onChangeText={v => setForm(p => ({ ...p, category: v }))} />
              <TextInput style={[s.inp, { flex: 1 }]} placeholder="Vendor" placeholderTextColor="rgba(255,255,255,0.25)" value={form.vendor_name} onChangeText={v => setForm(p => ({ ...p, vendor_name: v }))} />
            </View>
            <View style={s.row2}>
              <TextInput style={[s.inp, { flex: 1 }]} placeholder="Estimated" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numeric" value={form.estimated_cost} onChangeText={v => setForm(p => ({ ...p, estimated_cost: v }))} />
              <TextInput style={[s.inp, { flex: 1 }]} placeholder="Actual" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numeric" value={form.actual_cost} onChangeText={v => setForm(p => ({ ...p, actual_cost: v }))} />
              <TextInput style={[s.inp, { flex: 1 }]} placeholder="Paid" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numeric" value={form.paid_amount} onChangeText={v => setForm(p => ({ ...p, paid_amount: v }))} />
            </View>
            <TextInput style={s.inp} placeholder="Notes…" placeholderTextColor="rgba(255,255,255,0.25)" value={form.notes} onChangeText={v => setForm(p => ({ ...p, notes: v }))} />
          </ScrollView>
          <TouchableOpacity style={[s.modalSaveBtn, (!form.title.trim() || saving) && { opacity: 0.5 }]} onPress={submit} disabled={!form.title.trim() || saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalSaveBtnText}>Add Item</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BudgetSection({ project, projectId, onGenerate, generating }: { project: any; projectId: string; onGenerate: () => void; generating: boolean }) {
  const { budget, fetchBudget, deleteBudgetItem } = usePlannerStore();
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => { fetchBudget(projectId); }, [projectId]);

  const items = budget?.items || [];
  const totalBudget   = Number(project?.total_budget || budget?.total_budget || 0);
  const totalEst      = items.reduce((s: number, i: any) => s + Number(i.estimated_cost || 0), 0);
  const totalActual   = items.reduce((s: number, i: any) => s + Number(i.actual_cost || 0), 0);
  const totalPaid     = items.reduce((s: number, i: any) => s + Number(i.paid_amount || 0), 0);
  const remaining     = totalBudget - totalActual;
  const spendPct      = totalBudget > 0 ? Math.min(100, Math.round((totalActual / totalBudget) * 100)) : 0;
  const estimatedPct  = totalBudget > 0 ? Math.min(100, Math.round((totalEst / totalBudget) * 100)) : 0;
  const health        = spendPct > 100 ? 'over' : spendPct > 85 ? 'warning' : 'healthy';
  const healthColor   = health === 'over' ? '#ef4444' : health === 'warning' ? '#f59e0b' : '#10b981';
  const variance      = totalActual - totalEst;

  const byCategory = items.reduce((acc: any, item: any) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const catEntries = Object.entries(byCategory).map(([cat, catItems]: any, idx) => {
    const catActual = catItems.reduce((s: number, i: any) => s + Number(i.actual_cost || i.estimated_cost || 0), 0);
    const catEst    = catItems.reduce((s: number, i: any) => s + Number(i.estimated_cost || 0), 0);
    const base      = Math.max(totalActual, totalEst, 1);
    return { cat, catItems, catActual, catEst, pct: Math.round((catActual / base) * 100), color: CAT_PALETTE[idx % CAT_PALETTE.length] };
  }).sort((a: any, b: any) => b.catActual - a.catActual);

  const categories    = ['all', ...Object.keys(byCategory)];
  const displayItems  = activeCategory === 'all' ? items : (byCategory[activeCategory] || []);

  return (
    <View style={s.sectionContent}>
      {/* KPI grid */}
      <View style={s.kpiGrid}>
        {[
          { label: 'Total Budget', val: `$${fmt(totalBudget)}`, color: '#fff',          sub: 'allocated' },
          { label: 'Estimated',    val: `$${fmt(totalEst)}`,    color: '#f59e0b',        sub: `${estimatedPct}% of budget` },
          { label: 'Actual Spend', val: `$${fmt(totalActual)}`, color: health === 'over' ? '#ef4444' : '#fff', sub: `${spendPct}% used` },
          { label: 'Paid Out',     val: `$${fmt(totalPaid)}`,   color: '#10b981',        sub: `${items.filter((i: any) => i.payment_status === 'PAID').length} items` },
        ].map(({ label, val, color, sub }) => (
          <View key={label} style={s.kpiCard}>
            <Text style={s.kpiLabel}>{label}</Text>
            <Text style={[s.kpiVal, { color, fontSize: 18 }]}>{val}</Text>
            <Text style={s.kpiSub}>{sub}</Text>
          </View>
        ))}
      </View>

      {/* Health bar */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Feather name={health === 'over' ? 'alert-triangle' : health === 'warning' ? 'trending-up' : 'check-circle'} size={14} color={healthColor} />
            <Text style={s.cardTitle}>Budget Overview</Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: healthColor }}>{spendPct}% used</Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={s.kpiSub}>Actual spend</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>${fmt(totalActual)}</Text>
          </View>
          <View style={[s.progressTrack, { height: 10 }]}>
            <View style={[s.progressFill, { width: `${Math.min(100, spendPct)}%` as any, height: 10, backgroundColor: healthColor }]} />
          </View>
        </View>
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={s.kpiSub}>Estimated total</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>${fmt(totalEst)}</Text>
          </View>
          <View style={[s.progressTrack, { height: 5 }]}>
            <View style={[s.progressFill, { width: `${Math.min(100, estimatedPct)}%` as any, height: 5, backgroundColor: `${Colors.accent.indigo}99` }]} />
          </View>
        </View>
        {remaining < 0
          ? <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 10 }}>⚠ ${fmt(Math.abs(remaining))} over budget</Text>
          : totalBudget > 0 ? <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>${fmt(remaining)} remaining</Text>
          : null}
        {variance !== 0 && <Text style={{ fontSize: 10, color: variance > 0 ? '#ef4444' : '#10b981', marginTop: 4 }}>{variance > 0 ? '↑' : '↓'} ${fmt(Math.abs(variance))} {variance > 0 ? 'over estimate' : 'under estimate'}</Text>}
      </Card>

      {/* Category breakdown */}
      {catEntries.length > 0 && (
        <Card>
          <CardTitle>By Category</CardTitle>
          {catEntries.map(({ cat, catActual, color, pct }: any) => {
            const maxVal = Math.max(...catEntries.map((e: any) => e.catActual), 1);
            return (
              <View key={cat} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{cat}</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>${fmt(catActual)}</Text>
                </View>
                <View style={[s.progressTrack, { height: 5 }]}>
                  <View style={[s.progressFill, { width: `${(catActual / maxVal) * 100}%` as any, height: 5, backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {/* Category filter + actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {categories.map(cat => (
              <TouchableOpacity key={cat} style={[s.filterChip, activeCategory === cat && s.filterChipActive]} onPress={() => setActiveCategory(cat)}>
                <Text style={[s.filterChipText, activeCategory === cat && s.filterChipTextActive, { textTransform: 'capitalize' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={s.row2}>
          <TouchableOpacity style={[s.addBtn, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)' }]} onPress={onGenerate} disabled={generating}>
            <Feather name="zap" size={12} color="#10b981" /><Text style={[s.addBtnText, { color: '#10b981' }]}>{generating ? '…' : 'AI'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.addBtn, { backgroundColor: Colors.accent.indigo }]} onPress={() => setShowAdd(true)}>
            <Feather name="plus" size={12} color="#fff" /><Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Line items */}
      {displayItems.length === 0
        ? <SectionEmpty icon="dollar-sign" title="No budget items yet" desc="Add items manually or let AI generate a budget breakdown." onGenerate={onGenerate} generating={generating} />
        : (
          <Card style={{ padding: 0 }}>
            {displayItems.map((item: any, i: number) => {
              const pm      = PAYMENT_META[item.payment_status] ?? PAYMENT_META.UNPAID;
              const catColor = catEntries.find((e: any) => e.cat === (item.category || 'Uncategorized'))?.color;
              const over    = Number(item.actual_cost || 0) > Number(item.estimated_cost || 0) && Number(item.estimated_cost || 0) > 0;
              return (
                <View key={item.id} style={[s.budgetLineItem, i < displayItems.length - 1 && s.taskBorder]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {catColor && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: catColor }} />}
                      <Text style={s.taskTitle} numberOfLines={1}>{item.title}</Text>
                    </View>
                    {item.vendor_name && <Text style={s.taskMeta}>{item.vendor_name}</Text>}
                    {item.due_date && <Text style={s.taskMeta}>Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 3 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: over ? '#ef4444' : '#fff' }}>${fmt(item.actual_cost || 0)}</Text>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>est. ${fmt(item.estimated_cost || 0)}</Text>
                    <View style={[s.statusBadge, { backgroundColor: pm.color + '20' }]}>
                      <Text style={[s.statusText, { color: pm.color }]}>{pm.label}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteBudgetItem(projectId, item.id)} hitSlop={8}>
                    <Feather name="trash-2" size={14} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </Card>
        )
      }

      {showAdd && <AddBudgetModal projectId={projectId} onClose={() => setShowAdd(false)} />}
    </View>
  );
}

/* ── Section: Team ─────────────────────────────────────────────────── */
function TeamSection({ projectId, activeSection }: { projectId: string; activeSection?: string }) {
  const { team, fetchTeam, inviteTeamMember, removeTeamMember, updateTeamMember } = usePlannerStore();
  const { plan, isSubscribed, fetchSubscription } = useSubscriptionStore();
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '' });
  const [saving, setSaving] = useState(false);
  const { confirm, confirmProps } = useConfirm();

  useEffect(() => {
    fetchTeam(projectId);
    fetchSubscription();
  }, [projectId, fetchSubscription]);

  // Refetch team data when tab becomes active (catches updates from web)
  useEffect(() => {
    if (activeSection === 'team') {
      fetchTeam(projectId);
    }
  }, [activeSection, projectId]);

  async function handleInvite() {
    if (!inviteForm.email.trim()) return;
    setSaving(true);
    const res = await inviteTeamMember(projectId, { email: inviteForm.email.trim(), name: '' });
    setSaving(false);
    if (res.success) {
      const message = res.type === 'invited'
        ? "Invitation sent! They'll receive a signup link."
        : 'Team member added';
      notify.success(message);
      setInviteForm({ email: '' });
      setShowInvite(false);
    } else {
      notify.memberFailed(res.error);
    }
  }

  async function handleRemove(member: any) {
    if (member.role?.toUpperCase() === 'OWNER') return;
    confirm({
      title: 'Remove Member',
      message: `Remove ${member.name}?`,
      confirmLabel: 'Remove',
      variant: 'danger',
      onConfirm: () => removeTeamMember(projectId, member.id),
    });
  }

  const owners = team.filter((m: any) => m.role?.toUpperCase() === 'OWNER');
  const others = team.filter((m: any) => m.role?.toUpperCase() !== 'OWNER');

  // Use same team limits as event team page
  // Free: 1 total (owner only), Starter: 2 total, Pro: 4 total, Premium/Enterprise: unlimited
  const isPro = isSubscribed && (plan === 'pro' || plan === 'premium' || plan === 'enterprise');
  const planLimits: Record<string, number> = {
    free: 1,
    starter: 2,
    pro: 4,
    premium: Infinity,
    enterprise: Infinity
  };
  const maxTotal = isPro && (plan === 'premium' || plan === 'enterprise')
    ? null
    : (planLimits[plan as string] ?? 1);
  const currentTotal = team.length;
  const canInvite = maxTotal === null || currentTotal < maxTotal;

  return (
    <View style={s.sectionContent}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={s.kpiSub}>{team.length} members · {team.filter((m: any) => m.accepted_at).length} active</Text>
          {maxTotal !== null && (
            <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {currentTotal}/{maxTotal} team {maxTotal === 1 ? 'member' : 'members'}
            </Text>
          )}
        </View>
        {canInvite ? (
          <TouchableOpacity style={[s.addBtn, { backgroundColor: Colors.accent.indigo, borderColor: Colors.accent.indigo }]} onPress={() => setShowInvite(v => !v)}>
            <Feather name={showInvite ? 'x' : 'user-plus'} size={13} color="#fff" />
            <Text style={s.addBtnText}>{showInvite ? 'Cancel' : 'Invite'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.addBtn, { backgroundColor: '#f59e0b', borderColor: '#f59e0b' }]} onPress={() => router.push('/profile/billing?plan=pro')}>
            <Feather name="award" size={13} color="#fff" />
            <Text style={s.addBtnText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>

      {!canInvite && (
        <Card>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <Feather name="award" size={16} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 4 }}>Team member limit reached</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 16 }}>
                You've used all {maxTotal} team {maxTotal === 1 ? 'member' : 'members'} allowed on the {plan} plan. Upgrade to add more collaborators.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {showInvite && canInvite && (
        <Card>
          <CardTitle>Invite Team Member</CardTitle>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10, lineHeight: 14 }}>
            If they have an account, they're added instantly. If not, they'll receive a signup link.
          </Text>
          <TextInput
            style={[s.inp, { marginBottom: 12 }]}
            placeholder="teammate@email.com"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleInvite}
            value={inviteForm.email}
            onChangeText={v => setInviteForm(p => ({ ...p, email: v }))}
            autoFocus
          />
          <TouchableOpacity style={[s.modalSaveBtn, (saving || !inviteForm.email.trim()) && { opacity: 0.5 }]} onPress={handleInvite} disabled={saving || !inviteForm.email.trim()}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalSaveBtnText}>Invite Member</Text>}
          </TouchableOpacity>
        </Card>
      )}

      {team.length === 0 ? (
        <SectionEmpty icon="users" title="No team members" desc="Invite collaborators to work on this project together." />
      ) : (
        <>
          {owners.length > 0 && (
            <View>
              <Text style={s.groupLabel}>OWNER</Text>
              {owners.map((m: any) => <MemberCard key={m.user_id || m.id || m.email} member={m} projectId={projectId} onRemove={handleRemove} onRoleChange={updateTeamMember} />)}
            </View>
          )}
          {others.length > 0 && (
            <View>
              <Text style={s.groupLabel}>TEAM</Text>
              {others.map((m: any) => <MemberCard key={m.user_id || m.id || m.email} member={m} projectId={projectId} onRemove={handleRemove} onRoleChange={updateTeamMember} />)}
            </View>
          )}
        </>
      )}
      <ConfirmModal {...confirmProps} />
    </View>
  );
}

function MemberCard({ member, projectId, onRemove, onRoleChange }: any) {
  const [role,     setRole]     = useState(member.role?.toUpperCase() || 'VIEWER');
  const [changing, setChanging] = useState(false);
  const rm      = ROLE_META[role] ?? ROLE_META.VIEWER;
  const isOwner = role === 'OWNER';
  const accepted = !!member.accepted_at;
  const memberId = member.user_id || member.id; // user_id for event_members, id for planner_team_members

  async function changeRole(newRole: string) {
    setChanging(true);
    setRole(newRole);
    await onRoleChange(projectId, memberId, { role: newRole });
    setChanging(false);
  }

  return (
    <Card style={{ marginBottom: 8 }}>
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <View style={[s.memberAvatar, { backgroundColor: rm.bg, borderColor: rm.color + '60' }]}>
          <Text style={[s.memberAvatarText, { color: rm.color }]}>{initials(member.name)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{member.name}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} numberOfLines={1}>{member.email}</Text>
        </View>
        <Text style={{ fontSize: 10, color: accepted ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
          {accepted ? '● Active' : '◌ Pending'}
        </Text>
      </View>

      {/* Role chips — matches web role selector; hidden for OWNER */}
      {isOwner ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[s.statusBadge, { backgroundColor: rm.bg }]}>
            <Text style={[s.statusText, { color: rm.color }]}>OWNER</Text>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          {['EDITOR','ADMIN','VIEWER'].map(r => {
            const m = ROLE_META[r] ?? ROLE_META.VIEWER;
            const active = role === r;
            return (
              <TouchableOpacity key={r} onPress={() => changeRole(r)} disabled={changing}
                style={[s.filterChip, { flex: 1, justifyContent: 'center' }, active && { backgroundColor: m.bg, borderColor: m.color + '60' }]}>
                <Text style={[s.filterChipText, active && { color: m.color }]}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Remove */}
      {!isOwner && (
        <TouchableOpacity onPress={() => onRemove(member)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' }}>
          <Feather name="user-x" size={12} color="rgba(239,68,68,0.55)" />
          <Text style={{ fontSize: 11, color: 'rgba(239,68,68,0.55)', fontWeight: '600' }}>Remove</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

/* ── Section: Notes ────────────────────────────────────────────────── */
function NotesSection({ projectId }: { projectId: string }) {
  const { notes, fetchNotes, createNote, updateNote, deleteNote } = usePlannerStore();
  const [view, setView]                   = useState<'list' | 'editor'>('list');
  const [selected, setSelected]           = useState<any>(null);
  const [editorTitle, setEditorTitle]     = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags]       = useState('');
  const [creating, setCreating]           = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { confirm, confirmProps } = useConfirm();

  useEffect(() => { fetchNotes(projectId); }, [projectId]);
  useEffect(() => {
    if (selected) { setEditorTitle(selected.title || ''); setEditorContent(selected.content || ''); setEditorTags((selected.tags || []).join(', ')); }
  }, [selected?.id]);

  function scheduleAutoSave(title: string, content: string, tags: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (selected) {
        const tagArr = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        updateNote(projectId, selected.id, { title, content, tags: tagArr });
      }
    }, 900);
  }

  async function handleNew() {
    setCreating(true);
    const res = await createNote(projectId, { title: 'Untitled Note', content: '' });
    setCreating(false);
    if (res.success) { setSelected(res.data); setView('editor'); }
  }

  async function handleDelete(noteId: string) {
    confirm({
      title: 'Delete Note',
      message: 'Delete this note?',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        await deleteNote(projectId, noteId);
        if (selected?.id === noteId) { setSelected(null); setView('list'); }
      },
    });
  }

  async function togglePin(note: any) {
    await updateNote(projectId, note.id, { is_pinned: !note.is_pinned });
  }

  if (view === 'editor' && selected) {
    return (
      <View style={s.sectionContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity style={s.backBtn2} onPress={() => setView('list')}>
            <Feather name="arrow-left" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Notes</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => togglePin(selected)} hitSlop={8}>
              <Feather name={selected.is_pinned ? 'bookmark' : 'bookmark'} size={16} color={selected.is_pinned ? '#f59e0b' : 'rgba(255,255,255,0.4)'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(selected.id)} hitSlop={8}>
              <Feather name="trash-2" size={16} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={s.noteTitle}
          value={editorTitle}
          onChangeText={v => { setEditorTitle(v); scheduleAutoSave(v, editorContent, editorTags); }}
          placeholder="Note title…"
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
          <Feather name="tag" size={12} color="rgba(255,255,255,0.3)" />
          <TextInput
            style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
            value={editorTags}
            onChangeText={v => { setEditorTags(v); scheduleAutoSave(editorTitle, editorContent, v); }}
            placeholder="Tags, comma separated…"
            placeholderTextColor="rgba(255,255,255,0.2)"
          />
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>autosaves</Text>
        </View>
        <TextInput
          style={s.noteContent}
          value={editorContent}
          onChangeText={v => { setEditorContent(v); scheduleAutoSave(editorTitle, v, editorTags); }}
          placeholder="Start writing…"
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline
          textAlignVertical="top"
        />
      </View>
    );
  }

  const pinned   = notes.filter((n: any) => n.is_pinned);
  const unpinned = notes.filter((n: any) => !n.is_pinned);
  const sorted   = [...pinned, ...unpinned];

  return (
    <View style={s.sectionContent}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={s.kpiSub}>{notes.length} notes</Text>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: Colors.accent.indigo }]} onPress={handleNew} disabled={creating}>
          {creating ? <ActivityIndicator size="small" color="#fff" /> : <><Feather name="plus" size={13} color="#fff" /><Text style={s.addBtnText}>New Note</Text></>}
        </TouchableOpacity>
      </View>

      {sorted.length === 0
        ? <SectionEmpty icon="file-text" title="No notes yet" desc="Create notes to keep track of ideas, decisions, and details." />
        : sorted.map((note: any) => (
          <TouchableOpacity key={note.id} style={s.noteCard} onPress={() => { setSelected(note); setView('editor'); }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  {note.is_pinned && <Feather name="bookmark" size={10} color="#f59e0b" />}
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }} numberOfLines={1}>{note.title || 'Untitled'}</Text>
                </View>
                <Text style={s.taskMeta} numberOfLines={2}>{note.content || 'No content'}</Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{timeAgo(note.updated_at)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(note.id)} hitSlop={8} style={{ marginLeft: 8 }}>
                <Feather name="trash-2" size={14} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            </View>
            {note.tags?.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                {note.tags.slice(0, 3).map((t: string) => (
                  <View key={t} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.15)' }}>
                    <Text style={{ fontSize: 10, color: Colors.accent.indigo }}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))
      }
      <ConfirmModal {...confirmProps} />
    </View>
  );
}

/* ── Section: Files ────────────────────────────────────────────────── */
function AddFileModal({ projectId, folder, onClose }: { projectId: string; folder: string; onClose: () => void }) {
  const { uploadFile } = usePlannerStore();
  const [form, setForm] = useState({ file_name: '', file_url: '', mime_type: '', tags: '' });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.file_name.trim() || !form.file_url.trim()) return;
    setSaving(true);
    const res = await uploadFile(projectId, { ...form, folder, mime_type: form.mime_type || 'application/octet-stream', tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
    setSaving(false);
    if (res.success) { notify.fileAdded(); onClose(); }
    else notify.fileFailed(res.error);
  }

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={s.modalBackdrop} onPress={onClose} />
      <View style={s.modalSheet}>
        <View style={s.modalHandle} />
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Add File Reference</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={18} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
        </View>
        <Text style={[s.taskMeta, { marginBottom: 12 }]}>Paste a URL to a file in your cloud storage.</Text>
        <TextInput style={[s.inp, { marginBottom: 8 }]} placeholder="File Name *" placeholderTextColor="rgba(255,255,255,0.25)" value={form.file_name} onChangeText={v => setForm(p => ({ ...p, file_name: v }))} />
        <TextInput style={[s.inp, { marginBottom: 8 }]} placeholder="File URL *" placeholderTextColor="rgba(255,255,255,0.25)" autoCapitalize="none" keyboardType="url" value={form.file_url} onChangeText={v => setForm(p => ({ ...p, file_url: v }))} />
        <TextInput style={[s.inp, { marginBottom: 8 }]} placeholder="MIME type (e.g. image/png)" placeholderTextColor="rgba(255,255,255,0.25)" value={form.mime_type} onChangeText={v => setForm(p => ({ ...p, mime_type: v }))} />
        <TextInput style={[s.inp, { marginBottom: 16 }]} placeholder="Tags, comma separated" placeholderTextColor="rgba(255,255,255,0.25)" value={form.tags} onChangeText={v => setForm(p => ({ ...p, tags: v }))} />
        <TouchableOpacity style={[s.modalSaveBtn, (saving || !form.file_name.trim() || !form.file_url.trim()) && { opacity: 0.5 }]} onPress={submit} disabled={saving || !form.file_name.trim() || !form.file_url.trim()}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalSaveBtnText}>Add File</Text>}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function FilesSection({ projectId }: { projectId: string }) {
  const { files, fetchFiles, deleteFile } = usePlannerStore();
  const [activeFolder, setActiveFolder] = useState('general');
  const [showAdd, setShowAdd] = useState(false);
  const { confirm, confirmProps } = useConfirm();

  useEffect(() => { fetchFiles(projectId); }, [projectId]);

  const folderFiles = files.filter((f: any) => f.folder === activeFolder);
  const countByFolder = FOLDERS.reduce((acc: any, f) => { acc[f] = files.filter((fi: any) => fi.folder === f).length; return acc; }, {});

  function fileIcon(mime: string) {
    if (!mime) return 'file';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'film';
    if (mime.includes('pdf') || mime.includes('document')) return 'file-text';
    return 'file';
  }

  function formatBytes(bytes: number) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <View style={s.sectionContent}>
      {/* Folder tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {FOLDERS.map(f => (
            <TouchableOpacity key={f} style={[s.filterChip, activeFolder === f && s.filterChipActive]} onPress={() => setActiveFolder(f)}>
              <Feather name="folder" size={11} color={activeFolder === f ? '#fff' : 'rgba(255,255,255,0.4)'} />
              <Text style={[s.filterChipText, activeFolder === f && s.filterChipTextActive, { textTransform: 'capitalize' }]}>{f}</Text>
              {countByFolder[f] > 0 && <Text style={[s.filterChipText, activeFolder === f && s.filterChipTextActive, { opacity: 0.6 }]}>{countByFolder[f]}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Text style={[s.kpiSub, { textTransform: 'capitalize' }]}>{activeFolder}</Text>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: Colors.accent.indigo }]} onPress={() => setShowAdd(true)}>
          <Feather name="upload" size={12} color="#fff" /><Text style={s.addBtnText}>Add File</Text>
        </TouchableOpacity>
      </View>

      {folderFiles.length === 0
        ? <SectionEmpty icon="folder" title={`No files in ${activeFolder}`} desc="Add file references from your cloud storage." />
        : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {folderFiles.map((file: any) => (
              <TouchableOpacity
                key={file.id}
                style={[s.fileCard]}
                onLongPress={() => confirm({
                  title: 'Delete File',
                  message: `Delete "${file.file_name}"?`,
                  confirmLabel: 'Delete',
                  variant: 'danger',
                  onConfirm: () => deleteFile(projectId, file.id),
                })}
              >
                <View style={s.filePreview}>
                  <Feather name={fileIcon(file.mime_type) as any} size={22} color="rgba(255,255,255,0.4)" />
                </View>
                <View style={{ padding: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }} numberOfLines={2}>{file.file_name}</Text>
                  {file.file_size ? <Text style={s.taskMeta}>{formatBytes(file.file_size)}</Text> : null}
                  {file.is_public && <Text style={{ fontSize: 9, color: '#10b981', fontWeight: '700', marginTop: 2 }}>PUBLIC</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )
      }

      {showAdd && <AddFileModal projectId={projectId} folder={activeFolder} onClose={() => setShowAdd(false)} />}
      <ConfirmModal {...confirmProps} />
    </View>
  );
}

/* ── Section: AI Brief ─────────────────────────────────────────────── */
function AIBriefSection({ project, onGenerate, generating }: { project: any; onGenerate: () => void; generating: boolean }) {
  let brief: any = null;
  try { brief = project.ai_brief ? JSON.parse(project.ai_brief) : null; } catch {}

  return (
    <View style={s.sectionContent}>
      <TouchableOpacity style={[s.addBtn, { marginBottom: 16, alignSelf: 'flex-start', backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.35)' }]} onPress={onGenerate} disabled={generating}>
        {generating ? <ActivityIndicator size="small" color={Colors.accent.indigo} /> : <Feather name="zap" size={13} color={Colors.accent.indigo} />}
        <Text style={[s.addBtnText, { color: Colors.accent.indigo }]}>{generating ? 'Generating…' : (brief ? 'Regenerate Brief' : 'Generate Brief')}</Text>
      </TouchableOpacity>

      {!brief && !generating && <SectionEmpty icon="zap" title="No AI brief yet" desc="Generate an executive brief with critical path, risk analysis, and next actions." />}

      {brief && !generating && (
        <>
          {brief.executiveSummary && <Card><CardTitle>Executive Summary</CardTitle><Text style={s.briefText}>{brief.executiveSummary}</Text></Card>}
          {brief.risks?.length > 0 && (
            <Card>
              <CardTitle>Key Risks</CardTitle>
              {brief.risks.slice(0, 5).map((r: any, i: number) => (
                <View key={i} style={s.riskRow}>
                  <Feather name="alert-triangle" size={13} color="#f59e0b" />
                  <Text style={s.riskText}>{typeof r === 'string' ? r : r.risk || r.description || JSON.stringify(r)}</Text>
                </View>
              ))}
            </Card>
          )}
          {brief.priorities?.length > 0 && (
            <Card>
              <CardTitle>Top Priorities</CardTitle>
              {brief.priorities.slice(0, 5).map((p: any, i: number) => (
                <View key={i} style={s.priorityRow}>
                  <View style={s.priorityNum}><Text style={s.priorityNumText}>{i + 1}</Text></View>
                  <Text style={s.priorityText}>{typeof p === 'string' ? p : p.action || p.title || JSON.stringify(p)}</Text>
                </View>
              ))}
            </Card>
          )}
          {brief.nextActions?.length > 0 && (
            <Card>
              <CardTitle>Next Actions</CardTitle>
              {brief.nextActions.slice(0, 5).map((a: string, i: number) => (
                <View key={i} style={s.actionRow}>
                  <Feather name="arrow-right" size={13} color={Colors.accent.indigo} />
                  <Text style={s.actionText}>{a}</Text>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </View>
  );
}

/* ── Section: Settings ─────────────────────────────────────────────── */
function SettingsSection({ project, projectId }: { project: any; projectId: string }) {
  const { updateProject, deleteProject, archiveProject, saving } = usePlannerStore();
  const router = useRouter();
  const { confirm, confirmProps } = useConfirm();

  function formFromProject(p: any) {
    return {
      title:         p?.title         || '',
      event_type:    p?.event_type    || 'wedding',
      event_date:    p?.event_date    ? String(p.event_date).slice(0, 10)     : '',
      event_end_date:p?.event_end_date? String(p.event_end_date).slice(0, 10) : '',
      venue:         p?.venue         || '',
      city:          p?.city          || '',
      country:       p?.country       || '',
      guest_count:   p?.guest_count   ? String(p.guest_count)   : '',
      total_budget:  p?.total_budget  ? String(p.total_budget)  : '',
      currency:      p?.currency      || 'USD',
      style_notes:   p?.style_notes   || '',
      color:         p?.color         || '#6366f1',
    };
  }

  const [form,          setForm]          = useState(() => formFromProject(project));
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [archiving,     setArchiving]     = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // Re-sync when project loads or changes (e.g. initial null → loaded)
  useEffect(() => {
    if (project?.id) setForm(formFromProject(project));
  }, [project?.id]);

  function upd(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSave() {
    if (!form.title.trim()) { notify.titleRequired(); return; }
    const res = await updateProject(projectId, {
      ...form,
      guest_count:   form.guest_count   ? parseInt(form.guest_count)    : null,
      total_budget:  form.total_budget  ? parseFloat(form.total_budget) : null,
      event_date:    form.event_date    || null,
      event_end_date:form.event_end_date|| null,
    });
    if (res.success) notify.settingsSaved();
    else notify.settingsFailed(res.error);
  }

  async function handleArchive() {
    confirm({
      title: 'Archive Project',
      message: 'Hide this project from the active list? It can be restored later.',
      confirmLabel: 'Archive',
      variant: 'warning',
      onConfirm: async () => {
        setArchiving(true);
        const res = await archiveProject(projectId);
        setArchiving(false);
        if (res.success) { notify.projectArchived(); router.replace('/planner'); }
        else notify.projectFailed(res.error);
      },
    });
  }

  async function handleDelete() {
    if (deleteConfirm !== (project?.title || '')) return;
    try {
      setDeleting(true);
      const res = await deleteProject(projectId);
      setDeleting(false);
      if (res.success) { notify.projectDeleted(); router.replace('/planner'); }
      else notify.projectFailed(res.error);
    } catch (error) {
      setDeleting(false);
      notify.projectFailed('Failed to delete project');
      console.error('Delete error:', error);
    }
  }

  const SLabel = ({ children }: { children: string }) => (
    <Text style={s.settingsLabel}>{children}</Text>
  );

  return (
    <View style={s.sectionContent}>

      {/* ── Project Details ── */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Feather name="settings" size={13} color={Colors.accent.indigo} />
          <Text style={s.cardTitle}>Project Details</Text>
        </View>

        <SLabel>Project Title</SLabel>
        <TextInput
          style={[s.inp, { marginBottom: 14 }]}
          value={form.title}
          onChangeText={v => upd('title', v)}
          placeholder="My Event Planner"
          placeholderTextColor="rgba(255,255,255,0.25)"
        />

        <SLabel>Event Type</SLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {EVENT_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.filterChip, form.event_type === t && s.filterChipActive]}
                onPress={() => upd('event_type', t)}
              >
                <Text style={[s.filterChipText, form.event_type === t && s.filterChipTextActive, { textTransform: 'capitalize' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <SLabel>Currency</SLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.filterChip, form.currency === c && s.filterChipActive]}
                onPress={() => upd('currency', c)}
              >
                <Text style={[s.filterChipText, form.currency === c && s.filterChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <SLabel>Start Date</SLabel>
            <TextInput
              style={[s.inp, { marginBottom: 14 }]}
              value={form.event_date}
              onChangeText={v => upd('event_date', v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.25)"
            />
          </View>
          <View style={{ flex: 1 }}>
            <SLabel>End Date</SLabel>
            <TextInput
              style={[s.inp, { marginBottom: 14 }]}
              value={form.event_end_date}
              onChangeText={v => upd('event_end_date', v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.25)"
            />
          </View>
        </View>

        <SLabel>Venue</SLabel>
        <TextInput
          style={[s.inp, { marginBottom: 14 }]}
          value={form.venue}
          onChangeText={v => upd('venue', v)}
          placeholder="Venue name or address"
          placeholderTextColor="rgba(255,255,255,0.25)"
        />

        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <SLabel>City</SLabel>
            <TextInput style={[s.inp, { marginBottom: 14 }]} value={form.city} onChangeText={v => upd('city', v)} placeholder="New York" placeholderTextColor="rgba(255,255,255,0.25)" />
          </View>
          <View style={{ flex: 1 }}>
            <SLabel>Country</SLabel>
            <TextInput style={[s.inp, { marginBottom: 14 }]} value={form.country} onChangeText={v => upd('country', v)} placeholder="USA" placeholderTextColor="rgba(255,255,255,0.25)" />
          </View>
        </View>

        <View style={s.row2}>
          <View style={{ flex: 1 }}>
            <SLabel>Expected Guests</SLabel>
            <TextInput style={[s.inp, { marginBottom: 14 }]} value={form.guest_count} onChangeText={v => upd('guest_count', v)} placeholder="150" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <SLabel>Total Budget</SLabel>
            <TextInput style={[s.inp, { marginBottom: 14 }]} value={form.total_budget} onChangeText={v => upd('total_budget', v)} placeholder="25000" placeholderTextColor="rgba(255,255,255,0.25)" keyboardType="numeric" />
          </View>
        </View>

        <SLabel>Style Notes</SLabel>
        <TextInput
          style={[s.inp, { height: 80, marginBottom: 14, textAlignVertical: 'top' }]}
          value={form.style_notes}
          onChangeText={v => upd('style_notes', v)}
          placeholder="Describe the atmosphere, theme, or style…"
          placeholderTextColor="rgba(255,255,255,0.25)"
          multiline
        />

        <SLabel>Project Color</SLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
          {COLOR_SWATCHES.map(c => {
            const selected = form.color?.toLowerCase() === c.toLowerCase();
            return (
              <TouchableOpacity
                key={c}
                onPress={() => upd('color', c)}
                style={{
                  width: 36, height: 36,
                  borderRadius: 10,
                  backgroundColor: c,
                  borderWidth: selected ? 3 : 0,
                  borderColor: '#fff',
                  opacity: selected ? 1 : 0.65,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selected && (
                  <Feather name="check" size={14} color="#fff" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[s.modalSaveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Feather name="save" size={14} color="#fff" /><Text style={s.modalSaveBtnText}>Save Settings</Text></>}
        </TouchableOpacity>
      </Card>

      {/* ── Danger Zone ── */}
      <View style={[s.card, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.04)', marginBottom: 32 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          <Feather name="alert-triangle" size={14} color="#ef4444" />
          <Text style={[s.cardTitle, { color: '#ef4444' }]}>Danger Zone</Text>
        </View>

        {/* Archive */}
        <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(239,68,68,0.12)', marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 3 }}>Archive Project</Text>
          <Text style={[s.taskMeta, { marginBottom: 10 }]}>Hide this project from the active list. You can restore it later.</Text>
          <TouchableOpacity
            style={[s.addBtn, { borderColor: 'rgba(245,158,11,0.4)', alignSelf: 'flex-start' }]}
            onPress={handleArchive}
            disabled={archiving}
          >
            {archiving
              ? <ActivityIndicator size="small" color="#f59e0b" />
              : <><Feather name="archive" size={13} color="#f59e0b" /><Text style={[s.addBtnText, { color: '#f59e0b' }]}>Archive</Text></>}
          </TouchableOpacity>
        </View>

        {/* Delete */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 3 }}>Delete Project</Text>
        <Text style={[s.taskMeta, { marginBottom: 12 }]}>
          This is irreversible. All tasks, budget items, vendors, and files will be permanently deleted.
        </Text>
        <TextInput
          style={[s.inp, { marginBottom: 10, borderColor: 'rgba(239,68,68,0.35)' }]}
          value={deleteConfirm}
          onChangeText={setDeleteConfirm}
          placeholder={`Type "${project?.title || ''}" to confirm`}
          placeholderTextColor="rgba(255,255,255,0.2)"
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[
            s.addBtn,
            {
              backgroundColor: deleteConfirm === (project?.title || '') ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.08)',
              borderColor: 'rgba(239,68,68,0.35)',
              opacity: deleting ? 0.6 : 1,
            },
          ]}
          onPress={handleDelete}
          disabled={deleting || deleteConfirm !== (project?.title || '')}
        >
          {deleting
            ? <ActivityIndicator size="small" color="#ef4444" />
            : <><Feather name="trash-2" size={13} color="#ef4444" /><Text style={[s.addBtnText, { color: '#ef4444' }]}>Delete Project</Text></>}
        </TouchableOpacity>
      </View>
      <ConfirmModal {...confirmProps} />
    </View>
  );
}

/* ── Sidebar Drawer ────────────────────────────────────────────────── */
function SidebarDrawer({ open, onClose, project, activeSection, onSelect }: {
  open: boolean; onClose: () => void; project: any; activeSection: SectionId; onSelect: (id: SectionId) => void;
}) {
  const translateX = useRef(new Animated.Value(-280)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (open) setRendered(true);
    Animated.parallel([
      Animated.spring(translateX, { toValue: open ? 0 : -280, useNativeDriver: true, speed: 20, bounciness: 0 }),
      Animated.timing(opacity, { toValue: open ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start(() => { if (!open) setRendered(false); });
  }, [open]);

  if (!rendered) return null;

  const tasks = project?.tasks || [];
  const done  = tasks.filter((t: any) => ['done','DONE'].includes(t.status)).length;
  const pct   = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.drawer, { transform: [{ translateX }] }]}>
        <View style={s.drawerHeader}>
          <View style={s.drawerEmoji}><Text style={{ fontSize: 22 }}>{getEmoji(project?.event_type)}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={s.drawerTitle} numberOfLines={1}>{project?.title || 'Project'}</Text>
            <Text style={s.drawerSub} numberOfLines={1}>{project?.event_type || 'Event Planner'}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10}><Feather name="x" size={18} color="rgba(255,255,255,0.5)" /></TouchableOpacity>
        </View>
        <View style={s.drawerProgress}>
          <View style={s.drawerProgressTrack}><View style={[s.drawerProgressFill, { width: `${pct}%` as any }]} /></View>
          <Text style={s.drawerProgressText}>{pct}% complete · {done}/{tasks.length} tasks</Text>
        </View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={s.drawerNav}>
            {SECTIONS.map(section => {
              const active = section.id === activeSection;
              return (
                <TouchableOpacity key={section.id} style={[s.drawerNavItem, active && s.drawerNavItemActive]} onPress={() => { onSelect(section.id); onClose(); }}>
                  {active && <View style={s.drawerActiveLine} />}
                  <Feather name={section.icon} size={15} color={active ? '#fff' : 'rgba(255,255,255,0.4)'} />
                  <Text style={[s.drawerNavLabel, active && { color: '#fff' }]}>{section.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        {project?.event_date && (
          <View style={s.drawerFooter}>
            <Feather name="calendar" size={12} color="rgba(255,255,255,0.3)" />
            <Text style={s.drawerFooterText}>{new Date(project.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

/* ── Main Screen ───────────────────────────────────────────────────── */
export default function PlannerProjectScreen() {
  const { projectId }  = useLocalSearchParams<{ projectId: string }>();
  const router         = useRouter();
  const insets         = useSafeAreaInsets();

  const {
    currentProject, loading, aiGenerating,
    fetchProject, generateAIBrief, generateAITasks, generateAITimeline, generateAIVendors, generateAIBudget,
  } = usePlannerStore();

  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => { if (projectId) fetchProject(projectId); }, [projectId]);

  // TESTING: Always show upgrade modal
  useEffect(() => {
    console.log('TESTING MODE: Always showing upgrade modal');
    setShowUpgradeModal(true);
  }, []);

  async function handleGenerate(type: string) {
    let res: any;
    if      (type === 'tasks')    res = await generateAITasks(projectId!);
    else if (type === 'timeline') res = await generateAITimeline(projectId!);
    else if (type === 'vendors')  res = await generateAIVendors(projectId!);
    else if (type === 'budget')   res = await generateAIBudget(projectId!);
    else                          res = await generateAIBrief(projectId!);
    if (res?.success) notify.aiComplete();
    else              notify.aiFailed(res?.error);
  }

  if (loading && !currentProject) {
    return (
      <SafeAreaView style={s.screen} edges={['bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.accent.indigo} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentProject) return null;

  const tasks   = currentProject.tasks || [];
  const done    = tasks.filter((t: any) => ['done','DONE'].includes(t.status)).length;
  const taskPct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>

      {/* Header */}
      <View style={[s.header, { paddingTop: Math.max(insets.top + 8, 52) }]}>
        <View style={s.headerAccent} />
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={8}>
          <Feather name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.headerEmoji}>{getEmoji(currentProject.event_type)}</Text>
            <Text style={s.headerTitle} numberOfLines={1}>{currentProject.title}</Text>
          </View>
          {currentProject.event_date && (
            <Text style={s.headerSub}>{new Date(currentProject.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          )}
        </View>
        {aiGenerating && (
          <View style={s.aiIndicator}>
            <Feather name="zap" size={11} color={Colors.accent.indigo} />
            <Text style={s.aiIndicatorText}>AI</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={s.iconBtn} hitSlop={8}>
          <Feather name="menu" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Progress strip */}
      <View style={s.progressStrip}>
        <View style={[s.progressStripFill, { width: `${taskPct}%` as any }]} />
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {SECTIONS.map(section => {
          const active = section.id === activeSection;
          return (
            <TouchableOpacity key={section.id} style={[s.tab, active && s.tabActive]}
              onPress={() => {
                if (section.id === 'vendors') { router.push(`/planner/vendors/${projectId}`); return; }
                setActiveSection(section.id);
              }}>
              <Feather name={section.icon} size={12} color={active ? '#fff' : 'rgba(255,255,255,0.35)'} />
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{section.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Section content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        {activeSection === 'overview'  && <OverviewSection  project={currentProject} onGenerate={handleGenerate} generating={aiGenerating} onNavigate={setActiveSection} projectId={projectId!} />}
        {activeSection === 'tasks'     && <TasksSection     project={currentProject} projectId={projectId!} onGenerate={() => handleGenerate('tasks')} generating={aiGenerating} />}
        {activeSection === 'timeline'  && <TimelineSection  project={currentProject} projectId={projectId!} onGenerate={() => handleGenerate('timeline')} generating={aiGenerating} />}
        {/* vendors tab navigates to /planner/vendors/[projectId] */}
        {activeSection === 'budget'    && <BudgetSection    project={currentProject} projectId={projectId!} onGenerate={() => handleGenerate('budget')} generating={aiGenerating} />}
        {activeSection === 'team'      && <TeamSection      projectId={projectId!} activeSection={activeSection} />}
        {activeSection === 'notes'     && <NotesSection     projectId={projectId!} />}
        {activeSection === 'files'     && <FilesSection     projectId={projectId!} />}
        {activeSection === 'ai-brief'  && <AIBriefSection   project={currentProject} onGenerate={() => handleGenerate('brief')} generating={aiGenerating} />}
        {activeSection === 'settings'  && <SettingsSection  project={currentProject} projectId={projectId!} />}
      </ScrollView>

      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} project={currentProject} activeSection={activeSection} onSelect={setActiveSection} />

      {/* Upgrade Modal */}
      <UpgradeNotificationModal isOpen={showUpgradeModal} onDismiss={() => setShowUpgradeModal(false)} />
    </SafeAreaView>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },

  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  headerAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.accent.indigo, opacity: 0.7 },
  headerEmoji: { fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff', flex: 1 },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  aiIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(99,102,241,0.18)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  aiIndicatorText: { fontSize: 10, fontWeight: '800', color: Colors.accent.indigo },

  progressStrip: { height: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressStripFill: { height: 2, backgroundColor: Colors.accent.indigo, opacity: 0.8 },

  tabBar: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 6, flexDirection: 'row', alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  tabActive: { backgroundColor: Colors.accent.indigo },
  tabLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.38)' },
  tabLabelActive: { color: '#fff', fontWeight: '700' },

  sectionContent: { padding: 14, gap: 12 },
  card: { backgroundColor: Colors.bg.card, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '47.5%', backgroundColor: Colors.bg.card, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14, gap: 6 },
  kpiIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kpiVal:   { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiSub:   { fontSize: 10, color: 'rgba(255,255,255,0.3)' },

  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  progressFill:  { height: 6, borderRadius: 3 },
  progressLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },

  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  upcomingDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  upcomingTitle: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  upcomingDate:  { fontSize: 11, color: 'rgba(255,255,255,0.35)' },

  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  detailLabel: { fontSize: 12, color: 'rgba(255,255,255,0.38)' },
  detailValue: { fontSize: 12, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'right', marginLeft: 12, textTransform: 'capitalize' },

  aiActionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  aiActionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)', paddingHorizontal: 12, paddingVertical: 7 },
  aiActionText: { fontSize: 12, fontWeight: '700', color: Colors.accent.indigo },

  statsRow: { flexDirection: 'row', gap: 10 },
  statChip: { flex: 1, backgroundColor: Colors.bg.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  statChipVal:   { fontSize: 18, fontWeight: '900' },
  statChipLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: 2 },

  /* Task section — web-parity */
  taskKpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  taskKpiCard: { width: '47.5%', backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 },
  taskKpiVal:   { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 28 },
  taskKpiLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  taskSearchWrap:  { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  taskSearchInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingLeft: 36, paddingRight: 36, paddingVertical: 10, fontSize: 13, color: '#fff' },

  taskCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 12, paddingVertical: 12 },
  taskCardBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  taskCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  taskCheckDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  taskCardTitle: { fontSize: 14, fontWeight: '600', color: '#fff', lineHeight: 20, marginBottom: 5 },
  taskBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  taskBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  taskBadgeText: { fontSize: 10, fontWeight: '700' },
  taskDueText: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  taskDeleteBtn: { marginTop: 2, padding: 4 },

  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  filterChipActive: { backgroundColor: Colors.accent.indigo, borderColor: Colors.accent.indigo },
  filterChipText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  filterChipTextActive: { color: '#fff' },

  phaseGroup: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 2 },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  phaseDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  phaseLabel: { flex: 1, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  phaseCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  phaseCountText: { fontSize: 10, fontWeight: '800' },

  taskRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12 },
  taskBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  taskTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  taskDone:  { textDecorationLine: 'line-through', opacity: 0.4 },
  taskMeta:  { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  priorityDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },

  addTaskRow:    { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  addTaskInput:  { flex: 1, backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.accent.indigo + '40', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#fff' },
  addTaskSave:   { width: 38, height: 38, backgroundColor: Colors.accent.indigo, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addTaskCancel: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  row2: { flexDirection: 'row', gap: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, flex: 1, justifyContent: 'center' },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  timelineLine: { position: 'absolute', left: 24, top: 28, bottom: 14, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  timelineRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  timelineDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent.indigo, marginTop: 4, flexShrink: 0 },
  timelineMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  timelineTime: { fontSize: 11, fontWeight: '700', color: Colors.accent.indigo },
  milestonePill: { backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  milestoneText: { fontSize: 9, fontWeight: '800', color: '#f59e0b' },

  vendorRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  vendorIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:  { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },

  budgetLineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },

  groupLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  memberAvatarText: { fontSize: 14, fontWeight: '800' },

  noteCard: { backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14 },
  noteTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 12, lineHeight: 26 },
  noteContent: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 22, minHeight: 200 },
  backBtn2: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },

  fileCard: { width: '47.5%', backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  filePreview: { aspectRatio: 1.5, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },

  inp: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#fff', marginBottom: 4 },

  settingsLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginBottom: 6 },
  colorSwatch: { width: 30, height: 30, borderRadius: 8 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon:  { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.12)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emptySub:   { fontSize: 12, color: 'rgba(255,255,255,0.38)', textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: Colors.accent.indigo, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  genBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  briefText:    { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20 },
  riskRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 6 },
  riskText:     { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 18, flex: 1 },
  priorityRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  priorityNum:  { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  priorityNumText: { fontSize: 10, fontWeight: '900', color: Colors.accent.indigo },
  priorityText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18, flex: 1 },
  actionRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 6 },
  actionText:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 18, flex: 1 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: '#0f0f1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  modalSaveBtn: { backgroundColor: Colors.accent.indigo, borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  modalSaveBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  drawer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 270, backgroundColor: '#0b0b18', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)', zIndex: 50 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  drawerEmoji: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)', alignItems: 'center', justifyContent: 'center' },
  drawerTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  drawerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'capitalize' },
  drawerProgress: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  drawerProgressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  drawerProgressFill:  { height: 3, backgroundColor: Colors.accent.indigo, borderRadius: 2 },
  drawerProgressText:  { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  drawerNav: { padding: 12, gap: 2 },
  drawerNavItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12, position: 'relative' },
  drawerNavItemActive: { backgroundColor: Colors.accent.indigo },
  drawerActiveLine: { position: 'absolute', left: 0, top: '50%', width: 3, height: 18, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, marginTop: -9 },
  drawerNavLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  drawerFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  drawerFooterText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },

  backBtn: { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
});
