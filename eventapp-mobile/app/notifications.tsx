import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useNotificationStore, AppNotification } from '@/store/notification.store';

/* ─── type → icon + accent ──────────────────────────────────────────── */
const TYPE_CFG: Record<string, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  new_rsvp:     { icon: 'users',      color: Colors.accent.indigo  },
  ticket_sold:  { icon: 'tag',        color: Colors.accent.emerald },
  new_donation: { icon: 'heart',      color: '#f43f5e'             },
  checkin:      { icon: 'check-circle', color: Colors.accent.cyan  },
};
const DEFAULT_CFG = { icon: 'bell' as const, color: Colors.text.muted };

/* ─── Relative time ──────────────────────────────────────────────────── */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins   = Math.floor(diffMs / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── Row ────────────────────────────────────────────────────────────── */
function NotifRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const cfg = TYPE_CFG[item.type] ?? DEFAULT_CFG;
  const isUnread = !item.read_at;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.72 }, isUnread && s.rowUnread]}
    >
      <View style={[s.iconWrap, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}28` }]}>
        <Feather name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={s.rowContent}>
        <Text style={[s.rowTitle, isUnread && s.rowTitleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.body ? (
          <Text style={s.rowBody} numberOfLines={2}>{item.body}</Text>
        ) : null}
        <Text style={s.rowTime}>{fmtTime(item.created_at)}</Text>
      </View>
      {isUnread && <View style={s.unreadDot} />}
    </Pressable>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────── */
export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, fetch, markRead, markAllRead } = useNotificationStore();

  useEffect(() => { fetch(); }, []);

  const handlePress = useCallback((n: AppNotification) => {
    if (!n.read_at) markRead(n.id);
    if (n.link) {
      // Convert web-style paths to mobile routes
      // e.g. /events/abc/guests → /events/abc/guests
      router.push(n.link as any);
    }
  }, [markRead, router]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Feather name="chevron-left" size={20} color={Colors.text.muted} />
        </Pressable>
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTxt}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} style={s.markAllBtn}>
            <Feather name="check-square" size={17} color={Colors.accent.indigo} />
          </Pressable>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <NotifRow item={item} onPress={() => handlePress(item)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading && notifications.length > 0}
            onRefresh={fetch}
            tintColor={Colors.accent.indigo}
          />
        }
        contentContainerStyle={notifications.length === 0 ? s.emptyContainer : s.listContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Colors.accent.indigo} size="large" style={{ marginTop: 80 }} />
          ) : (
            <View style={s.emptyWrap}>
              <View style={s.emptyIconWrap}>
                <LinearGradient
                  colors={[`${Colors.accent.indigo}30`, `${Colors.accent.violet}18`]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <Feather name="bell-off" size={30} color={Colors.accent.indigo} />
              </View>
              <Text style={s.emptyTitle}>All caught up</Text>
              <Text style={s.emptyBody}>
                You'll be notified here when guests RSVP, tickets are sold, or check-ins happen.
              </Text>
            </View>
          )
        }
        ItemSeparatorComponent={() => <View style={s.sep} />}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },

  /* Header */
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
    gap:               8,
  },
  backBtn: {
    width:           38,
    height:          38,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    12,
    backgroundColor: Colors.bg.elevated,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
  },
  headerMid: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    paddingLeft:   4,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.3 },
  badge: {
    backgroundColor:  Colors.accent.indigo,
    borderRadius:     10,
    paddingHorizontal: 7,
    paddingVertical:  2,
  },
  badgeTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },
  markAllBtn: {
    width:           38,
    height:          38,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    12,
    backgroundColor: Colors.bg.elevated,
    borderWidth:     1,
    borderColor:     Colors.border.subtle,
  },

  /* List */
  listContent:    { paddingBottom: 60 },
  emptyContainer: { flex: 1 },

  /* Row */
  row: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    paddingHorizontal: 16,
    paddingVertical:   14,
    gap:               12,
    backgroundColor:   Colors.bg.primary,
  },
  rowUnread: { backgroundColor: `${Colors.accent.indigo}08` },
  iconWrap: {
    width:          44,
    height:         44,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    flexShrink:     0,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTitle:       { fontSize: 14, fontWeight: '600', color: Colors.text.muted, lineHeight: 20 },
  rowTitleUnread: { fontWeight: '800', color: Colors.text.primary },
  rowBody:        { fontSize: 12, color: Colors.text.subtle, lineHeight: 18 },
  rowTime:        { fontSize: 11, color: Colors.text.subtle, marginTop: 2 },
  unreadDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.accent.indigo,
    marginTop:       8,
    flexShrink:      0,
  },

  sep: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: 72 },

  /* Empty */
  emptyWrap: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40, gap: 16 },
  emptyIconWrap: {
    width:           72,
    height:          72,
    borderRadius:    22,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     `${Colors.accent.indigo}30`,
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.3 },
  emptyBody:  { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
});
