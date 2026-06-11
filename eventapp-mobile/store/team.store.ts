import { create } from 'zustand';
import api from '@/lib/api';

export interface TeamMember {
  user_id:    string;
  role:       'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'CHECKIN_AGENT' | 'VIEWER';
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
  currentUserRole: string;
}

export interface RolePermissions {
  canEdit:          boolean;
  canDelete:        boolean;
  canManageTeam:    boolean;
  canManageGuests:  boolean;
  canCheckin:       boolean;
  canViewAnalytics: boolean;
  canPublish:       boolean;
}

export interface TeamEvent {
  id:               string;
  title:            string;
  status:           string;
  starts_at_local:  string | null;
  starts_at_utc:    string | null;
  cover_image_url:  string | null;
  event_type:       string;
  allow_rsvp:       boolean;
  allow_ticketing:  boolean;
  allow_donations:  boolean;
  role:             string;
  joined_at:        string;
  owner_name:       string;
  owner_avatar:     string | null;
  permissions?:     RolePermissions;
}

interface TeamState {
  members:      TeamMember[];
  meta:         TeamMeta | null;
  teamEvents:   TeamEvent[];
  isLoading:    boolean;
  isSubmitting: boolean;
  error:        string | null;

  fetchMembers:     (eventId: string) => Promise<{ success: boolean }>;
  inviteMember:     (eventId: string, email: string, name?: string) => Promise<{ success: boolean; type?: string; error?: string; code?: string }>;
  removeMember:     (eventId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
  acceptInvite:     (token: string) => Promise<{ success: boolean; eventId?: string; error?: string }>;
  getInviteInfo:    (token: string) => Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }>;
  fetchMyTeamEvents:() => Promise<void>;
  getMyRole:        (eventId: string) => Promise<{ success: boolean; data?: TeamEvent & { permissions: RolePermissions }; error?: string }>;
  reset:            () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members:      [],
  meta:         null,
  teamEvents:   [],
  isLoading:    false,
  isSubmitting: false,
  error:        null,

  fetchMembers: async (eventId) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get(`/events/${eventId}/team`);
      set({ members: res.data?.data ?? [], meta: res.data?.meta ?? null, isLoading: false });
      return { success: true };
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      return { success: false };
    }
  },

  fetchMyTeamEvents: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.get('/team/my-events');
      set({ teamEvents: res.data?.data ?? [], isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  getMyRole: async (eventId) => {
    try {
      const res = await api.get(`/team/my-role/${eventId}`);
      return { success: true, data: res.data?.data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  inviteMember: async (eventId, email, name) => {
    try {
      set({ isSubmitting: true });
      const res = await api.post(`/events/${eventId}/team/invite`, { email, name });
      set({ isSubmitting: false });
      return { success: true, type: res.data?.type };
    } catch (e: any) {
      set({ isSubmitting: false });
      return { success: false, error: e.response?.data?.message ?? e.message, code: e.response?.data?.code };
    }
  },

  removeMember: async (eventId, memberId) => {
    try {
      await api.delete(`/events/${eventId}/team/${memberId}`);
      set(s => ({ members: s.members.filter(m => m.user_id !== memberId) }));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.response?.data?.message ?? e.message };
    }
  },

  acceptInvite: async (token) => {
    try {
      const res = await api.post(`/team/accept/${token}`, {});
      return { success: true, eventId: res.data?.eventId };
    } catch (e: any) {
      return { success: false, error: e.response?.data?.message ?? e.message };
    }
  },

  getInviteInfo: async (token) => {
    try {
      const res = await api.get(`/team/invite-info/${token}`);
      return { success: true, data: res.data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  reset: () => set({ members: [], meta: null, teamEvents: [], isLoading: false, isSubmitting: false, error: null }),
}));