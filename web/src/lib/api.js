import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10000,
});

// In-memory token store — set by auth.store on login/refresh, cleared on logout.
// Never written to localStorage; httpOnly refresh cookie handles persistence.
let _accessToken = null;
export function setInMemoryToken(token) { _accessToken = token; }
export function clearInMemoryToken() { _accessToken = null; }

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

// Attach Bearer token from memory (never from localStorage)
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;

    if (!response) return Promise.reject(error);

    if (originalRequest?.url?.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    if (response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token) => {
            if (!token) { reject(error); return; }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { useAuthStore } = await import("@/store/auth.store");
        const newToken = await useAuthStore.getState().refreshToken();

        if (!newToken) throw new Error("Refresh token expired");

        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        try {
          const { useAuthStore } = await import("@/store/auth.store");
          await useAuthStore.getState().logout();
        } catch {
          // ignore
        }
        onRefreshed(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
