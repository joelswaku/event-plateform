"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useTeamStore = create((set, get) => ({
  members:      [],
  meta:         null,
  myEvents:     [],
  isLoading:    false,
  isSubmitting: false,
  error:        null,

  fetchMembers: async (eventId) => {
    if (!eventId) return { success: false };
    try {
      set({ isLoading: true, error: null });
      const res = await api.get(`/events/${eventId}/team`);
      set({ members: res.data?.data ?? [], meta: res.data?.meta ?? null, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false, error: err?.response?.data?.message || err.message });
      return { success: false };
    }
  },

  inviteMember: async (eventId, email, name) => {
    try {
      set({ isSubmitting: true, error: null });
      const res  = await api.post(`/events/${eventId}/team/invite`, { email, name });
      const type = res.data?.type;
      set({ isSubmitting: false });
      return { success: true, type, data: res.data?.data };
    } catch (err) {
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
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  acceptInvite: async (token) => {
    try {
      const res = await api.post(`/team/accept/${token}`);
      return { success: true, eventId: res.data?.eventId };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  getInviteInfo: async (token) => {
    try {
      const res = await api.get(`/team/invite-info/${token}`);
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  /* New user account setup via invite token (called from /team/setup page) */
  setupTeamPassword: async (token, full_name, password) => {
    try {
      const res = await api.post(`/team/setup-password`, { token, full_name, password });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  /* Portal login — verifies email + code, redirects existing users to login, new users to setup */
  portalLogin: async ({ email, code }) => {
    try {
      const res = await api.post(`/team/portal-login`, { email, code });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err?.response?.data?.message || err.message };
    }
  },

  /* Fetch events where logged-in user is an ADMIN team member */
  fetchMyTeamEvents: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get(`/team/my-events`);
      set({ myEvents: res.data?.data ?? [], isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false };
    }
  },
}));
