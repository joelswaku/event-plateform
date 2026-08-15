import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { Config } from '@/constants/config';

// ─── In-memory state (NEVER stored to disk) ───────────────────────────────────
let _accessToken: string | null = null;

export const setToken   = (t: string) => { _accessToken = t; };
export const clearToken = ()          => { _accessToken = null; };
export const getToken   = ()          => _accessToken;

// No-ops: org resolution is handled server-side by resolveOrganization middleware.
// Sending x-organization-id from the client breaks cross-org event access for team members.
export const setOrgId   = (_id: string) => {};
export const clearOrgId = ()            => {};

// ─── Axios instance ───────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL:         Config.API_URL,
  withCredentials: true,
  timeout:         10_000,
});

// ─── Request: attach Bearer token and mobile client identifier ───────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Identify as mobile client so backend knows to return tokens in JSON
  config.headers['X-Client-Type'] = 'mobile';

  // Android aggressive cache fix - force no-cache on all requests
  if (Platform.OS === 'android') {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }

  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ─── Response: transparent 401 refresh ───────────────────────────────────────
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  queue.forEach(cb => cb(token));
  queue = [];
}

api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status   = error.response?.status as number | undefined;
    const url      = original?.url ?? '';

    if (!error.response) {
      error.message = 'Connection unavailable. Check your Wi-Fi or mobile data, then try again.';
      return Promise.reject(error);
    }

    // Auth endpoints handle their own errors — never try to refresh on them.
    // Without this, a wrong-password 401 triggers a refresh attempt that
    // deadlocks the queue (logout call inside the catch re-queues itself).
    if (
      url.includes('/auth/refresh-token') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/google') ||
      url.includes('/auth/logout')
    ) return Promise.reject(error);

    if (status === 429) return Promise.reject(error);

    if (status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push(token => {
            if (!token) return reject(error);
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        // Mobile doesn't use httpOnly cookies - send refresh token in body
        const { loadSession } = await import('@/lib/secure-storage');
        const session = await loadSession();

        if (!session.refreshToken) {
          throw new Error('No refresh token available');
        }

        // Mobile refresh endpoint - expects refreshToken in body
        const res = await api.post<{ data?: { accessToken: string; refreshToken: string }; accessToken?: string; refreshToken?: string }>('/auth/refresh-token', {
          refreshToken: session.refreshToken
        });
        const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
        const newRefreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;

        if (!newAccessToken) throw new Error('No token in refresh response');

        setToken(newAccessToken);

        // Store new refresh token if backend rotated it
        if (newRefreshToken && session.user) {
          const { persistSession } = await import('@/lib/secure-storage');
          await persistSession(session.user, true, newRefreshToken);
        }

        processQueue(newAccessToken);
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        // Release the queue FIRST so pending requests don't deadlock.
        processQueue(null);

        // A lost connection is temporary, not an invalid session.
        if (!(refreshError as { response?: unknown })?.response) {
          return Promise.reject(refreshError);
        }

        clearToken();
        clearOrgId();
        const { useAuthStore } = await import('@/store/auth.store');
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
