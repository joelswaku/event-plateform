// import axios from "axios";

// export const publicApi = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
//   withCredentials: false, // 🔥 IMPORTANT
//   timeout: 10000,
// });


import axios from "axios";

export const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  withCredentials: false, // 🔥 IMPORTANT
  timeout: 10000,
});

// 🚫 NO interceptors
// 🚫 NO Authorization header