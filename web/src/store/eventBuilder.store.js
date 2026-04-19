"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useEventBuilderStore = create((set) => ({
  builder: null,
  isLoading: false,

  /* GET BUILDER */
  fetchBuilder: async (eventId) => {
    const res = await api.get(`/events/${eventId}/builder`);
    set({ builder: res.data.data });
  },

  /* PAGE */
  savePage: async (eventId, payload) => {
    await api.put(`/events/${eventId}/page`, payload);
  },

  /* SECTIONS */
  addSection: async (eventId, payload) => {
    const res = await api.post(`/events/${eventId}/sections`, payload);
    return res.data.data;
  },

  updateSection: async (eventId, sectionId, payload) => {
    await api.patch(`/events/${eventId}/sections/${sectionId}`, payload);
  },

  deleteSection: async (eventId, sectionId) => {
    await api.delete(`/events/${eventId}/sections/${sectionId}`);
  },

  reorderSections: async (eventId, payload) => {
    await api.patch(`/events/${eventId}/sections/reorder`, payload);
  },

  /* PUBLISH PAGE */
  publishPage: async (eventId) => {
    await api.post(`/events/${eventId}/page/publish`);
  },

  unpublishPage: async (eventId) => {
    await api.post(`/events/${eventId}/page/unpublish`);
  },

  /* PREVIEW */
  previewPage: async (eventId) => {
    const res = await api.get(`/events/${eventId}/page/preview`);
    return res.data.data;
  },
}));