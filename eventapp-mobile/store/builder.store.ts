import { create } from 'zustand';
import api from '@/lib/api';
import { BuilderData, BuilderSection, SaveStatus } from '@/types';

const MAX_HISTORY = 20;

interface BuilderState {
  builder:     BuilderData | null;
  isLoading:   boolean;
  saveStatus:  SaveStatus;

  // Undo/redo
  _history:      BuilderSection[][];
  _historyIndex: number;
  _pushSnapshot: () => void;
  canUndo:       () => boolean;
  canRedo:       () => boolean;
  undo:          () => void;
  redo:          () => void;

  // Fetch
  fetchBuilder: (eventId: string) => Promise<void>;

  // Sections
  createSectionFromTemplate: (eventId: string, templateKey: string) => Promise<BuilderSection | undefined>;
  applyPreset:               (eventId: string, sections: (string | { type: string; config?: Record<string, unknown> })[]) => Promise<BuilderSection[] | undefined>;
  batchCreateSections:       (eventId: string, templateKeys: string[]) => Promise<BuilderSection[] | undefined>;
  updateSection:             (eventId: string, sectionId: string, payload: Record<string, unknown>) => Promise<void>;
  deleteSection:             (eventId: string, sectionId: string) => Promise<void>;
  reorderSections:           (eventId: string, payload: { id: string; position_order: number }[]) => Promise<void>;

  // Speakers
  createSpeaker: (eventId: string, payload: Record<string, unknown>) => Promise<void>;
  updateSpeaker: (eventId: string, speakerId: string, payload: Record<string, unknown>) => Promise<void>;
  deleteSpeaker: (eventId: string, speakerId: string) => Promise<void>;

  // Schedule Items
  createScheduleItem: (eventId: string, payload: Record<string, unknown>) => Promise<void>;
  updateScheduleItem: (eventId: string, itemId: string, payload: Record<string, unknown>) => Promise<void>;
  deleteScheduleItem: (eventId: string, itemId: string) => Promise<void>;

  // Theme
  setTheme: (eventId: string, themeId: string) => Promise<void>;

  // Event details sync
  updateEventDetails: (eventId: string, payload: Record<string, unknown>) => Promise<void>;

  // Publish
  publishPage: (eventId: string) => Promise<boolean>;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  builder:       null,
  isLoading:     false,
  saveStatus:    'idle',
  _history:      [],
  _historyIndex: -1,

  // ── Undo / redo ───────────────────────────────────────────────────────────────
  _pushSnapshot: () => {
    const { builder, _history, _historyIndex } = get();
    if (!builder?.sections) return;

    const snapshot = builder.sections.map((s) => ({ ...s }));
    const trimmed  = _history.slice(0, _historyIndex + 1);
    const next     = [...trimmed, snapshot];
    if (next.length > MAX_HISTORY) next.shift();

    set({ _history: next, _historyIndex: next.length - 1 });
  },

  canUndo: () => get()._historyIndex > 0,
  canRedo: () => get()._historyIndex < get()._history.length - 1,

  undo: () => {
    const { _history, _historyIndex, builder } = get();
    if (_historyIndex <= 0 || !builder) return;
    const newIndex = _historyIndex - 1;
    set({ builder: { ...builder, sections: _history[newIndex] }, _historyIndex: newIndex });
  },

