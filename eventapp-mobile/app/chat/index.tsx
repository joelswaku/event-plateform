import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  ActivityIndicator, RefreshControl, Image, Alert, Animated, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useChatStore, Conversation } from '@/store/chat.store';
import { useAuthStore } from '@/store/auth.store';

const POLL_MS = 5000;

/* ─── Premium Colors ──────────────────────────────────────────────────── */
const COLORS = {
  bg: '#09090B',
  card: '#18181B',
  cardHover: '#1F1F23',
  primary: '#3B82F6',
  success: '#22C55E',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: 'rgba(255,255,255,0.06)',
  inputBg: '#27272A',
};

/* ─── Helper Functions ────────────────────────────────────────────────── */
function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
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

/* ─── Avatar Component ────────────────────────────────────────────────── */
function Avatar({ uri, name, size = 56, online }: { uri: string | null; name: string; size?: number; online?: boolean }) {
  if (uri) {
    return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image source={{ uri }} style={styles.avatarImage} />
        {online && <View style={styles.onlineDot} />}
      </View>
    );
  }
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <LinearGradient
        colors={[COLORS.primary, '#2563EB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={[styles.avatarTxt, { fontSize: size * 0.35 }]}>{initialsOf(name)}</Text>
      {online && <View style={styles.onlineDot} />}
    </View>
  );
}

/* ─── Conversation Card ───────────────────────────────────────────────── */
function ConvCard({
  item,
  onPress,
  isSuperAdmin,
  onDelete,
  onDeleteAll,
}: {
  item: Conversation;
  onPress: () => void;
  isSuperAdmin?: boolean;
  onDelete?: (id: string) => void;
  onDeleteAll?: (userId: string) => void;
}) {
  const title = convTitle(item);
  const isUnread = item.unread_count > 0;
  const avatarUri = item.counterpart?.avatar_url ?? null;
  const preview = item.last_message_preview ?? 'No messages yet';
  const userId = item.counterpart?.id;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLongPress = () => {
    if (!isSuperAdmin || !onDelete) return;

    const options = userId && onDeleteAll
      ? [
          { text: 'Delete This Conversation', onPress: () => onDelete(item.id) },
          { text: 'Delete All with User', onPress: () => onDeleteAll(userId), style: 'destructive' as const },
          { text: 'Cancel', style: 'cancel' as const },
        ]
      : [
          { text: 'Delete Conversation', onPress: () => onDelete(item.id), style: 'destructive' as const },
          { text: 'Cancel', style: 'cancel' as const },
        ];

    Alert.alert('Delete Conversation', 'Choose an option:', options);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={500}
        style={[styles.card, isUnread && styles.cardUnread]}
      >
        {/* Avatar */}
        <Avatar uri={avatarUri} name={title} size={56} online={false} />

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardTitle, isUnread && styles.cardTitleUnread]} numberOfLines={1}>
              {title}
            </Text>
            {item.last_message_at && (
              <Text style={styles.cardTime}>{fmtTime(item.last_message_at)}</Text>
            )}
          </View>

          <View style={styles.cardBottom}>
            <Text style={[styles.cardPreview, isUnread && styles.cardPreviewUnread]} numberOfLines={2}>
              {item.last_message_sender && `${item.last_message_sender}: `}
              {preview}
            </Text>
          </View>
        </View>

        {/* Unread Badge & Chevron */}
        <View style={styles.cardRight}>
          {isUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text>
            </View>
          )}
          <Feather name="chevron-right" size={18} color={COLORS.textMuted} style={{ marginTop: 4 }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────── */
function EmptyState() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.emptyWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.emptyIcon}>
        <LinearGradient
          colors={[`${COLORS.primary}20`, `${COLORS.primary}05`]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Feather name="message-circle" size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyBody}>
        Start chatting with support or other users.{'\n'}
        Your conversations will appear here.
      </Text>
    </Animated.View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────────────────── */
export default function ChatListScreen() {
  const router = useRouter();
  const isSuperAdmin = useAuthStore(s => !!s.user?.is_super_admin);
  const conversations = useChatStore(s => s.conversations);
  const loadingList = useChatStore(s => s.loadingList);
  const fetchConversations = useChatStore(s => s.fetchConversations);
  const deleteConversation = useChatStore(s => s.deleteConversation);
  const deleteAllConversationsWithUser = useChatStore(s => s.deleteAllConversationsWithUser);
  const openSupport = useChatStore(s => s.openSupport);
  const [initialDone, setInitialDone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectedRef = useRef(false);

  const handleDelete = useCallback(async (conversationId: string) => {
    await deleteConversation(conversationId);
    Alert.alert('Deleted', 'Conversation deleted successfully');
  }, [deleteConversation]);

  const handleDeleteAll = useCallback(async (userId: string) => {
    const count = await deleteAllConversationsWithUser(userId);
    Alert.alert('Deleted', `${count} conversation(s) deleted successfully`);
  }, [deleteAllConversationsWithUser]);

  // Regular users redirect to support
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

  // Poll while focused
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

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => {
      const title = convTitle(c).toLowerCase();
      const preview = (c.last_message_preview || '').toLowerCase();
      return title.includes(q) || preview.includes(q);
    });
  }, [conversations, searchQuery]);

  // Show loading for regular users
  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
              <Feather name="chevron-left" size={22} color={COLORS.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Messages</Text>
            <Pressable style={styles.composeButton}>
              <Feather name="edit-3" size={18} color={COLORS.primary} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search conversations..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color={COLORS.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Conversations List */}
        <FlatList
          data={filteredConversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ConvCard
              item={item}
              onPress={() => router.push(`/chat/${item.id}` as never)}
              isSuperAdmin={isSuperAdmin}
              onDelete={handleDelete}
              onDeleteAll={handleDeleteAll}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={loadingList && conversations.length > 0}
              onRefresh={() => fetchConversations()}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={filteredConversations.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !initialDone ? (
              <View style={styles.loadingContainer}>
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
const styles = StyleSheet.create({
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
  backButton: {
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
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  composeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },

  /* List */
  listContent: { paddingTop: 8, paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    backgroundColor: '#22253A',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarTxt: {
    fontWeight: '900',
    color: '#fff',
    zIndex: 10,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  cardTitleUnread: {
    fontWeight: '800',
    color: COLORS.text,
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardPreview: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  cardPreviewUnread: {
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeTxt: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
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
});
