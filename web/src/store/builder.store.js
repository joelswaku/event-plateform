"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

const MAX_HISTORY = 20;

export const useBuilderStore = create((set, get) => ({
  builder: null,
  isLoading: false,
  // "idle" | "saving" | "saved" | "error"
  saveStatus: "idle",

  // ── Undo / redo history ────────────────────────────────────────────────────
  _history: [],
  _historyIndex: -1,

  _pushSnapshot: () => {
    const { builder, _history, _historyIndex } = get();
    if (!builder?.sections) return;

    const snapshot = builder.sections.map((s) => ({ ...s }));
    const trimmed = _history.slice(0, _historyIndex + 1);
    const next = [...trimmed, snapshot];
    if (next.length > MAX_HISTORY) next.shift();

    set({ _history: next, _historyIndex: next.length - 1 });
  },

  canUndo: () => get()._historyIndex > 0,
  canRedo: () => get()._historyIndex < get()._history.length - 1,

  undo: () => {
    const { _history, _historyIndex, builder } = get();
    if (_historyIndex <= 0 || !builder) return;

    const newIndex = _historyIndex - 1;
    set({
      builder: { ...builder, sections: _history[newIndex] },
      _historyIndex: newIndex,
    });
  },

  redo: () => {
    const { _history, _historyIndex, builder } = get();
    if (_historyIndex >= _history.length - 1 || !builder) return;

    const newIndex = _historyIndex + 1;
    set({
      builder: { ...builder, sections: _history[newIndex] },
      _historyIndex: newIndex,
    });
  },

  // ── Fetch ──────────────────────────────────────────────────────────────────
  fetchBuilder: async (eventId) => {
    try {
      set({ isLoading: true });
      const res = await api.get(`/builder/events/${eventId}/builder`);
      const data = res.data?.data || null;
      set({ builder: data, isLoading: false });

      if (data?.sections) {
        const snapshot = data.sections.map((s) => ({ ...s }));
        set({ _history: [snapshot], _historyIndex: 0 });
      }
    } catch {
      set({ isLoading: false });
      toast.error("Failed to load builder");
    }
  },

  // ── Create single section ──────────────────────────────────────────────────
  createSectionFromTemplate: async (eventId, templateKey) => {
    get()._pushSnapshot();
    try {
      set({ saveStatus: "saving" });
      const res = await api.post(`/builder/events/${eventId}/sections`, {
        template_key: templateKey,
      });
      const newSection = res.data?.data;
      set((state) => ({
        builder: {
          ...state.builder,
          sections: [...(state.builder?.sections || []), newSection],
        },
        saveStatus: "saved",
      }));
      setTimeout(() => { if (get().saveStatus === "saved") set({ saveStatus: "idle" }); }, 2000);
      return newSection;
    } catch {
      set({ saveStatus: "error" });
      toast.error("Failed to add section");
    }
  },

  // ── Apply preset — REPLACES all existing sections atomically ──────────────
  applyPreset: async (eventId, templateKeys) => {
    get()._pushSnapshot();
    try {
      set({ saveStatus: "saving" });
      const res = await api.post(`/builder/events/${eventId}/sections/replace`, {
        sections: templateKeys.map((key) => ({ template_key: key })),
      });
      const newSections = res.data?.data || [];
      set((state) => ({
        builder: { ...state.builder, sections: newSections },
        saveStatus: "saved",
      }));
      setTimeout(() => { if (get().saveStatus === "saved") set({ saveStatus: "idle" }); }, 2000);
      return newSections;
    } catch {
      set({ saveStatus: "error" });
      toast.error("Failed to apply preset");
    }
  },

  // ── Batch create sections (for preset templates) ───────────────────────────
  batchCreateSections: async (eventId, templateKeys) => {
    get()._pushSnapshot();
    try {
      set({ saveStatus: "saving" });
      const res = await api.post(`/builder/events/${eventId}/sections/batch`, {
        sections: templateKeys.map((key) => ({ template_key: key })),
      });
      const newSections = res.data?.data || [];
      set((state) => ({
        builder: {
          ...state.builder,
          sections: [...(state.builder?.sections || []), ...newSections],
        },
        saveStatus: "saved",
      }));
      setTimeout(() => { if (get().saveStatus === "saved") set({ saveStatus: "idle" }); }, 2000);
      return newSections;
    } catch {
      set({ saveStatus: "error" });
      toast.error("Failed to apply template");
    }
  },

  // ── Update section — called by debounced autosave in SectionConfigPanel ───
  updateSection: async (eventId, sectionId, payload) => {
    set({ saveStatus: "saving" });
    try {
      const res = await api.patch(
        `/builder/events/${eventId}/sections/${sectionId}`,
        payload
      );
      const updated = res.data?.data;

      set((state) => ({
        builder: {
          ...state.builder,
          sections: state.builder.sections.map((s) =>
            s.id === sectionId ? { ...s, ...updated } : s
          ),
        },
        saveStatus: "saved",
      }));
      setTimeout(() => { if (get().saveStatus === "saved") set({ saveStatus: "idle" }); }, 2000);
    } catch {
      set({ saveStatus: "error" });
      toast.error("Failed to save changes");
    }
  },

  // ── Delete section — optimistic with rollback ──────────────────────────────
  deleteSection: async (eventId, sectionId) => {
    get()._pushSnapshot();
    const prevSections = get().builder?.sections || [];

    set((state) => ({
      builder: {
        ...state.builder,
        sections: state.builder.sections.filter((s) => s.id !== sectionId),
      },
    }));

    try {
      await api.delete(`/builder/events/${eventId}/sections/${sectionId}`);
    } catch {
      set((state) => ({ builder: { ...state.builder, sections: prevSections } }));
      toast.error("Delete failed");
    }
  },

  // ── Reorder sections — optimistic with rollback ────────────────────────────
  reorderSections: async (eventId, payload) => {
    const currentSections = get().builder?.sections || [];
    get()._pushSnapshot();

    const optimistic = payload
      .map((item) => {
        const found = currentSections.find((s) => s.id === item.id);
        return found ? { ...found, position_order: item.position_order } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.position_order - b.position_order);

    set((state) => ({
      builder: { ...state.builder, sections: optimistic },
    }));

    try {
      const res = await api.patch(
        `/builder/events/${eventId}/sections/reorder`,
        { sections: payload }
      );
      set((state) => ({
        builder: {
          ...state.builder,
          sections: res.data?.data || optimistic,
        },
      }));
    } catch {
      set((state) => ({ builder: { ...state.builder, sections: currentSections } }));
      toast.error("Reorder failed, rolled back");
    }
  },

  // ── Publish ────────────────────────────────────────────────────────────────
  publishPage: async (eventId) => {
    try {
      const res = await api.post(`/builder/events/${eventId}/page/publish`);
      set((state) => ({
        builder: {
          ...state.builder,
          page: { ...state.builder?.page, ...res.data?.data },
        },
      }));
      toast.success("Page published!");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to publish");
      return false;
    }
  },
}));
