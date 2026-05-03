import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Config } from '@/constants/config';

// ─── In-memory state (NEVER stored to disk) ───────────────────────────────────
let _accessToken: string | null = null;
let _orgId:       string | null = null;

export const setToken   = (t: string) => { _accessToken = t; };
export const clearToken = ()          => { _accessToken = null; };
export const getToken   = ()          => _accessToken;

export const setOrgId   = (id: string) => { _orgId = id; };
export const clearOrgId = ()           => { _orgId = null; };

// ─── Axios instance ───────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL:         Config.API_URL,
  withCredentials: true,
  timeout:         10_000,
});

// ─── Request: attach Bearer + x-organization-id ───────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  if (_orgId) {
    config.headers['x-organization-id'] = _orgId;
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

    // Never retry on refresh endpoint itself or rate limits
    if (original?.url?.includes('/auth/refresh-token')) return Promise.reject(error);
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
