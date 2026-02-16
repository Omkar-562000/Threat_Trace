// src/utils/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { hasFeature, hasRole } from "./role";

export default function ProtectedRoute({
  children,
  allowedRoles = null,
  requiredFeature = null,
  fallbackPath = "/dashboard",
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredFeature && !hasFeature(requiredFeature)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
