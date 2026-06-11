import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore, Conversation, Message } from '@/store/chat.store';

const MSG_POLL_MS = 3000;
const TYPING_THROTTLE_MS = 2500;

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

/* ─── Small avatar for group sender ──────────────────────────────────── */
function MiniAvatar({ uri, name }: { uri: string | null; name: string }) {
  if (uri) return <Image source={{ uri }} style={s.miniAvatar} />;
  return (
    <View style={s.miniAvatar}>
      <LinearGradient
        colors={[Colors.accent.indigo, Colors.accent.violet]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <Text style={s.miniAvatarTxt}>{initialsOf(name)}</Text>
    </View>
  );
}

/* ─── Message bubble ─────────────────────────────────────────────────── */
function Bubble({ msg, mine, isGroup }: { msg: Message; mine: boolean; isGroup: boolean }) {
  if (msg.deleted) {
    return (
      <View style={[s.bubbleRow, mine ? s.rowMine : s.rowTheirs]}>
        <View style={[s.bubble, s.bubbleDeleted]}>
          <Text style={s.deletedTxt}>Message deleted</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[s.bubbleRow, mine ? s.rowMine : s.rowTheirs]}>
      {!mine && isGroup && <MiniAvatar uri={msg.sender_avatar} name={msg.sender_name} />}
      <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
        {!mine && isGroup && <Text style={s.senderName}>{msg.sender_name}</Text>}
        {msg.attachment_url && (
          <Image source={{ uri: msg.attachment_url }} style={s.attachment} resizeMode="cover" />
        )}
        {msg.body ? (
          <Text style={[s.bubbleTxt, mine ? s.bubbleTxtMine : s.bubbleTxtTheirs]}>{msg.body}</Text>
        ) : null}
        <Text style={[s.timeTxt, mine ? s.timeMine : s.timeTheirs]}>
          {fmtTime(msg.created_at)}{msg.edited_at ? ' · edited' : ''}
        </Text>
      </View>
    </View>
  );
}

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = String(id);
  const navigation = useNavigation();
  const router = useRouter();

  const userId = useAuthStore(s => s.user?.id);

  const messages       = useChatStore(s => s.messagesByConv[conversationId]);
  const loadingThread  = useChatStore(s => s.loadingThread[conversationId]);
  const conversations  = useChatStore(s => s.conversations);
  const fetchMessages  = useChatStore(s => s.fetchMessages);
  const loadOlder      = useChatStore(s => s.loadOlderMessages);
  const sendMessage    = useChatStore(s => s.sendMessage);
  const markRead       = useChatStore(s => s.markRead);
  const sendTyping     = useChatStore(s => s.sendTyping);
  const getConversation = useChatStore(s => s.getConversation);

  const [conv,        setConv]        = useState<Conversation | null>(
    () => conversations.find(c => c.id === conversationId) ?? null
  );
  const [text,        setText]        = useState('');
  const [sending,     setSending]     = useState(false);
  const [hasMore,     setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTypingSent = useRef(0);
  const typingTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef       = useRef<FlatList<Message>>(null);

  const msgs = messages ?? [];
  const isGroup = conv?.type === 'group' || (!conv?.counterpart && (conv?.participants?.length ?? 0) > 1);

  // Header title with back button
  useEffect(() => {
    navigation.setOptions({
      title: convTitle(conv),
      headerShown: true,
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/profile/support' as never);
            }
          }}
          style={{ marginRight: 12, padding: 4 }}
          hitSlop={10}
        >
          <Feather name="chevron-left" size={26} color={Colors.accent.indigo} />
        </Pressable>
      ),
    });
  }, [conv, navigation, router]);

  // Load conversation meta if not already cached
  useEffect(() => {
    let active = true;
    (async () => {
      const c = await getConversation(conversationId);
      if (active && c) setConv(c);
    })();
    return () => { active = false; };
  }, [conversationId, getConversation]);

  // Initial load + mark read + poll while focused
  useFocusEffect(
    useCallback(() => {
      fetchMessages(conversationId).then(() => markRead(conversationId));

      pollRef.current = setInterval(async () => {
        await fetchMessages(conversationId);
        await markRead(conversationId);
      }, MSG_POLL_MS);

      return () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        if (typingTimer.current) { clearTimeout(typingTimer.current); typingTimer.current = null; }
      };
    }, [conversationId, fetchMessages, markRead])
  );

  const handleLoadOlder = useCallback(async () => {
    if (loadingMore || !hasMore || msgs.length === 0) return;
    setLoadingMore(true);
    const more = await loadOlder(conversationId);
    setHasMore(more);
    setLoadingMore(false);
  }, [loadingMore, hasMore, msgs.length, loadOlder, conversationId]);

  const handleChangeText = useCallback((t: string) => {
    setText(t);
    const now = Date.now();
    if (now - lastTypingSent.current > TYPING_THROTTLE_MS) {
      lastTypingSent.current = now;
      sendTyping(conversationId);
    }
  }, [conversationId, sendTyping]);

  const handleSend = useCallback(async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    const sent = await sendMessage(conversationId, body);
    setSending(false);
    if (!sent) setText(body); // restore on failure
  }, [text, sending, sendMessage, conversationId]);

  // Inverted list shows newest at bottom; pass reversed data
  const reversed = useMemo(() => [...msgs].reverse(), [msgs]);

  return (
    <View style={s.container}>
      <KeyboardAvoidingView
        style={s.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={s.chatArea}>
          {loadingThread && msgs.length === 0 ? (
            <View style={s.loadingContainer}>
              <ActivityIndicator color={Colors.accent.indigo} size="large" />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={reversed}
              inverted
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <Bubble msg={item} mine={item.sender_id === userId} isGroup={isGroup} />
              )}
              contentContainerStyle={msgs.length === 0 ? s.emptyContainer : s.listContent}
              onEndReached={handleLoadOlder}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                loadingMore ? (
                  <View style={s.loadingMore}>
                    <ActivityIndicator color={Colors.accent.indigo} size="small" />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={s.emptyWrap}>
                  <View style={s.emptyIcon}>
                    <Feather name="message-circle" size={32} color={Colors.accent.indigo} />
                  </View>
                  <Text style={s.emptyTitle}>No messages yet</Text>
                  <Text style={s.emptyBody}>Say hello to start the conversation.</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Composer */}
        <View style={s.composerContainer}>
          <View style={s.composer}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={handleChangeText}
              placeholder="Type a message…"
              placeholderTextColor={Colors.text.subtle}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleSend}
              disabled={!text.trim() || sending}
              style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <Feather name="send" size={18} color="#fff" />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  keyboardView: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg.primary,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
    gap: 8,
  },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: Colors.accent.indigo,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderBottomLeftRadius: 6,
  },
  bubbleDeleted: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  deletedTxt: {
    fontSize: 13,
    color: Colors.text.subtle,
    fontStyle: 'italic',
  },

  senderName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accent.violet,
    marginBottom: 3,
  },

  bubbleTxt: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTxtMine: { color: '#fff' },
  bubbleTxtTheirs: { color: Colors.text.primary },

  attachment: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },

  timeTxt: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeMine: { color: 'rgba(255,255,255,0.6)' },
  timeTheirs: { color: Colors.text.subtle },

  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.bg.elevated,
    marginBottom: 2,
  },
  miniAvatarTxt: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },

  composerContainer: {
    backgroundColor: Colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.DEFAULT,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: Colors.text.primary,
    fontSize: 15,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.indigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: { opacity: 0.4 },

  emptyWrap: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.accent.indigo}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
