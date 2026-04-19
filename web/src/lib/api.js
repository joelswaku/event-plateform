import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10000,
});

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(accessToken) {
  refreshSubscribers.forEach((callback) => callback(accessToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const authState =
        window.__zustandAuthState ||
        JSON.parse(localStorage.getItem("auth-storage") || "null");

      const token =
        authState?.state?.accessToken ||
        authState?.accessToken ||
        null;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      // ignore storage parse errors
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;

    if (!response) {
      return Promise.reject(error);
    }

    if (originalRequest?.url?.includes("/auth/refresh-token")) {
      return Promise.reject(error);
    }

    if (response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token) => {
            if (!token) {
              reject(error);
              return;
            }

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

        if (!newToken) {
          throw new Error("Refresh token expired or invalid");
        }

        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        try {
          const { useAuthStore } = await import("@/store/auth.store");
          await useAuthStore.getState().logout();
        } catch (_) {
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





// import axios from "axios";
// import { useAuthStore } from "@/store/auth.store";

// export const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
//   withCredentials: true, // Required for HttpOnly cookies
// });

// let isRefreshing = false;
// let refreshSubscribers = [];

// // Helper to notify all queued requests once the token is refreshed
// function onRefreshed(accessToken) {
//   refreshSubscribers.map((callback) => callback(accessToken));
//   refreshSubscribers = [];
// }

// // Helper to add a request to the queue
// function addRefreshSubscriber(callback) {
//   refreshSubscribers.push(callback);
// }

// /* Request Interceptor: Attach Bearer Token */
// api.interceptors.request.use((config) => {
//   const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// /* Response Interceptor: Handle 401 and Token Refresh */
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const { config, response } = error;
//     const originalRequest = config;

//     // If it's a 401 and we haven't retried this specific request yet
//     if (response?.status === 401 && !originalRequest._retry) {
      
//       // If we are already refreshing, create a promise that resolves when onRefreshed is called
//       if (isRefreshing) {
//         return new Promise((resolve) => {
//           addRefreshSubscriber((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             resolve(api(originalRequest));
//           });
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         // Trigger the refresh logic in your Zustand store
//         const newToken = await useAuthStore.getState().refreshToken();

//         if (!newToken) {
//           throw new Error("Refresh token expired or invalid");
//         }

//         isRefreshing = false;
//         onRefreshed(newToken);

//         // Retry the original request with the new token
//         originalRequest.headers.Authorization = `Bearer ${newToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         isRefreshing = false;
//         refreshSubscribers = [];
        
//         // Force logout the user if refresh fails
//         useAuthStore.getState().logout();
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );
// import axios from "axios";
// import { useAuthStore } from "@/store/auth.store";

// export const api = axios.create({
//   baseURL:
//     process.env.NEXT_PUBLIC_API_URL ||
//     "http://localhost:5000/api",
//   withCredentials: true,
// });

// let isRefreshing = false;
// let refreshSubscribers = [];

// /* attach token */
// api.interceptors.request.use((config) => {
//   const token =
//     typeof window !== "undefined"
//       ? localStorage.getItem("accessToken")
//       : null;

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// /* response interceptor */
// api.interceptors.response.use(
//   (res) => res,
//   async (err) => {
//     const originalRequest = err.config;

//     if (!err.response) {
//       return Promise.reject(err);
//     }

//     /* =========================
//        HANDLE 401
//     ========================= */
//     if (
//       err.response.status === 401 &&
//       !originalRequest._retry
//     ) {
//       originalRequest._retry = true;

//       /* already refreshing → queue */
//       if (isRefreshing) {
//         return new Promise((resolve) => {
//           subscribeTokenRefresh((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             resolve(api(originalRequest));
//           });
//         });
//       }

//       isRefreshing = true;

//       try {
//         const newToken =
//           await useAuthStore.getState().refreshToken();

//         if (!newToken) {
//           throw new Error("Refresh failed");
//         }

//         /* notify all queued requests */
//         onRefreshed(newToken);

//         originalRequest.headers.Authorization = `Bearer ${newToken}`;

//         return api(originalRequest);

//       } catch (refreshError) {
//         useAuthStore.getState().logout();
//         return Promise.reject(refreshError);

//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(err);
//   }
// );
