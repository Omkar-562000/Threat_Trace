// src/components/ui/Sidebar.jsx
import {
  ArrowRightOnRectangleIcon,
  BellAlertIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  HomeIcon,
  InboxIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [hovered, setHovered] = useState(false);

  const expanded = open || hovered;

  // 🔥 MENU ITEMS (Updated: Added "System Logs")
  const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <HomeIcon className="h-6 w-6" /> },
    { to: "/ransomware", label: "Ransomware", icon: <ShieldCheckIcon className="h-6 w-6" /> },
    { to: "/audit", label: "Audit Logs", icon: <DocumentMagnifyingGlassIcon className="h-6 w-6" /> },
    { to: "/alerts", label: "Alerts", icon: <BellAlertIcon className="h-6 w-6" /> },
    { to: "/reports", label: "Reports", icon: <InboxIcon className="h-6 w-6" /> },

    // ⭐ NEW FEATURE ADDED HERE
    { to: "/logs", label: "System Logs", icon: <ServerStackIcon className="h-6 w-6" /> },

    { to: "/settings", label: "Settings", icon: <Cog6ToothIcon className="h-6 w-6" /> },
  ];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`h-full bg-white/6 backdrop-blur-xl border-r border-white/10 shadow-xl
                  transition-all duration-300 ${expanded ? "w-64" : "w-20"} flex flex-col`}
      style={{ minWidth: expanded ? 256 : 80 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h1
          className={`font-Orbitron text-lg text-cyberPurple font-bold transition-all ${
            expanded ? "opacity-100" : "opacity-0 w-0"
          }`}
        >
          ThreatTrace
        </h1>

        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle sidebar"
          className="p-2 bg-white/6 border border-white/10 rounded-lg hover:bg-white/10"
        >
          <svg className="w-5 h-5 text-cyberNeon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4 flex-1 px-2 space-y-2">
        {menuItems.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-lg transition-all text-white hover:bg-cyberNeon/10
               ${isActive ? "bg-cyberNeon/10 border border-cyberNeon/20" : "bg-transparent"}`
            }
          >
            <div className="text-cyberNeon">{m.icon}</div>

            <span className={`font-medium transition-all ${expanded ? "opacity-100" : "opacity-0 w-0"}`}>
              {m.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <NavLink to="/" className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/6 text-white">
          <ArrowRightOnRectangleIcon className="h-6 w-6 text-pink-400" />
          <span className={`transition-all ${expanded ? "opacity-100" : "opacity-0 w-0"}`}>Logout</span>
        </NavLink>
      </div>
    </div>
  );
}
