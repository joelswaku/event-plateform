import { create } from 'zustand';
import api from '@/lib/api';
import {
  Guest, GuestGroup, GuestRsvp, GuestAttendance, GuestDashboard,
} from '@/types';

interface GuestState {
  guests:           Guest[];
  guestGroups:      GuestGroup[];
  rsvps:            GuestRsvp[];
  attendance:       GuestAttendance[];
  guestDashboard:   GuestDashboard | null;
  /** @deprecated use guestDashboard */
  dashboard:        GuestDashboard | null;
  selectedGuestIds: string[];
  isLoading:        boolean;
  isSubmitting:     boolean;
  error:            string | null;

  // Selection
  toggleGuestSelection: (guestId: string) => void;
  clearSelection:       () => void;
  selectAllGuests:      () => void;

  // Guests
  getGuests:       (eventId: string) => Promise<{ success: boolean; data?: Guest[] }>;
  getGuestById:    (eventId: string, guestId: string) => Promise<{ success: boolean; data?: Guest }>;
  createGuest:     (eventId: string, payload: Partial<Guest>) => Promise<{ success: boolean; data?: Guest; code?: string }>;
  updateGuest:     (eventId: string, guestId: string, payload: Partial<Guest>) => Promise<{ success: boolean }>;
  deleteGuest:     (eventId: string, guestId: string) => Promise<{ success: boolean }>;
  bulkDeleteGuests:(eventId: string, guestIds: string[]) => Promise<{ success: boolean }>;

  // RSVP
  getRsvps:        (eventId: string) => Promise<{ success: boolean; data?: GuestRsvp[] }>;
  submitGuestRsvp: (eventId: string, payload: Record<string, unknown>) => Promise<{ success: boolean }>;
  bulkSubmitRsvp:  (eventId: string, guestIds: string[], rsvpStatus: string) => Promise<{ success: boolean }>;

  // Attendance
  getAttendance:      (eventId: string) => Promise<{ success: boolean }>;
  markGuestAttendance:(eventId: string, payload: Record<string, unknown>) => Promise<{ success: boolean }>;
  manualCheckIn:      (eventId: string, guestId: string) => Promise<{ success: boolean; error?: string }>;

  // QR
  generateQrPass:   (eventId: string, guestId: string) => Promise<{ success: boolean; data?: unknown }>;
  sendQrEmail:      (eventId: string, guestId: string) => Promise<{ success: boolean; error?: string }>;
  checkInGuestByQr: (eventId: string, payload: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown; error?: string }>;

  // Invitations
  sendGuestInvitation:  (eventId: string, guestId: string, payload?: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  bulkSendInvitations:  (eventId: string, guestIds: string[], payload?: Record<string, unknown>) => Promise<{ success: boolean }>;

  // Dashboard
  getGuestDashboard: (eventId: string) => Promise<{ success: boolean; data?: GuestDashboard }>;
  /** @deprecated use getGuests */
  fetchGuests:    (eventId: string) => Promise<void>;
  /** @deprecated use getGuestDashboard */
  fetchDashboard: (eventId: string) => Promise<void>;
  /** @deprecated use sendGuestInvitation */
  sendInvitation: (eventId: string, guestId: string) => Promise<{ success: boolean }>;

  // Public
  getInvitationByToken:  (token: string) => Promise<{ success: boolean; data?: unknown }>;
  submitInvitationRsvp:  (token: string, payload: Record<string, unknown>) => Promise<{ success: boolean; data?: unknown }>;

  // Guest groups (stubs)
  getGuestGroups:    () => Promise<{ success: boolean }>;
  createGuestGroup:  () => Promise<{ success: boolean }>;
  updateGuestGroup:  () => Promise<{ success: boolean }>;
  deleteGuestGroup:  () => Promise<{ success: boolean }>;
}

export const useGuestStore = create<GuestState>((set, get) => ({
  guests:           [],
  guestGroups:      [],
  rsvps:            [],
  attendance:       [],
  guestDashboard:   null,
  dashboard:        null,
  selectedGuestIds: [],
  isLoading:        false,
  isSubmitting:     false,
  error:            null,

  // ── Selection ────────────────────────────────────────────────────────────────
  toggleGuestSelection: (guestId) =>
    set((s) => ({
      selectedGuestIds: s.selectedGuestIds.includes(guestId)
        ? s.selectedGuestIds.filter((id) => id !== guestId)
        : [...s.selectedGuestIds, guestId],
    })),
  clearSelection:  () => set({ selectedGuestIds: [] }),
  selectAllGuests: () => set({ selectedGuestIds: get().guests.map((g) => g.id) }),

  // ── Guests ───────────────────────────────────────────────────────────────────
  getGuests: async (eventId) => {
    if (!eventId) return { success: false };
    try {
      set({ isLoading: true, error: null });
      const res = await api.get<{ data: Guest[] }>(`/events/${eventId}/guests`);
      const incoming = res.data?.data ?? [];
      set((s) => ({
        guests: incoming.map((g) => {
          const local = s.guests.find((lg) => lg.id === g.id);
          // Preserve a locally-confirmed check-in if the API hasn't caught up yet
          return { ...g, checked_in_at: g.checked_in_at ?? local?.checked_in_at ?? null };
        }),
        isLoading: false,
      }));
      return { success: true, data: incoming };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load guests';
      set({ isLoading: false, error: msg });
      return { success: false };
    }
  },

  // alias used by older screens
  fetchGuests: async (eventId: string) => { await get().getGuests(eventId); },

  getGuestById: async (eventId, guestId) => {
    try {
      const res = await api.get<{ data: Guest }>(`/events/${eventId}/guests/${guestId}`);
      const guest = res.data?.data;
      if (guest) {
        set((s) => ({
          guests: s.guests.some((g) => g.id === guestId)
            ? s.guests.map((g) => {
                if (g.id !== guestId) return g;
                // Never overwrite a locally-confirmed check-in with a stale null from a
                // racing GET that started before the POST write was committed to the DB.
                return {
                  ...guest,
                  checked_in_at: guest.checked_in_at ?? g.checked_in_at ?? null,
                };
              })
            : [guest, ...s.guests],
        }));
      }
      return { success: true, data: guest };
    } catch { return { success: false }; }
  },

  createGuest: async (eventId, payload) => {
    try {
      set({ isSubmitting: true, error: null });
      const body = {
        full_name:         (payload.full_name as string)?.trim(),
        email:             (payload.email as string)?.trim() || null,
        phone:             (payload.phone as string)?.trim() || null,
        plus_one_allowed:  payload.plus_one_allowed ?? false,
        plus_one_count:    payload.plus_one_count   ?? 0,
        is_vip:            payload.is_vip           ?? false,
      };
      const res  = await api.post<{ data: Guest }>(`/events/${eventId}/guests`, body);
      const guest = res.data?.data;
      set((s) => ({ guests: guest ? [guest, ...s.guests] : s.guests, isSubmitting: false }));
      return { success: true, data: guest };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; code?: string } } };
      const msg  = e?.response?.data?.message ?? 'Failed to create guest';
      const code = e?.response?.data?.code;
      set({ isSubmitting: false, error: msg });
      return { success: false, code };
    }
  },

