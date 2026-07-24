import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotificationStore, AppNotification } from '@/store/notification.store';

/* ─── Premium Colors ──────────────────────────────────────────────────── */
const COLORS = {
  bg: '#09090B',
  card: '#18181B',
  cardUnread: '#22253A',
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  border: 'rgba(255,255,255,0.06)',
  borderUnread: 'rgba(59,130,246,0.2)',
};

/* ─── Type Config ─────────────────────────────────────────────────────── */
const TYPE_CFG: Record<string, { icon: keyof typeof Feather.glyphMap; color: string; gradient: string[] }> = {
  chat:         { icon: 'message-circle', color: COLORS.primary,  gradient: ['#3B82F6', '#2563EB'] },
  new_rsvp:     { icon: 'users',          color: COLORS.success,  gradient: ['#22C55E', '#16A34A'] },
  ticket_sold:  { icon: 'tag',            color: '#10B981',       gradient: ['#10B981', '#059669'] },
  new_donation: { icon: 'heart',          color: COLORS.danger,   gradient: ['#EF4444', '#DC2626'] },
  checkin:      { icon: 'check-circle',   color: '#06B6D4',       gradient: ['#06B6D4', '#0891B2'] },
  event:        { icon: 'calendar',       color: COLORS.warning,  gradient: ['#F59E0B', '#D97706'] },
  system:       { icon: 'bell',           color: COLORS.textSecondary, gradient: ['#71717A', '#52525B'] },
};
const DEFAULT_CFG = { icon: 'bell' as const, color: COLORS.textSecondary, gradient: ['#71717A', '#52525B'] };

/* ─── Helper Functions ────────────────────────────────────────────────── */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

