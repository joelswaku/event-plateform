"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, setVendorToken, clearVendorToken } from "@/lib/api";

export const useVendorStore = create(
  persist(
    (set, get) => ({
      vendor: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post("/vendors/auth/login", { email, password });
          const { token, vendor } = res.data.data;
          setVendorToken(token);
          set({ vendor, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || "Login failed" };
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post("/vendors/auth/register", data);
          const { token, vendor } = res.data.data;
          setVendorToken(token);
          set({ vendor, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || "Registration failed" };
        }
      },

      logout: () => {
        clearVendorToken();
        set({ vendor: null, token: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const res = await api.get("/vendors/me");
          set({ vendor: res.data.data, isAuthenticated: true });
        } catch {}
      },

      updateProfile: async (data) => {
        try {
          const res = await api.patch("/vendors/me", data);
          set({ vendor: res.data.data });
          return { success: true };
        } catch (err) {
          return { success: false, message: err.response?.data?.message || "Update failed" };
        }
      },

      hydrate: () => {
        const token = get().token;
        if (token) { setVendorToken(token); get().fetchMe(); }
      },
    }),
    { name: "vendor-auth", partialize: (s) => ({ token: s.token, vendor: s.vendor, isAuthenticated: s.isAuthenticated }) }
  )
);
