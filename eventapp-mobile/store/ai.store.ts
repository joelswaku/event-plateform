import { create } from "zustand";
import api from "@/lib/api";

interface AIStore {
  loading: boolean;
  lastResult: any;
  error: string | null;
  clearResult: () => void;
  generatePostEventSummary: (eventId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  analyzeGuestList: (eventId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getPerformancePrediction: (eventId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  generateEmailCopy: (eventId: string, payload: any) => Promise<{ success: boolean; data?: any; error?: string }>;
}

export const useAIStore = create<AIStore>((set) => ({
  loading: false,
  lastResult: null,
  error: null,

  clearResult: () => set({ lastResult: null, error: null }),

  generatePostEventSummary: async (eventId) => {
    try {
      set({ loading: true, error: null });
      const res = await api.post(`/ai/events/${eventId}/post-event-summary`);
      set({ loading: false, lastResult: res.data.data });
      return { success: true, data: res.data.data };
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      const error = err?.response?.data?.message || err.message;
      set({ loading: false, error });
      return { success: false, error };
    }
  },
}));
