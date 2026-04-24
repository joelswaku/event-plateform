"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useGuestStore = create((set, get) => ({
  guests: [],
  guestGroups: [],
  rsvps: [],
  attendance: [],
  guestDashboard: null,
  selectedGuestIds: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  /* ── Selection ── */
  toggleGuestSelection: (guestId) =>
    set((s) => ({
      selectedGuestIds: s.selectedGuestIds.includes(guestId)
        ? s.selectedGuestIds.filter((id) => id !== guestId)
        : [...s.selectedGuestIds, guestId],
    })),
  clearSelection: () => set({ selectedGuestIds: [] }),
  selectAllGuests: () => set({ selectedGuestIds: get().guests.map((g) => g.id) }),

  /* ── Guests ── */
  getGuests: async (eventId) => {
    if (!eventId) return { success: false };
    try {
      set({ isLoading: true, error: null });
      const res = await api.get(`/events/${eventId}/guests`);
      set({ guests: res.data?.data || [], isLoading: false });
      return { success: true, data: res.data?.data || [] };
    } catch (err) {
      set({ isLoading: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  getGuestById: async (eventId, guestId) => {
    try {
      const res = await api.get(`/events/${eventId}/guests/${guestId}`);
      return { success: true, data: res.data?.data };
    } catch { return { success: false }; }
  },

  createGuest: async (eventId, payload) => {
    try {
      set({ isSubmitting: true, error: null });
      const body = {
        full_name: payload.full_name?.trim(),
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        plus_one_allowed: payload.plus_one_allowed ?? false,
        plus_one_count: payload.plus_one_count ?? 0,
        is_vip: payload.is_vip ?? false,
      };
      const res = await api.post(`/events/${eventId}/guests`, body);
      const newGuest = res.data?.data;
      set((s) => ({ guests: newGuest ? [newGuest, ...s.guests] : s.guests, isSubmitting: false }));
      return { success: true, data: newGuest };
    } catch (err) {
      set({ isSubmitting: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  updateGuest: async (eventId, guestId, payload) => {
    try {
      set({ isSubmitting: true, error: null });
      const body = {
        full_name: payload.full_name?.trim(),
        email: payload.email?.trim() || null,
        phone: payload.phone?.trim() || null,
        plus_one_allowed: payload.plus_one_allowed ?? false,
        plus_one_count: payload.plus_one_count ?? 0,
        is_vip: payload.is_vip ?? false,
      };
      const res = await api.patch(`/events/${eventId}/guests/${guestId}`, body);
      const updated = res.data?.data;
      set((s) => ({ guests: s.guests.map((g) => (g.id === guestId ? updated : g)), isSubmitting: false }));
      return { success: true, data: updated };
    } catch (err) {
      set({ isSubmitting: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  deleteGuest: async (eventId, guestId) => {
    try {
      await api.delete(`/events/${eventId}/guests/${guestId}`);
      set((s) => ({
        guests: s.guests.filter((g) => g.id !== guestId),
        selectedGuestIds: s.selectedGuestIds.filter((id) => id !== guestId),
      }));
      return { success: true };
    } catch { return { success: false }; }
  },

  bulkDeleteGuests: async (eventId, guestIds) => {
    try {
      set({ isSubmitting: true });
      for (const guestId of guestIds) await api.delete(`/events/${eventId}/guests/${guestId}`);
      set((s) => ({
        guests: s.guests.filter((g) => !guestIds.includes(g.id)),
        selectedGuestIds: [],
        isSubmitting: false,
      }));
      return { success: true };
    } catch (err) {
      set({ isSubmitting: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  /* ── RSVP ── */
  getRsvps: async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/rsvps`);
      set({ rsvps: res.data?.data || [] });
      return { success: true, data: res.data?.data || [] };
    } catch { return { success: false }; }
  },

  submitGuestRsvp: async (eventId, payload) => {
    try {
      const res = await api.post(`/events/${eventId}/rsvps`, payload);
      await get().getRsvps(eventId);
      return { success: true, data: res.data?.data };
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
    } catch (err) {
      set({ isSubmitting: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  /* ── Attendance ── */
  getAttendance: async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/attendance`);
      set({ attendance: res.data?.data || [] });
      return { success: true, data: res.data?.data || [] };
    } catch { return { success: false }; }
  },

  markGuestAttendance: async (eventId, payload) => {
    try {
      const res = await api.post(`/events/${eventId}/attendance`, payload);
      return { success: true, data: res.data?.data };
    } catch { return { success: false }; }
  },

  manualCheckIn: async (eventId, guestId) => {
    try {
      const res = await api.post(`/events/${eventId}/guests/${guestId}/manual-checkin`);
      await get().getAttendance(eventId);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  /* ── QR ── */
  generateQrPass: async (eventId, guestId) => {
    try {
      const res = await api.post(`/events/${eventId}/guests/${guestId}/qr-pass`);
      return { success: true, data: res.data?.data };
    } catch { return { success: false }; }
  },

  sendQrEmail: async (eventId, guestId) => {
    try {
      const res = await api.post(`/events/${eventId}/guests/${guestId}/send-qr`);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  checkInGuestByQr: async (eventId, payload) => {
    try {
      const res = await api.post(`/events/${eventId}/check-in`, payload);
      await get().getAttendance(eventId);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  /* ── Invitations ── */
  sendGuestInvitation: async (eventId, guestId, payload = {}) => {
    try {
      const res = await api.post(`/events/${eventId}/guests/${guestId}/invitations`, payload);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  bulkSendInvitations: async (eventId, guestIds, payload = {}) => {
    try {
      set({ isSubmitting: true });
      for (const guestId of guestIds)
        await api.post(`/events/${eventId}/guests/${guestId}/invitations`, payload);
      set({ isSubmitting: false, selectedGuestIds: [] });
      return { success: true };
    } catch (err) {
      set({ isSubmitting: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  /* ── Dashboard ── */
  getGuestDashboard: async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/guest-dashboard`);
      set({ guestDashboard: res.data?.data || null });
      return { success: true, data: res.data?.data || null };
    } catch { return { success: false }; }
  },

  /* ── Public ── */
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

  /* ── Guest Groups (stubs) ── */
  getGuestGroups: async () => ({ success: false }),
  createGuestGroup: async () => ({ success: false }),
  updateGuestGroup: async () => ({ success: false }),
  deleteGuestGroup: async () => ({ success: false }),
}));
