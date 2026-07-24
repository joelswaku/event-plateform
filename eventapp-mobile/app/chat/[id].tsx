import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore, Conversation, Message } from '@/store/chat.store';

const MSG_POLL_MS = 3000;

/* ─── Premium Colors ──────────────────────────────────────────────────── */
const COLORS = {
  bg: '#09090B',
  card: '#18181B',
  bubble: '#27272A',
  bubbleMine: '#3B82F6',
  bubbleSystem: 'rgba(245,158,11,0.15)',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  border: 'rgba(255,255,255,0.06)',
  inputBg: '#18181B',
  inputBorder: '#27272A',
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function initialsOf(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function convTitle(c: Conversation | null): string {
  if (!c) return 'Chat';
  if (c.title) return c.title;
  if (c.counterpart) return c.counterpart.full_name;
  if (c.participants?.length) return c.participants.map(p => p.full_name).join(', ');
  return 'Chat';
}

/* ─── Mini Avatar ─────────────────────────────────────────────────────── */
function MiniAvatar({ uri, name }: { uri: string | null; name: string }) {
  if (uri) return <Image source={{ uri }} style={s.miniAvatar} />;
  return (
    <View style={s.miniAvatar}>
      <LinearGradient
        colors={[COLORS.bubbleMine, '#2563EB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <Text style={s.miniAvatarTxt}>{initialsOf(name)}</Text>
    </View>
  );
}

/* ─── Message Bubble ──────────────────────────────────────────────────── */
function Bubble({
  msg, mine, user, isSuperAdmin, onDelete, isDeleting
}: {
  msg: Message;
  mine: boolean;
  user: any;
  isSuperAdmin?: boolean;
  onDelete?: (msgId: string) => void;
  isDeleting?: boolean;
}) {
  const isSystem = msg.sender_id === 'system';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (msg.deleted) {
    return (
      <View style={[s.bubbleRow, mine ? s.rowMine : s.rowTheirs]}>
        {!mine && !isSystem && <View style={{ width: 32 }} />}
        <View style={[s.bubble, s.bubbleDeleted]}>
          <Text style={s.deletedTxt}>Message deleted</Text>
        </View>
        {mine && <View style={{ width: 32 }} />}
      </View>
    );
  }

  const userInitials = user?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.slice(0, 2).toUpperCase() || 'ME';

  const handleLongPress = () => {
    if (isSuperAdmin && onDelete && !isSystem) {
      Alert.alert(
        'Delete Message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(msg.id) },
        ]
      );
    }
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
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={500}
        disabled={!isSuperAdmin || isSystem}
        style={[s.bubbleRow, mine ? s.rowMine : s.rowTheirs]}
      >
        {/* Avatar for received messages */}
        {!mine && !isSystem && (
          <MiniAvatar uri={msg.sender_avatar} name={msg.sender_name || 'User'} />
        )}

        {/* Bubble */}
        <View
          style={[
            s.bubble,
            isSystem ? s.bubbleSystem : mine ? s.bubbleMine : s.bubbleTheirs,
          ]}
        >
          {/* Sender name for group messages */}
          {!mine && !isSystem && (
            <Text style={s.senderName}>{msg.sender_name}</Text>
          )}

          {/* Message text */}
          <Text
            style={[
              s.bubbleText,
              isSystem ? s.bubbleTextSystem : mine ? s.bubbleTextMine : s.bubbleTextTheirs,
            ]}
          >
            {msg.body}
          </Text>

          {/* Timestamp */}
          <Text style={[s.bubbleTime, mine ? s.bubbleTimeMine : s.bubbleTimeTheirs]}>
            {fmtTime(msg.created_at)}
          </Text>
        </View>

        {/* Avatar for sent messages */}
        {mine && (
          <MiniAvatar uri={user?.avatar_url} name={user?.full_name || 'You'} />
        )}
      </Pressable>
    </Animated.View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────────────────── */
export default function ChatConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore(s => s.user);
  const isSuperAdmin = !!user?.is_super_admin;

  const conversation = useChatStore(s => s.conversations.find(c => c.id === id));
  const messages = useChatStore(s => s.messagesByConv[id || '']) ?? [];
  const loadingThread = useChatStore(s => s.loadingThread[id || '']);
  const fetchMessages = useChatStore(s => s.fetchMessages);
  const sendMessage = useChatStore(s => s.sendMessage);
  const markRead = useChatStore(s => s.markRead);
  const getConversation = useChatStore(s => s.getConversation);
  const deleteMessage = useChatStore(s => s.deleteMessage);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch messages
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getConversation(id);
      fetchMessages(id);
      markRead(id);

      pollRef.current = setInterval(() => fetchMessages(id), MSG_POLL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [id, getConversation, fetchMessages, markRead])
  );

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || sending || !id) return;
    setSending(true);
    const msgText = text;
    setText('');
    await sendMessage(id, msgText);
    setSending(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleDelete = async (messageId: string) => {
    if (!id) return;
    setDeletingId(messageId);
    await deleteMessage(id, messageId);
    setDeletingId(null);
  };

  const title = convTitle(conversation);
  const avatarUri = conversation?.counterpart?.avatar_url;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.innerContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Feather name="chevron-left" size={22} color={COLORS.text} />
          </Pressable>

          <View style={s.headerCenter}>
            <View style={s.headerAvatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.headerAvatarImg} />
              ) : (
                <>
                  <LinearGradient
                    colors={[COLORS.bubbleMine, '#2563EB']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={s.headerAvatarTxt}>{initialsOf(title)}</Text>
                </>
              )}
            </View>
            <View style={s.headerInfo}>
              <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
              {conversation?.type === 'support' && (
                <View style={s.statusRow}>
                  <View style={s.onlineDot} />
                  <Text style={s.statusText}>Usually replies quickly</Text>
                </View>
              )}
            </View>
          </View>

          <Pressable style={s.moreBtn}>
            <Feather name="more-vertical" size={20} color={COLORS.textSecondary} />
          </Pressable>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <Bubble
              msg={item}
              mine={item.sender_id === user?.id}
              user={user}
              isSuperAdmin={isSuperAdmin}
              onDelete={handleDelete}
              isDeleting={deletingId === item.id}
            />
          )}
          contentContainerStyle={s.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loadingThread ? (
              <View style={s.loadingWrap}>
                <ActivityIndicator color={COLORS.bubbleMine} size="large" />
              </View>
            ) : (
              <View style={s.emptyWrap}>
                <View style={s.emptyIcon}>
                  <LinearGradient
                    colors={[`${COLORS.bubbleMine}20`, `${COLORS.bubbleMine}05`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Feather name="message-circle" size={32} color={COLORS.bubbleMine} />
                </View>
                <Text style={s.emptyTitle}>No messages yet</Text>
                <Text style={s.emptyBody}>Send a message to start the conversation</Text>
              </View>
            )
          }
        />

        {/* Input */}
        <View style={s.inputWrap}>
          <View style={s.inputContainer}>
            <Pressable style={s.emojiBtn}>
              <Feather name="smile" size={22} color={COLORS.textMuted} />
            </Pressable>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textMuted}
              style={s.input}
              multiline
              maxLength={1000}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />

            <Pressable style={s.attachBtn}>
              <Feather name="paperclip" size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  innerContainer: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  headerAvatarTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    zIndex: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  /* Messages */
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  miniAvatarTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    zIndex: 10,
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    gap: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.bubble,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: COLORS.bubbleMine,
    borderBottomRightRadius: 4,
  },
  bubbleSystem: {
    backgroundColor: COLORS.bubbleSystem,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  bubbleDeleted: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bubbleMine,
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextTheirs: {
    color: COLORS.text,
  },
  bubbleTextMine: {
    color: '#fff',
  },
  bubbleTextSystem: {
    color: '#F59E0B',
  },
  deletedTxt: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textMuted,
  },
  bubbleTime: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  bubbleTimeTheirs: {
    color: COLORS.textMuted,
  },
  bubbleTimeMine: {
    color: 'rgba(255,255,255,0.7)',
  },

  /* Input */
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    gap: 12,
  },
  emojiBtn: {
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    fontWeight: '500',
  },
  attachBtn: {
    padding: 4,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bubbleMine,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.bubbleMine,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.bubble,
    opacity: 0.5,
  },

  /* Empty/Loading */
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${COLORS.bubbleMine}30`,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
