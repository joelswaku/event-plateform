"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useSuperAdminStore = create((set, get) => ({
  stats:         null,
  revenue:       null,
  events:        [],
  eventsMeta:    null,
  orgs:          [],
  orgsMeta:      null,
  users:         [],
  usersMeta:     null,
  orgDetail:     null,
  loading:       false,
  error:         null,
  activity:      [],
  financial:     null,
  health:        null,
  flags:         [],
  moderation:    null,
  auditLogs:     [],
  auditMeta:     null,
  aiInsights:    null,
  searchResults: null,
  searchLoading: false,

  fetchStats: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/super-admin/stats");
      set({ stats: res.data.data, loading: false });
      return { success: true };
    } catch (e) {
      set({ loading: false, error: e?.response?.data?.message || e.message });
      return { success: false };
    }
  },

  fetchRevenue: async () => {
    try {
      set({ loading: true });
      const res = await api.get("/super-admin/revenue");
      set({ revenue: res.data.data, loading: false });
      return { success: true };
    } catch (e) {
      set({ loading: false });
      return { success: false };
    }
  },

  fetchEvents: async ({ page = 1, limit = 50, q = "", status = "" } = {}) => {
    try {
      set({ loading: true });
      const res = await api.get("/super-admin/events", { params: { page, limit, q, status } });
      set({ events: res.data.data, eventsMeta: res.data.meta, loading: false });
      return { success: true };
    } catch (e) {
      set({ loading: false });
      return { success: false };
    }
  },

  fetchOrgs: async ({ page = 1, limit = 50, q = "" } = {}) => {
    try {
      set({ loading: true });
      const res = await api.get("/super-admin/organizations", { params: { page, limit, q } });
      set({ orgs: res.data.data, orgsMeta: res.data.meta, loading: false });
      return { success: true };
    } catch (e) {
      set({ loading: false });
      return { success: false };
    }
  },

  fetchOrgDetail: async (orgId) => {
    try {
      set({ loading: true });
      const res = await api.get(`/super-admin/organizations/${orgId}`);
      set({ orgDetail: res.data.data, loading: false });
      return { success: true };
    } catch (e) {
      set({ loading: false });
      return { success: false };
    }
  },

  fetchUsers: async ({ page = 1, limit = 50, q = "" } = {}) => {
    try {
      set({ loading: true });
      const res = await api.get("/super-admin/users", { params: { page, limit, q } });
      set({ users: res.data.data, usersMeta: res.data.meta, loading: false });
      return { success: true };
    } catch (e) {
      set({ loading: false });
      return { success: false };
    }
  },

  updateUser: async (userId, payload) => {
    try {
      const res = await api.patch(`/super-admin/users/${userId}`, payload);
      set((s) => ({
        users: s.users.map((u) => u.id === userId ? { ...u, ...res.data.data } : u),
      }));
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.message || e.message };
    }
  },

  createEnterpriseOrg: async (payload) => {
    try {
      const res = await api.post("/super-admin/organizations", payload);
      set((s) => ({ orgs: [res.data.data.org, ...s.orgs] }));
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.message || e.message };
    }
  },

  addOrgMember: async (orgId, payload) => {
    try {
      const res = await api.post(`/super-admin/organizations/${orgId}/members`, payload);
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.message || e.message };
    }
  },

  updateOrgPlan: async (orgId, plan) => {
    try {
      const res = await api.patch(`/super-admin/organizations/${orgId}/plan`, { plan });
      set((s) => ({
        orgs: s.orgs.map((o) => o.id === orgId ? { ...o, plan } : o),
      }));
      return { success: true, data: res.data.data };
    } catch (e) {
      return { success: false, error: e?.response?.data?.message || e.message };
    }
  },

  updateEvent: async (eventId, payload) => {
    try {
      const res = await api.patch(`/super-admin/events/${eventId}`, payload);
      set((s) => ({
        events: s.events.map((e) => e.id === eventId ? { ...e, ...res.data.data } : e),
      }));
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.message || e.message };
    }
  },

  deleteEvent: async (eventId) => {
    try {
      await api.delete(`/super-admin/events/${eventId}`);
      set((s) => ({ events: s.events.filter((e) => e.id !== eventId) }));
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.response?.data?.message || e.message };
    }
  },

  fetchActivity: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/activity');
      set({ activity: res.data?.data ?? [], loading: false });
    } catch { set({ loading: false }); }
  },

  fetchFinancial: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/financial');
      set({ financial: res.data?.data ?? null, loading: false });
    } catch { set({ loading: false }); }
  },

  fetchHealth: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/health');
      set({ health: res.data?.data ?? null, loading: false });
    } catch { set({ loading: false }); }
  },

  fetchFlags: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/flags');
      set({ flags: res.data?.data ?? [], loading: false });
    } catch { set({ loading: false }); }
  },

  updateFlag: async (key, enabled) => {
    try {
      const res = await api.patch(`/super-admin/flags/${key}`, { enabled });
      set(s => ({ flags: s.flags.map(f => f.key === key ? res.data?.data ?? f : f) }));
    } catch (e) { console.error(e); }
  },

  fetchModeration: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/moderation');
      set({ moderation: res.data?.data ?? null, loading: false });
    } catch { set({ loading: false }); }
  },

  fetchAuditLogs: async ({ page = 1, limit = 50, action, resource_type, organization_id, user_email, from, to } = {}) => {
    set({ loading: true });
    try {
      const params = { page, limit };
      if (action)          params.action          = action;
      if (resource_type)   params.resource_type   = resource_type;
      if (organization_id) params.organization_id = organization_id;
      if (user_email)      params.user_email      = user_email;
      if (from)            params.from            = from;
      if (to)              params.to              = to;
      const res = await api.get('/super-admin/audit-logs', { params });
      set({ auditLogs: res.data?.data ?? [], auditMeta: res.data?.meta ?? null, loading: false });
    } catch { set({ loading: false }); }
  },

  fetchAiInsights: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/ai-insights');
      set({ aiInsights: res.data?.data ?? null, loading: false });
    } catch { set({ loading: false }); }
  },

  search: async (q) => {
    if (!q || q.length < 2) { set({ searchResults: null }); return; }
    set({ searchLoading: true });
    try {
      const res = await api.get('/super-admin/search', { params: { q } });
      set({ searchResults: res.data?.data ?? null, searchLoading: false });
    } catch { set({ searchLoading: false }); }
  },

  // ── VENDORS ──────────────────────────────────────────────────────────────
  vendors:      [],
  vendorsMeta:  null,
  vendorStats:  null,

  fetchAdminVendors: async (params = {}) => {
    try {
      set({ loading: true });
      const res = await api.get("/super-admin/vendors", { params });
      set({ vendors: res.data.data.vendors, vendorsMeta: { total: res.data.data.total, pages: res.data.data.pages }, vendorStats: res.data.data.stats, loading: false });
      return { success: true };
    } catch (e) {
      set({ loading: false });
      return { success: false };
    }
  },

  updateAdminVendor: async (id, payload) => {
    try {
      const res = await api.patch(`/super-admin/vendors/${id}`, payload);
      set((s) => ({ vendors: s.vendors.map((v) => v.id === id ? { ...v, ...res.data.data } : v) }));
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },

  deleteAdminVendor: async (id) => {
    try {
      await api.delete(`/super-admin/vendors/${id}`);
      set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) }));
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.response?.data?.message || e.message };
    }
  },
}));
