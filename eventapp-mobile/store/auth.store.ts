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
  updateAvatar: (uri: string, mimeType?: string, fileName?: string) => Promise<{ success: boolean; avatar_url?: string; message?: string }>;
  logout:       () => Promise<void>;
  clearError:   () => void;
  setUser:      (user: User) => void;
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
      const res = await api.post<any>('/auth/login', { email, password });
      console.log('AUTH STORE: Login API Response:', JSON.stringify(res.data, null, 2)); // DEBUG

      // Check if email verification is required
      if (res.data?.requiresVerification) {
        console.log('AUTH STORE: Verification required, returning verification response'); // DEBUG
        set({ isLoading: false });
        const verificationResponse = {
          success: false,
          requiresVerification: true,
          verificationToken: res.data.verificationToken,
          message: res.data.message,
        };
        console.log('AUTH STORE: Returning:', JSON.stringify(verificationResponse, null, 2)); // DEBUG
        return verificationResponse;
      }

      const accessToken  = res.data?.data?.accessToken;
      const refreshToken = res.data?.data?.refreshToken;
      const user         = res.data?.data?.user;
      if (!accessToken || !user) throw new Error('Invalid login response');

      // SECURITY: Store tokens securely
      setToken(accessToken);
      applyUser(user);
      await persistSession(user, true, refreshToken ?? undefined);
      set({ user, isAuthenticated: true, isLoading: false, error: null });

      console.log('✅ Login successful, session persisted securely');
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
      const res = await api.post('/auth/register', data);
      console.log('API Register Response:', JSON.stringify(res.data, null, 2)); // DEBUG
      set({ isLoading: false });
      // Return full response data (includes requiresVerification flag)
      const result = { success: true, ...res.data };
      console.log('Returning from auth store:', JSON.stringify(result, null, 2)); // DEBUG
      return result;
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
      const res  = await api.get<{ data: User; user: User }>('/auth/me');
      const user = res.data?.data ?? (res.data as unknown as { user: User })?.user;
      if (user) {
        applyUser(user);
        await persistSession(user, true);
        set({ user });
      }
    } catch { /* silent */ }
  },

  // ─── Upload profile avatar ────────────────────────────────────────────────
  updateAvatar: async (uri, mimeType = 'image/jpeg', fileName = 'avatar.jpg') => {
    try {
      const form = new FormData();
      form.append('file', { uri, type: mimeType, name: fileName } as unknown as Blob);
      const res = await api.patch<{ data: { avatar_url: string } }>('/auth/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const avatarUrl = res.data?.data?.avatar_url;
      if (avatarUrl) {
        const { user } = get();
        if (user) {
          const updated = { ...user, avatar_url: avatarUrl };
          await persistSession(updated, true);
          set({ user: updated });
        }
      }
      return { success: true, avatar_url: avatarUrl };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed';
      return { success: false, message };
    }
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
  setUser:    (user: User) => set({ user }),
}));
