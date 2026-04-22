


"use client";

import toast from "react-hot-toast";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useEventStore = create((set, get) => ({
  events: [],
  currentEvent: null,
  dashboard: null,
  loading: false,
  error: null,


fetchEvents: async () => {
    try {
      set({ loading: true, error: null });
      const res = await api.get("/events", { params: { page: 1, limit: 10 } });
      set({ events: res.data.data || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err?.response?.data?.message || err.message });
    }
  },
  createEvent: async (payload) => {
    try {
      set({ loading: true, error: null });

      const res = await api.post("/events", payload);
      const newEvent = res.data?.data;

      set((state) => ({
        events: newEvent ? [newEvent, ...state.events] : state.events,
        loading: false,
      }));

      return newEvent;
    } catch (error) {
      set({
        loading: false,
        error:
          error?.response?.data?.message || "Failed to create event",
      });
      throw error;
    }
  },
  
  updateEvent: async (eventId, payload) => {
    try {
      set({ isLoading: true });
  
      const res = await api.patch(`/events/${eventId}`, payload);
      const updated = res.data.data;
  
      set((state) => ({
        events: state.events.map((e) =>
          e.id === updated.id ? updated : e
        ),
        dashboard: state.dashboard
          ? { ...state.dashboard, event: updated }
          : null,
        currentEvent: updated,
        isLoading: false,
      }));
  
      return { success: true, data: updated };
    } catch (err) {
      set({ isLoading: false });
      return { success: false };
    }
  },



publishEvent: async (id) => {
  try {
    // optimistic
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "PUBLISHED" } : e
      ),
    }));

    await api.post(`/events/${id}/publish`);

    toast.success("Event published 🚀");
  } catch (err) {
    toast.error("Failed to publish");
  }
},

unpublishEvent: async (id) => {
  try {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "DRAFT" } : e
      ),
    }));

    await api.post(`/events/${id}/unpublish`);

    toast.success("Event unpublished");
  } catch (err) {
    toast.error("Failed to unpublish");
  }
},

cancelEvent: async (id) => {
  try {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "CANCELLED" } : e
      ),
    }));

    await api.post(`/events/${id}/cancel`);

    toast.success("Event cancelled ❌");
  } catch (err) {
    toast.error("Cancel failed");
  }
},

archiveEvent: async (id) => {
  try {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "ARCHIVED" } : e
      ),
    }));

    await api.post(`/events/${id}/archive`);

    toast.success("Event archived 📦");
  } catch (err) {
    toast.error("Archive failed");
  }
},

restoreEvent: async (id) => {
  try {
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "DRAFT" } : e
      ),
    }));

    await api.post(`/events/${id}/restore`);

    toast.success("Event restored ✅");
  } catch (err) {
    toast.error("Restore failed");
  }
},

deleteEvent: async (id) => {
  try {
    await api.delete(`/events/${id}`);

    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    }));

    toast.success("Event deleted 🗑️");
  } catch (err) {
    toast.error("Delete failed");
  }
},
    
    duplicateEvent: async (id) => {
      try {
        const res = await api.post(`/events/${id}/duplicate`);
        set((state) => ({ events: [res.data.data, ...state.events] }));
        toast.success("Event duplicated");
      } catch {
        toast.error("Duplicate failed");
      }
    },
  
  
  
  
  fetchEventDashboard: async (eventId) => {
    try {
      set({ loading: true, error: null });

      const res = await api.get(`/events/${eventId}/dashboard`);

      set({
        dashboard: res.data?.data || null,
        currentEvent: res.data?.data?.event || null,
        loading: false,
      });

      return res.data?.data;
    } catch (error) {
      set({
        loading: false,
        error:
          error?.response?.data?.message ||
          "Failed to fetch event dashboard",
      });
      throw error;
    }
  },

  getEventAnalyticsDashboard: async (eventId) => {
    const res = await api.get(`/events/${eventId}/analytics/dashboard`);
    return res.data?.data;
  },

  getEventBuilder: async (eventId) => {
    const res = await api.get(`/events/${eventId}/builder`);
    return res.data?.data;
  },
}));
