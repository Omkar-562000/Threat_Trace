// frontend/src/components/ui/TopNavbar.jsx

import { useEffect, useState } from "react";
import socket from "../../utils/socket";
import Toast from "./Toast";

import {
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function TopNavbar() {
  const [toast, setToast] = useState(null);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newAlert, setNewAlert] = useState(false);

  /* -------------------------------------------------------
     REAL-TIME ALERT RECEIVER
  ------------------------------------------------------- */
  useEffect(() => {
    const handleAlert = (msg) => {
      const alertMsg =
        msg?.message || msg?.title || "⚠ Security event detected";

      const entry = {
        message: alertMsg,
        severity: msg?.severity || "info",
        time: new Date().toLocaleString(),
      };

      setNotifications((prev) => [entry, ...prev]);
      setNewAlert(true);

      // Toast popup
      setToast(`🔔 ${alertMsg}`);
      setTimeout(() => setToast(null), 3500);
    };

    socket.on("new_alert", handleAlert);
    socket.on("tamper_alert", handleAlert);
    socket.on("ransomware_alert", handleAlert);

    return () => {
      socket.off("new_alert", handleAlert);
      socket.off("tamper_alert", handleAlert);
      socket.off("ransomware_alert", handleAlert);
    };
  }, []);

  return (
    <header
      className="
        w-full glass-cyber px-6 py-3 border-b border-white/20
        flex items-center justify-between shadow-lg backdrop-blur-xl
        sticky top-0 z-40
      "
    >
      {/* Toast Notification */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* -------------------------------------------------------
         SEARCH BAR
      ------------------------------------------------------- */}
      <div
        className="
          flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl
          backdrop-blur-md border border-white/20 w-96
          shadow-md hover:border-cyberNeon/40 transition-all
        "
      >
        <MagnifyingGlassIcon className="h-5 w-5 text-cyberNeon" />
        <input
          placeholder="Search threats, logs, alerts..."
          className="bg-transparent w-full focus:outline-none text-white placeholder-gray-300"
        />
      </div>

      {/* -------------------------------------------------------
         RIGHT SIDE BUTTONS (Alerts + User)
      ------------------------------------------------------- */}
      <div className="flex items-center gap-6">

        {/* -------------------------------------------------------
           ALERT BELL
        ------------------------------------------------------- */}
        <div
          className="relative group cursor-pointer"
          onClick={() => setNewAlert(false)}
        >
          <BellIcon className="h-7 w-7 text-cyberNeon group-hover:text-cyberPurple transition" />

          {newAlert && (
            <>
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-400 rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
            </>
          )}

          {/* Dropdown */}
          <div
            className="
              absolute right-0 mt-3 w-80 hidden group-hover:block glass-cyber p-3
              rounded-xl border border-white/20 shadow-xl z-50 max-h-80 overflow-y-auto
            "
          >
            <h3 className="font-semibold text-white mb-2">Recent Alerts</h3>

            {notifications.length === 0 ? (
              <p className="text-gray-300 text-sm">No alerts yet.</p>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  className="
                    p-2 mb-2 rounded-lg bg-white/10 border border-white/10
                    text-gray-200 text-sm
                  "
                >
                  <p className="font-medium">{n.message}</p>
                  <p className="text-xs text-gray-400">{n.time}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* -------------------------------------------------------
           USER MENU
        ------------------------------------------------------- */}
        <div className="relative">
          <button
            onClick={() => setOpenUserMenu((s) => !s)}
            className="
              flex items-center gap-2 bg-white/10 border border-white/20
              px-3 py-2 rounded-xl hover:border-cyberNeon/40
              transition-all text-white
            "
          >
            <UserCircleIcon className="h-7 w-7 text-cyberNeon" />
            <span className="font-semibold hidden md:block">Admin</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>

          {openUserMenu && (
            <div
              className="
                absolute right-0 mt-3 w-48 glass-cyber border border-white/20
                rounded-xl p-3 shadow-lg flex flex-col text-white z-50
              "
            >
              <button className="px-3 py-2 rounded-lg hover:bg-white/10 text-left">
                Profile Settings
              </button>

              <button className="px-3 py-2 rounded-lg hover:bg-white/10 text-left">
                System Preferences
              </button>

              <button
                onClick={() => window.location.href = "/"}
                className="
                  px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30
                  text-left mt-1
                "
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
