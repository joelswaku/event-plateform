
"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useGuestStore = create((set, get) => ({
  guests: [],
  guestGroups: [],
  rsvps: [],
  guestDashboard: null,
  selectedGuestIds: [],

  isLoading: false,
  isSubmitting: false,
  error: null,

  /* =========================
     SELECTION
  ========================= */
  toggleGuestSelection: (guestId) => {
    set((state) => {
      const exists = state.selectedGuestIds.includes(guestId);

      return {
        selectedGuestIds: exists
          ? state.selectedGuestIds.filter((id) => id !== guestId)
          : [...state.selectedGuestIds, guestId],
      };
    });
  },

  clearSelection: () => {
    set({ selectedGuestIds: [] });
  },

  selectAllGuests: () => {
    const guests = get().guests || [];
    set({ selectedGuestIds: guests.map((g) => g.id) });
  },

  /* =========================
     GUESTS
  ========================= */
  getGuests: async (eventId) => {
    if (!eventId) return { success: false };

    try {
      set({ isLoading: true, error: null });

      const res = await api.get(`/events/${eventId}/guests`);

      set({
        guests: res.data?.data || [],
        isLoading: false,
      });

      return { success: true, data: res.data?.data || [] };
    } catch (err) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || err.message,
      });
      return { success: false, error: err };
    }
  },

  getGuestById: async (eventId, guestId) => {
    try {
      const res = await api.get(`/events/${eventId}/guests/${guestId}`);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    }
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

      set((state) => ({
        guests: newGuest ? [newGuest, ...state.guests] : state.guests,
        isSubmitting: false,
      }));

      return { success: true, data: newGuest };
    } catch (err) {
      set({
        isSubmitting: false,
        error: err?.response?.data?.message || err.message,
      });
      return { success: false, error: err };
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

      set((state) => ({
        guests: state.guests.map((g) => (g.id === guestId ? updated : g)),
        isSubmitting: false,
      }));

      return { success: true, data: updated };
    } catch (err) {
      set({
        isSubmitting: false,
        error: err?.response?.data?.message || err.message,
      });
      return { success: false, error: err };
    }
  },

  deleteGuest: async (eventId, guestId) => {
    try {
      await api.delete(`/events/${eventId}/guests/${guestId}`);

      set((state) => ({
        guests: state.guests.filter((g) => g.id !== guestId),
        selectedGuestIds: state.selectedGuestIds.filter((id) => id !== guestId),
      }));

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  bulkDeleteGuests: async (eventId, guestIds) => {
    try {
      set({ isSubmitting: true, error: null });

      for (const guestId of guestIds) {
        await api.delete(`/events/${eventId}/guests/${guestId}`);
      }

      set((state) => ({
        guests: state.guests.filter((g) => !guestIds.includes(g.id)),
        selectedGuestIds: [],
        isSubmitting: false,
      }));

      return { success: true };
    } catch (err) {
      set({
        isSubmitting: false,
        error: err?.response?.data?.message || err.message,
      });
      return { success: false, error: err };
    }
  },

  /* =========================
     GUEST GROUPS
  ========================= */
  getGuestGroups: async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/guest-groups`);

      set({
        guestGroups: res.data?.data || [],
      });

      return { success: true, data: res.data?.data || [] };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  createGuestGroup: async (eventId, payload) => {
    try {
      const res = await api.post(`/events/${eventId}/guest-groups`, payload);
      const newGroup = res.data?.data;

      set((state) => ({
        guestGroups: newGroup ? [newGroup, ...state.guestGroups] : state.guestGroups,
      }));

      return { success: true, data: newGroup };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  updateGuestGroup: async (eventId, groupId, payload) => {
    try {
      const res = await api.patch(`/events/${eventId}/guest-groups/${groupId}`, payload);
      const updated = res.data?.data;

      set((state) => ({
        guestGroups: state.guestGroups.map((g) => (g.id === groupId ? updated : g)),
      }));

      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  deleteGuestGroup: async (eventId, groupId) => {
    try {
      await api.delete(`/events/${eventId}/guest-groups/${groupId}`);

      set((state) => ({
        guestGroups: state.guestGroups.filter((g) => g.id !== groupId),
      }));

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /* =========================
     RSVP
  ========================= */
  getRsvps: async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/rsvps`);

      set({
        rsvps: res.data?.data || [],
      });

      return { success: true, data: res.data?.data || [] };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  submitGuestRsvp: async (eventId, payload) => {
    try {
      const res = await api.post(`/events/${eventId}/rsvps`, payload);
      const rsvp = res.data?.data;

      await get().getRsvps(eventId);

      return { success: true, data: rsvp };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  bulkSubmitRsvp: async (eventId, guestIds, rsvpStatus) => {
    try {
      set({ isSubmitting: true, error: null });

      for (const guestId of guestIds) {
        await api.post(`/events/${eventId}/rsvps`, {
          guest_id: guestId,
          rsvp_status: rsvpStatus,
        });
      }

      await get().getRsvps(eventId);

      set({
        isSubmitting: false,
        selectedGuestIds: [],
      });

      return { success: true };
    } catch (err) {
      set({
        isSubmitting: false,
        error: err?.response?.data?.message || err.message,
      });
      return { success: false, error: err };
    }
  },

  /* =========================
     ATTENDANCE
  ========================= */
  markGuestAttendance: async (eventId, payload) => {
    try {
      const res = await api.post(`/events/${eventId}/attendance`, payload);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /* =========================
     QR
  ========================= */
  generateQrPass: async (eventId, guestId) => {
    try {
      const res = await api.post(`/events/${eventId}/guests/${guestId}/qr-pass`);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /* =========================
     INVITATIONS
  ========================= */
  sendGuestInvitation: async (eventId, guestId, payload = {}) => {
    try {
      const res = await api.post(
        `/events/${eventId}/guests/${guestId}/invitations`,
        payload
      );
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  bulkSendInvitations: async (eventId, guestIds, payload = {}) => {
    try {
      set({ isSubmitting: true, error: null });

      for (const guestId of guestIds) {
        await api.post(`/events/${eventId}/guests/${guestId}/invitations`, payload);
      }

      set({
        isSubmitting: false,
        selectedGuestIds: [],
      });

      return { success: true };
    } catch (err) {
      set({
        isSubmitting: false,
        error: err?.response?.data?.message || err.message,
      });
      return { success: false, error: err };
    }
  },

  /* =========================
     CHECK-IN
  ========================= */
  checkInGuestByQr: async (eventId, payload) => {
    try {
      const res = await api.post(`/events/${eventId}/check-in`, payload);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  scannerCheckInGuestByQr: async (eventId, payload) => {
    try {
      const res = await api.post(`/scanner/events/${eventId}/check-in/scan`, payload);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /* =========================
     DASHBOARD
  ========================= */
  getGuestDashboard: async (eventId) => {
    try {
      const res = await api.get(`/events/${eventId}/guest-dashboard`);

      set({
        guestDashboard: res.data?.data || null,
      });

      return { success: true, data: res.data?.data || null };
    } catch (err) {
      return { success: false, error: err };
    }
  },

  /* =========================
     PUBLIC INVITATION / RSVP
  ========================= */
  getInvitationByToken: async (token) => {
    try {
      const res = await api.get(`/public/invitations/${token}`);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    }
  },
  /* =========================
   PUBLIC INVITATION
========================= */

getInvitationByToken: async (token) => {
  try {
    const res = await api.get(`/public/invitations/${token}`);

    return {
      success: true,
      data: res.data?.data,
    };
  } catch (err) {
    return { success: false };
  }
},

submitInvitationRsvp: async (token, payload) => {
  try {
    const res = await api.post(
      `/public/invitations/${token}/rsvp`,
      payload
    );

    return { success: true, data: res.data };
  } catch (err) {
    return { success: false };
  }
},

  submitInvitationRsvp: async (token, payload) => {
    try {
      const res = await api.post(`/public/invitations/${token}/rsvp`, payload);
      return { success: true, data: res.data?.data };
    } catch (err) {
      return { success: false, error: err };
    }
  },
}));












