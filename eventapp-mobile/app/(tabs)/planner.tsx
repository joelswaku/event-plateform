import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePlannerStore } from '@/store/planner.store';
import { useEventStore } from '@/store/event.store';
import { Colors } from '@/constants/colors';
import { notify } from '@/lib/toast';

const EVENT_TYPE_EMOJI: Record<string, string> = {
  wedding: '💍', conference: '🎤', concert: '🎵', birthday: '🎂',
  corporate: '💼', festival: '🎪', party: '🎉', gala: '✨',
};

function getEmoji(type?: string): string {
  if (!type) return '📋';
  return EVENT_TYPE_EMOJI[type.toLowerCase()] ?? '📋';
}

function ProgressBar({ value, total, color = Colors.accent.indigo }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <View style={s.barBg}>
      <View style={[s.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function PlannerTab() {
  const router = useRouter();
  const { projects, loading, fetchProjects, deleteProject } = usePlannerStore();
  const { events: allEvents, loading: eventsLoading, fetchEvents } = useEventStore();
  const events = allEvents.filter((e: any) => !e.user_role || e.user_role === 'OWNER');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => { fetchProjects(); fetchEvents(); }, []);

  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      const res = await deleteProject(id);
      setDeleting(null);
      if (res.success) {
        notify.success('Project deleted');
      } else {
        notify.error(res.error || 'Failed to delete');
      }
    } catch (error) {
      setDeleting(null);
      notify.error('Failed to delete project');
      console.error('Delete error:', error);
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const done = Number(item.done_count || 0);
    const total = Number(item.task_count || 0);
    const budget = Number(item.total_budget || 0);

    return (
      <TouchableOpacity style={s.card} onPress={() => router.push(`/planner/${item.id}`)} activeOpacity={0.7}>
        <View style={s.cardTop}>
          <Text style={s.emoji}>{getEmoji(item.event_type)}</Text>
          <View style={s.cardInfo}>
            <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
            {item.event_date && (
              <Text style={s.cardSub}>
                {new Date(item.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            disabled={deleting === item.id}
            style={s.deleteBtn}
          >
            {deleting === item.id ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Feather name="trash-2" size={16} color="#ef4444" />
            )}
          </TouchableOpacity>
        </View>

        {total > 0 && (
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>{done}/{total} tasks</Text>
            <ProgressBar value={done} total={total} />
          </View>
        )}

        {budget > 0 && (
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>Budget: {item.currency || 'USD'} {budget.toLocaleString()}</Text>
            <ProgressBar value={0} total={budget} color={Colors.accent.indigo + '60'} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [router, deleting, handleDelete]);

  const busy = loading || eventsLoading;
  const noEvents = !busy && events.length === 0 && projects.length === 0;
  const hasEventsNoProjects = !busy && events.length > 0 && projects.length === 0;

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Event Planner</Text>
          <Text style={s.headerSub}>Plan every detail with AI</Text>
        </View>
        {projects.length > 0 && (
          <TouchableOpacity
            style={s.headerAddBtn}
            onPress={() => setShowEventModal(true)}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={s.headerAddBtnText}>Add Planner</Text>
          </TouchableOpacity>
        )}
      </View>

      {busy && (
        <View style={s.center}>
          <ActivityIndicator color={Colors.accent.indigo} />
        </View>
      )}

      {/* ── No events at all ── */}
      {noEvents && (
        <View style={s.center}>
          <View style={s.emptyIconWrap}>
            <Feather name="clipboard" size={32} color={Colors.accent.indigo} />
            <View style={s.sparkBadge}>
              <Feather name="zap" size={10} color="#fff" />
            </View>
          </View>
          <Text style={s.emptyTitle}>No events yet</Text>
          <Text style={s.emptySub}>
            Create your first event, then attach a planner to manage every detail — tasks, vendors, timeline and budget.
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/events/create')}>
            <Feather name="plus" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.primaryBtnText}>Create an Event</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Events exist but no planners ── */}
      {hasEventsNoProjects && (
        <View style={{ flex: 1 }}>
          <View style={s.noProjectsTop}>
            <Text style={s.emptyTitle}>No planner projects yet</Text>
            <Text style={s.emptySub}>Add a planner to one of your events to get started.</Text>
          </View>
          <FlatList
            data={events.slice(0, 5)}
            keyExtractor={(ev) => ev.id}
            contentContainerStyle={s.eventList}
            renderItem={({ item: ev }) => (
              <TouchableOpacity
                style={s.eventCard}
                onPress={() => router.push({ pathname: '/planner/new', params: { eventId: ev.id } })}
              >
                <Text style={s.eventEmoji}>{getEmoji((ev as any).event_type || (ev as any).type)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventCardTitle} numberOfLines={1}>{(ev as any).title || (ev as any).name}</Text>
                  {((ev as any).starts_at || (ev as any).date) && (
                    <Text style={s.eventCardSub}>
                      {new Date((ev as any).starts_at || (ev as any).date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  )}
                </View>
                <View style={s.addPlannerBadge}>
                  <Text style={s.addPlannerText}>Add Planner</Text>
                  <Feather name="arrow-right" size={12} color={Colors.accent.indigo} />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── Projects list ── */}
      {!loading && projects.length > 0 && (
        <FlatList
          data={projects}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB — always show, handle no events case */}
      {projects.length > 0 && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => setShowEventModal(true)}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Event Selection Modal */}
      <Modal
        visible={showEventModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEventModal(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setShowEventModal(false)}>
          <Pressable style={s.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Event for Planner</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Feather name="x" size={20} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={events}
              keyExtractor={(ev) => ev.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item: ev }) => (
                <TouchableOpacity
                  style={s.modalEventCard}
                  onPress={() => {
                    setShowEventModal(false);
                    router.push({ pathname: '/planner/new', params: { eventId: ev.id } });
                  }}
                >
                  <Text style={s.modalEventEmoji}>{getEmoji((ev as any).event_type || (ev as any).type)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.modalEventTitle} numberOfLines={1}>
                      {(ev as any).title || (ev as any).name}
                    </Text>
                    {((ev as any).starts_at || (ev as any).date) && (
                      <Text style={s.modalEventSub}>
                        {new Date((ev as any).starts_at || (ev as any).date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                  <Feather name="arrow-right" size={16} color={Colors.accent.indigo} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: Colors.text.subtle, fontSize: 13, marginBottom: 16, textAlign: 'center', paddingHorizontal: 20 }}>
                    No events available. Create an event first.
                  </Text>
                  <TouchableOpacity
                    style={s.primaryBtn}
                    onPress={() => {
                      setShowEventModal(false);
                      router.push('/events/create');
                    }}
                  >
                    <Feather name="plus" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={s.primaryBtnText}>Create Event</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border.DEFAULT },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text.primary },
  headerSub: { fontSize: 12, color: Colors.text.subtle, marginTop: 2 },
  headerAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accent.indigo, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  headerAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(99,102,241,0.12)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  sparkBadge: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.accent.amber, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text.primary, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.text.subtle, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent.indigo, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.DEFAULT },
  ghostBtnText: { color: Colors.text.muted, fontSize: 13, fontWeight: '600' },
  noProjectsTop: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 16, alignItems: 'center' },
  eventList: { paddingHorizontal: 16, paddingBottom: 16 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.DEFAULT, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  eventEmoji: { fontSize: 22 },
  eventCardTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  eventCardSub: { fontSize: 11, color: Colors.text.subtle, marginTop: 2 },
  addPlannerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addPlannerText: { fontSize: 11, fontWeight: '600', color: Colors.accent.indigo },
  ghostCenter: { paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' },
  card: { backgroundColor: Colors.bg.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.DEFAULT, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text.primary, lineHeight: 20 },
  cardSub: { fontSize: 12, color: Colors.text.subtle, marginTop: 2 },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' },
  progressRow: { marginTop: 10, gap: 4 },
  progressLabel: { fontSize: 11, color: Colors.text.subtle },
  barBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.accent.indigo, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent.indigo, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bg.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingTop: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border.DEFAULT },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text.primary },
  modalEventCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bg.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.border.DEFAULT, paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 16, marginTop: 12 },
  modalEventEmoji: { fontSize: 22 },
  modalEventTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  modalEventSub: { fontSize: 11, color: Colors.text.subtle, marginTop: 2 },
});
