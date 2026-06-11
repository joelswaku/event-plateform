"use client";
import { create } from "zustand";
import { api } from "@/lib/api";

export const useAIStore = create((set, get) => ({
  loading: false,
  streaming: false,
  streamedText: "",
  lastResult: null,
  error: null,

  clearResult: () => set({ lastResult: null, error: null }),

  generateEventContent: async (eventId, payload) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/generate-content`, payload);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  generateBuilderPage: async (eventId, payload) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/generate-page`, payload);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  generateTicketPricing: async (eventId, payload) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/generate-ticket-pricing`, payload);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  analyzeGuestList: async (eventId) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/analyze-guests`);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  generateSeating: async (eventId, payload) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/generate-seating`, payload);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  generatePostEventSummary: async (eventId) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/post-event-summary`);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  generateEmailCopy: async (eventId, payload) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/generate-email`, payload);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  generateRsvpForm: async (eventId, payload) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/generate-rsvp-form`, payload);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  getPerformancePrediction: async (eventId) => {
    try {
      set({ loading: true, error: null });
      const res = await api.get(`/ai/events/${eventId}/performance-prediction`);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },
}));
