import { create } from 'zustand';
import api from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────────────── */
export interface ChatCounterpart {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_super_admin?: boolean;
}

export interface ChatContact {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_super_admin?: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'support' | string;
  title: string | null;
  counterpart: ChatCounterpart | null;
  participants: ChatCounterpart[];
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender: string | null;
  unread_count: number;
  muted: boolean;
  archived: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  kind: string | null;
  created_at: string;
  edited_at: string | null;
  deleted: boolean;
}

interface ChatState {
  conversations:    Conversation[];
  messagesByConv:   Record<string, Message[]>;
  unreadTotal:      number;
  loadingList:      boolean;
  loadingThread:    Record<string, boolean>;
  typingByConv:     Record<string, number>; // conversation_id → timestamp of last typing event

  // List
  fetchConversations: (search?: string) => Promise<void>;
  fetchUnreadCount:   () => Promise<void>;
  getConversation:    (id: string) => Promise<Conversation | null>;
  startDirect:        (recipientId: string) => Promise<Conversation | null>;
  openSupport:        () => Promise<Conversation | null>;
  fetchContacts:      (search?: string) => Promise<ChatContact[]>;

  // Thread
  fetchMessages:      (conversationId: string) => Promise<void>;
  loadOlderMessages:  (conversationId: string) => Promise<boolean>; // returns hasMore
  sendMessage:        (conversationId: string, body: string) => Promise<Message | null>;
  deleteMessage:      (conversationId: string, messageId: string) => Promise<boolean>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  deleteAllConversationsWithUser: (userId: string) => Promise<number>;
  markRead:           (conversationId: string) => Promise<void>;
  sendTyping:         (conversationId: string) => Promise<void>;

  // Realtime ingestion (used by polling diff)
  ingestMessages:     (conversationId: string, msgs: Message[]) => void;

  reset: () => void;
}

const PAGE = 30;

