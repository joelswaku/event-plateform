import { create } from 'zustand';
import api from '@/lib/api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  lastFetchedAt: number | null;

  fetch: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  lastFetchedAt: null,

  fetch: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const { data } = await api.get('/notifications?limit=30');
      if (data.success) {
        set({
          notifications: data.notifications ?? [],
          unreadCount: data.unreadCount ?? 0,
          lastFetchedAt: Date.now(),
        });
      }
    } catch {
      // silent — notifications are non-critical
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
    } catch {}
  },

  markAllRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((s) => ({
        notifications: s.notifications.map((n) => ({
          ...n,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch {}
  },
}));
