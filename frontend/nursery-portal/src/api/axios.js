// src/api/axios.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Read token from either "access" or "accessToken" (supports both)
function getAccess() {
  return localStorage.getItem("access") || localStorage.getItem("accessToken");
}
function setAccess(token) {
  localStorage.setItem("access", token);
  localStorage.setItem("accessToken", token);
}

axiosInstance.interceptors.request.use((cfg) => {
  const token = getAccess();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing = null;           // single flight
let requestQueue = [];

async function refreshAccess() {
  if (!refreshing) {
    refreshing = (async () => {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) throw new Error("No refresh token");
      const { data } = await axios.post("/api/token/refresh/", { refresh });
      setAccess(data.access);
      return data.access;
    })()
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const newToken = await refreshAccess();
        // replay queued requests after refresh succeeds
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      } catch (e) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;