function groupByDate(notifications: AppNotification[]): { title: string; data: AppNotification[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayItems: AppNotification[] = [];
  const yesterdayItems: AppNotification[] = [];
  const earlierItems: AppNotification[] = [];

  notifications.forEach(n => {
    const date = new Date(n.created_at);
    if (date >= today) {
      todayItems.push(n);
    } else if (date >= yesterday) {
      yesterdayItems.push(n);
    } else {
      earlierItems.push(n);
    }
  });

  const groups: { title: string; data: AppNotification[] }[] = [];
  if (todayItems.length) groups.push({ title: 'Today', data: todayItems });
  if (yesterdayItems.length) groups.push({ title: 'Yesterday', data: yesterdayItems });
  if (earlierItems.length) groups.push({ title: 'Earlier', data: earlierItems });

  return groups;
}

/* ─── Avatar Component ────────────────────────────────────────────────── */
function NotifAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const cfg = TYPE_CFG[name] || DEFAULT_CFG;

  if (imageUrl) {
    return (
      <View style={s.avatar}>
        <Image source={{ uri: imageUrl }} style={s.avatarImage} />
      </View>
    );
  }

  return (
    <View style={s.avatar}>
      <LinearGradient
        colors={cfg.gradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={s.avatarText}>{getInitials(name)}</Text>
    </View>
  );
}

/* ─── Notification Card ──────────────────────────────────────────────── */
function NotificationCard({
  item,
  onPress,
  index
}: {
  item: AppNotification;
  onPress: () => void;
  index: number;
}) {
  const cfg = TYPE_CFG[item.type] ?? DEFAULT_CFG;
  const isUnread = !item.read_at;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Parse title to extract name and action
  const parts = item.title.split(/(\s+sent you\s+|\s+replied to\s+|\s+mentioned you\s+)/);
  const userName = parts[0] || item.title;
  const action = parts[1] || '';
  const rest = parts[2] || '';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          s.card,
          isUnread && s.cardUnread,
          { borderColor: isUnread ? COLORS.borderUnread : COLORS.border }
        ]}
      >
        {/* Avatar */}
        <NotifAvatar name={userName} imageUrl={item.metadata?.avatar_url as string} />

        {/* Content */}
        <View style={s.cardContent}>
          {/* Title with name in bold */}
          <Text style={s.cardTitle} numberOfLines={2}>
            <Text style={s.cardName}>{userName}</Text>
            {action && <Text style={s.cardAction}>{action}</Text>}
            {rest && <Text style={s.cardMessage}>{rest}</Text>}
          </Text>

          {/* Body */}
          {item.body && (
            <Text style={s.cardBody} numberOfLines={2}>
              {item.body}
            </Text>
          )}

          {/* Time */}
          <Text style={s.cardTime}>{fmtTime(item.created_at)}</Text>
        </View>

        {/* Icon & Indicator */}
        <View style={s.cardRight}>
          {isUnread && <View style={s.unreadDot} />}
          <View style={[s.iconBadge, { backgroundColor: `${cfg.color}15` }]}>
            <Feather name={cfg.icon} size={14} color={cfg.color} />
          </View>
          <Feather name="chevron-right" size={16} color={COLORS.textSecondary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ─── Section Header ──────────────────────────────────────────────────── */
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────── */
function EmptyState() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.emptyWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={s.emptyIcon}>
        <LinearGradient
          colors={[`${COLORS.primary}20`, `${COLORS.primary}05`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Feather name="bell-off" size={48} color={COLORS.primary} />
      </View>
      <Text style={s.emptyTitle}>You're all caught up!</Text>
      <Text style={s.emptyBody}>
        No new notifications at the moment.{'\n'}
        We'll let you know when something arrives.
      </Text>
    </Animated.View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────────────────── */
export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, unreadCount, loading, fetch, markRead, markAllRead } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => { fetch(); }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read_at);
    }
    return notifications;
  }, [notifications, filter]);

  const groupedData = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications]);

  const handlePress = useCallback((n: AppNotification) => {
    if (!n.read_at) markRead(n.id);
    if (n.link) {
      router.push(n.link as any);
    }
  }, [markRead, router]);

  const renderItem = ({ item, index }: { item: { title: string; data: AppNotification[] }; index: number }) => {
    return (
      <View>
        <SectionHeader title={item.title} />
        {item.data.map((notif, idx) => (
          <NotificationCard
            key={notif.id}
            item={notif}
            onPress={() => handlePress(notif)}
            index={idx}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={s.container}>
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Feather name="chevron-left" size={22} color={COLORS.text} />
            </Pressable>

            <View style={s.headerActions}>
              {unreadCount > 0 && (
                <Pressable onPress={markAllRead} style={s.actionBtn}>
                  <Feather name="check-double" size={18} color={COLORS.primary} />
                </Pressable>
              )}
              <Pressable onPress={() => setFilter(f => f === 'all' ? 'unread' : 'all')} style={s.actionBtn}>
                <Feather name="filter" size={18} color={filter === 'unread' ? COLORS.primary : COLORS.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={s.headerTitle}>
            <Text style={s.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={s.headerBadge}>
                <Text style={s.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>

          {filter === 'unread' && (
            <View style={s.filterTag}>
              <Text style={s.filterTagText}>Unread only</Text>
            </View>
          )}
        </View>

        {/* List */}
        <FlatList
          data={groupedData}
          keyExtractor={(item) => item.title}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading && notifications.length > 0}
              onRefresh={fetch}
              tintColor={COLORS.primary}
              progressBackgroundColor={COLORS.card}
            />
          }
          contentContainerStyle={filteredNotifications.length === 0 ? s.emptyContainer : s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loading ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator color={COLORS.primary} size="large" />
              </View>
            ) : (
              <EmptyState />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  safe: { flex: 1 },

  /* Header */
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  filterTag: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  filterTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  /* List */
  listContent: { paddingBottom: 100 },
  emptyContainer: { flex: 1 },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: COLORS.cardUnread,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    zIndex: 10,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardName: {
    fontWeight: '700',
    color: COLORS.text,
  },
  cardAction: {
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
  cardMessage: {
    fontWeight: '600',
    color: COLORS.text,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty State */
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyBody: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
});
