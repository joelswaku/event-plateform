"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

let _token = null;
const orgApi = axios.create({ baseURL: BASE, withCredentials: true, timeout: 15000 });
orgApi.interceptors.request.use((cfg) => {
  if (_token) cfg.headers.Authorization = `Bearer ${_token}`;
  return cfg;
});

export const setOrganizerToken = (t) => { _token = t; };
export const clearOrganizerToken = () => { _token = null; };

export const useOrganizerStore = create(
  persist(
    (set, get) => ({
      organizer:       null,
      token:           null,
      isAuthenticated: false,
      isLoading:       false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await orgApi.post("/organizers/auth/login", { email, password });
          const { token, organizer } = res.data.data;
          setOrganizerToken(token);
          set({ organizer, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || "Login failed" };
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await orgApi.post("/organizers/auth/register", data);
          const { token, organizer } = res.data.data;
          setOrganizerToken(token);
          set({ organizer, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || "Registration failed" };
        }
      },

      logout: () => {
        clearOrganizerToken();
        set({ organizer: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const res = await orgApi.get("/organizers/me");
          set({ organizer: res.data.data, isAuthenticated: true });
        } catch {}
      },

      updateProfile: async (data) => {
        try {
          const res = await orgApi.patch("/organizers/me", data);
          set({ organizer: res.data.data });
          return { success: true };
        } catch (err) {
          return { success: false, message: err.response?.data?.message || "Update failed" };
        }
      },

      saveVendor: async (vendorId) => {
        try {
          await orgApi.post(`/organizers/me/saved/${vendorId}`);
          return { success: true };
        } catch { return { success: false }; }
      },

      unsaveVendor: async (vendorId) => {
        try {
          await orgApi.delete(`/organizers/me/saved/${vendorId}`);
          return { success: true };
        } catch { return { success: false }; }
      },

      hydrate: () => {
        const token = get().token;
        if (token) { setOrganizerToken(token); get().fetchMe(); }
      },
    }),
    {
      name: "organizer-auth",
      partialize: (s) => ({ token: s.token, organizer: s.organizer, isAuthenticated: s.isAuthenticated }),
    }
  )
);

export { orgApi };
