import { create } from 'zustand';
import api from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SAStats {
  totalUsers:     number;
  totalEvents:    number;
  totalOrgs:      number;
  totalRevenue:   number;
  totalTickets:   number;
  activeEvents:   number;
  newUsersLast30: number;
}

export interface SARevenue {
  monthly?:   Array<{ month: string; tickets: number; revenue: string | number }>;
  topEvents?: Array<{ id: string; title: string; org_name?: string; ticket_count?: number; revenue: string | number }>;
  topOrgs?:   Array<{ id: string; name: string; event_count?: number; ticket_count?: number; revenue: string | number }>;
}

export interface SAFinancial {
  gmv?:               string | number;
  netRevenue?:        string | number;
  estimatedFees?:     string | number;
  totalTransactions?: number;
  avgTransaction?:    string | number;
  last24h?:           { revenue: string | number; tickets: number };
  last7d?:            { revenue: string | number; tickets: number };
  daily30?:           Array<{ day: string; revenue: string | number }>;
  topBuyers?:         Array<{ buyer_name: string; buyer_email: string; tickets: number; total_spent: string | number }>;
}

export interface SAEvent {
  id:          string;
  title:       string;
  status:      string;
  org_name?:   string;
  owner_email?: string;
  guest_count?: number;
  ticket_count?: number;
  revenue?:    string | number;
  starts_at?:  string;
  created_at?: string;
}

export interface SAOrg {
  id:           string;
  name:         string;
  owner_name?:  string;
  owner_email?: string;
  plan?:        string;
  event_count?: number;
  member_count?: number;
  created_at?:  string;
}

export interface SAVendor {
  id:                  string;
  business_name:       string;
  slug:                string;
  category:            string;
  email:               string;
  phone?:              string;
  city?:               string;
  country?:            string;
  verification_status: string;
  is_active:           boolean;
  is_featured:         boolean;
  tier?:               string;
  rating?:             number;
  review_count?:       number;
  inquiry_count?:      number;
  booking_count?:      number;
  profile_views?:      number;
  logo_url?:           string;
  base_price?:         number;
  created_at?:         string;
}

export interface SAVendorStats {
  total:            number;
  active:           number;
  verified:         number;
  pending:          number;
  total_inquiries:  number;
  total_reviews:    number;
}

export interface SAUser {
  id:             string;
  full_name:      string;
  email:          string;
  plan?:          string;
  is_active?:     boolean;
  is_super_admin?: boolean;
  status?:        string;
  created_at?:    string;
  last_login_at?: string;
  avatar_url?:    string;
}

export interface SAActivity {
  id:         string;
  type:       string;
  title:      string;
  subtitle?:  string;
  created_at: string;
  amount?:    string | number;
}

export interface SAHealth {
  services: Array<{ name: string; status: 'healthy' | 'degraded' | 'down'; latency?: number }>;
  metrics:  {
    total_users?:      number;
    total_events?:     number;
    total_tickets?:    number;
    active_users_24h?: number;
  };
  uptime?: string;
}

export interface SAFlag {
  id:           string;
  key:          string;
  name:         string;
  description?: string;
  enabled:      boolean;
  updated_by?:  string;
  updated_at?:  string;
}

export interface SAModeration {
  suspiciousTickets: Array<{
    buyer_email:   string;
    buyer_name:    string;
    ticket_count:  number;
    total_spent:   string | number;
    last_activity: string;
  }>;
  highVelocity: Array<{
    title:             string;
    org_name:          string;
    tickets_last_hour: number;
    revenue_last_hour: string | number;
  }>;
  suspended: Array<{
    full_name:  string;
    email:      string;
    status:     string;
    updated_at: string;
  }>;
}

export interface SAAiInsight {
  id?:         string;
  type:        string;
  priority:    'high' | 'medium' | 'low';
  title:       string;
  description: string;
  metric?:     string;
}

export interface SAAuditLog {
  id:            string;
  created_at:    string;
  admin_email:   string;
  action:        string;
  resource_type?: string;
  resource_id?:  string;
  ip_address?:   string;
}

export interface SAMeta {
  total:    number;
  page:     number;
  per_page: number;
  limit?:   number;
}

// ─── Store state ───────────────────────────────────────────────────────────────

interface SuperAdminState {
  stats:       SAStats | null;
  revenue:     SARevenue | null;
  financial:   SAFinancial | null;
  events:      SAEvent[];
  eventsMeta:  SAMeta | null;
  orgs:        SAOrg[];
  orgsMeta:    SAMeta | null;
  users:       SAUser[];
  usersMeta:   SAMeta | null;
  activity:    SAActivity[];
  health:      SAHealth | null;
  flags:       SAFlag[];
  moderation:  SAModeration | null;
  auditLogs:   SAAuditLog[];
  auditMeta:   SAMeta | null;
  aiInsights:  SAAiInsight[];
  loading:     boolean;

