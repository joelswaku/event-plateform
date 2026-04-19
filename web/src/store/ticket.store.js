"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useTicketStore = create((set) => ({
  tickets: [],
  orders: [],
  loading: false,

  /* ADMIN */
  fetchTickets: async (eventId) => {
    const res = await api.get(`/events/${eventId}/tickets`);
    set({ tickets: res.data.data });
  },

  createTicket: (eventId, payload) =>
    api.post(`/events/${eventId}/tickets`, payload),

  /* PUBLIC */
  fetchPublicTickets: async (eventId) => {
    const res = await api.get(`/public/events/${eventId}/tickets`);
    return res.data.data;
  },

  createOrder: (eventId, payload) =>
    api.post(`/public/events/${eventId}/orders`, payload),

  /* CHECK-IN */
  checkTicket: (eventId, qr_token) =>
    api.post(`/events/${eventId}/tickets/checkin`, { qr_token }),
}));