  redo: () => {
    const { _history, _historyIndex, builder } = get();
    if (_historyIndex >= _history.length - 1 || !builder) return;
    const newIndex = _historyIndex + 1;
    set({ builder: { ...builder, sections: _history[newIndex] }, _historyIndex: newIndex });
  },

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  fetchBuilder: async (eventId) => {
    try {
      set({ isLoading: true });
      const res  = await api.get<{ data: BuilderData }>(`/builder/events/${eventId}/builder`);
      const data = res.data?.data ?? null;
      set({ builder: data, isLoading: false });

      if (data?.sections) {
        const snapshot = data.sections.map((s) => ({ ...s }));
        set({ _history: [snapshot], _historyIndex: 0 });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Create single section ─────────────────────────────────────────────────────
  createSectionFromTemplate: async (eventId, templateKey) => {
    get()._pushSnapshot();
    try {
      set({ saveStatus: 'saving' });
      const res        = await api.post<{ data: BuilderSection }>(`/builder/events/${eventId}/sections`, { template_key: templateKey });
      const newSection = res.data?.data;
      set((state) => ({
        builder:    { ...state.builder!, sections: [...(state.builder?.sections ?? []), newSection!] },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
      return newSection;
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  // ── Apply preset (replace all sections) ──────────────────────────────────────
  applyPreset: async (eventId, sections) => {
    get()._pushSnapshot();
    try {
      set({ saveStatus: 'saving' });
      const payload = sections.map((s) =>
        typeof s === 'string'
          ? { template_key: s }
          : { template_key: s.type, config: s.config ?? {} }
      );
      const res         = await api.post<{ data: BuilderSection[] }>(`/builder/events/${eventId}/sections/replace`, { sections: payload });
      const newSections = res.data?.data ?? [];
      set((state) => ({
        builder:    { ...state.builder!, sections: newSections },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
      return newSections;
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  // ── Batch create sections ─────────────────────────────────────────────────────
  batchCreateSections: async (eventId, templateKeys) => {
    get()._pushSnapshot();
    try {
      set({ saveStatus: 'saving' });
      const res         = await api.post<{ data: BuilderSection[] }>(`/builder/events/${eventId}/sections/batch`, {
        sections: templateKeys.map((key) => ({ template_key: key })),
      });
      const newSections = res.data?.data ?? [];
      set((state) => ({
        builder:    { ...state.builder!, sections: [...(state.builder?.sections ?? []), ...newSections] },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
      return newSections;
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  // ── Update section ────────────────────────────────────────────────────────────
  updateSection: async (eventId, sectionId, payload) => {
    set({ saveStatus: 'saving' });
    try {
      const res     = await api.patch<{ data: BuilderSection }>(`/builder/events/${eventId}/sections/${sectionId}`, payload);
      const updated = res.data?.data;
      set((state) => ({
        builder: {
          ...state.builder!,
          sections: state.builder!.sections.map((s) => s.id === sectionId ? { ...s, ...updated } : s),
        },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  // ── Delete section (optimistic + rollback) ────────────────────────────────────
  deleteSection: async (eventId, sectionId) => {
    get()._pushSnapshot();
    const prevSections = get().builder?.sections ?? [];

    set((state) => ({
      builder: { ...state.builder!, sections: state.builder!.sections.filter((s) => s.id !== sectionId) },
    }));

    try {
      await api.delete(`/builder/events/${eventId}/sections/${sectionId}`);
    } catch {
      set((state) => ({ builder: { ...state.builder!, sections: prevSections } }));
    }
  },

  // ── Reorder sections (optimistic + rollback) ──────────────────────────────────
  reorderSections: async (eventId, payload) => {
    const currentSections = get().builder?.sections ?? [];
    get()._pushSnapshot();

    const optimistic = payload
      .map((item) => {
        const found = currentSections.find((s) => s.id === item.id);
        return found ? { ...found, position_order: item.position_order } : null;
      })
      .filter((s): s is BuilderSection => s !== null)
      .sort((a, b) => a.position_order - b.position_order);

    set((state) => ({ builder: { ...state.builder!, sections: optimistic }, saveStatus: 'saving' }));

    try {
      const res = await api.patch<{ data: BuilderSection[] }>(`/builder/events/${eventId}/sections/reorder`, { sections: payload });
      set((state) => ({
        builder: { ...state.builder!, sections: res.data?.data ?? optimistic },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set((state) => ({ builder: { ...state.builder!, sections: currentSections }, saveStatus: 'error' }));
    }
  },

  // ── Set theme ─────────────────────────────────────────────────────────────────
  setTheme: async (eventId, themeId) => {
    const sections = get().builder?.sections ?? [];
    if (!sections.length) return;

    set((state) => ({
      builder: {
        ...state.builder!,
        sections: sections.map((s) => ({ ...s, config: { ...(s.config ?? {}), _theme: themeId } })),
      },
      saveStatus: 'saving',
    }));

    try {
      await Promise.all(
        sections.map((s) =>
          api.patch(`/builder/events/${eventId}/sections/${s.id}`, {
            config: { ...(s.config ?? {}), _theme: themeId },
          })
        )
      );
      set({ saveStatus: 'saved' });
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  // ── Speakers ──────────────────────────────────────────────────────────────────
  createSpeaker: async (eventId, payload) => {
    set({ saveStatus: 'saving' });
    try {
      const res     = await api.post<{ data: Record<string, unknown> }>(`/builder/events/${eventId}/speakers`, payload);
      const speaker = res.data?.data;
      set((state) => ({
        builder: {
          ...state.builder!,
          speakers: [...((state.builder as any)?.speakers ?? []), speaker],
        },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  updateSpeaker: async (eventId, speakerId, payload) => {
    set({ saveStatus: 'saving' });
    try {
      const res     = await api.patch<{ data: Record<string, unknown> }>(`/builder/events/${eventId}/speakers/${speakerId}`, payload);
      const updated = res.data?.data;
      set((state) => ({
        builder: {
          ...state.builder!,
          speakers: ((state.builder as any)?.speakers ?? []).map((s: any) =>
            s.id === speakerId ? updated : s
          ),
        },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  deleteSpeaker: async (eventId, speakerId) => {
    set((state) => ({
      builder: {
        ...state.builder!,
        speakers: ((state.builder as any)?.speakers ?? []).filter((s: any) => s.id !== speakerId),
      },
      saveStatus: 'saving',
    }));
    try {
      await api.delete(`/builder/events/${eventId}/speakers/${speakerId}`);
      set({ saveStatus: 'saved' });
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  // ── Schedule Items ────────────────────────────────────────────────────────────
  createScheduleItem: async (eventId, payload) => {
    set({ saveStatus: 'saving' });
    try {
      const res  = await api.post<{ data: Record<string, unknown> }>(`/builder/events/${eventId}/schedule-items`, payload);
      const item = res.data?.data;
      set((state) => ({
        builder: {
          ...state.builder!,
          schedule_items: [...((state.builder as any)?.schedule_items ?? []), item],
        },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  updateScheduleItem: async (eventId, itemId, payload) => {
    set({ saveStatus: 'saving' });
    try {
      const res     = await api.patch<{ data: Record<string, unknown> }>(`/builder/events/${eventId}/schedule-items/${itemId}`, payload);
      const updated = res.data?.data;
      set((state) => ({
        builder: {
          ...state.builder!,
          schedule_items: ((state.builder as any)?.schedule_items ?? []).map((s: any) =>
            s.id === itemId ? updated : s
          ),
        },
        saveStatus: 'saved',
      }));
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  deleteScheduleItem: async (eventId, itemId) => {
    set((state) => ({
      builder: {
        ...state.builder!,
        schedule_items: ((state.builder as any)?.schedule_items ?? []).filter((s: any) => s.id !== itemId),
      },
      saveStatus: 'saving',
    }));
    try {
      await api.delete(`/builder/events/${eventId}/schedule-items/${itemId}`);
      set({ saveStatus: 'saved' });
      setTimeout(() => { if (get().saveStatus === 'saved') set({ saveStatus: 'idle' }); }, 2000);
    } catch {
      set({ saveStatus: 'error' });
    }
  },

  // ── Event details sync ────────────────────────────────────────────────────────
  updateEventDetails: async (eventId, payload) => {
    try {
      const res     = await api.patch<{ data: Record<string, unknown> }>(`/events/${eventId}`, payload);
      const updated = res.data?.data;
      if (updated) {
        set((state) => ({
          builder: state.builder
            ? { ...state.builder, event: { ...state.builder.event, ...(updated as object) } }
            : state.builder,
        }));
      }
    } catch { /* silent — venue config is still saved; event sync is best-effort */ }
  },

  // ── Publish ───────────────────────────────────────────────────────────────────
  publishPage: async (eventId) => {
    try {
      const res            = await api.post<{ data: { page: unknown; event: unknown } }>(`/builder/events/${eventId}/page/publish`);
      const { page, event } = (res.data?.data ?? {}) as { page?: unknown; event?: unknown };
      set((state) => ({
        builder: {
          ...state.builder!,
          page:  page  ? { ...state.builder?.page,  ...(page  as object) } as BuilderData['page']  : state.builder?.page  ?? null,
          event: event ? { ...state.builder?.event, ...(event as object) } as BuilderData['event'] : state.builder!.event,
        },
      }));
      return true;
    } catch {
      return false;
    }
  },
}));
