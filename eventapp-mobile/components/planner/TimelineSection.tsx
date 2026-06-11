import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Modal, Pressable, TextInput, ScrollView, KeyboardAvoidingView,
  Platform, useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePlannerStore } from '@/store/planner.store';
import { Colors } from '@/constants/colors';
import { notify, showSuccess, showError } from '@/lib/toast';

// ─── Category palette (mirrors web) ──────────────────────────────────────────
const CAT_C: Record<string, { bg: string; text: string; dot: string }> = {
  ceremony:      { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd', dot: '#8b5cf6' },
  reception:     { bg: 'rgba(244,63,94,0.15)',  text: '#fda4af', dot: '#f43f5e' },
  catering:      { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', dot: '#f59e0b' },
  entertainment: { bg: 'rgba(6,182,212,0.15)',  text: '#67e8f9', dot: '#06b6d4' },
  logistics:     { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc', dot: '#6366f1' },
  other:         { bg: 'rgba(107,114,128,0.12)',text: '#d1d5db', dot: '#6b7280' },
};
const CATS = ['ceremony','reception','catering','entertainment','logistics','other'];
const MONTHS_LONG = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const HOURS = Array.from({ length: 20 }, (_, i) => i + 5); // 5am → midnight

function cc(cat?: string) { return CAT_C[cat?.toLowerCase?.() ?? ''] ?? CAT_C.other; }

function fmt12(t?: string) {
  if (!t) return '';
  const [hh, mm] = t.split(':');
  const h = parseInt(hh, 10);
  if (isNaN(h)) return t;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mm ?? '00'}${suffix}`;
}

function capitalize(s: string) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// ─── Milestone pulsing indicator ──────────────────────────────────────────────
function MilestoneDot() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
      <View style={[ts.mileDotOuter]}>
        <Feather name="flag" size={7} color="#f59e0b" />
      </View>
    </View>
  );
}

// ─── Single timeline item card ────────────────────────────────────────────────
function TLItemCard({
  item, projectId, isLast,
}: { item: any; projectId: string; isLast: boolean }) {
  const { deleteTimelineItem } = usePlannerStore();
  const [deleting, setDeleting] = useState(false);
  const cat   = cc(item.category);
  const time  = item.item_time || item.start_time;
  const durPct = item.duration_minutes
    ? Math.min(100, (Number(item.duration_minutes) / 120) * 100)
    : 0;

  async function del() {
    setDeleting(true);
    const res = await deleteTimelineItem(projectId, item.id);
    if (!res.success) { showError('Could not delete item'); setDeleting(false); }
  }

  return (
    <View style={ts.itemRow}>
      {/* Dot + connector */}
      <View style={ts.dotCol}>
        {item.is_milestone
          ? <MilestoneDot />
          : <View style={[ts.dot, { backgroundColor: cat.dot + '55', borderColor: cat.dot }]} />
        }
        {!isLast && <View style={ts.connector} />}
      </View>

      {/* Card */}
      <View style={[
        ts.card,
        item.is_milestone
          ? { backgroundColor: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.22)' }
          : { backgroundColor: Colors.bg.card, borderColor: 'rgba(255,255,255,0.08)' },
      ]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            {/* Title row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
              {item.is_milestone && (
                <View style={ts.milestonePill}>
                  <Text style={ts.milestonePillText}>MILESTONE</Text>
                </View>
              )}
              <Text style={ts.itemTitle}>{item.title}</Text>
            </View>
            {/* Description */}
            {!!item.description && (
              <Text style={ts.itemDesc} numberOfLines={2}>{item.description}</Text>
            )}
            {/* Meta row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
              {!!time && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Feather name="clock" size={10} color="rgba(255,255,255,0.35)" />
                  <Text style={ts.metaText}>{fmt12(time)}</Text>
                  {!!item.duration_minutes && (
                    <Text style={[ts.metaText, { color: 'rgba(255,255,255,0.22)' }]}>· {item.duration_minutes}min</Text>
                  )}
                </View>
              )}
              {!!item.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Feather name="map-pin" size={10} color="rgba(255,255,255,0.35)" />
                  <Text style={ts.metaText} numberOfLines={1}>{item.location}</Text>
                </View>
              )}
              {!!item.category && (
                <View style={[ts.catPill, { backgroundColor: cat.bg }]}>
                  <Text style={[ts.catPillText, { color: cat.text }]}>{capitalize(item.category)}</Text>
                </View>
              )}
            </View>
          </View>
          {/* Delete button */}
          <TouchableOpacity onPress={del} disabled={deleting} style={ts.delBtn} activeOpacity={0.7}>
            {deleting
              ? <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
              : <Feather name="trash-2" size={13} color="rgba(255,255,255,0.25)" />
            }
          </TouchableOpacity>
        </View>

        {/* Duration bar */}
        {durPct > 0 && (
          <View style={ts.durTrack}>
            <View style={[ts.durFill, { width: `${durPct}%` as any, backgroundColor: cat.dot }]} />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── List / Timeline view ─────────────────────────────────────────────────────
function TLListView({
  items, projectId, onAdd, onGenerate, generating,
}: { items: any[]; projectId: string; onAdd: () => void; onGenerate: () => void; generating: boolean }) {
  const sorted = [...items].sort((a, b) => {
    const ta = a.item_time || a.start_time;
    const tb = b.item_time || b.start_time;
    if (ta && tb) return ta.localeCompare(tb);
    if (ta) return -1;
    if (tb) return 1;
    return (a.position_order ?? 0) - (b.position_order ?? 0);
  });

  const milestones = sorted.filter(i => i.is_milestone);
  const regular    = sorted.filter(i => !i.is_milestone);

  if (items.length === 0) {
    return (
      <View style={ts.emptyWrap}>
        <View style={ts.emptyIcon}><Feather name="clock" size={26} color="#8b5cf6" /></View>
        <Text style={ts.emptyTitle}>No timeline yet</Text>
        <Text style={ts.emptySub}>Build a complete schedule with AI — vendor arrivals, ceremony timing, and more.</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <TouchableOpacity onPress={onGenerate} disabled={generating} style={ts.aiBtn} activeOpacity={0.8}>
            {generating
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Feather name="zap" size={13} color="#fff" /><Text style={ts.aiBtnText}>Generate AI Schedule</Text></>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={onAdd} style={ts.outlineBtn} activeOpacity={0.8}>
            <Feather name="plus" size={13} color="#fff" />
            <Text style={ts.outlineBtnText}>Add Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Milestones section */}
      {milestones.length > 0 && (
        <View>
          <View style={ts.sectionHeader}>
            <Feather name="flag" size={12} color="#f59e0b" />
            <Text style={[ts.sectionHeaderText, { color: '#f59e0b' }]}>Key Milestones</Text>
            <View style={[ts.countPill, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.22)' }]}>
              <Text style={[ts.countPillText, { color: '#f59e0b' }]}>{milestones.length}</Text>
            </View>
          </View>
          {milestones.map((item, idx) => (
            <TLItemCard key={item.id} item={item} projectId={projectId} isLast={idx === milestones.length - 1} />
          ))}
        </View>
      )}

      {/* Schedule section */}
      <View>
        {milestones.length > 0 && regular.length > 0 && (
          <View style={ts.sectionHeader}>
            <Feather name="list" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={ts.sectionHeaderText}>Schedule</Text>
            <View style={ts.countPill}>
              <Text style={ts.countPillText}>{regular.length}</Text>
            </View>
          </View>
        )}
        {regular.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>No schedule items yet.</Text>
            <TouchableOpacity onPress={onAdd} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: Colors.accent.indigo, fontWeight: '700' }}>+ Add first item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          regular.map((item, idx) => (
            <TLItemCard key={item.id} item={item} projectId={projectId} isLast={idx === regular.length - 1} />
          ))
        )}
      </View>
    </View>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────
function TLCalendarView({ items, project }: { items: any[]; project: any }) {
  const { width: W } = useWindowDimensions();
  const cellW = Math.floor((W - 32) / 7);

  const [cal, setCal] = useState(() => {
    if (project?.event_date) {
      const d = new Date(project.event_date);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const eventDate = project?.event_date ? new Date(project.event_date) : null;
  const today     = new Date();
  const firstDay  = new Date(cal.year, cal.month, 1).getDay();
  const daysCount = new Date(cal.year, cal.month + 1, 0).getDate();

  const itemsByDate: Record<string, any[]> = {};
  for (const item of items) {
    const d = item.event_date || item.item_date;
    if (d) {
      const k = d.slice(0, 10);
      if (!itemsByDate[k]) itemsByDate[k] = [];
      itemsByDate[k].push(item);
    }
  }

  function prevMonth() {
    setCal(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 });
  }
  function nextMonth() {
    setCal(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { ...p, month: p.month + 1 });
  }

  const isToday = (d: number) =>
    today.getFullYear() === cal.year && today.getMonth() === cal.month && today.getDate() === d;
  const isEvent = (d: number) =>
    eventDate &&
    eventDate.getFullYear() === cal.year &&
    eventDate.getMonth() === cal.month &&
    eventDate.getDate() === d;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysCount; d++) cells.push(d);

  return (
    <View style={{ backgroundColor: Colors.bg.card, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      {/* Month nav */}
      <View style={ts.calHeader}>
        <TouchableOpacity onPress={prevMonth} style={ts.calNavBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
        <Text style={ts.calMonthLabel}>{MONTHS_LONG[cal.month]} {cal.year}</Text>
        <TouchableOpacity onPress={nextMonth} style={ts.calNavBtn} activeOpacity={0.7}>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
        {DAYS.map(d => (
          <View key={d} style={{ width: cellW, alignItems: 'center', paddingVertical: 7 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, idx) => {
          if (!day) return (
            <View key={`e${idx}`} style={{ width: cellW, height: 58, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }} />
          );

          const dateStr = `${cal.year}-${String(cal.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayItems = itemsByDate[dateStr] || [];
          const evDay = isEvent(day);
          const todayDay = isToday(day);

          return (
            <View
              key={day}
              style={[
                { width: cellW, height: 58, borderBottomWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.04)', padding: 4 },
                evDay && { backgroundColor: 'rgba(99,102,241,0.10)' },
                todayDay && !evDay && { backgroundColor: 'rgba(255,255,255,0.03)' },
              ]}
            >
              {/* Day number */}
              <View style={{
                width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2,
                backgroundColor: evDay ? Colors.accent.indigo : todayDay ? 'rgba(255,255,255,0.18)' : 'transparent',
              }}>
                <Text style={{ fontSize: 10, fontWeight: evDay || todayDay ? '800' : '500', color: evDay || todayDay ? '#fff' : 'rgba(255,255,255,0.4)' }}>{day}</Text>
              </View>

              {evDay && <Text style={{ fontSize: 7, fontWeight: '800', color: '#818cf8', letterSpacing: 0.3 }}>EVENT</Text>}

              {/* Item dots */}
              {dayItems.length > 0 && !evDay && (
                <View style={{ flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
                  {dayItems.slice(0, 3).map((it, i) => (
                    <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: cc(it.category).dot }} />
                  ))}
                  {dayItems.length > 3 && (
                    <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }}>+{dayItems.length - 3}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.accent.indigo }} />
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Event day</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)' }} />
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Today</Text>
        </View>
        {CATS.slice(0, 3).map(c => (
          <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cc(c).dot }} />
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{capitalize(c)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Day-of hourly view ───────────────────────────────────────────────────────
function TLDayOfView({
  items, onAdd, onGenerate, generating,
}: { items: any[]; onAdd: () => void; onGenerate: () => void; generating: boolean }) {
  const timed   = [...items].filter(i => i.item_time || i.start_time).sort((a, b) => {
    const ta = a.item_time || a.start_time;
    const tb = b.item_time || b.start_time;
    return ta.localeCompare(tb);
  });
  const allDay = items.filter(i => !i.item_time && !i.start_time);

  if (items.length === 0) {
    return (
      <View style={ts.emptyWrap}>
        <View style={ts.emptyIcon}><Feather name="clock" size={26} color="#8b5cf6" /></View>
        <Text style={ts.emptyTitle}>No schedule yet</Text>
        <Text style={ts.emptySub}>Add items with times to see your day-of schedule.</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <TouchableOpacity onPress={onGenerate} disabled={generating} style={ts.aiBtn} activeOpacity={0.8}>
            {generating
              ? <ActivityIndicator size="small" color="#fff" />
              : <><Feather name="zap" size={13} color="#fff" /><Text style={ts.aiBtnText}>Generate AI Schedule</Text></>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={onAdd} style={ts.outlineBtn} activeOpacity={0.8}>
            <Feather name="plus" size={13} color="#fff" />
            <Text style={ts.outlineBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {/* All day / no time */}
      {allDay.length > 0 && (
        <View style={{ backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            All Day / No Time
          </Text>
          {allDay.map(item => {
            const cat = cc(item.category);
            return (
              <View key={item.id} style={[ts.allDayRow, { backgroundColor: cat.bg }]}>
                {item.is_milestone && <Feather name="flag" size={10} color="#f59e0b" />}
                <Text style={[ts.allDayText, { color: cat.text }]}>{item.title}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Hourly grid */}
      <View style={{ backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {HOURS.map(h => {
          const hStr = String(h).padStart(2, '0') + ':';
          const matched = timed.filter(i => {
            const t = i.item_time || i.start_time || '';
            return t.startsWith(hStr);
          });
          const label = h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`;
          const isActive = matched.length > 0;
          const isPeak = h >= 8 && h <= 22;

          return (
            <View key={h} style={[ts.hourRow, isActive && { backgroundColor: 'rgba(255,255,255,0.02)' }]}>
              <Text style={[ts.hourLabel, { color: isPeak ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)' }]}>{label}</Text>
              <View style={ts.hourContent}>
                {matched.map(item => {
                  const cat = cc(item.category);
                  return (
                    <View key={item.id} style={[ts.hourItem, { backgroundColor: cat.bg }]}>
                      {item.is_milestone && <Feather name="flag" size={9} color="#f59e0b" />}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[ts.hourTime, { color: cat.dot }]}>{fmt12(item.item_time || item.start_time)}</Text>
                          {item.duration_minutes && (
                            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{item.duration_minutes}min</Text>
                          )}
                          <Text style={ts.hourTitle} numberOfLines={1}>{item.title}</Text>
                        </View>
                        {item.location && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                            <Feather name="map-pin" size={9} color="rgba(255,255,255,0.25)" />
                            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.location}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
function TLAddModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const { createTimelineItem } = usePlannerStore();
  const [form, setForm] = useState({
    title: '', category: 'logistics', item_time: '',
    duration_minutes: '', description: '', location: '', is_milestone: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (v: any) => setForm(p => ({ ...p, [k]: v }));

  async function submit() {
    if (!form.title.trim()) return notify.titleRequired();
    setSaving(true);
    const payload = {
      ...form,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      item_time: form.item_time || undefined,
    };
    const res = await createTimelineItem(projectId, payload);
    setSaving(false);
    if (res.success) {
      showSuccess('Item added');
      onClose();
    } else {
      notify.projectFailed(res.error);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={ts.backdrop} onPress={onClose} />
        <View style={ts.sheet}>
          <View style={ts.handle} />

          {/* Header */}
          <View style={ts.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="clock" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={ts.sheetTitle}>Add Timeline Item</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={ts.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 12 }}>

            {/* Title */}
            <View>
              <Text style={ts.fieldLabel}>Title *</Text>
              <TextInput
                style={ts.inp}
                placeholder="e.g. Ceremony begins"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={form.title}
                onChangeText={set('title')}
              />
            </View>

            {/* Time + Duration */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={ts.fieldLabel}>Time (HH:MM)</Text>
                <TextInput
                  style={ts.inp}
                  placeholder="09:00"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={form.item_time}
                  onChangeText={set('item_time')}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ts.fieldLabel}>Duration (min)</Text>
                <TextInput
                  style={ts.inp}
                  placeholder="60"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={form.duration_minutes}
                  onChangeText={set('duration_minutes')}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Location */}
            <View>
              <Text style={ts.fieldLabel}>Location</Text>
              <TextInput
                style={ts.inp}
                placeholder="Main hall, Outdoor garden…"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={form.location}
                onChangeText={set('location')}
              />
            </View>

            {/* Category chips */}
            <View>
              <Text style={ts.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 7 }}>
                  {CATS.map(c => {
                    const active = form.category === c;
                    const cat = cc(c);
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => set('category')(c)}
                        activeOpacity={0.7}
                        style={[
                          ts.catChip,
                          active && { backgroundColor: cat.bg, borderColor: cat.dot + '55' },
                        ]}
                      >
                        <Text style={[ts.catChipText, active && { color: cat.text }]}>{capitalize(c)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Description */}
            <View>
              <Text style={ts.fieldLabel}>Description</Text>
              <TextInput
                style={[ts.inp, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Optional notes…"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={form.description}
                onChangeText={set('description')}
                multiline
              />
            </View>

            {/* Milestone toggle */}
            <TouchableOpacity
              onPress={() => set('is_milestone')(!form.is_milestone)}
              activeOpacity={0.8}
              style={[
                ts.milestoneToggle,
                form.is_milestone && { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.28)' },
              ]}
            >
              <View style={[
                ts.milestoneBox,
                form.is_milestone && { backgroundColor: 'rgba(245,158,11,0.25)', borderColor: '#f59e0b' },
              ]}>
                {form.is_milestone && <Feather name="check" size={11} color="#f59e0b" />}
              </View>
              <Feather name="flag" size={13} color={form.is_milestone ? '#f59e0b' : 'rgba(255,255,255,0.4)'} />
              <Text style={[ts.milestoneToggleText, form.is_milestone && { color: '#fcd34d' }]}>
                Mark as Key Milestone
              </Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity
              onPress={submit}
              disabled={saving || !form.title.trim()}
              activeOpacity={0.8}
              style={[ts.submitBtn, (saving || !form.title.trim()) && { opacity: 0.55 }]}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={ts.submitBtnText}>Add Item</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main TimelineSection ─────────────────────────────────────────────────────
export function TimelineSection({
  project, projectId, onGenerate, generating,
}: { project: any; projectId: string; onGenerate: () => void; generating: boolean }) {
  const [view, setView] = useState<'list' | 'calendar' | 'day'>('list');
  const [showAdd, setShowAdd] = useState(false);

  const items: any[]      = project?.timeline || [];
  const milestoneCount    = items.filter(i => i.is_milestone).length;

  const VIEWS = [
    { id: 'list'     as const, icon: 'list'     as const, label: 'Timeline' },
    { id: 'calendar' as const, icon: 'calendar' as const, label: 'Calendar' },
    { id: 'day'      as const, icon: 'clock'    as const, label: 'Day-of'   },
  ];

  return (
    <View style={{ padding: 14, gap: 12 }}>
      {/* ── Toolbar ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        {/* View switcher */}
        <View style={ts.viewSwitcher}>
          {VIEWS.map(v => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setView(v.id)}
              activeOpacity={0.8}
              style={[ts.viewBtn, view === v.id && ts.viewBtnActive]}
            >
              <Feather name={v.icon} size={11} color={view === v.id ? '#fff' : 'rgba(255,255,255,0.35)'} />
              <Text style={[ts.viewBtnText, view === v.id && ts.viewBtnTextActive]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats + action buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {items.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={ts.countPill}>
                <Text style={ts.countPillText}>{items.length} items</Text>
              </View>
              {milestoneCount > 0 && (
                <View style={[ts.countPill, { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.22)' }]}>
                  <Feather name="flag" size={9} color="#f59e0b" />
                  <Text style={[ts.countPillText, { color: '#f59e0b' }]}>{milestoneCount}</Text>
                </View>
              )}
            </View>
          )}
          {/* AI Generate */}
          <TouchableOpacity onPress={onGenerate} disabled={generating} activeOpacity={0.8}
            style={[ts.aiSmallBtn, generating && { opacity: 0.55 }]}>
            {generating
              ? <ActivityIndicator size="small" color="#a78bfa" />
              : <Feather name="zap" size={11} color="#a78bfa" />
            }
            <Text style={ts.aiSmallBtnText}>AI</Text>
          </TouchableOpacity>
          {/* Add */}
          <TouchableOpacity onPress={() => setShowAdd(true)} activeOpacity={0.8} style={ts.addBtn}>
            <Feather name="plus" size={11} color="#fff" />
            <Text style={ts.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── View content ── */}
      {view === 'list' && (
        <TLListView
          items={items}
          projectId={projectId}
          onAdd={() => setShowAdd(true)}
          onGenerate={onGenerate}
          generating={generating}
        />
      )}
      {view === 'calendar' && (
        <TLCalendarView items={items} project={project} />
      )}
      {view === 'day' && (
        <TLDayOfView
          items={items}
          onAdd={() => setShowAdd(true)}
          onGenerate={onGenerate}
          generating={generating}
        />
      )}

      {showAdd && <TLAddModal projectId={projectId} onClose={() => setShowAdd(false)} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ts = StyleSheet.create({
  // List view
  itemRow:    { flexDirection: 'row', gap: 10, marginBottom: 4 },
  dotCol:     { alignItems: 'center', width: 18, paddingTop: 2 },
  dot:        { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 4 },
  connector:  { width: 1, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 4 },
  card:       { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, overflow: 'hidden' },
  itemTitle:  { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  itemDesc:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 18, marginTop: 2 },
  metaText:   { fontSize: 11, color: 'rgba(255,255,255,0.38)' },
  catPill:    { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  catPillText:{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  durTrack:   { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  durFill:    { height: 3, borderRadius: 2, opacity: 0.65 },
  delBtn:     { padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)' },

  // Milestone dot
  mileDotOuter: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 2,
    borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  milestonePill:    { backgroundColor: 'rgba(245,158,11,0.18)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  milestonePillText:{ fontSize: 8, fontWeight: '900', color: '#f59e0b', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Section headers
  sectionHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionHeaderText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8 },
  countPill:         { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  countPillText:     { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },

  // Empty state
  emptyWrap:  { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon:  { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  emptySub:   { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingHorizontal: 24, lineHeight: 18 },
  aiBtn:      { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  aiBtnText:  { fontSize: 13, fontWeight: '800', color: '#fff' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)' },
  outlineBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Calendar
  calHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
  calNavBtn:     { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)' },
  calMonthLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Day-of
  allDayRow:    { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, marginBottom: 5 },
  allDayText:   { fontSize: 12, fontWeight: '600', flex: 1 },
  hourRow:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', minHeight: 44 },
  hourLabel:    { width: 44, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', paddingTop: 12, paddingLeft: 10, paddingRight: 4, flexShrink: 0 },
  hourContent:  { flex: 1, padding: 6, gap: 5 },
  hourItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  hourTime:     { fontSize: 10, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  hourTitle:    { fontSize: 12, fontWeight: '600', color: '#fff', flex: 1 },

  // View switcher
  viewSwitcher:       { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  viewBtn:            { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9 },
  viewBtnActive:      { backgroundColor: Colors.accent.indigo },
  viewBtnText:        { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)' },
  viewBtnTextActive:  { color: '#fff' },

  // Toolbar buttons
  aiSmallBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.14)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  aiSmallBtnText: { fontSize: 11, fontWeight: '800', color: '#a78bfa' },
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.accent.indigo },
  addBtnText:     { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Modal
  backdrop:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:       { backgroundColor: '#0d0d1c', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', maxHeight: '93%', paddingTop: 10 },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  sheetTitle:  { fontSize: 14, fontWeight: '800', color: '#fff' },
  closeBtn:    { padding: 7, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.07)' },

  fieldLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inp:        { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: '#fff' },
  catChip:    { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  catChipText:{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },

  milestoneToggle:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  milestoneBox:        { width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  milestoneToggleText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },

  submitBtn:     { backgroundColor: Colors.accent.indigo, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