  updateGuest: async (eventId, guestId, payload) => {
    try {
      set({ isSubmitting: true, error: null });
      const body = {
        full_name:         (payload.full_name as string)?.trim(),
        email:             (payload.email as string)?.trim() || null,
        phone:             (payload.phone as string)?.trim() || null,
        plus_one_allowed:  payload.plus_one_allowed ?? false,
        plus_one_count:    payload.plus_one_count   ?? 0,
        is_vip:            payload.is_vip           ?? false,
      };
      const res     = await api.patch<{ data: Guest }>(`/events/${eventId}/guests/${guestId}`, body);
      const updated = res.data?.data;
      if (updated) set((s) => ({ guests: s.guests.map((g) => (g.id === guestId ? updated : g)), isSubmitting: false }));
      else set({ isSubmitting: false });
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update guest';
      set({ isSubmitting: false, error: msg });
      return { success: false };
    }
  },

  deleteGuest: async (eventId, guestId) => {
    const prev = get().guests;
    set((s) => ({
      guests:           s.guests.filter((g) => g.id !== guestId),
      selectedGuestIds: s.selectedGuestIds.filter((id) => id !== guestId),
    }));
    try {
      await api.delete(`/events/${eventId}/guests/${guestId}`);
      return { success: true };
    } catch {
      set({ guests: prev });
      return { success: false };
    }
  },

  bulkDeleteGuests: async (eventId, guestIds) => {
    try {
      set({ isSubmitting: true });
      for (const id of guestIds) await api.delete(`/events/${eventId}/guests/${id}`);
      set((s) => ({
        guests:           s.guests.filter((g) => !guestIds.includes(g.id)),
        selectedGuestIds: [],
        isSubmitting:     false,
      }));
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Bulk delete failed';
      set({ isSubmitting: false, error: msg });
      return { success: false };
    }
  },

  // ── RSVP ─────────────────────────────────────────────────────────────────────
  getRsvps: async (eventId) => {
    try {
      const res = await api.get<{ data: GuestRsvp[] }>(`/events/${eventId}/rsvps`);
      set({ rsvps: res.data?.data ?? [] });
      return { success: true, data: res.data?.data ?? [] };
    } catch { return { success: false }; }
  },

  submitGuestRsvp: async (eventId, payload) => {
    try {
      await api.post(`/events/${eventId}/rsvps`, payload);
      await get().getRsvps(eventId);
      return { success: true };
    } catch { return { success: false }; }
  },

