import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true, // Send httpOnly cookies automatically
  timeout: 10000,
});

// Web uses httpOnly cookies - no token management needed
// These are no-ops for backward compatibility
export function setTokens() {}
export function clearTokens() {}
export function getTokens() {
  return { accessToken: null, refreshToken: null };
}

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

// Web uses cookies - no Authorization header needed
api.interceptors.request.use((config) => {
  // Cookies sent automatically via withCredentials: true
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
          addRefreshSubscriber(() => {
            // Retry request - cookies are already refreshed
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { useAuthStore } = await import("@/store/auth.store");
        await useAuthStore.getState().refreshToken();

        // Cookies refreshed automatically - retry request
        onRefreshed();
        return api(originalRequest);
      } catch (refreshError) {
        // Release the queue FIRST so any pending requests don't deadlock.
        onRefreshed();

        // Only call logout if we're not already on an auth page or public page
        // This prevents double-logout and error toasts when user manually logs out
        if (typeof window !== "undefined") {
          const pathname = window.location.pathname;

          // Public pages that should NOT redirect to login on 401
          const PUBLIC_ROUTES = ["/", "/features", "/pricing", "/templates", "/about", "/contact", "/faq", "/terms", "/privacy-policy", "/cookies-policy", "/acceptable-use"];
          const isPublicPage = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/e/");

          const isAuthPage = pathname.startsWith("/login") ||
                            pathname.startsWith("/register") ||
                            pathname.startsWith("/forgot-password");

          // Only logout and redirect if NOT on public page or auth page
          if (!isAuthPage && !isPublicPage) {
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
