"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api, setInMemoryToken, clearInMemoryToken } from "@/lib/api";
import { authSync } from "@/lib/auth-sync";
import { sessionMonitor } from "@/lib/session-monitor";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isHydrated: false,
      _syncUnsubscribe: null,

      setHydrated: () => set({ isHydrated: true }),
      clearError:  () => set({ error: null }),
      setUser:     (user) => set({ user }),

      // Initialize cross-tab sync
      initSync: () => {
        if (typeof window === 'undefined') return;

        const unsubscribe = authSync.subscribe((event) => {
          const state = get();

          switch (event.type) {
            case 'logout':
              // Another tab logged out - logout this tab too
              if (state.isAuthenticated) {
                console.log('Logout detected from another tab');
                sessionMonitor.stop();
                clearInMemoryToken();
                set({
                  user: null,
                  accessToken: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: null,
                });
                // Force navigation to homepage
                window.location.href = '/';
              }
              break;

            case 'login':
              // Another tab logged in - sync user data and navigate
              if (!state.isAuthenticated && event.payload?.user) {
                console.log('Login detected from another tab');
                set({
                  user: event.payload.user,
                  isAuthenticated: true,
                });

                // Navigate to dashboard if on homepage or auth pages
                const currentPath = window.location.pathname;
                const REDIRECT_PATHS = ['/', '/login', '/register', '/forgot-password'];

                if (REDIRECT_PATHS.includes(currentPath)) {
                  console.log('Redirecting to dashboard after login sync from path:', currentPath);
                  window.location.href = '/dashboard';
                }
              }
              break;

            case 'token_refresh':
              // Token refreshed in another tab
              sessionMonitor.reset();
              break;
          }
        });

        set({ _syncUnsubscribe: unsubscribe });

        // Start session monitoring if already authenticated
        if (get().isAuthenticated) {
          sessionMonitor.start(async (reason) => {
            console.log(`Auto-logout triggered: ${reason}`);
            await get().logout();
          });
        }
      },

      login: async ({ email, password }) => {
        try {
          set({ isLoading: true, error: null });

          const res = await api.post("/auth/login", { email, password });

          // Check if email verification is required
          if (res.data?.requiresVerification) {
            set({ isLoading: false });
            return {
              success: false,
              requiresVerification: true,
              verificationToken: res.data.verificationToken,
              message: res.data.message,
            };
          }

          const accessToken =
            res.data?.data?.accessToken || res.data?.accessToken;
          const user = res.data?.data?.user || res.data?.user;

          if (!accessToken || !user) throw new Error("Invalid login response");

          setInMemoryToken(accessToken);
          set({ user, accessToken, isAuthenticated: true, isLoading: false });

          // Broadcast login to other tabs
          authSync.broadcast('login', { user });

          // Start session monitoring
          sessionMonitor.start(async (reason) => {
            console.log(`Auto-logout triggered: ${reason}`);
            await get().logout();
          });

          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || err.message || "Login failed";
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
          return { success: true, data: res.data, message: res.data?.message || "Account created" };
        } catch (err) {
          const message = err.response?.data?.message || err.message || "Register failed";
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      refreshToken: async () => {
        try {
          const res = await api.post("/auth/refresh-token");

          const accessToken =
            res.data?.data?.accessToken || res.data?.accessToken;

          if (!accessToken) throw new Error("Invalid refresh response");

          setInMemoryToken(accessToken);
          set({ accessToken, isAuthenticated: true });

          // Broadcast token refresh to reset activity timers in other tabs
          authSync.broadcast('token_refresh');

          // Reset activity timer
          sessionMonitor.reset();

          return accessToken;
        } catch {
          // Return null — the interceptor already handles cleanup.
          // Do NOT call logout() here: it makes an API request that
          // re-enters the 401 interceptor queue and causes a deadlock.
          return null;
        }
      },

      fetchMe: async () => {
        try {
          const res = await api.get("/auth/me");
          const user = res.data?.data || res.data?.user;

          if (!user) throw new Error("Invalid user data");

          set({ user, isAuthenticated: true });
          return user;
        } catch (err) {
          // Only logout on 401 — a 429 rate-limit or transient error
          // must not clear a valid session.
          if (err.response?.status === 401) {
            await get().logout();
          }
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
          return { success: true, message: res.data?.message || "Reset link sent" };
        } catch (err) {
          const message = err.response?.data?.message || err.message || "Failed to send reset link";
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      resetPassword: async ({ token, newPassword }) => {
        try {
          set({ isLoading: true, error: null });

          if (!token || !newPassword) throw new Error("Token and password required");

          const res = await api.post("/auth/reset-password", { token, password: newPassword });

          if (res.data?.success === false) {
            throw new Error(res.data.message || "Reset failed");
          }

          set({ isLoading: false });
          return { success: true, message: res.data?.message || "Password updated" };
        } catch (err) {
          const message = err.response?.data?.message || err.message || "Reset password failed";
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
          const message = err.response?.data?.message || "Email verification failed";
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      googleLogin: async ({ access_token }) => {
        try {
          set({ isLoading: true, error: null });

          const res = await api.post("/auth/google", { access_token });

          const accessToken =
            res.data?.data?.accessToken || res.data?.accessToken;
          const user = res.data?.data?.user || res.data?.user;

          if (!accessToken || !user) throw new Error("Invalid Google login response");

          setInMemoryToken(accessToken);
          set({ user, accessToken, isAuthenticated: true, isLoading: false });

          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || err.message || "Google login failed";
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      updateProfile: async ({ full_name }) => {
        try {
          const res = await api.patch("/auth/profile", { full_name });
          const user = res.data?.data?.user;
          if (user) set({ user });
          return { success: true };
        } catch (err) {
          return { success: false, message: err?.response?.data?.message || "Update failed" };
        }
      },

      changePassword: async ({ currentPassword, newPassword }) => {
        try {
          await api.patch("/auth/password", { currentPassword, newPassword });
          return { success: true };
        } catch (err) {
          return { success: false, message: err?.response?.data?.message || "Failed to change password" };
        }
      },

      updateAvatar: async (file) => {
        try {
          const form = new FormData();
          form.append("file", file);
          const res = await api.patch("/auth/avatar", form, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const avatarUrl = res.data?.data?.avatar_url;
          if (avatarUrl) {
            set((s) => ({ user: s.user ? { ...s.user, avatar_url: avatarUrl } : s.user }));
          }
          return { success: true, avatar_url: avatarUrl };
        } catch (err) {
          return { success: false, message: err?.response?.data?.message || "Upload failed" };
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // ignore backend logout failure
        } finally {
          // Stop session monitoring
          sessionMonitor.stop();

          // Broadcast logout to other tabs
          authSync.broadcast('logout');

          clearInMemoryToken();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Redirect to homepage after logout
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : undefined
      ),
      // accessToken intentionally excluded — stored in memory only, never localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
