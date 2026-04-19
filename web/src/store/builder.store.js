

//fird one work 
"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

const SECTION_TEMPLATES = {
  HERO: { title: "Welcome to our event" },
  ABOUT: { title: "About Event" },
  SCHEDULE: { title: "Event Schedule" },
  GALLERY: { title: "Gallery" },
  FAQ: { title: "FAQ" },
  CTA: { title: "Call To Action" },

  SPEAKERS: { title: "Speakers" },
  TICKETS: { title: "Tickets" },
  VENUE: { title: "Venue" },
  COUNTDOWN: { title: "Countdown" },
  DONATIONS: { title: "Donations" },
  REGISTRY: { title: "Registry" },
  STORY: { title: "Our Story" },
  COUPLE: { title: "The Couple" },
};

export const useBuilderStore = create((set, get) => ({
  builder: null,
  isLoading: false,
  isSaving: false,

  fetchBuilder: async (eventId) => {
    try {
      set({ isLoading: true });
      const res = await api.get(`/builder/events/${eventId}/builder`);
      set({ builder: res.data?.data || null, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to load builder");
    }
  },

  createSectionFromTemplate: async (eventId, templateKey) => {
    try {
      set({ isSaving: true });
      const res = await api.post(`/builder/events/${eventId}/sections`, {
        template_key: templateKey,
      });
      const newSection = res.data?.data;
      set((state) => ({
        builder: {
          ...state.builder,
          sections: [...(state.builder?.sections || []), newSection],
        },
        isSaving: false,
      }));
      return newSection;
    } catch (error) {
      set({ isSaving: false });
      toast.error("Failed to add section");
    }
  },



  updateSection: async (eventId, sectionId, payload) => {
    try {
      const res = await api.patch(`/builder/events/${eventId}/sections/${sectionId}`, payload);
      const updatedData = res.data?.data;
  
      set((state) => ({
        builder: {
          ...state.builder,
          // CRITICAL: Use .map() to create a NEW array
          sections: state.builder.sections.map((s) =>
            s.id === sectionId ? { ...s, ...updatedData } : s
          ),
        },
      }));
      toast.success("Updated!");
    } catch (error) {
      toast.error("Failed to update");
    }
  },
  
  // updateSection: async (eventId, sectionId, payload) => {
  //   try {
  //     // FIX: Added /builder prefix to match your backend router
  //     const res = await api.patch(
  //       `/builder/events/${eventId}/sections/${sectionId}`,
  //       payload
  //     );
  
  //     const updated = res.data?.data;
  
  //     set((state) => ({
  //       builder: {
  //         ...state.builder,
  //         sections: state.builder.sections.map((s) =>
  //           s.id === sectionId ? { ...s, ...updated } : s
  //         ),
  //       },
  //     }));
  //     toast.success("Section updated!");
  //   } catch (error) {
  //     console.error("Update error:", error);
  //     toast.error("Failed to update section");
  //   }
  // },

  deleteSection: async (eventId, sectionId) => {
    try {
      await api.delete(`/builder/events/${eventId}/sections/${sectionId}`);
      set((state) => ({
        builder: {
          ...state.builder,
          sections: state.builder.sections.filter((s) => s.id !== sectionId),
        },
      }));
      toast.success("Section removed");
    } catch {
      toast.error("Delete failed");
    }
  },

  reorderSections: async (eventId, payload) => {
    const currentSections = get().builder?.sections || [];
    const optimisticSections = payload.map((item) => {
      const found = currentSections.find((s) => s.id === item.id);
      return { ...found, position_order: item.position_order };
    }).sort((a, b) => a.position_order - b.position_order);

    set((state) => ({
      builder: { ...state.builder, sections: optimisticSections },
    }));

    try {
      const res = await api.patch(`/builder/events/${eventId}/sections/reorder`, { sections: payload });
      set((state) => ({
        builder: { ...state.builder, sections: res.data?.data || optimisticSections },
      }));
    } catch (err) {
      set((state) => ({ builder: { ...state.builder, sections: currentSections } }));
      toast.error("Reorder failed, rolled back");
    }
  },
}));

