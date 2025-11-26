// src/components/ui/TopNavbar.jsx
import {
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import socket from "../../utils/socket"; // <-- socket.io client

export default function TopNavbar() {
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newAlert, setNewAlert] = useState(false);

  // ---- Listen for real-time tamper + ransomware alerts ----
  useEffect(() => {
    socket.on("audit_alert", (msg) => {
      setNotifications((prev) => [...prev, msg]);
      setNewAlert(true);
    });

    socket.on("ransomware_alert", (msg) => {
      setNotifications((prev) => [...prev, msg]);
      setNewAlert(true);
    });

    return () => {
      socket.off("audit_alert");
      socket.off("ransomware_alert");
    };
  }, []);

  return (
    <header className="w-full glass-cyber px-6 py-3 border-b border-white/20 flex items-center justify-between shadow-xl z-40">
      
      {/* =================== SEARCH BAR =================== */}
      <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl 
                      backdrop-blur-md border border-white/20 w-96 shadow-lg hover:border-cyberNeon/40 transition-all">
        <MagnifyingGlassIcon className="h-5 w-5 text-cyberNeon" />
        <input
          className="bg-transparent w-full focus:outline-none text-white placeholder-gray-300"
          placeholder="Search threats, logs, modules..."
        />
      </div>

      {/* =================== RIGHT SIDE: NOTIF + USER =================== */}
      <div className="flex items-center gap-6">

        {/* --------- NOTIFICATIONS ICON --------- */}
        <div className="relative group cursor-pointer" onClick={() => setNewAlert(false)}>
          <BellIcon className="h-7 w-7 text-cyberNeon group-hover:text-cyberPurple transition-all" />

          {/* Alert Indicator */}
          {newAlert && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-400 rounded-full 
                              animate-ping"></span>
          )}
          {newAlert && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
          )}

          {/* Notifications Dropdown */}
          <div className="absolute right-0 mt-3 w-80 hidden group-hover:block glass-cyber p-3 
                          rounded-xl border border-white/20 shadow-xl z-50 max-h-72 overflow-y-auto">
            <h3 className="font-semibold text-white mb-2">Recent Alerts</h3>

            {notifications.length === 0 ? (
              <p className="text-gray-300 text-sm">No alerts</p>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  className="p-2 mb-2 rounded-lg bg-white/10 border border-white/10 text-gray-200 text-sm"
                >
                  {n.message || n}
                </div>
              ))
            )}
          </div>
        </div>

        {/* --------- USER MENU --------- */}
        <div className="relative">
          <button
            className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-xl 
                       hover:border-cyberNeon/40 transition-all text-white"
            onClick={() => setOpenUserMenu(!openUserMenu)}
          >
            <UserCircleIcon className="h-7 w-7 text-cyberNeon" />
            <span className="font-semibold hidden md:block">Admin</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>

          {openUserMenu && (
            <div className="absolute right-0 mt-3 w-48 glass-cyber border border-white/20
                            rounded-xl p-3 shadow-xl flex flex-col text-white z-50">
              
              <button className="px-3 py-2 rounded-lg hover:bg-white/10 text-left">
                Profile Settings
              </button>

              <button className="px-3 py-2 rounded-lg hover:bg-white/10 text-left">
                System Preferences
              </button>

              <button
                onClick={() => window.location.href = "/"}
                className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-left mt-1"
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
