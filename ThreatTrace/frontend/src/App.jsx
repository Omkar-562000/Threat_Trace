// src/App.jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Auth Pages
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Signup from "./pages/Signup";

// Dashboard Layout + Protection
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./utils/ProtectedRoute";

// Dashboard Feature Pages
import Alerts from "./pages/Alerts";
import Audit from "./pages/Audit";
import EnhancedDashboard from "./pages/EnhancedDashboard";
import Ransomware from "./pages/Ransomware";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SystemLogs from "./pages/SystemLogs";
import LocationTracking from "./pages/LocationTracking";
import SecurityControl from "./pages/SecurityControl";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== AUTH ROUTES ===== */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ===== PROTECTED DASHBOARD AREA ===== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredFeature="dashboard">
              <DashboardLayout>
                <EnhancedDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ransomware"
          element={
            <ProtectedRoute requiredFeature="ransomware">
              <DashboardLayout>
                <Ransomware />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute requiredFeature="audit">
              <DashboardLayout>
                <Audit />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute requiredFeature="alerts">
              <DashboardLayout>
                <Alerts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredFeature="reports">
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <ProtectedRoute requiredFeature="logs">
              <DashboardLayout>
                <SystemLogs />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredFeature="settings">
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/locations"
          element={
            <ProtectedRoute requiredFeature="locations">
              <DashboardLayout>
                <LocationTracking />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/security"
          element={
            <ProtectedRoute requiredFeature="security_control">
              <DashboardLayout>
                <SecurityControl />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* ===== FALLBACK ===== */}
        <Route
          path="*"
          element={
            <div className="p-6 text-white text-center text-xl">
              ❌ Page Not Found
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
