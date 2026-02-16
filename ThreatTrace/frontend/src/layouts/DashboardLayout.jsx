// frontend/src/layouts/DashboardLayout.jsx

import { useEffect, useState } from "react";
import Sidebar from "../components/ui/Sidebar";
import Toast from "../components/ui/Toast";
import TopNavbar from "../components/ui/TopNavbar";
import WebNettingBackground from "../components/ui/WebNettingBackground";
import socket from "../utils/socket";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

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

  /* ---------------------------------------------------------
     CLOSE MOBILE MENU ON DESKTOP RESIZE
  --------------------------------------------------------- */
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDesktop = viewportWidth >= 1024;
  const sidebarOffset = isDesktop ? (sidebarOpen ? "256px" : "80px") : "0";

  return (
    <div className="flex h-screen overflow-hidden bg-cyberDark relative">
      <WebNettingBackground />

      {/* ---------------------------------------------------------
         MOBILE OVERLAY (when menu is open)
      --------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ---------------------------------------------------------
         SIDEBAR - Desktop: fixed, Mobile: drawer overlay
      --------------------------------------------------------- */}
      <aside
        className={`
          fixed left-0 top-0 h-full z-50 transition-transform duration-300
          lg:z-30
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      </aside>

      {/* ---------------------------------------------------------
         MAIN CONTENT AREA
      --------------------------------------------------------- */}
      <div
        className="flex flex-col flex-1 transition-all duration-300 w-full"
        style={{
          marginLeft: sidebarOffset,
        }}
      >
        {/* ---------------------------------------------------------
           FIXED TOP NAVBAR
        --------------------------------------------------------- */}
        <header
          className="fixed top-0 right-0 z-20 transition-all duration-300 w-full lg:w-auto"
          style={{
            left: sidebarOffset,
          }}
        >
          <TopNavbar
            onMobileMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            mobileMenuOpen={mobileMenuOpen}
          />
        </header>

        {/* ---------------------------------------------------------
           PAGE CONTENT
        --------------------------------------------------------- */}
        <main className="pt-20 px-3 sm:px-4 md:px-6 pb-6 overflow-auto flex-1">
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
