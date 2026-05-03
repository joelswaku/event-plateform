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

  fetchTicketTypes:       (eventId: string) => Promise<void>;
  createTicketType:       (eventId: string, payload: Partial<TicketType>) => Promise<{ success: boolean }>;
  updateTicketType:       (ticketId: string, payload: Partial<TicketType>) => Promise<{ success: boolean }>;
  deleteTicketType:       (ticketId: string) => Promise<{ success: boolean }>;
  fetchOrders:            (eventId: string) => Promise<void>;
  fetchStats:             (eventId: string) => Promise<void>;
  fetchEventsWithTickets: () => Promise<void>;
  purchaseTicket:         (eventId: string, payload: PurchaseOrderPayload) => Promise<{ success: boolean; data?: PurchaseOrderResult; message?: string }>;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  ticketTypes:       [],
  orders:            [],
  stats:             null,
  eventsWithTickets: [],
  loading:           false,

  fetchTicketTypes: async (eventId) => {
    set({ loading: true });
    try {
      const res = await api.get<{ tickets: TicketType[] }>(`/ticket-types/events/${eventId}/tickets`);
      set({ ticketTypes: res.data?.tickets ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createTicketType: async (eventId, payload) => {
    try {
      const res    = await api.post<{ data: TicketType }>(`/ticket-types/events/${eventId}/tickets`, payload);
      const ticket = res.data?.data;
      if (ticket) set(s => ({ ticketTypes: [...s.ticketTypes, ticket] }));
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  updateTicketType: async (ticketId, payload) => {
    try {
      const res    = await api.patch<{ data: TicketType }>(`/ticket-types/tickets/${ticketId}`, payload);
      const ticket = res.data?.data;
      if (ticket) set(s => ({ ticketTypes: s.ticketTypes.map(t => t.id === ticketId ? ticket : t) }));
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  deleteTicketType: async (ticketId) => {
    const prev = get().ticketTypes;
    set(s => ({ ticketTypes: s.ticketTypes.filter(t => t.id !== ticketId) }));
    try {
      await api.delete(`/ticket-types/tickets/${ticketId}`);
      return { success: true };
    } catch {
      set({ ticketTypes: prev });
      return { success: false };
    }
  },

  fetchOrders: async (eventId) => {
    try {
      const res = await api.get<{ data: TicketOrder[] }>(`/ticket-types/events/${eventId}/orders`);
      set({ orders: res.data?.data ?? [] });
    } catch { /* non-critical */ }
  },

  fetchStats: async (eventId) => {
    try {
      const res = await api.get<{ data: TicketStats }>(`/ticket-types/events/${eventId}/tickets/stats`);
      set({ stats: res.data?.data ?? null });
    } catch { /* non-critical */ }
  },

  fetchEventsWithTickets: async () => {
    try {
      const res = await api.get<{ data: Event[] }>('/ticket-types/events-with-tickets');
      set({ eventsWithTickets: res.data?.data ?? [] });
    } catch { /* non-critical */ }
  },

  purchaseTicket: async (eventId, payload) => {
    try {
      const res = await api.post<{ data: PurchaseOrderResult }>(
        `/public/events/${eventId}/orders`,
        payload,
      );
      return { success: true, data: res.data?.data };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Purchase failed';
      return { success: false, message };
    }
  },
}));
