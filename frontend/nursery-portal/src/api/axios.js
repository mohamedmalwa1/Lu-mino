// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",   // all app APIs under /api/v1
  withCredentials: false,
});

// attach access token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// refresh-once flow for 401s
let isRefreshing = false;
let queue = [];

const flushQueue = (token) => {
  queue.forEach((cb) => cb(token));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { config, response } = err || {};
    if (!response || response.status !== 401 || config?._retry) {
      return Promise.reject(err);
    }

    // if a refresh is already in flight, wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((newToken) => {
          if (!newToken) return reject(err);
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(config));
        });
      });
    }

    isRefreshing = true;
    config._retry = true;

    try {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) throw new Error("No refresh token");

      // NOTE: token endpoints are OUTSIDE /api/v1
      const { data } = await axios.post("/api/token/refresh/", { refresh });
      const newAccess = data?.access;
      if (!newAccess) throw new Error("No new access token");

      localStorage.setItem("access", newAccess);
      api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
      flushQueue(newAccess);
      return api(config);
    } catch (e) {
      flushQueue(null);
      localStorage.clear();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

