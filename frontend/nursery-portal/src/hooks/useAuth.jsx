// mohamedmalwa1/lu-mino/Lu-mino-eef071840a5399afd97f3e5772965c80cf5a7740/frontend/nursery-portal/src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import axios from "axios";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [access, setAccess] = useState(localStorage.getItem("access"));
  const [refresh, setRefresh] = useState(localStorage.getItem("refresh"));
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // <-- ADD THIS LOADING STATE
  const isAuthenticated = !!access;

  const fetchPermissions = useCallback(async () => {
    const { data } = await api.get("/core/permissions/");
    setPermissions(data);
  }, []);

  const fetchMe = useCallback(async () => {
    const { data } = await api.get("/core/me/");
    setUser(data);
  }, []);

  const login = async (username, password) => {
    const { data } = await axios.post("/api/token/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setAccess(data.access);
    setRefresh(data.refresh);
    // After login, fetch data and set loading to false
    await Promise.all([fetchMe(), fetchPermissions()]);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.clear();
    setAccess(null);
    setRefresh(null);
    setUser(null);
    setPermissions(null);
  };

  useEffect(() => {
    const rehydrate = async () => {
      if (access) {
        try {
          await Promise.all([fetchMe(), fetchPermissions()]);
        } catch {
          logout();
        }
      }
      setIsLoading(false); // <-- SET LOADING TO FALSE AFTER CHECKING
    };

    rehydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- RUN ONLY ONCE ON INITIAL LOAD

  const value = {
    access,
    refresh,
    user,
    permissions,
    isAuthenticated,
    isLoading, // <-- EXPOSE LOADING STATE
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
