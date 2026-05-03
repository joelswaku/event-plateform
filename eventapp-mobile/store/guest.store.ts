import { create } from 'zustand';
import api from '@/lib/api';
import { Guest, GuestDashboard } from '@/types';

interface GuestState {
  guests:    Guest[];
  dashboard: GuestDashboard | null;
  loading:   boolean;
  error:     string | null;

  fetchGuests:    (eventId: string) => Promise<void>;
  fetchDashboard: (eventId: string) => Promise<void>;
  createGuest:    (eventId: string, payload: Partial<Guest>) => Promise<{ success: boolean; guest?: Guest }>;
  updateGuest:    (eventId: string, guestId: string, payload: Partial<Guest>) => Promise<{ success: boolean }>;
  deleteGuest:    (eventId: string, guestId: string) => Promise<{ success: boolean }>;
  sendInvitation: (eventId: string, guestId: string) => Promise<{ success: boolean }>;
  sendQrEmail:    (eventId: string, guestId: string) => Promise<{ success: boolean }>;
  manualCheckIn:  (eventId: string, guestId: string) => Promise<{ success: boolean }>;
}

export const useGuestStore = create<GuestState>((set, get) => ({
  guests:    [],
  dashboard: null,
  loading:   false,
  error:     null,

  fetchGuests: async (eventId) => {
    set({ loading: true });
    try {
      const res = await api.get<{ data: Guest[] }>(`/events/${eventId}/guests`);
      set({ guests: res.data?.data ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchDashboard: async (eventId) => {
    try {
      const res = await api.get<{ data: GuestDashboard }>(`/events/${eventId}/guest-dashboard`);
      set({ dashboard: res.data?.data ?? null });
    } catch { /* non-critical */ }
  },

  createGuest: async (eventId, payload) => {
    try {
      const res   = await api.post<{ data: Guest }>(`/events/${eventId}/guests`, payload);
      const guest = res.data?.data;
      if (guest) set(s => ({ guests: [...s.guests, guest] }));
      return { success: true, guest };
    } catch {
      return { success: false };
    }
  },

  updateGuest: async (eventId, guestId, payload) => {
    try {
      const res   = await api.patch<{ data: Guest }>(`/events/${eventId}/guests/${guestId}`, payload);
      const guest = res.data?.data;
      if (guest) set(s => ({ guests: s.guests.map(g => g.id === guestId ? guest : g) }));
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  deleteGuest: async (eventId, guestId) => {
    const prev = get().guests;
    set(s => ({ guests: s.guests.filter(g => g.id !== guestId) }));
    try {
      await api.delete(`/events/${eventId}/guests/${guestId}`);
      return { success: true };
    } catch {
      set({ guests: prev });
      return { success: false };
    }
  },

  sendInvitation: async (eventId, guestId) => {
    try {
      await api.post(`/events/${eventId}/guests/${guestId}/invitations`);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  sendQrEmail: async (eventId, guestId) => {
    try {
      await api.post(`/events/${eventId}/guests/${guestId}/send-qr`);
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  manualCheckIn: async (eventId, guestId) => {
    try {
      await api.post(`/events/${eventId}/guests/${guestId}/manual-checkin`);
      const now = new Date().toISOString();
      set(s => ({
        guests: s.guests.map(g => g.id === guestId ? { ...g, checked_in_at: now } : g),
      }));
      return { success: true };
    } catch {
      return { success: false };
    }
  },
}));
