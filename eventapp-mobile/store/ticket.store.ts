import { create } from 'zustand';
import api from '@/lib/api';
import {
  TicketType, TicketOrder, TicketStats,
  PurchaseOrderPayload, PurchaseOrderResult, Event,
} from '@/types';

interface TicketState {
  ticketTypes:       TicketType[];
  orders:            TicketOrder[];
  stats:             TicketStats | null;
  eventsWithTickets: Event[];
  loading:           boolean;

  // Admin
  fetchTicketTypes:       (eventId: string) => Promise<void>;
  fetchStats:             (eventId: string) => Promise<TicketStats | null>;
  fetchOrders:            (eventId: string, opts?: { limit?: number; offset?: number }) => Promise<TicketOrder[]>;
  createTicketType:       (eventId: string, payload: Partial<TicketType>) => Promise<{ success: boolean; data?: TicketType }>;
  updateTicketType:       (ticketId: string, payload: Partial<TicketType>) => Promise<{ success: boolean }>;
  deleteTicketType:       (ticketId: string) => Promise<{ success: boolean }>;
  fetchEventsWithTickets: () => Promise<void>;

  // Public
  fetchPublicTickets: (eventId: string) => Promise<TicketType[]>;
  purchaseTicket:     (eventId: string, payload: PurchaseOrderPayload) => Promise<{ success: boolean; data?: PurchaseOrderResult; message?: string }>;

  // Check-in
  checkTicket: (eventId: string, qrToken: string) => Promise<{ success: boolean; data?: unknown; message?: string }>;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  ticketTypes:       [],
  orders:            [],
  stats:             null,
  eventsWithTickets: [],
  loading:           false,

  // ── Admin ─────────────────────────────────────────────────────────────────────
  fetchTicketTypes: async (eventId) => {
    set({ loading: true });
    try {
      const res = await api.get<{ tickets: TicketType[] }>(`/ticket-types/events/${eventId}/tickets`);
      set({ ticketTypes: res.data?.tickets ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStats: async (eventId) => {
    try {
      const res = await api.get<{ data: TicketStats }>(`/ticket-types/events/${eventId}/tickets/stats`);
      const data = res.data?.data ?? null;
      set({ stats: data });
      return data;
    } catch {
      set({ stats: null });
      return null;
    }
  },

  fetchOrders: async (eventId, { limit = 50, offset = 0 } = {}) => {
    try {
      const res = await api.get<{ orders: TicketOrder[] }>(`/ticket-types/events/${eventId}/orders`, { params: { limit, offset } });
      const orders = res.data?.orders ?? [];
      set({ orders });
      return orders;
    } catch {
      set({ orders: [] });
      return [];
    }
  },

  createTicketType: async (eventId, payload) => {
    try {
      const res    = await api.post<{ data: TicketType }>(`/ticket-types/events/${eventId}/tickets`, payload);
      const ticket = res.data?.data;
      if (ticket) set((s) => ({ ticketTypes: [...s.ticketTypes, ticket] }));
      return { success: true, data: ticket };
    } catch {
      return { success: false };
    }
  },

  updateTicketType: async (ticketId, payload) => {
    try {
      const res    = await api.patch<{ data: TicketType }>(`/ticket-types/tickets/${ticketId}`, payload);
      const ticket = res.data?.data;
      if (ticket) set((s) => ({ ticketTypes: s.ticketTypes.map((t) => t.id === ticketId ? ticket : t) }));
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  deleteTicketType: async (ticketId) => {
    const prev = get().ticketTypes;
    set((s) => ({ ticketTypes: s.ticketTypes.filter((t) => t.id !== ticketId) }));
    try {
      await api.delete(`/ticket-types/tickets/${ticketId}`);
      return { success: true };
    } catch {
      set({ ticketTypes: prev });
      return { success: false };
    }
  },

  fetchEventsWithTickets: async () => {
    try {
      const res = await api.get<{ data: Event[] }>('/ticket-types/events-with-tickets');
      set({ eventsWithTickets: res.data?.data ?? [] });
    } catch { /* non-critical */ }
  },

  // ── Public ────────────────────────────────────────────────────────────────────
  fetchPublicTickets: async (eventId) => {
    try {
      const res = await api.get<{ tickets: TicketType[] }>(`/public/events/${eventId}/tickets`);
      return res.data?.tickets ?? [];
    } catch {
      return [];
    }
  },

  purchaseTicket: async (eventId, payload) => {
    try {
      const res = await api.post<{ data: PurchaseOrderResult }>(`/public/events/${eventId}/orders`, payload);
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Purchase failed';
      return { success: false, message };
    }
  },

  // ── Check-in ──────────────────────────────────────────────────────────────────
  checkTicket: async (eventId, qrToken) => {
    try {
      const res = await api.post(`/events/${eventId}/tickets/checkin`, { qr_token: qrToken });
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Check-in failed';
      return { success: false, message };
    }
  },
}));
