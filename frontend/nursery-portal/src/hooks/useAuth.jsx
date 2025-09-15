// src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import axios from "axios"; // raw axios for token endpoints outside /api/v1

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [access, setAccess] = useState(localStorage.getItem("access"));
  const [refresh, setRefresh] = useState(localStorage.getItem("refresh"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [permissions, setPermissions] = useState(() => {
    const raw = localStorage.getItem("permissions");
    return raw ? JSON.parse(raw) : null;
  });
  const isAuthenticated = !!access;

  const fetchPermissions = useCallback(async () => {
    const { data } = await api.get("/core/user-permissions/");
    setPermissions(data);
    localStorage.setItem("permissions", JSON.stringify(data));
  }, []);

  const fetchMe = useCallback(async () => {
    const { data } = await api.get("/core/users/me/");
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  }, []);

  const login = async (username, password) => {
    // IMPORTANT: absolute path, not through api baseURL
    const { data } = await axios.post("/api/token/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setAccess(data.access);
    setRefresh(data.refresh);
    await Promise.all([fetchMe(), fetchPermissions()]);
  };

  const logout = () => {
    localStorage.clear();
    setAccess(null);
    setRefresh(null);
    setUser(null);
    setPermissions(null);
  };

  // rehydrate on reload if we still have an access token
  useEffect(() => {
    if (access) {
      (async () => {
        try {
          await Promise.all([fetchMe(), fetchPermissions()]);
        } catch {
          // if rehydrate fails (e.g., expired), clear state
          logout();
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access]);

  return (
    <AuthContext.Provider value={{ access, refresh, user, permissions, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

