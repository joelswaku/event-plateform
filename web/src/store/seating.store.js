
"use client";

/**
 * seating.store.js
 *
 * Rule: every fetch merges loading + data in ONE atomic set() call.
 * Never call set({ loading: true }) then set({ data }) — React 19 / Strict Mode
 * flags synchronous setState chains inside useEffect as a warning/error.
 */

import { create } from "zustand";
import { api }    from "@/lib/api";
import toast      from "react-hot-toast";

export const useSeatingStore = create((set, get) => ({

  // ── State ──────────────────────────────────────────────────────────────────
  locations:   [],
  assignments: [],
  chart:       [],
  loading:     false,
  saving:      false,
  error:       null,

  // ── Locations ──────────────────────────────────────────────────────────────

  fetchLocations: async (eventId) => {
    // Single atomic set — avoids the synchronous-setState-in-effect warning
    set({ loading: true, error: null });
    try {
      const res  = await api.get(`/seating/events/${eventId}/seating-locations`);
      const data = res.data.data ?? [];
      set({ locations: data, loading: false });
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load tables";
      set({ loading: false, error: msg });
      toast.error(msg);
      return [];
    }
  },

  createLocation: async (eventId, payload) => {
    set({ saving: true });
    try {
      const res = await api.post(`/seating/events/${eventId}/seating-locations`, payload);
      const loc = res.data.data;
      set((s) => ({ locations: [...s.locations, loc], saving: false }));
      toast.success("Table created");
      return { success: true, data: loc };
    } catch (err) {
      set({ saving: false });
      const msg = err?.response?.data?.message || "Failed to create table";
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  updateLocation: async (eventId, locationId, payload) => {
    set({ saving: true });
    try {
      const res     = await api.patch(`/seating/events/${eventId}/seating-locations/${locationId}`, payload);
      const updated = res.data.data;
      set((s) => ({
        locations: s.locations.map((l) => (l.id === locationId ? updated : l)),
        saving: false,
      }));
      toast.success("Table updated");
      return { success: true, data: updated };
    } catch (err) {
      set({ saving: false });
      const msg = err?.response?.data?.message || "Failed to update table";
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  deleteLocation: async (eventId, locationId) => {
    set({ saving: true });
    try {
      await api.delete(`/seating/events/${eventId}/seating-locations/${locationId}`);
      set((s) => ({
        locations:   s.locations.filter((l) => l.id !== locationId),
        assignments: s.assignments.filter((a) => a.seating_table_id !== locationId),
        saving: false,
      }));
      toast.success("Table deleted");
      return { success: true };
    } catch (err) {
      set({ saving: false });
      const msg = err?.response?.data?.message || "Failed to delete table";
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  // ── Assignments ────────────────────────────────────────────────────────────

  fetchAssignments: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const res  = await api.get(`/seating/events/${eventId}/seating-assignments`);
      const data = res.data.data ?? [];
      set({ assignments: data, loading: false });
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load assignments";
      set({ loading: false, error: msg });
      return [];
    }
  },

  assignGuest: async (eventId, payload) => {
    set({ saving: true });
    try {
      const res        = await api.post(`/seating/events/${eventId}/seating-assignments`, payload);
      const assignment = res.data.data;
      // Remove any prior assignment for this guest, then insert new one atomically
      set((s) => ({
        assignments: [
          ...s.assignments.filter((a) => a.guest_id !== payload.guest_id),
          assignment,
        ],
        saving: false,
      }));
      return { success: true, data: assignment };
    } catch (err) {
      set({ saving: false });
      const msg = err?.response?.data?.message || "Failed to assign guest";
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  removeAssignment: async (eventId, assignmentId) => {
    set({ saving: true });
    try {
      await api.delete(`/seating/events/${eventId}/seating-assignments/${assignmentId}`);
      set((s) => ({
        assignments: s.assignments.filter((a) => a.id !== assignmentId),
        saving: false,
      }));
      return { success: true };
    } catch (err) {
      set({ saving: false });
      const msg = err?.response?.data?.message || "Failed to remove assignment";
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  // ── Chart ──────────────────────────────────────────────────────────────────

  fetchChart: async (eventId) => {
    set({ loading: true, error: null });
    try {
      const res  = await api.get(`/seating/events/${eventId}/seating-chart`);
      const data = res.data.data ?? [];
      set({ chart: data, loading: false });
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load chart";
      set({ loading: false, error: msg });
      return [];
    }
  },

  // ── Auto-assign ────────────────────────────────────────────────────────────

  autoAssign: async (eventId, options = {}) => {
    set({ saving: true });
    try {
      const res  = await api.post(`/seating/events/${eventId}/seating/auto-assign`, options);
      const data = res.data.data;
      set({ saving: false });
      toast.success(`Auto-assigned ${data.assigned_count} guests`);
      return { success: true, data };
    } catch (err) {
      set({ saving: false });
      const msg = err?.response?.data?.message || "Auto-assign failed";
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  clearAllAssignments: async (eventId) => {
    set({ saving: true });
    try {
      await api.delete(`/seating/events/${eventId}/seating/assignments`);
      set({ assignments: [], saving: false });
      toast.success("All assignments cleared");
      return { success: true };
    } catch (err) {
      set({ saving: false });
      const msg = err?.response?.data?.message || "Failed to clear assignments";
      toast.error(msg);
      return { success: false, message: msg };
    }
  },

  // ── Derived (no API calls) ─────────────────────────────────────────────────

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


// "use client";



// import { create } from "zustand";

// import { api } from "@/lib/api";

// import toast from "react-hot-toast";



// export const useSeatingStore = create((set, get) => ({

//   // ── State ─────────────────────────────────────────────────────────────────

//   locations: [],       // seating tables/zones

//   assignments: [],     // guest → table assignments

//   chart: [],           // enriched chart data (locations + nested assignments)

//   loading: false,

//   saving: false,

//   error: null,



//   // ── Helpers ───────────────────────────────────────────────────────────────

//   _setLoading: (v) => set({ loading: v }),

//   _setSaving:  (v) => set({ saving: v }),



//   // ── Locations (Tables / Zones) ────────────────────────────────────────────



//   fetchLocations: async (eventId) => {

//     set({ loading: true, error: null });

//     try {

//       const res = await api.get(`/seating/events/${eventId}/seating-locations`);

//       set({ locations: res.data.data ?? [], loading: false });

//       return res.data.data ?? [];

//     } catch (err) {

//       const msg = err?.response?.data?.message || "Failed to load seating locations";

//       set({ loading: false, error: msg });

//       toast.error(msg);

//       return [];

//     }

//   },



//   createLocation: async (eventId, payload) => {

//     set({ saving: true });

//     try {

//       const res = await api.post(`/seating/events/${eventId}/seating-locations`, payload);

//       const loc = res.data.data;

//       set((s) => ({ locations: [...s.locations, loc], saving: false }));

//       toast.success("Table created");

//       return { success: true, data: loc };

//     } catch (err) {

//       set({ saving: false });

//       const msg = err?.response?.data?.message || "Failed to create table";

//       toast.error(msg);

//       return { success: false, message: msg };

//     }

//   },



//   updateLocation: async (eventId, locationId, payload) => {

//     set({ saving: true });

//     try {

//       const res = await api.patch(

//         `/seating/events/${eventId}/seating-locations/${locationId}`,

//         payload

//       );

//       const updated = res.data.data;

//       set((s) => ({

//         locations: s.locations.map((l) => (l.id === locationId ? updated : l)),

//         saving: false,

//       }));

//       toast.success("Table updated");

//       return { success: true, data: updated };

//     } catch (err) {

//       set({ saving: false });

//       const msg = err?.response?.data?.message || "Failed to update table";

//       toast.error(msg);

//       return { success: false, message: msg };

//     }

//   },



//   deleteLocation: async (eventId, locationId) => {

//     set({ saving: true });

//     try {

//       await api.delete(`/seating/events/${eventId}/seating-locations/${locationId}`);

//       set((s) => ({

//         locations: s.locations.filter((l) => l.id !== locationId),

//         assignments: s.assignments.filter((a) => a.seating_table_id !== locationId),

//         saving: false,

//       }));

//       toast.success("Table deleted");

//       return { success: true };

//     } catch (err) {

//       set({ saving: false });

//       const msg = err?.response?.data?.message || "Failed to delete table";

//       toast.error(msg);

//       return { success: false, message: msg };

//     }

//   },



//   // ── Assignments ───────────────────────────────────────────────────────────



//   fetchAssignments: async (eventId) => {

//     set({ loading: true, error: null });

//     try {

//       const res = await api.get(`/seating/events/${eventId}/seating-assignments`);

//       set({ assignments: res.data.data ?? [], loading: false });

//       return res.data.data ?? [];

//     } catch (err) {

//       const msg = err?.response?.data?.message || "Failed to load assignments";

//       set({ loading: false, error: msg });

//       return [];

//     }

//   },



//   assignGuest: async (eventId, payload) => {

//     // payload: { guest_id, seating_table_id, seat_number? }

//     set({ saving: true });

//     try {

//       const res = await api.post(`/seating/events/${eventId}/seating-assignments`, payload);

//       const assignment = res.data.data;

//       // Remove any existing assignment for this guest, then add new one

//       set((s) => ({

//         assignments: [

//           ...s.assignments.filter((a) => a.guest_id !== payload.guest_id),

//           assignment,

//         ],

//         saving: false,

//       }));

//       return { success: true, data: assignment };

//     } catch (err) {

//       set({ saving: false });

//       const msg = err?.response?.data?.message || "Failed to assign guest";

//       toast.error(msg);

//       return { success: false, message: msg };

//     }

//   },



//   removeAssignment: async (eventId, assignmentId) => {

//     set({ saving: true });

//     try {

//       await api.delete(`/seating/events/${eventId}/seating-assignments/${assignmentId}`);

//       set((s) => ({

//         assignments: s.assignments.filter((a) => a.id !== assignmentId),

//         saving: false,

//       }));

//       return { success: true };

//     } catch (err) {

//       set({ saving: false });

//       const msg = err?.response?.data?.message || "Failed to remove assignment";

//       toast.error(msg);

//       return { success: false, message: msg };

//     }

//   },



//   // ── Chart (enriched: locations + nested assignments) ──────────────────────



//   fetchChart: async (eventId) => {

//     set({ loading: true, error: null });

//     try {

//       const res = await api.get(`/seating/events/${eventId}/seating-chart`);

//       set({ chart: res.data.data ?? [], loading: false });

//       return res.data.data ?? [];

//     } catch (err) {

//       const msg = err?.response?.data?.message || "Failed to load seating chart";

//       set({ loading: false, error: msg });

//       return [];

//     }

//   },



//   // ── Auto-assign ───────────────────────────────────────────────────────────



//   autoAssign: async (eventId, options = {}) => {

//     set({ saving: true });

//     try {

//       const res = await api.post(`/seating/events/${eventId}/seating/auto-assign`, options);

//       const data = res.data.data;

//       toast.success(`Auto-assigned ${data.assigned_count} guests`);

//       set({ saving: false });

//       return { success: true, data };

//     } catch (err) {

//       set({ saving: false });

//       const msg = err?.response?.data?.message || "Auto-assign failed";

//       toast.error(msg);

//       return { success: false, message: msg };

//     }

//   },



//   clearAllAssignments: async (eventId) => {

//     set({ saving: true });

//     try {

//       await api.delete(`/seating/events/${eventId}/seating/assignments`);

//       set({ assignments: [], saving: false });

//       toast.success("All assignments cleared");

//       return { success: true };

//     } catch (err) {

//       set({ saving: false });

//       const msg = err?.response?.data?.message || "Failed to clear assignments";

//       toast.error(msg);

//       return { success: false, message: msg };

//     }

//   },



//   // ── Local helpers (derived state, no API calls) ───────────────────────────



//   getAssignedGuestIds: () => get().assignments.map((a) => a.guest_id),



//   getAssignmentForGuest: (guestId) =>

//     get().assignments.find((a) => a.guest_id === guestId) ?? null,



//   getAssignmentsForLocation: (locationId) =>

//     get().assignments.filter((a) => a.seating_table_id === locationId),



//   getLocationById: (locationId) =>

//     get().locations.find((l) => l.id === locationId) ?? null,



//   // Derived capacity stats

//   getStats: () => {

//     const { locations, assignments } = get();

//     const totalCapacity = locations.reduce((s, l) => s + (l.capacity || 0), 0);

//     const assigned = assignments.length;

//     return {

//       totalCapacity,

//       assigned,

//       unassigned: Math.max(0, totalCapacity - assigned),

//       fillRate: totalCapacity > 0 ? Math.round((assigned / totalCapacity) * 100) : 0,

//       tableCount: locations.length,

//     };

//   },

// }));


