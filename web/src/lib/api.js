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

    // Auth endpoints handle their own errors — never try to refresh on them.
    // Without this, a wrong-password 401 triggers a refresh attempt that
    // deadlocks the queue (logout call inside the catch re-queues itself).
    const url = originalRequest?.url ?? "";
    if (
      url.includes("/auth/refresh-token") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/google") ||
      url.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    // Rate-limit: surface the error directly — never attempt a token refresh.
    if (response.status === 429) {
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
        // Release the queue FIRST so any pending requests don't deadlock.
        onRefreshed(null);

        // Only call logout if we're not already on an auth page
        // This prevents double-logout and error toasts when user manually logs out
        if (typeof window !== "undefined") {
          const isAuthPage = window.location.pathname.startsWith("/login") ||
                            window.location.pathname.startsWith("/register") ||
                            window.location.pathname.startsWith("/forgot-password");

          if (!isAuthPage) {
            try {
              const { useAuthStore } = await import("@/store/auth.store");
              await useAuthStore.getState().logout();
              // Navigate to login after logout
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
            } catch {
              // ignore
            }
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
