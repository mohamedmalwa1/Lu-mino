// src/components/auth/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute({ children, requiredModule }) {
  const { isAuthenticated, permissions } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredModule && permissions) {
    const map = {
      student:   "can_access_student",
      hr:        "can_access_hr",
      finance:   "can_access_finance",
      inventory: "can_access_inventory",
    };
    const flag = map[requiredModule];
    if (flag && !permissions[flag]) return <Navigate to="/" replace />;
  }

  return children;
}

