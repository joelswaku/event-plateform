"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

// Admin routes are mounted under /ticket-types in the API router
const A = (path) => `/ticket-types${path}`;

export const useTicketStore = create((set) => ({
  tickets: [],
  orders:  [],
  stats:   null,
  loading: false,

  /* ── Admin ─────────────────────────────────────────────── */
  fetchTickets: async (eventId) => {
    set({ loading: true });
    try {
      const res = await api.get(A(`/events/${eventId}/tickets`));
      set({ tickets: res.data.tickets ?? [] });
    } finally {
      set({ loading: false });
    }
  },

  createTicket: async (eventId, payload) => {
    const res = await api.post(A(`/events/${eventId}/tickets`), payload);
    set((s) => ({ tickets: [...s.tickets, res.data.data] }));
    return res.data.data;
  },

  updateTicket: async (ticketId, payload) => {
    const res = await api.patch(A(`/tickets/${ticketId}`), payload);
    set((s) => ({
      tickets: s.tickets.map((t) => (t.id === ticketId ? res.data.data : t)),
    }));
    return res.data.data;
  },

  deleteTicket: async (ticketId) => {
    await api.delete(A(`/tickets/${ticketId}`));
    set((s) => ({ tickets: s.tickets.filter((t) => t.id !== ticketId) }));
  },

  fetchStats: async (eventId) => {
    const res = await api.get(A(`/events/${eventId}/tickets/stats`));
    set({ stats: res.data.data });
    return res.data.data;
  },

  fetchOrders: async (eventId, { limit = 50, offset = 0 } = {}) => {
    const res = await api.get(A(`/events/${eventId}/orders`), { params: { limit, offset } });
    set({ orders: res.data.orders ?? [] });
    return res.data.orders ?? [];
  },

  /* ── Public (no auth required) ─────────────────────────── */
  fetchPublicTickets: async (eventId) => {
    const res = await api.get(`/public/events/${eventId}/tickets`);
    return res.data.tickets ?? [];
  },

  createOrder: (eventId, payload) =>
    api.post(`/public/events/${eventId}/orders`, payload),

  /* ── Check-in ──────────────────────────────────────────── */
  checkTicket: (eventId, qr_token) =>
    api.post(`/events/${eventId}/tickets/checkin`, { qr_token }),
}));