  fetchStats:      () => Promise<void>;
  fetchRevenue:    () => Promise<void>;
  fetchFinancial:  () => Promise<void>;
  fetchEvents:     (params?: { search?: string; q?: string; status?: string; page?: number }) => Promise<void>;
  fetchOrgs:       (params?: { search?: string; q?: string; page?: number }) => Promise<void>;
  fetchUsers:      (params?: { search?: string; q?: string; page?: number }) => Promise<void>;
  updateUser:      (id: string, data: Partial<SAUser>) => Promise<void>;
  updateEvent:     (id: string, data: Partial<SAEvent>) => Promise<void>;
  deleteEvent:     (id: string) => Promise<void>;
  fetchActivity:   () => Promise<void>;
  fetchHealth:     () => Promise<void>;
  fetchFlags:      () => Promise<void>;
  updateFlag:      (keyOrId: string, enabled: boolean) => Promise<void>;
  fetchModeration: () => Promise<void>;
  fetchAuditLogs:  (params?: { page?: number; limit?: number; action?: string; user_email?: string; organization_id?: string; from?: string; to?: string }) => Promise<void>;
  fetchAiInsights: () => Promise<void>;

  // Vendors
  vendors:            SAVendor[];
  vendorsMeta:        SAMeta | null;
  vendorStats:        SAVendorStats | null;
  fetchAdminVendors:  (params?: Record<string, string | number>) => Promise<void>;
  updateAdminVendor:  (id: string, data: Partial<SAVendor>) => Promise<void>;
  deleteAdminVendor:  (id: string) => Promise<void>;

  // Broadcasts
  broadcasts:        SABroadcast[];
  broadcastStats:    SABroadcastStats | null;
  fetchBroadcasts:   (params?: { status?: string }) => Promise<void>;
  fetchBroadcastStats: () => Promise<void>;
  createBroadcast:   (data: Partial<SABroadcast>) => Promise<{ success: boolean; broadcast?: SABroadcast; message?: string }>;
  updateBroadcast:   (id: string, data: Partial<SABroadcast>) => Promise<{ success: boolean }>;
  deleteBroadcast:   (id: string) => Promise<void>;
  sendBroadcast:     (id: string) => Promise<{ success: boolean; sent_count?: number; message?: string }>;
}

export interface SABroadcast {
  id:           string;
  title:        string;
  body:         string;
  image_url:    string | null;
  deep_link:    string | null;
  audience:     string;
  status:       'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_at: string | null;
  sent_at:      string | null;
  sent_count:   number;
  created_by_name?: string;
  created_at:   string;
}

