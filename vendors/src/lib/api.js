import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 15000,
});

let _vendorToken = null;
export const setVendorToken = (t) => { _vendorToken = t; };
export const clearVendorToken = () => { _vendorToken = null; };

api.interceptors.request.use((cfg) => {
  if (_vendorToken) cfg.headers.Authorization = `Bearer ${_vendorToken}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const url = err.config?.url ?? "";
    if (url.includes("/vendor/login") || url.includes("/vendor/register")) return Promise.reject(err);
    if (err.response?.status === 401) {
      clearVendorToken();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
