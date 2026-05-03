import { create } from 'zustand';
import api from '@/lib/api';
import { Event, EventDashboard, EventCreatePayload } from '@/types';

interface EventState {
  events:       Event[];
  currentEvent: Event | null;
  dashboard:    EventDashboard | null;
  loading:      boolean;
  error:        string | null;

  fetchEvents:        () => Promise<void>;
  fetchEventById:     (id: string) => Promise<Event | null>;
  fetchEventDashboard:(id: string) => Promise<void>;
  createEvent:        (payload: EventCreatePayload) => Promise<{ success: boolean; event?: Event; message?: string; code?: string }>;
  updateEvent:        (id: string, payload: Partial<EventCreatePayload>) => Promise<{ success: boolean; message?: string }>;
  publishEvent:       (id: string) => Promise<{ success: boolean }>;
  unpublishEvent:     (id: string) => Promise<{ success: boolean }>;
  cancelEvent:        (id: string) => Promise<{ success: boolean }>;
  archiveEvent:       (id: string) => Promise<{ success: boolean }>;
  restoreEvent:       (id: string) => Promise<{ success: boolean }>;
  deleteEvent:        (id: string) => Promise<{ success: boolean }>;
  duplicateEvent:     (id: string) => Promise<{ success: boolean }>;
  clearError:         () => void;
}

type ErrResponse = { response?: { data?: { message?: string; code?: string }; status?: number } };

function extractMsg(err: unknown, fallback: string): string {
  return (err as ErrResponse)?.response?.data?.message ?? fallback;
}
function extractCode(err: unknown): string | undefined {
  return (err as ErrResponse)?.response?.data?.code;
}

// Optimistic status patch helper
function patchStatus(events: Event[], id: string, status: Event['status']): Event[] {
  return events.map(e => e.id === id ? { ...e, status } : e);
}

export const useEventStore = create<EventState>((set, get) => ({
  events:       [],
  currentEvent: null,
  dashboard:    null,
  loading:      false,
  error:        null,

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<{ data: Event[] }>('/events');
      set({ events: res.data?.data ?? [], loading: false });
    } catch (err) {
      set({ error: extractMsg(err, 'Failed to load events'), loading: false });
    }
  },

  fetchEventById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<{ data: Event }>(`/events/${id}`);
      const event = res.data?.data ?? null;
      set({ currentEvent: event, loading: false });
      return event;
    } catch (err) {
      set({ error: extractMsg(err, 'Failed to load event'), loading: false });
      return null;
    }
  },

  fetchEventDashboard: async (id) => {
    set({ loading: true });
    try {
      const res = await api.get<{ data: EventDashboard }>(`/events/${id}/dashboard`);
      set({ dashboard: res.data?.data ?? null, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createEvent: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res   = await api.post<{ data: Event }>('/events', payload);
      const event = res.data?.data;
      if (event) set(s => ({ events: [event, ...s.events], loading: false }));
      return { success: true, event };
    } catch (err) {
      const message = extractMsg(err, 'Failed to create event');
      const code    = extractCode(err);
      set({ error: message, loading: false });
      return { success: false, message, code };
    }
  },

  updateEvent: async (id, payload) => {
    try {
      const res   = await api.patch<{ data: Event }>(`/events/${id}`, payload);
      const event = res.data?.data;
      if (event) {
        set(s => ({
          events:       patchStatus(s.events, id, event.status),
          currentEvent: s.currentEvent?.id === id ? event : s.currentEvent,
        }));
      }
      return { success: true };
    } catch (err) {
      return { success: false, message: extractMsg(err, 'Failed to update event') };
    }
  },

  publishEvent: async (id) => {
    set(s => ({ events: patchStatus(s.events, id, 'PUBLISHED') }));
    try {
      await api.post(`/events/${id}/publish`);
      return { success: true };
    } catch {
      await get().fetchEvents();
      return { success: false };
    }
  },

  unpublishEvent: async (id) => {
    set(s => ({ events: patchStatus(s.events, id, 'DRAFT') }));
    try {
      await api.post(`/events/${id}/unpublish`);
      return { success: true };
    } catch {
      await get().fetchEvents();
      return { success: false };
    }
  },

  cancelEvent: async (id) => {
    set(s => ({ events: patchStatus(s.events, id, 'CANCELLED') }));
    try {
      await api.post(`/events/${id}/cancel`);
      return { success: true };
    } catch {
      await get().fetchEvents();
      return { success: false };
    }
  },

  archiveEvent: async (id) => {
    set(s => ({ events: patchStatus(s.events, id, 'ARCHIVED') }));
    try {
      await api.post(`/events/${id}/archive`);
      return { success: true };
    } catch {
      await get().fetchEvents();
      return { success: false };
    }
  },

  restoreEvent: async (id) => {
    set(s => ({ events: patchStatus(s.events, id, 'DRAFT') }));
    try {
      await api.post(`/events/${id}/restore`);
      return { success: true };
    } catch {
      await get().fetchEvents();
      return { success: false };
    }
  },

  deleteEvent: async (id) => {
    const prev = get().events;
    set(s => ({ events: s.events.filter(e => e.id !== id) }));
    try {
      await api.delete(`/events/${id}`);
      return { success: true };
    } catch {
      set({ events: prev });
      return { success: false };
    }
  },

  duplicateEvent: async (id) => {
    try {
      const res   = await api.post<{ data: Event }>(`/events/${id}/duplicate`);
      const event = res.data?.data;
      if (event) set(s => ({ events: [event, ...s.events] }));
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  clearError: () => set({ error: null }),
}));
