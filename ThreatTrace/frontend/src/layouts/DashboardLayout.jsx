// frontend/src/layouts/DashboardLayout.jsx

import { useEffect, useState } from "react";
import Sidebar from "../components/ui/Sidebar";
import Toast from "../components/ui/Toast";
import TopNavbar from "../components/ui/TopNavbar";
import socket from "../utils/socket";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);

  /* ---------------------------------------------------------
     GLOBAL REAL-TIME ALERT LISTENERS
     (tampering, ransomware alerts, system events)
  --------------------------------------------------------- */
  useEffect(() => {
    const pushToast = (msg, severity = "info") => {
      setToast({ msg, severity });
      setTimeout(() => setToast(null), 4500);
    };

    const handleTamper = (data) => {
      pushToast(`Log Tampered: ${data.file_path}`, "tamper");
    };

    const handleAlert = (data) => {
      pushToast(`${data.title}: ${data.message}`, data.severity || "info");
    };

    const handleSystemEvent = (log) => {
      pushToast(`System Event: ${log.message}`, log.level || "info");
    };

    socket.on("tamper_alert", handleTamper);
    socket.on("new_alert", handleAlert);
    socket.on("system_log", handleSystemEvent);

    return () => {
      socket.off("tamper_alert", handleTamper);
      socket.off("new_alert", handleAlert);
      socket.off("system_log", handleSystemEvent);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ---------------------------------------------------------
         FIXED SIDEBAR
      --------------------------------------------------------- */}
      <aside className="fixed left-0 top-0 h-full z-30">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </aside>

      {/* ---------------------------------------------------------
         MAIN CONTENT AREA
      --------------------------------------------------------- */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}
      >
        {/* ---------------------------------------------------------
           FIXED TOP NAVBAR
        --------------------------------------------------------- */}
        <header
          className="fixed top-0 right-0 z-20 transition-all duration-300"
          style={{ left: sidebarOpen ? "256px" : "80px" }}
        >
          <TopNavbar />
        </header>

        {/* ---------------------------------------------------------
           PAGE CONTENT
        --------------------------------------------------------- */}
        <main className="pt-20 px-6 overflow-auto">
          {children}
        </main>

        {/* ---------------------------------------------------------
           GLOBAL TOAST (Always On)
        --------------------------------------------------------- */}
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
