import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
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

// ─── Request: attach Bearer token ─────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
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
        const res      = await api.post<{ accessToken: string }>('/auth/refresh-token');
        const newToken = res.data?.accessToken;
        if (!newToken) throw new Error('No token in refresh response');

        setToken(newToken);
        processQueue(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // Release the queue FIRST so pending requests don't deadlock.
        processQueue(null);
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
