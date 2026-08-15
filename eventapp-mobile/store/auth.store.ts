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
  login:        (email: string, password: string) => Promise<AuthActionResult>;
  register:     (data: { full_name: string; email: string; password: string }) => Promise<AuthActionResult>;
  verifyEmail:  (token: string, code: string) => Promise<AuthActionResult>;
  resendVerificationCode: (token: string) => Promise<AuthActionResult>;
  googleLogin:  (idToken: string) => Promise<{ success: boolean; message?: string }>;
  refreshToken: (storedToken?: string | null) => Promise<string | null>;
  fetchMe:      () => Promise<void>;
  updateAvatar: (uri: string, mimeType?: string, fileName?: string) => Promise<{ success: boolean; avatar_url?: string; message?: string }>;
  logout:       () => Promise<void>;
  clearError:   () => void;
  setUser:      (user: User) => void;
}

interface AuthActionResult {
  success: boolean;
  message?: string;
  requiresVerification?: boolean;
  verificationToken?: string;
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

      // COLD-START FIX: Don't set isHydrated until token refresh completes
      set({ user, isAuthenticated });

      if (isAuthenticated) {
        if (!refreshToken) {
          await clearSession();
          set({ user: null, isAuthenticated: false, isHydrated: true });
        } else {
          const newToken = await get().refreshToken(refreshToken);
          if (!newToken) {
            await clearSession();
            set({ user: null, isAuthenticated: false, isHydrated: true });
          } else {
            // Token refresh succeeded - NOW we're ready
            set({ isHydrated: true });
          }
        }
      } else {
        // No session to restore - hydration complete
        set({ isHydrated: true });
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
      // SECURITY FIX: Never log tokens - removed sensitive data logging

      // Check if email verification is required.
      if (res.data?.requiresVerification) {
        set({ isLoading: false });
        return {
          success: false,
          requiresVerification: true,
          verificationToken: res.data.verificationToken,
          message: res.data.message,
        };
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

      return { success: true };
    } catch (err: unknown) {
      const verification = (err as {
        response?: { data?: { message?: string; requiresVerification?: boolean; verificationToken?: string } };
      })?.response?.data;

      if (verification?.requiresVerification && verification.verificationToken) {
        const message = verification.message ?? 'Please verify your email before logging in.';
        set({ error: message, isLoading: false });
        return {
          success: false,
          requiresVerification: true,
          verificationToken: verification.verificationToken,
          message,
        };
      }

      const message = verification?.message
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
      set({ isLoading: false });
      // Registration may require verification before the user can sign in.
      return { success: true, ...res.data } as AuthActionResult;
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Registration failed');
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // ─── Email verification ──────────────────────────────────────────────────
  // Mobile verification creates a real mobile session. Using the shared client
  // guarantees the API returns JSON tokens and that they are saved only in
  // SecureStore, never in ordinary app storage.
  verifyEmail: async (token, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<{
        success: boolean;
        message?: string;
        user?: User;
        accessToken?: string;
        refreshToken?: string;
      }>('/auth/verify-email', { token, code });
      const { success, message, user, accessToken, refreshToken } = res.data;
      if (!success || !user || !accessToken || !refreshToken) {
        throw new Error(message || 'Verification did not create a session');
      }

      setToken(accessToken);
      applyUser(user);
      await persistSession(user, true, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return { success: true, message };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Verification failed');
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  resendVerificationCode: async (token) => {
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/auth/resend-verification-code', { token });
      if (!res.data?.success) {
        return { success: false, message: res.data?.message || 'Unable to resend the code' };
      }
      return { success: true, message: res.data.message };
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Unable to resend the code';
      return { success: false, message };
    }
  },

  // ─── Google OAuth ────────────────────────────────────────────────────────
  googleLogin: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      // SECURITY FIX: Backend expects access_token, not id_token
      const res          = await api.post<{ data: { accessToken: string; refreshToken: string; user: User } }>('/auth/google', { access_token: idToken });
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
      const res             = await api.post<{ data?: { accessToken: string; refreshToken: string }; accessToken?: string; refreshToken?: string }>('/auth/refresh-token', { refreshToken: storedToken });
      // Backend returns { success: true, message: "...", accessToken: "...", refreshToken: "..." }
      const newAccessToken  = res.data?.data?.accessToken || res.data?.accessToken;
      const newRefreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
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
      // Always request fresh account details. Profile edits may have been made
      // from another signed-in device while this app was in the background.
      const res  = await api.get<{ data: User; user: User }>('/auth/me', {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
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
    // Include the refresh token so the server can revoke the session even if
    // the in-memory access token has already expired.
    const { refreshToken } = await loadSession();
    try { await api.post('/auth/logout', { refreshToken }); } catch { /* local cleanup still proceeds */ }
    clearToken();
    clearOrgId();
    await clearSession();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
  setUser:    (user: User) => set({ user }),
}));
