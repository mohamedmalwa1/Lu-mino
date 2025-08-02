import { createContext, useContext, useState } from "react";
import axios from "../api/axios";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [access, setAccess]   = useState(localStorage.getItem("access"));
  const [refresh, setRefresh] = useState(localStorage.getItem("refresh"));

  const login = async (username, password) => {
    const { data } = await axios.post("/token/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setAccess(data.access);  setRefresh(data.refresh);
  };

  const logout = () => {
    localStorage.clear();
    setAccess(null); setRefresh(null);
  };

  const isAuthenticated = !!access;

  return (
    <AuthContext.Provider value={{ access, refresh, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
