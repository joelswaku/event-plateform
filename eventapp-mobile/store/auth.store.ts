import { create } from 'zustand';
import api, { setToken, clearToken, setOrgId, clearOrgId } from '@/lib/api';
import { persistSession, loadSession, clearSession } from '@/lib/secure-storage';
import { User } from '@/types';

interface AuthState {
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  isHydrated:      boolean;
  error:           string | null;

  // Actions
  hydrate:      () => Promise<void>;
  login:        (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register:     (data: { full_name: string; email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  googleLogin:  (idToken: string) => Promise<{ success: boolean; message?: string }>;
  refreshToken: (storedToken?: string | null) => Promise<string | null>;
  fetchMe:      () => Promise<void>;
  logout:       () => Promise<void>;
  clearError:   () => void;
}

function applyUser(user: User) {
  if (user.default_organization_id) setOrgId(user.default_organization_id);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  isHydrated:      false,
  error:           null,

  // ─── Hydrate from SecureStore on app launch ──────────────────────────────
  hydrate: async () => {
    try {
      const { user, isAuthenticated, refreshToken } = await loadSession();
      if (user) applyUser(user);
      set({ user, isAuthenticated, isHydrated: true });

      if (isAuthenticated) {
        if (!refreshToken) {
          await clearSession();
          set({ user: null, isAuthenticated: false });
        } else {
          const newToken = await get().refreshToken(refreshToken);
          if (!newToken) {
            await clearSession();
            set({ user: null, isAuthenticated: false });
          }
        }
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  // ─── Login ───────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res          = await api.post<{ data: { accessToken: string; refreshToken: string; user: User } }>('/auth/login', { email, password });
      const accessToken  = res.data?.data?.accessToken;
      const refreshToken = res.data?.data?.refreshToken;
      const user         = res.data?.data?.user;
      if (!accessToken || !user) throw new Error('Invalid login response');

      setToken(accessToken);
      applyUser(user);
      await persistSession(user, true, refreshToken ?? undefined);
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Login failed');
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // ─── Register ────────────────────────────────────────────────────────────
  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', data);
      set({ isLoading: false });
      return { success: true, message: 'Account created! Please log in.' };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Registration failed');
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // ─── Google OAuth ────────────────────────────────────────────────────────
  googleLogin: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const res          = await api.post<{ data: { accessToken: string; refreshToken: string; user: User } }>('/auth/google', { id_token: idToken });
      const accessToken  = res.data?.data?.accessToken;
      const refreshToken = res.data?.data?.refreshToken;
      const user         = res.data?.data?.user;
      if (!accessToken || !user) throw new Error('Invalid Google login response');

      setToken(accessToken);
      applyUser(user);
      await persistSession(user, true, refreshToken ?? undefined);
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return { success: true };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Google login failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // ─── Refresh token ────────────────────────────────────────────────────────
  refreshToken: async (storedToken?) => {
    if (!storedToken) return null;
    try {
      const res             = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh-token', { refreshToken: storedToken });
      const newAccessToken  = res.data?.accessToken;
      const newRefreshToken = res.data?.refreshToken;
      if (!newAccessToken) throw new Error('No token');

      setToken(newAccessToken);
      if (newRefreshToken) {
        const { user } = get();
        if (user) await persistSession(user, true, newRefreshToken);
      }
      set({ isAuthenticated: true });
      return newAccessToken;
    } catch {
      return null;
    }
  },

  // ─── Fetch current user ───────────────────────────────────────────────────
  fetchMe: async () => {
    try {
      const res  = await api.get<{ data: User }>('/auth/me');
      const user = res.data?.data;
      if (user) {
        applyUser(user);
        await persistSession(user, true);
        set({ user });
      }
    } catch { /* silent */ }
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout: async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearToken();
    clearOrgId();
    await clearSession();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