  bulkSubmitRsvp: async (eventId, guestIds, rsvpStatus) => {
    try {
      set({ isSubmitting: true });
      for (const guestId of guestIds)
        await api.post(`/events/${eventId}/rsvps`, { guest_id: guestId, rsvp_status: rsvpStatus });
      await get().getRsvps(eventId);
      set({ isSubmitting: false, selectedGuestIds: [] });
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Bulk RSVP failed';
      set({ isSubmitting: false, error: msg });
      return { success: false };
    }
  },

  // ── Attendance ────────────────────────────────────────────────────────────────
  getAttendance: async (eventId) => {
    try {
      const res = await api.get<{ data: GuestAttendance[] }>(`/events/${eventId}/attendance`);
      const raw = res.data?.data ?? [];
      const checkinMap = new Map<string, string>();
      for (const a of raw) {
        const t = a.marked_at ?? a.checked_in_at;
        if (t && a.attendance_status === 'CHECKED_IN') {
          checkinMap.set(a.guest_id, t);
        }
      }
      set((s) => ({
        attendance: raw,
        guests: s.guests.map((g) => ({
          ...g,
          checked_in_at: checkinMap.get(g.id) ?? g.checked_in_at ?? null,
        })),
      }));
      return { success: true };
    } catch { return { success: false }; }
  },

  markGuestAttendance: async (eventId, payload) => {
    try {
      await api.post(`/events/${eventId}/attendance`, payload);
      return { success: true };
    } catch { return { success: false }; }
  },

  manualCheckIn: async (eventId, guestId) => {
    try {
      await api.post(`/events/${eventId}/guests/${guestId}/manual-checkin`);
      const now = new Date().toISOString();
      set((s) => ({
        guests:     s.guests.map((g) => g.id === guestId ? { ...g, checked_in_at: now } : g),
        attendance: [...s.attendance, { id: '', guest_id: guestId, event_id: eventId, checked_in_at: now, checked_in_by: null }],
      }));
      return { success: true };
    } catch (err: unknown) {
      const error = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Check-in failed';
      return { success: false, error };
    }
  },

  // ── QR ───────────────────────────────────────────────────────────────────────
  generateQrPass: async (eventId, guestId) => {
    try {
      const res = await api.post(`/events/${eventId}/guests/${guestId}/qr-pass`);
      return { success: true, data: res.data?.data };
    } catch { return { success: false }; }
  },

  sendQrEmail: async (eventId, guestId) => {
    try {
      await api.post(`/events/${eventId}/guests/${guestId}/send-qr`);
      return { success: true };
    } catch (err: unknown) {
      const error = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send QR email';
      return { success: false, error };
    }
  },

  checkInGuestByQr: async (eventId, payload) => {
    try {
      const res = await api.post(`/events/${eventId}/check-in`, payload);
      await get().getAttendance(eventId);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const error = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'QR check-in failed';
      return { success: false, error };
    }
  },

  // ── Invitations ───────────────────────────────────────────────────────────────
  sendGuestInvitation: async (eventId, guestId, payload = {}) => {
    try {
      await api.post(`/events/${eventId}/guests/${guestId}/invitations`, payload);
      return { success: true };
    } catch (err: unknown) {
      const error = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send invitation';
      return { success: false, error };
    }
  },

  // alias used by older screens
  sendInvitation: async (eventId: string, guestId: string) => {
    const result = await get().sendGuestInvitation(eventId, guestId);
    return result;
  },

  bulkSendInvitations: async (eventId, guestIds, payload = {}) => {
    try {
      set({ isSubmitting: true });
      for (const guestId of guestIds)
        await api.post(`/events/${eventId}/guests/${guestId}/invitations`, payload);
      set({ isSubmitting: false, selectedGuestIds: [] });
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Bulk invite failed';
      set({ isSubmitting: false, error: msg });
      return { success: false };
    }
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  getGuestDashboard: async (eventId) => {
    try {
      const res  = await api.get<{ data: GuestDashboard }>(`/events/${eventId}/guest-dashboard`);
      const data = res.data?.data ?? null;
      set({ guestDashboard: data, dashboard: data });
      return { success: true, data: data ?? undefined };
    } catch { return { success: false }; }
  },

  // alias used by older screens
  fetchDashboard: async (eventId: string) => { await get().getGuestDashboard(eventId); },

  // ── Public ────────────────────────────────────────────────────────────────────
  getInvitationByToken: async (token) => {
    try {
      const res = await api.get(`/public/invitations/${token}`);
      return { success: true, data: res.data?.data };
    } catch { return { success: false }; }
  },

  submitInvitationRsvp: async (token, payload) => {
    try {
      const res = await api.post(`/public/invitations/${token}/rsvp`, payload);
      return { success: true, data: res.data?.data };
    } catch { return { success: false }; }
  },

  // ── Guest groups (stubs) ──────────────────────────────────────────────────────
  getGuestGroups:   async () => ({ success: false }),
  createGuestGroup: async () => ({ success: false }),
  updateGuestGroup: async () => ({ success: false }),
  deleteGuestGroup: async () => ({ success: false }),
}));