export interface SABroadcastStats {
  totals:     { total: string; sent: string; scheduled: string; draft: string; total_delivered: string };
  byAudience: Array<{ audience: string; count: string }>;
  recentSent: SABroadcast[];
}

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useSuperAdminStore = create<SuperAdminState>((set) => ({
  stats:      null,
  revenue:    null,
  financial:  null,
  events:     [],
  eventsMeta: null,
  orgs:       [],
  orgsMeta:   null,
  users:      [],
  usersMeta:  null,
  activity:   [],
  health:     null,
  flags:      [],
  moderation: null,
  auditLogs:  [],
  vendors:     [],
  vendorsMeta: null,
  vendorStats: null,
  auditMeta:  null,
  aiInsights: [],
  loading:    false,

  fetchStats: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/stats');
      set({ stats: res.data?.data ?? res.data });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchRevenue: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/revenue');
      set({ revenue: res.data?.data ?? res.data });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchFinancial: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/financial');
      set({ financial: res.data?.data ?? res.data });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchEvents: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/events', { params });
      const d   = res.data?.data;
      if (Array.isArray(d)) {
        set({ events: d, eventsMeta: res.data?.meta ?? null });
      } else if (d && Array.isArray(d.events)) {
        set({ events: d.events, eventsMeta: d.meta ?? null });
      } else {
        set({ events: Array.isArray(res.data) ? res.data : [] });
      }
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchOrgs: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/organizations', { params });
      const d   = res.data?.data;
      if (Array.isArray(d)) {
        set({ orgs: d, orgsMeta: res.data?.meta ?? null });
      } else if (d && Array.isArray(d.organizations)) {
        set({ orgs: d.organizations, orgsMeta: d.meta ?? null });
      } else {
        set({ orgs: Array.isArray(res.data) ? res.data : [] });
      }
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchUsers: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/users', { params });
      const d   = res.data?.data;
      if (Array.isArray(d)) {
        set({ users: d, usersMeta: res.data?.meta ?? null });
      } else if (d && Array.isArray(d.users)) {
        set({ users: d.users, usersMeta: d.meta ?? null });
      } else {
        set({ users: Array.isArray(res.data) ? res.data : [] });
      }
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  updateUser: async (id, data) => {
    try {
      await api.patch(`/super-admin/users/${id}`, data);
      set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) }));
    } catch { /* silent */ }
  },

  updateEvent: async (id, data) => {
    try {
      const res = await api.patch(`/super-admin/events/${id}`, data);
      set(state => ({
        events: state.events.map(e => e.id === id ? { ...e, ...(res.data?.data ?? data) } : e),
      }));
    } catch { /* silent */ }
  },

  deleteEvent: async (id) => {
    try {
      await api.delete(`/super-admin/events/${id}`);
      set(state => ({ events: state.events.filter(e => e.id !== id) }));
    } catch { /* silent */ }
  },

  fetchActivity: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/activity');
      set({ activity: Array.isArray(res.data?.data) ? res.data.data : [] });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchHealth: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/health');
      set({ health: res.data?.data ?? res.data });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchFlags: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/flags');
      set({ flags: Array.isArray(res.data?.data) ? res.data.data : [] });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  updateFlag: async (keyOrId, enabled) => {
    try {
      await api.patch(`/super-admin/flags/${keyOrId}`, { enabled });
      set(state => ({
        flags: state.flags.map(f =>
          (f.id === keyOrId || f.key === keyOrId) ? { ...f, enabled } : f
        ),
      }));
    } catch { /* silent */ }
  },

  fetchModeration: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/moderation');
      set({ moderation: res.data?.data ?? null });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchAuditLogs: async ({ page = 1, limit = 30, action, user_email, organization_id, from, to } = {}) => {
    set({ loading: true });
    try {
      const params: Record<string, any> = { page, limit };
      if (action)          params.action          = action;
      if (user_email)      params.user_email      = user_email;
      if (organization_id) params.organization_id = organization_id;
      if (from)            params.from            = from;
      if (to)              params.to              = to;
      const res = await api.get('/super-admin/audit-logs', { params });
      set({ auditLogs: res.data?.data ?? [], auditMeta: res.data?.meta ?? null });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchAiInsights: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/ai-insights');
      const d   = res.data?.data;
      const arr = Array.isArray(d) ? d : (Array.isArray(d?.insights) ? d.insights : []);
      set({ aiInsights: arr });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  // ── Vendors ────────────────────────────────────────────────────────────
  vendors:      [],
  vendorsMeta:  null,
  vendorStats:  null,

  fetchAdminVendors: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/vendors', { params });
      const d   = res.data?.data;
      set({ vendors: d?.vendors ?? [], vendorsMeta: { total: d?.total ?? 0, pages: d?.pages ?? 1 }, vendorStats: d?.stats ?? null });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  updateAdminVendor: async (id, data) => {
    try {
      const res = await api.patch(`/super-admin/vendors/${id}`, data);
      set((s) => ({ vendors: s.vendors.map((v) => v.id === id ? { ...v, ...res.data?.data } : v) }));
    } catch { /* silent */ }
  },

  deleteAdminVendor: async (id) => {
    try {
      await api.delete(`/super-admin/vendors/${id}`);
      set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) }));
    } catch { /* silent */ }
  },

  // ── Broadcasts ───────────────────────────────────────────────────────────────
  broadcasts:     [],
  broadcastStats: null,

  fetchBroadcasts: async (params = {}) => {
    set({ loading: true });
    try {
      const res = await api.get('/super-admin/broadcasts', { params: { limit: 50, ...params } });
      set({ broadcasts: res.data?.broadcasts ?? [] });
    } catch { /* silent */ }
    finally { set({ loading: false }); }
  },

  fetchBroadcastStats: async () => {
    try {
      const res = await api.get('/super-admin/broadcasts/stats');
      set({ broadcastStats: res.data?.stats ?? null });
    } catch { /* silent */ }
  },

  createBroadcast: async (data) => {
    try {
      const res = await api.post('/super-admin/broadcasts', data);
      const broadcast = res.data?.broadcast;
      if (broadcast) set((s) => ({ broadcasts: [broadcast, ...s.broadcasts] }));
      return { success: true, broadcast };
    } catch (e: any) {
      return { success: false, message: e?.response?.data?.message || 'Failed' };
    }
  },

  updateBroadcast: async (id, data) => {
    try {
      const res = await api.patch(`/super-admin/broadcasts/${id}`, data);
      const updated = res.data?.broadcast;
      if (updated) set((s) => ({ broadcasts: s.broadcasts.map(b => b.id === id ? updated : b) }));
      return { success: true };
    } catch { return { success: false }; }
  },

  deleteBroadcast: async (id) => {
    try {
      await api.delete(`/super-admin/broadcasts/${id}`);
      set((s) => ({ broadcasts: s.broadcasts.filter(b => b.id !== id) }));
    } catch { /* silent */ }
  },

  sendBroadcast: async (id) => {
    try {
      // Optimistically mark as sending
      set((s) => ({ broadcasts: s.broadcasts.map(b => b.id === id ? { ...b, status: 'sending' as const } : b) }));
      const res = await api.post(`/super-admin/broadcasts/${id}/send`);
      // Refresh to get accurate sent_count
      const refresh = await api.get('/super-admin/broadcasts', { params: { limit: 50 } });
      set({ broadcasts: refresh.data?.broadcasts ?? [] });
      return { success: true, sent_count: res.data?.sent_count };
    } catch (e: any) {
      set((s) => ({ broadcasts: s.broadcasts.map(b => b.id === id ? { ...b, status: 'failed' as const } : b) }));
      return { success: false, message: e?.response?.data?.message || 'Send failed' };
    }
  },
}));