function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const map = new Map<string, Message>();
  for (const m of existing) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations:  [],
  messagesByConv: {},
  unreadTotal:    0,
  loadingList:    false,
  loadingThread:  {},
  typingByConv:   {},

  fetchConversations: async (search) => {
    set({ loadingList: true });
    try {
      const q   = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get<{ success: boolean; data: Conversation[] }>(`/chat/conversations${q}`);
      const list = res.data?.data ?? [];
      set({ conversations: list });
      // Keep unread total in sync with the list when no search filter applied
      if (!search) {
        const total = list.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        set({ unreadTotal: total });
      }
    } catch { /* non-critical */ } finally {
      set({ loadingList: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await api.get<{ success: boolean; data: { total: number } }>('/chat/unread-count');
      const total = res.data?.data?.total ?? 0;
      set({ unreadTotal: total });
    } catch {
      // Silent fail - non-critical
    }
  },

  getConversation: async (id) => {
    try {
      const res = await api.get<{ success: boolean; data: Conversation }>(`/chat/conversations/${id}`);
      const conv = res.data?.data ?? null;
      if (conv) {
        set(s => {
          const idx = s.conversations.findIndex(c => c.id === conv.id);
          const next = idx >= 0
            ? s.conversations.map(c => (c.id === conv.id ? conv : c))
            : [conv, ...s.conversations];
          return { conversations: next };
        });
      }
      return conv;
    } catch { return null; }
  },

  startDirect: async (recipientId) => {
    try {
      const res = await api.post<{ success: boolean; data: Conversation }>('/chat/conversations', {
        recipient_id: recipientId,
      });
      const conv = res.data?.data ?? null;
      if (conv) {
        set(s => {
          const exists = s.conversations.some(c => c.id === conv.id);
          return { conversations: exists ? s.conversations.map(c => c.id === conv.id ? conv : c) : [conv, ...s.conversations] };
        });
      }
      return conv;
    } catch { return null; }
  },

  openSupport: async () => {
    try {
      const res  = await api.post<{ success: boolean; data: Conversation }>('/chat/support');
      const conv = res.data?.data ?? null;
      if (conv) {
        set(s => {
          const exists = s.conversations.some(c => c.id === conv.id);
          return {
            conversations: exists
              ? s.conversations.map(c => (c.id === conv.id ? conv : c))
              : [conv, ...s.conversations],
          };
        });

        // Fetch messages to get the auto-reply
        get().fetchMessages(conv.id);
      }
      return conv;
    } catch { return null; }
  },

  fetchContacts: async (search) => {
    try {
      const q   = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get<{ success: boolean; data: ChatContact[] }>(`/chat/contacts${q}`);
      return res.data?.data ?? [];
    } catch { return []; }
  },

  fetchMessages: async (conversationId) => {
    set(s => ({ loadingThread: { ...s.loadingThread, [conversationId]: true } }));
    try {
      const res = await api.get<{ success: boolean; data: Message[] }>(
        `/chat/conversations/${conversationId}/messages?limit=${PAGE}`
      );
      const msgs = res.data?.data ?? [];
      set(s => ({ messagesByConv: { ...s.messagesByConv, [conversationId]: msgs } }));
    } catch { /* non-critical */ } finally {
      set(s => ({ loadingThread: { ...s.loadingThread, [conversationId]: false } }));
    }
  },

  loadOlderMessages: async (conversationId) => {
    const current = get().messagesByConv[conversationId] ?? [];
    if (current.length === 0) return false;
    const oldest = current[0];
    try {
      const res = await api.get<{ success: boolean; data: Message[] }>(
        `/chat/conversations/${conversationId}/messages?before=${encodeURIComponent(oldest.created_at)}&limit=${PAGE}`
      );
      const older = res.data?.data ?? [];
      if (older.length === 0) return false;
      set(s => ({
        messagesByConv: {
          ...s.messagesByConv,
          [conversationId]: mergeMessages(s.messagesByConv[conversationId] ?? [], older),
        },
      }));
      return older.length >= PAGE;
    } catch { return false; }
  },

  sendMessage: async (conversationId, body) => {
    const trimmed = body.trim();
    if (!trimmed) return null;
    try {
      const res = await api.post<{ success: boolean; data: Message }>(
        `/chat/conversations/${conversationId}/messages`,
        { body: trimmed }
      );
      const msg = res.data?.data ?? null;
      if (msg) {
        set(s => ({
          messagesByConv: {
            ...s.messagesByConv,
            [conversationId]: mergeMessages(s.messagesByConv[conversationId] ?? [], [msg]),
          },
          conversations: s.conversations.map(c =>
            c.id === conversationId
              ? {
                  ...c,
                  last_message_preview: msg.body ?? c.last_message_preview,
                  last_message_at:      msg.created_at,
                  last_message_sender:  msg.sender_name,
                }
              : c
          ),
        }));

        // Check if this is a support conversation and if it's the first user message
        const conv = get().conversations.find(c => c.id === conversationId);
        const messages = get().messagesByConv[conversationId] ?? [];
        const userMessages = messages.filter(m => m.sender_id !== 'system');

        // If this is the first user message in a support conversation, fetch to get auto-reply
        if (conv?.type === 'support' && userMessages.length <= 1) {
          // Wait a bit for backend to create auto-reply, then fetch
          setTimeout(() => {
            get().fetchMessages(conversationId);
          }, 500);
        }
      }
      return msg;
    } catch { return null; }
  },

  markRead: async (conversationId) => {
    try {
      await api.post(`/chat/conversations/${conversationId}/read`);
      set(s => {
        const conv  = s.conversations.find(c => c.id === conversationId);
        const delta = conv?.unread_count ?? 0;
        return {
          conversations: s.conversations.map(c =>
            c.id === conversationId ? { ...c, unread_count: 0 } : c
          ),
          unreadTotal: Math.max(0, s.unreadTotal - delta),
        };
      });
    } catch { /* silent */ }
  },

  sendTyping: async (conversationId) => {
    try { await api.post(`/chat/conversations/${conversationId}/typing`); } catch { /* silent */ }
  },

  deleteMessage: async (conversationId, messageId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`);
      // Mark message as deleted in local state
      set(s => ({
        messagesByConv: {
          ...s.messagesByConv,
          [conversationId]: (s.messagesByConv[conversationId] ?? []).map(m =>
            m.id === messageId ? { ...m, deleted: true, body: null } : m
          ),
        },
      }));
      return true;
    } catch {
      return false;
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      // Remove conversation from local state
      set(s => ({
        conversations: s.conversations.filter(c => c.id !== conversationId),
        messagesByConv: Object.fromEntries(
          Object.entries(s.messagesByConv).filter(([id]) => id !== conversationId)
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },

  deleteAllConversationsWithUser: async (userId) => {
    try {
      const res = await api.post('/chat/conversations/delete-all-with-user', { userId });
      const deleted = res.data?.deleted ?? 0;
      // Refresh conversation list
      await get().fetchConversations();
      return deleted;
    } catch {
      return 0;
    }
  },

  ingestMessages: (conversationId, msgs) => {
    if (!msgs.length) return;
    set(s => ({
      messagesByConv: {
        ...s.messagesByConv,
        [conversationId]: mergeMessages(s.messagesByConv[conversationId] ?? [], msgs),
      },
    }));
  },

  reset: () => set({
    conversations: [], messagesByConv: {}, unreadTotal: 0,
    loadingList: false, loadingThread: {}, typingByConv: {},
  }),
}));
