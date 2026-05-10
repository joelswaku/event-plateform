import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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
      style={({ pressed }) => [s.row, pressed && { opacity: 0.75 }, isUnread && s.rowUnread]}
    >
      <View style={[s.iconWrap, { backgroundColor: `${cfg.color}18` }]}>
        <Feather name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={s.rowBody}>
        <Text style={[s.rowTitle, isUnread && s.rowTitleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.body ? (
          <Text style={s.rowBody2} numberOfLines={1}>{item.body}</Text>
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
            <ActivityIndicator color={Colors.accent.indigo} size="large" style={{ marginTop: 60 }} />
          ) : (
            <View style={s.emptyWrap}>
              <View style={s.emptyIcon}>
                <Feather name="bell-off" size={28} color={Colors.text.subtle} />
              </View>
              <Text style={s.emptyTitle}>No notifications yet</Text>
              <Text style={s.emptyBody}>
                You'll be notified when guests RSVP, tickets are sold, or donations come in.
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  backBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  headerMid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  badge: {
    backgroundColor: Colors.accent.indigo,
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1,
  },
  badgeTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },
  markAllBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },

  listContent: { paddingBottom: 40 },
  emptyContainer: { flex: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: Colors.bg.primary,
  },
  rowUnread: { backgroundColor: 'rgba(99,102,241,0.06)' },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: Colors.text.muted, lineHeight: 20 },
  rowTitleUnread: { fontWeight: '700', color: Colors.text.primary },
  rowBody2: { fontSize: 12, color: Colors.text.subtle },
  rowTime: { fontSize: 11, color: Colors.text.subtle, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.accent.indigo,
    marginTop: 6,
  },

  sep: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: 68 },

  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  emptyBody: { fontSize: 13, color: Colors.text.muted, textAlign: 'center', lineHeight: 20 },
});
