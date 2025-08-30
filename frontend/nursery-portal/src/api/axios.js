// src/api/axios.js
import axios from "axios";

/**
 * Axios instance:
 * - baseURL = "/api"
 * - Adds Bearer access token if found
 * - Tries a SimpleJWT refresh once on 401
 */
const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

function getToken(keys) {
  for (const k of keys) {
    const v1 = localStorage.getItem(k);
    if (v1) return { storage: "localStorage", key: k, value: v1 };
    const v2 = sessionStorage.getItem(k);
    if (v2) return { storage: "sessionStorage", key: k, value: v2 };
  }
  return { storage: null, key: null, value: null };
}

function setToken(where, key, value) {
  if (!where || !key) return;
  window[where].setItem(key, value);
}
function clearTokens() {
  ["access", "access_token", "token", "jwt", "refresh", "refresh_token"].forEach(
    (k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
  );
}

api.interceptors.request.use((cfg) => {
  const { value: access } = getToken(["access", "access_token", "token", "jwt"]);
  if (access) {
    cfg.headers = cfg.headers || {};
    cfg.headers.Authorization = `Bearer ${access}`;
  }
  return cfg;
});

let refreshing = null;
async function refreshOnce() {
  if (refreshing) return refreshing;

  const { value: refresh } = getToken(["refresh", "refresh_token"]);
  if (!refresh) throw new Error("no_refresh_token");

  // try a few common endpoints
  const candidates = [
    "/token/refresh/",
    "/auth/jwt/refresh/",
    "/v1/auth/jwt/refresh/",
  ];

  refreshing = (async () => {
    for (const p of candidates) {
      try {
        const { data } = await axios.post(`/api${p}`, { refresh });
        if (data?.access) {
          // prefer to write back where access was originally
          setToken(getToken(["access", "access_token", "token", "jwt"]).storage || "localStorage", "access", data.access);
          if (data?.refresh) setToken("localStorage", "refresh", data.refresh);
          return data.access;
        }
      } catch (_) {
        /* try next */
      }
    }
    throw new Error("refresh_failed");
  })();

  try {
    const token = await refreshing;
    return token;
  } finally {
    refreshing = null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err?.config;
    if (!original || err?.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }
    try {
      const newAccess = await refreshOnce();
      original._retry = true;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      clearTokens();
      return Promise.reject(err);
    }
  }
);

export default api;

