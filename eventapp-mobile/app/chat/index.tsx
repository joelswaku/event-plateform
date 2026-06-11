import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useChatStore, Conversation } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';

const POLL_MS = 5000;

/* ─── Relative time ──────────────────────────────────────────────────── */
function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins   = Math.floor(diffMs / 60_000);
  if (mins < 1)  return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function convTitle(c: Conversation): string {
  if (c.title) return c.title;
  if (c.counterpart) return c.counterpart.full_name;
  if (c.participants?.length) return c.participants.map(p => p.full_name).join(', ');
  return 'Conversation';
}

function initialsOf(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

/* ─── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ uri, name, group }: { uri: string | null; name: string; group?: boolean }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.avatar} />;
  }
  return (
    <View style={styles.avatar}>
      <LinearGradient
        colors={[Colors.accent.indigo, Colors.accent.violet]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {group ? (
        <Feather name="users" size={22} color="#fff" style={{ zIndex: 10 }} />
      ) : (
        <Text style={styles.avatarTxt}>{initialsOf(name)}</Text>
      )}
    </View>
  );
}

/* ─── Row ────────────────────────────────────────────────────────────── */
function ConvRow({ item, onPress }: { item: Conversation; onPress: () => void }) {
  const title    = convTitle(item);
  const isGroup  = item.type === 'group' || (!item.counterpart && item.participants?.length > 1);
  const isUnread = item.unread_count > 0;
  const avatarUri = item.counterpart?.avatar_url ?? null;
  const preview  = item.last_message_preview ?? 'No messages yet';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardInner}>
        <Avatar uri={avatarUri} name={title} group={isGroup} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text
              style={[styles.cardTitle, isUnread && styles.cardTitleUnread]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {item.last_message_at && (
              <Text style={styles.cardTime}>{fmtTime(item.last_message_at)}</Text>
            )}
          </View>
          <View style={styles.cardBottom}>
            <Text
              style={[styles.cardPreview, isUnread && styles.cardPreviewUnread]}
              numberOfLines={2}
            >
              {item.last_message_sender ? `${item.last_message_sender}: ` : ''}{preview}
            </Text>
            {isUnread && (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {isUnread && <View style={styles.unreadIndicator} />}
    </Pressable>
  );
}

/* ─── Screen ─────────────────────────────────────────────────────────── */
export default function ChatListScreen() {
  const router = useRouter();
  const isSuperAdmin       = useAuthStore(s => !!s.user?.is_super_admin);
  const conversations      = useChatStore(s => s.conversations);
  const loadingList        = useChatStore(s => s.loadingList);
  const fetchConversations = useChatStore(s => s.fetchConversations);
  const openSupport        = useChatStore(s => s.openSupport);
  const [initialDone, setInitialDone] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectedRef = useRef(false);

  // Regular users have no inbox — they get a single support thread. Redirect
  // straight into it. This list screen is the support inbox for super admins only.
  useFocusEffect(
    useCallback(() => {
      if (isSuperAdmin || redirectedRef.current) return;
      redirectedRef.current = true;
      (async () => {
        const conv = await openSupport();
        if (conv) router.replace(`/chat/${conv.id}` as never);
        else router.back();
      })();
    }, [isSuperAdmin, openSupport, router])
  );

  const load = useCallback(async () => {
    await fetchConversations();
    setInitialDone(true);
  }, [fetchConversations]);

  // Poll while focused (super-admin inbox); clean up on blur/unmount
  useFocusEffect(
    useCallback(() => {
      if (!isSuperAdmin) return;
      load();
      pollRef.current = setInterval(() => { fetchConversations(); }, POLL_MS);
      return () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      };
    }, [isSuperAdmin, load, fetchConversations])
  );

  // While redirecting a regular user, show a spinner instead of an empty inbox.
  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.accent.indigo} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Feather name="chevron-left" size={24} color={Colors.accent.indigo} />
        </Pressable>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConvRow item={item} onPress={() => router.push(`/chat/${item.id}` as never)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loadingList && conversations.length > 0}
            onRefresh={() => fetchConversations()}
            tintColor={Colors.accent.indigo}
          />
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !initialDone ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.accent.indigo} size="large" />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIcon}>
                <Feather name="message-circle" size={36} color={Colors.accent.indigo} />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyBody}>
                Support conversations will appear here.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg.card,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.DEFAULT,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text.primary,
  },
  headerRight: {
    width: 44,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    backgroundColor: Colors.bg.card,
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Colors.bg.card,
  },

  card: {
    backgroundColor: Colors.bg.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.bg.elevated,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.border.subtle,
  },
  avatarTxt: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    zIndex: 10,
  },

  cardContent: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.muted,
    marginRight: 12,
  },
  cardTitleUnread: {
    fontWeight: '900',
    color: Colors.text.primary,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.subtle,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardPreview: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.subtle,
    lineHeight: 20,
    marginRight: 12,
  },
  cardPreviewUnread: {
    color: Colors.text.muted,
    fontWeight: '600',
  },

  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: Colors.accent.indigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeTxt: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },

  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.accent.indigo,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.bg.primary,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 15,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
