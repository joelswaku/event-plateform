/**
 * eventapp-mobile/app/team-events/index.tsx
 *
 * Team Events Hub — shows all events the logged-in user is a team member of.
 * Each card shows their role + taps into the role-aware control panel.
 */

import React, { useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTeamStore, TeamEvent } from '@/store/team.store';
import { Colors } from '@/constants/colors';

/* ── Role config ────────────────────────────────────────────────────────────── */
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ADMIN:         { label: 'Admin',         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: 'shield' },
  MANAGER:       { label: 'Manager',       color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: 'briefcase' },
  STAFF:         { label: 'Staff',         color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: 'user' },
  CHECKIN_AGENT: { label: 'Check-in',      color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: 'check-circle' },
  VIEWER:        { label: 'Viewer',        color: '#94a3b8', bg: 'rgba(148,163,184,0.12)',icon: 'eye' },
};

const STATUS_COLOR: Record<string, string> = {
  PUBLISHED: '#34d399',
  DRAFT:     '#94a3b8',
  ARCHIVED:  '#f87171',
  CANCELLED: '#f87171',
};

/* ══════════════════════════════════════════════════════════════════════════════
   SCREEN
══════════════════════════════════════════════════════════════════════════════ */
export default function TeamEventsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { teamEvents, isLoading, fetchMyTeamEvents } = useTeamStore();

  const load = useCallback(() => { fetchMyTeamEvents(); }, []);

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Team Events</Text>
          <Text style={s.headerSub}>Events you help manage</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor="#6366f1" />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && teamEvents.length === 0 ? (
          <View style={s.centered}>
            <ActivityIndicator color="#6366f1" size="large" />
          </View>
        ) : teamEvents.length === 0 ? (
          <EmptyState />
        ) : (
          teamEvents.map(event => (
            <TeamEventCard
              key={event.id}
              event={event}
              onPress={() => router.push(`/events/${event.id}` as never)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/* ── Team Event Card ─────────────────────────────────────────────────────────── */
function TeamEventCard({ event, onPress }: { event: TeamEvent; onPress: () => void }) {
  const roleCfg = ROLE_CONFIG[event.role] ?? ROLE_CONFIG.VIEWER;
  const statusColor = STATUS_COLOR[event.status] ?? '#94a3b8';

  const dateStr = event.starts_at_local
    ? new Date(event.starts_at_local).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date TBD';

  return (
    <Pressable style={({ pressed }) => [c.card, pressed && { opacity: 0.88 }]} onPress={onPress}>
      {/* Cover */}
      <View style={c.coverWrap}>
        {event.cover_image_url ? (
          <Image source={{ uri: event.cover_image_url }} style={c.cover} resizeMode="cover" />
        ) : (
          <LinearGradient colors={['#1e1b4b', '#312e81']} style={c.cover} />
        )}
        {/* Status dot */}
        <View style={[c.statusDot, { backgroundColor: statusColor }]} />
        {/* Role badge on cover */}
        <View style={[c.roleBadge, { backgroundColor: roleCfg.bg, borderColor: roleCfg.color + '40' }]}>
          <Feather name={roleCfg.icon} size={10} color={roleCfg.color} />
          <Text style={[c.roleTxt, { color: roleCfg.color }]}>{roleCfg.label}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={c.content}>
        <Text style={c.title} numberOfLines={2}>{event.title}</Text>
        <View style={c.metaRow}>
          <Feather name="calendar" size={12} color="#64748b" />
          <Text style={c.metaTxt}>{dateStr}</Text>
        </View>
        <View style={c.metaRow}>
          <Feather name="user" size={12} color="#64748b" />
          <Text style={c.metaTxt}>Owner: {event.owner_name}</Text>
        </View>

        <View style={c.footer}>
          <View style={[c.statusPill, { backgroundColor: statusColor + '20' }]}>
            <Text style={[c.statusTxt, { color: statusColor }]}>{event.status}</Text>
          </View>
          <Pressable style={c.openBtn} onPress={onPress}>
            <Text style={c.openTxt}>Open →</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <View style={es.wrap}>
      <View style={es.iconWrap}>
        <LinearGradient colors={['#4f46e5', '#7c3aed']} style={StyleSheet.absoluteFill} />
        <Feather name="users" size={28} color="#fff" />
      </View>
      <Text style={es.title}>No team events yet</Text>
      <Text style={es.sub}>When an event owner adds you to their team, you'll see the events here to manage.</Text>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#07070f' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerSub:    { fontSize: 11, color: '#64748b', marginTop: 1 },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 16, gap: 12 },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
});

const c = StyleSheet.create({
  card:      { backgroundColor: '#111127', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  coverWrap: { height: 120, position: 'relative' },
  cover:     { ...StyleSheet.absoluteFillObject },
  statusDot: { position: 'absolute', top: 10, left: 10, width: 8, height: 8, borderRadius: 4 },
  roleBadge: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  roleTxt:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  content:   { padding: 14, gap: 6 },
  title:     { fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 20 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt:   { fontSize: 12, color: '#64748b' },
  footer:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statusPill:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  openBtn:   { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 8 },
  openTxt:   { fontSize: 12, fontWeight: '700', color: '#6366f1' },
});

const es = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 20 },
  title:    { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  sub:      { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
});