
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      clearError: () => set({ error: null }),

  
    //     try {
    //       set({ isLoading: true, error: null });

    //       const res = await api.post("/auth/login", { email, password });
    //       const { accessToken, user } = res.data.data;

    //       set({
    //         user,
    //         accessToken,
    //         isAuthenticated: true,
    //         isLoading: false,
    //       });

    //       return { success: true };
    //     } catch (err) {
    //       const message = err.response?.data?.message || "Login failed";
    //       set({ error: message, isLoading: false });
    //       return { success: false, message };
    //     }
    //   },
    login: async ({ email, password }) => {
        try {
          set({ isLoading: true, error: null });
      
          const res = await api.post("/auth/login", { email, password });
      
          console.log("LOGIN RESPONSE:", res.data);
      
          const accessToken =
            res.data?.data?.accessToken || res.data?.accessToken;
      
          const user =
            res.data?.data?.user || res.data?.user;
      
          if (!accessToken || !user) {
            throw new Error("Invalid login response");
          }
      
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
      
          return { success: true };
      
        } catch (err) {
          const message =
            err.response?.data?.message ||
            err.message ||
            "Login failed";
      
          set({ error: message, isLoading: false });
      
          return { success: false, message };
        }
      },
      register: async (data) => {
        try {
          set({ isLoading: true, error: null });
      
          const res = await api.post("/auth/register", data);
      
          if (res.data?.success === false) {
            throw new Error(res.data.message || "Register failed");
          }
      
          set({ isLoading: false });
      
          return {
            success: true,
            data: res.data,
            message: res.data?.message || "Account created",
          };
      
        } catch (err) {
          const message =
            err.response?.data?.message ||
            err.message ||
            "Register failed";
      
          set({ error: message, isLoading: false });
      
          return { success: false, message };
        }
      },

      refreshToken: async () => {
        try {
          const res = await api.post("/auth/refresh-token");
      
          const accessToken =
            res.data?.data?.accessToken || res.data?.accessToken;
      
          if (!accessToken) {
            throw new Error("Invalid refresh response");
          }
      
          set({
            accessToken,
            isAuthenticated: true,
          });
      
          return accessToken;
      
        } catch (err) {
          await get().logout();
          return null;
        }
      },
      fetchMe: async () => {
        try {
          const res = await api.get("/auth/me");
      
          const user = res.data?.data || res.data?.user;
      
          if (!user) {
            throw new Error("Invalid user data");
          }
      
          set({
            user,
            isAuthenticated: true,
          });
      
          return user;
      
        } catch (err) {
          await get().logout();
          return null;
        }
      },
      forgotPassword: async (data) => {
        try {
          set({ isLoading: true, error: null });
      
          const res = await api.post("/auth/request-password-reset", data);
      
          if (res.data?.success === false) {
            throw new Error(res.data.message || "Request failed");
          }
      
          set({ isLoading: false });
      
          return {
            success: true,
            message: res.data?.message || "Reset link sent",
          };
      
        } catch (err) {
          const message =
            err.response?.data?.message ||
            err.message ||
            "Failed to send reset link";
      
          set({ error: message, isLoading: false });
      
          return { success: false, message };
        }
      },

      resetPassword: async ({ token, newPassword }) => {
        try {
          set({ isLoading: true, error: null });
      
          if (!token || !newPassword) {
            throw new Error("Token and password required");
          }
      
          const res = await api.post("/auth/reset-password", {
            token,
            newPassword,
          });
      
          if (res.data?.success === false) {
            throw new Error(res.data.message || "Reset failed");
          }
      
          set({ isLoading: false });
      
          return {
            success: true,
            message: res.data?.message || "Password updated",
          };
      
        } catch (err) {
          const message =
            err.response?.data?.message ||
            err.message ||
            "Reset password failed";
      
          set({ error: message, isLoading: false });
      
          return { success: false, message };
        }
      },
      verifyEmail: async (data) => {
        try {
          set({ isLoading: true, error: null });

          const res = await api.post("/auth/verify-email", data);

          set({ isLoading: false });
          return { success: true, data: res.data };
        } catch (err) {
          const message =
            err.response?.data?.message || "Email verification failed";
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },
      googleLogin: async ({ id_token }) => {
        try {
          set({ isLoading: true, error: null });
      
          const res = await api.post("/auth/google", { id_token });
      
          const accessToken =
            res.data?.data?.accessToken || res.data?.accessToken;
      
          const user =
            res.data?.data?.user || res.data?.user;
      
          if (!accessToken || !user) {
            throw new Error("Invalid Google login response");
          }
      
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
      
          return { success: true };
        } catch (err) {
          const message =
            err.response?.data?.message ||
            err.message ||
            "Google login failed";
      
          set({ error: message, isLoading: false });
      
          return { success: false, message };
        }
      },
    //   googleLogin: async (data) => {
    //     try {
    //       set({ isLoading: true, error: null });
      
    //       const res = await api.post("/auth/google", data);
      
    //       const accessToken =
    //         res.data?.data?.accessToken || res.data?.accessToken;
      
    //       const user =
    //         res.data?.data?.user || res.data?.user;
      
    //       if (!accessToken || !user) {
    //         throw new Error("Invalid Google login response");
    //       }
      
    //       set({
    //         user,
    //         accessToken,
    //         isAuthenticated: true,
    //         isLoading: false,
    //       });
      
    //       return { success: true };
      
    //     } catch (err) {
    //       const message =
    //         err.response?.data?.message ||
    //         err.message ||
    //         "Google login failed";
      
    //       set({ error: message, isLoading: false });
      
    //       return { success: false, message };
    //     }
    //   },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (_) {
          // ignore backend logout failure
        } finally {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : undefined
      ),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
