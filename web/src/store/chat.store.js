import { create } from 'zustand';

const API = process.env.NEXT_PUBLIC_API_URL;

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function mergeMessages(existing, incoming) {
  const map = new Map();
  for (const m of existing) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, m);
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export const useChatStore = create((set, get) => ({
  conversations: [],
  messagesByConv: {},
  unreadTotal: 0,
  loadingList: false,
  loadingThread: {},

  fetchConversations: async (search) => {
    set({ loadingList: true });
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiCall(`/chat/conversations${q}`);
      const list = res.data ?? [];
      set({ conversations: list });
      if (!search) {
        const total = list.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        set({ unreadTotal: total });
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      set({ loadingList: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await apiCall('/chat/unread-count');
      const total = res.data?.total ?? 0;
      set({ unreadTotal: total });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  getConversation: async (id) => {
    try {
      const res = await apiCall(`/chat/conversations/${id}`);
      const conv = res.data ?? null;
      if (conv) {
        set((s) => {
          const idx = s.conversations.findIndex((c) => c.id === conv.id);
          const next = idx >= 0
            ? s.conversations.map((c) => (c.id === conv.id ? conv : c))
            : [conv, ...s.conversations];
          return { conversations: next };
        });
      }
      return conv;
    } catch {
      return null;
    }
  },

  startDirect: async (recipientId) => {
    try {
      const res = await apiCall('/chat/conversations', {
        method: 'POST',
        body: JSON.stringify({ recipient_id: recipientId }),
      });
      const conv = res.data ?? null;
      if (conv) {
        set((s) => {
          const exists = s.conversations.some((c) => c.id === conv.id);
          return {
            conversations: exists
              ? s.conversations.map((c) => (c.id === conv.id ? conv : c))
              : [conv, ...s.conversations],
          };
        });
      }
      return conv;
    } catch {
      return null;
    }
  },

  openSupport: async () => {
    try {
      const res = await apiCall('/chat/support', { method: 'POST' });
      const conv = res.data ?? null;
      if (conv) {
        set((s) => {
          const exists = s.conversations.some((c) => c.id === conv.id);
          return {
            conversations: exists
              ? s.conversations.map((c) => (c.id === conv.id ? conv : c))
              : [conv, ...s.conversations],
          };
        });
        // Fetch messages to get the auto-reply
        get().fetchMessages(conv.id);
      }
      return conv;
    } catch {
      return null;
    }
  },

  fetchContacts: async (search) => {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiCall(`/chat/contacts${q}`);
      return res.data ?? [];
    } catch {
      return [];
    }
  },

  fetchMessages: async (conversationId) => {
    set((s) => ({ loadingThread: { ...s.loadingThread, [conversationId]: true } }));
    try {
      const res = await apiCall(`/chat/conversations/${conversationId}/messages?limit=30`);
      const msgs = res.data ?? [];
      set((s) => ({ messagesByConv: { ...s.messagesByConv, [conversationId]: msgs } }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      set((s) => ({ loadingThread: { ...s.loadingThread, [conversationId]: false } }));
    }
  },

  loadOlderMessages: async (conversationId) => {
    const current = get().messagesByConv[conversationId] ?? [];
    if (current.length === 0) return false;
    const oldest = current[0];
    try {
      const res = await apiCall(
        `/chat/conversations/${conversationId}/messages?before=${encodeURIComponent(oldest.created_at)}&limit=30`
      );
      const older = res.data ?? [];
      if (older.length === 0) return false;
      set((s) => ({
        messagesByConv: {
          ...s.messagesByConv,
          [conversationId]: mergeMessages(s.messagesByConv[conversationId] ?? [], older),
        },
      }));
      return older.length >= 30;
    } catch {
      return false;
    }
  },

  sendMessage: async (conversationId, body) => {
    const trimmed = body.trim();
    if (!trimmed) return null;
    try {
      const res = await apiCall(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: trimmed }),
      });
      const msg = res.data ?? null;
      if (msg) {
        set((s) => ({
          messagesByConv: {
            ...s.messagesByConv,
            [conversationId]: mergeMessages(s.messagesByConv[conversationId] ?? [], [msg]),
          },
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  last_message_preview: msg.body ?? c.last_message_preview,
                  last_message_at: msg.created_at,
                  last_message_sender: msg.sender_name,
                }
              : c
          ),
        }));
      }
      return msg;
    } catch {
      return null;
    }
  },

  markRead: async (conversationId) => {
    try {
      await apiCall(`/chat/conversations/${conversationId}/read`, { method: 'POST' });
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ),
      }));
      // Recalculate total
      const total = get().conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      set({ unreadTotal: total });
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  },

  sendTyping: async (conversationId) => {
    try {
      await apiCall(`/chat/conversations/${conversationId}/typing`, { method: 'POST' });
    } catch {
      // Silent fail
    }
  },

  deleteMessage: async (conversationId, messageId) => {
    try {
      await apiCall(`/chat/conversations/${conversationId}/messages/${messageId}`, {
        method: 'DELETE',
      });
      // Mark message as deleted in local state
      set((s) => ({
        messagesByConv: {
          ...s.messagesByConv,
          [conversationId]: (s.messagesByConv[conversationId] ?? []).map((m) =>
            m.id === messageId ? { ...m, deleted: true, body: null } : m
          ),
        },
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  },

  deleteConversation: async (conversationId) => {
    try {
      await apiCall(`/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      // Remove conversation from local state
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== conversationId),
        messagesByConv: Object.fromEntries(
          Object.entries(s.messagesByConv).filter(([id]) => id !== conversationId)
        ),
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  },

  deleteAllConversationsWithUser: async (userId) => {
    try {
      const res = await apiCall('/chat/conversations/delete-all-with-user', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      const deleted = res.data?.deleted ?? 0;
      // Refresh conversation list
      await get().fetchConversations();
      return deleted;
    } catch (error) {
      console.error('Failed to delete conversations:', error);
      return 0;
    }
  },

  ingestMessages: (conversationId, msgs) => {
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [conversationId]: mergeMessages(s.messagesByConv[conversationId] ?? [], msgs),
      },
    }));
  },

  reset: () => {
    set({
      conversations: [],
      messagesByConv: {},
      unreadTotal: 0,
      loadingList: false,
      loadingThread: {},
    });
  },
}));
