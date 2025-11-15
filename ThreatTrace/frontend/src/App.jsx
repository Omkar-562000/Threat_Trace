// src/App.jsx
import { BrowserRouter, Route, Routes } from "react-router-dom";

import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Signup from "./pages/Signup";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./utils/ProtectedRoute";

import Alerts from "./pages/Alerts";
import Audit from "./pages/Audit";
import Dashboard from "./pages/Dashboard";
import Ransomware from "./pages/Ransomware";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SystemLogs from "./pages/SystemLogs";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard area (protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ransomware"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Ransomware />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Audit />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Alerts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SystemLogs />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* fallback route */}
        <Route path="*" element={<div className="p-6 text-white">Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
