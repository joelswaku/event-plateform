import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppNotification, useNotificationStore } from '@/store/notification.store';
import { useAuthStore } from '@/store/auth.store';

/* Mirrors the compact notification inbox opened from the web-mobile bell. */
const COLORS = {
  bg: '#07070F',
  surface: '#0E0E16',
  rowUnread: 'rgba(99,102,241,0.10)',
  primary: '#818CF8',
  text: '#FFFFFF',
  textRead: 'rgba(255,255,255,0.78)',
  textMuted: 'rgba(255,255,255,0.43)',
  textFaint: 'rgba(255,255,255,0.27)',
  border: 'rgba(255,255,255,0.08)',
};

type NotificationStyle = {
  icon: keyof typeof Feather.glyphMap;
  color: string;
  background: string;
};

const TYPE_CFG: Record<string, NotificationStyle> = {
  new_rsvp:     { icon: 'users',          color: '#818CF8', background: 'rgba(99,102,241,0.18)' },
  ticket_sold:  { icon: 'tag',            color: '#34D399', background: 'rgba(16,185,129,0.16)' },
  new_donation: { icon: 'heart',          color: '#FB7185', background: 'rgba(244,63,94,0.16)' },
  checkin:      { icon: 'check-circle',   color: '#22D3EE', background: 'rgba(6,182,212,0.16)' },
  chat:         { icon: 'message-square', color: '#A78BFA', background: 'rgba(139,92,246,0.16)' },
  event:        { icon: 'calendar',       color: '#FBBF24', background: 'rgba(245,158,11,0.16)' },
};
const DEFAULT_CFG: NotificationStyle = {
  icon: 'zap', color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.08)',
};

function fmtTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const config = TYPE_CFG[item.type] ?? DEFAULT_CFG;
  const unread = !item.read_at;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [
        s.row,
        unread && s.rowUnread,
        pressed && s.rowPressed,
      ]}
    >
      <View style={[s.typeIcon, { backgroundColor: config.background }]}>
        <Feather name={config.icon} size={17} color={config.color} />
      </View>

      <View style={s.rowCopy}>
        <Text numberOfLines={2} style={[s.rowTitle, unread ? s.rowTitleUnread : s.rowTitleRead]}>
          {item.title}
        </Text>
        {!!item.body && <Text numberOfLines={1} style={s.rowBody}>{item.body}</Text>}
        <Text style={s.rowTime}>{fmtTime(item.created_at)}</Text>
      </View>

      {unread && <View style={s.unreadDot} />}
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={s.emptyState}>
      <View style={s.emptyIcon}>
        <Feather name="bell" size={23} color="rgba(255,255,255,0.28)" />
      </View>
      <Text style={s.emptyTitle}>No notifications yet</Text>
      <Text style={s.emptySubtitle}>Updates about your events will appear here.</Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, fetch, markRead, markAllRead } = useNotificationStore();
  const isSuperAdmin = useAuthStore(state => !!state.user?.is_super_admin);

  useEffect(() => { fetch(); }, [fetch]);

  // Support inbox messages belong in Super Admin → Support, exactly like web.
  const visibleNotifications = useMemo(
    () => isSuperAdmin ? notifications.filter(notification => notification.type !== 'chat') : notifications,
    [isSuperAdmin, notifications],
  );
  const visibleUnreadCount = useMemo(
    () => isSuperAdmin
      ? visibleNotifications.reduce((total, notification) => total + (notification.read_at ? 0 : 1), 0)
      : unreadCount,
    [isSuperAdmin, unreadCount, visibleNotifications],
  );

  const openNotification = useCallback((notification: AppNotification) => {
    if (!notification.read_at) void markRead(notification.id);
    if (notification.link) router.push(notification.link as never);
  }, [markRead, router]);

  return (
    <View style={s.container}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={s.backButton}
          >
            <Feather name="chevron-left" size={21} color={COLORS.textMuted} />
          </Pressable>

          <View style={s.headerTitleWrap}>
            <View style={s.headerBell}>
              <Feather name="bell" size={16} color={COLORS.primary} />
            </View>
            <Text style={s.headerTitle}>Notifications</Text>
            {visibleUnreadCount > 0 && (
              <View style={s.countBadge}>
                <Text style={s.countBadgeText}>{visibleUnreadCount > 99 ? '99+' : visibleUnreadCount}</Text>
              </View>
            )}
          </View>

          {visibleUnreadCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              onPress={() => void markAllRead()}
              style={s.markAllButton}
            >
              <Feather name="check" size={18} color={COLORS.primary} />
            </Pressable>
          ) : <View style={s.headerSpacer} />}
        </View>

        <FlatList
          data={visibleNotifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <NotificationRow item={item} onPress={() => openNotification(item)} />}
          refreshControl={
            <RefreshControl
              refreshing={loading && visibleNotifications.length > 0}
              onRefresh={() => void fetch()}
              tintColor={COLORS.primary}
              progressBackgroundColor={COLORS.surface}
            />
          }
          contentContainerStyle={visibleNotifications.length ? s.listContent : s.emptyContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={loading ? (
            <View style={s.loadingState}><ActivityIndicator color={COLORS.primary} size="large" /></View>
          ) : <EmptyState />}
          ListFooterComponent={visibleNotifications.length ? (
            <Text style={s.footerText}>Showing {visibleNotifications.length} most recent</Text>
          ) : null}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  headerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  headerBell: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  countBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  countBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  markAllButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
  headerSpacer: { width: 38, height: 38 },
  listContent: { paddingVertical: 8, paddingBottom: 34 },
  emptyContent: { flexGrow: 1 },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  rowUnread: { backgroundColor: COLORS.rowUnread },
  rowPressed: { opacity: 0.74 },
  typeIcon: {
    width: 36,
    height: 36,
    marginTop: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, lineHeight: 19 },
  rowTitleUnread: { color: COLORS.text, fontWeight: '700' },
  rowTitleRead: { color: COLORS.textRead, fontWeight: '500' },
  rowBody: { marginTop: 2, color: COLORS.textMuted, fontSize: 12, lineHeight: 17 },
  rowTime: { marginTop: 4, color: COLORS.textFaint, fontSize: 10, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, marginTop: 10, borderRadius: 4, backgroundColor: COLORS.primary },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 80 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    marginBottom: 14,
  },
  emptyTitle: { color: COLORS.textMuted, fontSize: 15, fontWeight: '700' },
  emptySubtitle: { marginTop: 5, color: COLORS.textFaint, fontSize: 12, textAlign: 'center' },
  footerText: { paddingTop: 14, color: COLORS.textFaint, fontSize: 11, textAlign: 'center' },
});
