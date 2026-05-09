import { create } from 'zustand';
import api from '@/lib/api';
import {
  SeatingLocation, SeatingAssignment, SeatingChartEntry, SeatingStats,
} from '@/types';

interface SeatingState {
  locations:   SeatingLocation[];
  assignments: SeatingAssignment[];
  chart:       SeatingChartEntry[];
  loading:     boolean;
  saving:      boolean;
  error:       string | null;

  // Locations
  fetchLocations:  (eventId: string) => Promise<SeatingLocation[]>;
  createLocation:  (eventId: string, payload: Partial<SeatingLocation>) => Promise<{ success: boolean; data?: SeatingLocation; message?: string }>;
  updateLocation:  (eventId: string, locationId: string, payload: Partial<SeatingLocation>) => Promise<{ success: boolean; data?: SeatingLocation; message?: string }>;
  deleteLocation:  (eventId: string, locationId: string) => Promise<{ success: boolean; message?: string }>;

  // Assignments
  fetchAssignments:    (eventId: string) => Promise<SeatingAssignment[]>;
  assignGuest:         (eventId: string, payload: { guest_id: string; seating_table_id: string; seat_number?: number }) => Promise<{ success: boolean; data?: SeatingAssignment; message?: string }>;
  removeAssignment:    (eventId: string, assignmentId: string) => Promise<{ success: boolean; message?: string }>;

  // Chart
  fetchChart: (eventId: string) => Promise<SeatingChartEntry[]>;

  // Auto-assign
  autoAssign:          (eventId: string, options?: Record<string, unknown>) => Promise<{ success: boolean; data?: { assigned_count: number }; message?: string }>;
  clearAllAssignments: (eventId: string) => Promise<{ success: boolean; message?: string }>;

  // Derived helpers (no API)
  getAssignedGuestIds:       () => string[];
  getAssignmentForGuest:     (guestId: string) => SeatingAssignment | null;
  getAssignmentsForLocation: (locationId: string) => SeatingAssignment[];
  getLocationById:           (locationId: string) => SeatingLocation | null;
  getStats:                  () => SeatingStats;
}

