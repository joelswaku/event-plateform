import { create } from 'zustand';
import api from '@/lib/api';

export interface TeamMember {
  user_id:    string;
  role:       'OWNER' | 'ADMIN';
  joined_at:  string;
  full_name:  string;
  email:      string;
  avatar_url: string | null;
}

export interface TeamMeta {
  plan:            string;
  maxTotal:        number | null;
  maxAdmins:       number | null;
  current:         number;
  currentUserRole: 'OWNER' | 'ADMIN' | string;
}

interface TeamState {
  members:      TeamMember[];
  meta:         TeamMeta | null;
  isLoading:    boolean;
  isSubmitting: boolean;
  error:        string | null;

  fetchMembers:  (eventId: string) => Promise<{ success: boolean }>;
  inviteMember:  (eventId: string, email: string, name?: string) => Promise<{ success: boolean; type?: string; error?: string; code?: string }>;
  removeMember:  (eventId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
  acceptInvite:  (token: string) => Promise<{ success: boolean; eventId?: string; error?: string }>;
  getInviteInfo: (token: string) => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>;
  reset:         () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members:      [],
  meta:         null,
  isLoading:    false,
  isSubmitting: false,
  error:        null,

  fetchMembers: async (eventId) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get(`/events/${eventId}/team`);
      set({
        members:   res.data?.data    ?? [],
        meta:      res.data?.meta    ?? null,
        isLoading: false,
      });
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  inviteMember: async (eventId, email, name) => {
    try {
      set({ isSubmitting: true, error: null });
      const res    = await api.post(`/events/${eventId}/team/invite`, { email, name });
      const member = res.data?.data as TeamMember | undefined;
      const type   = res.data?.type as string | undefined;
      if (member && type === 'added') set((s) => ({ members: [...s.members, member], isSubmitting: false }));
      else                            set({ isSubmitting: false });
      return { success: true, type };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      set({ isSubmitting: false, error: msg });
      return { success: false, error: msg, code: err?.response?.data?.code };
    }
  },

  removeMember: async (eventId, memberId) => {
    try {
      await api.delete(`/events/${eventId}/team/${memberId}`);
      set((s) => ({ members: s.members.filter((m) => m.user_id !== memberId) }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  acceptInvite: async (token) => {
    try {
      const res = await api.post(`/team/accept/${token}`);
      return { success: true, eventId: res.data?.eventId };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  getInviteInfo: async (token) => {
    try {
      const res = await api.get(`/team/invite-info/${token}`);
      return { success: true, data: res.data };
    } catch (err: any) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  reset: () => set({ members: [], meta: null, isLoading: false, isSubmitting: false, error: null }),
}));
