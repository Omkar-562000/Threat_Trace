// src/layouts/DashboardLayout.jsx

import { useEffect, useState } from "react";
import Sidebar from "../components/ui/Sidebar";
import Toast from "../components/ui/Toast";
import TopNavbar from "../components/ui/TopNavbar";
import socket from "../utils/socket";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // GLOBAL TOAST STATE
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // -------------------------------
    // 🔥 TAMPER ALERT (Audit module)
    // -------------------------------
    socket.on("tamper_alert", (data) => {
      setToast({
        msg: `Log Tampered: ${data.file_path}`,
        severity: "danger",
      });
    });

    // -------------------------------
    // 🔥 NEW ALERT (Ransomware & system alerts)
    // -------------------------------
    socket.on("new_alert", (data) => {
      setToast({
        msg: `${data.title}: ${data.message}`,
        severity: data.severity || "info",
      });
    });

    // -------------------------------
    // 🔥 SYSTEM LOGS ALERT
    // -------------------------------
    socket.on("system_log", (log) => {
      setToast({
        msg: `New system event: ${log.message}`,
        severity: log.level || "info",
      });
    });

    // Cleanup → prevents double listeners during hot reloads
    return () => {
      socket.off("tamper_alert");
      socket.off("new_alert");
      socket.off("system_log");
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* FIXED SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full z-30">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </aside>

      {/* MAIN AREA */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}
      >

        {/* FIXED TOP NAVBAR */}
        <header
          className="fixed top-0 right-0 z-20 transition-all duration-300"
          style={{ left: sidebarOpen ? "256px" : "80px" }}
        >
          <TopNavbar />
        </header>

        {/* PAGE CONTENT */}
        <main className="pt-20 px-6 overflow-auto">
          {children}
        </main>

        {/* 🌟 GLOBAL TOAST COMPONENT */}
        {toast && (
          <Toast
            message={toast.msg}
            severity={toast.severity}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}