export const useSeatingStore = create<SeatingState>((set, get) => ({
  locations:   [],
  assignments: [],
  chart:       [],
  loading:     false,
  saving:      false,
  error:       null,

  // ── Locations ─────────────────────────────────────────────────────────────────
  fetchLocations: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const res  = await api.get<{ data: SeatingLocation[] }>(`/seating/events/${eventId}/seating-locations`);
      const data = res.data?.data ?? [];
      set({ locations: data, loading: false });
      return data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load tables';
      set({ loading: false, error: msg });
      return [];
    }
  },

  createLocation: async (eventId, payload) => {
    set({ saving: true });
    try {
      const res = await api.post<{ data: SeatingLocation }>(`/seating/events/${eventId}/seating-locations`, payload);
      const loc = res.data?.data;
      if (loc) set((s) => ({ locations: [...s.locations, loc], saving: false }));
      else set({ saving: false });
      return { success: true, data: loc };
    } catch (err: unknown) {
      set({ saving: false });
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create table';
      return { success: false, message };
    }
  },

  updateLocation: async (eventId, locationId, payload) => {
    set({ saving: true });
    try {
      const res     = await api.patch<{ data: SeatingLocation }>(`/seating/events/${eventId}/seating-locations/${locationId}`, payload);
      const updated = res.data?.data;
      if (updated) set((s) => ({ locations: s.locations.map((l) => l.id === locationId ? updated : l), saving: false }));
      else set({ saving: false });
      return { success: true, data: updated };
    } catch (err: unknown) {
      set({ saving: false });
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update table';
      return { success: false, message };
    }
  },

  deleteLocation: async (eventId, locationId) => {
    set({ saving: true });
    try {
      await api.delete(`/seating/events/${eventId}/seating-locations/${locationId}`);
      set((s) => ({
        locations:   s.locations.filter((l) => l.id !== locationId),
        assignments: s.assignments.filter((a) => a.seating_table_id !== locationId),
        saving:      false,
      }));
      return { success: true };
    } catch (err: unknown) {
      set({ saving: false });
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete table';
      return { success: false, message };
    }
  },

  // ── Assignments ───────────────────────────────────────────────────────────────
  fetchAssignments: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const res  = await api.get<{ data: SeatingAssignment[] }>(`/seating/events/${eventId}/seating-assignments`);
      const data = res.data?.data ?? [];
      set({ assignments: data, loading: false });
      return data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load assignments';
      set({ loading: false, error: msg });
      return [];
    }
  },

  assignGuest: async (eventId, payload) => {
    set({ saving: true });
    try {
      const res        = await api.post<{ data: SeatingAssignment }>(`/seating/events/${eventId}/seating-assignments`, payload);
      const assignment = res.data?.data;
      if (assignment) {
        set((s) => ({
          assignments: [
            ...s.assignments.filter((a) => a.guest_id !== payload.guest_id),
            assignment,
          ],
          saving: false,
        }));
      } else {
        set({ saving: false });
      }
      return { success: true, data: assignment };
    } catch (err: unknown) {
      set({ saving: false });
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to assign guest';
      return { success: false, message };
    }
  },

  removeAssignment: async (eventId, assignmentId) => {
    set({ saving: true });
    try {
      await api.delete(`/seating/events/${eventId}/seating-assignments/${assignmentId}`);
      set((s) => ({
        assignments: s.assignments.filter((a) => a.id !== assignmentId),
        saving:      false,
      }));
      return { success: true };
    } catch (err: unknown) {
      set({ saving: false });
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to remove assignment';
      return { success: false, message };
    }
  },

  // ── Chart ─────────────────────────────────────────────────────────────────────
  fetchChart: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const res  = await api.get<{ data: SeatingChartEntry[] }>(`/seating/events/${eventId}/seating-chart`);
      const data = res.data?.data ?? [];
      set({ chart: data, loading: false });
      return data;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load chart';
      set({ loading: false, error: msg });
      return [];
    }
  },

  // ── Auto-assign ───────────────────────────────────────────────────────────────
  autoAssign: async (eventId, options = {}) => {
    set({ saving: true });
    try {
      const res  = await api.post<{ data: { assigned_count: number } }>(`/seating/events/${eventId}/seating/auto-assign`, options);
      const data = res.data?.data;
      set({ saving: false });
      return { success: true, data };
    } catch (err: unknown) {
      set({ saving: false });
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Auto-assign failed';
      return { success: false, message };
    }
  },

  clearAllAssignments: async (eventId) => {
    set({ saving: true });
    try {
      await api.delete(`/seating/events/${eventId}/seating/assignments`);
      set({ assignments: [], saving: false });
      return { success: true };
    } catch (err: unknown) {
      set({ saving: false });
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to clear assignments';
      return { success: false, message };
    }
  },

  // ── Derived helpers ───────────────────────────────────────────────────────────
  getAssignedGuestIds: () =>
    get().assignments.map((a) => a.guest_id),

  getAssignmentForGuest: (guestId) =>
    get().assignments.find((a) => a.guest_id === guestId) ?? null,

  getAssignmentsForLocation: (locationId) =>
    get().assignments.filter((a) => a.seating_table_id === locationId),

  getLocationById: (locationId) =>
    get().locations.find((l) => l.id === locationId) ?? null,

  getStats: () => {
    const { locations, assignments } = get();
    const totalCapacity = locations.reduce((s, l) => s + (l.capacity || 0), 0);
    const assigned      = assignments.length;
    return {
      totalCapacity,
      assigned,
      unassigned: Math.max(0, totalCapacity - assigned),
      fillRate:   totalCapacity > 0 ? Math.round((assigned / totalCapacity) * 100) : 0,
      tableCount: locations.length,
    };
  },
}));
