// src/components/ui/Sidebar.jsx
import {
    ArrowRightOnRectangleIcon,
    DocumentMagnifyingGlassIcon,
    HomeIcon,
    ShieldCheckIcon,
    WrenchIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const items = [
    { to: "/dashboard", icon: <HomeIcon className="h-6 w-6" />, text: "Dashboard" },
    { to: "/ransomware", icon: <ShieldCheckIcon className="h-6 w-6" />, text: "Ransomware" },
    { to: "/audit", icon: <DocumentMagnifyingGlassIcon className="h-6 w-6" />, text: "Audit Logs" },
    { to: "/alerts", icon: <DocumentMagnifyingGlassIcon className="h-6 w-6" />, text: "Alerts" },
    { to: "/reports", icon: <DocumentMagnifyingGlassIcon className="h-6 w-6" />, text: "Reports" },
    { to: "/logs", icon: <DocumentMagnifyingGlassIcon className="h-6 w-6" />, text: "System Logs" },
    { to: "/settings", icon: <WrenchIcon className="h-6 w-6" />, text: "Settings" },
  ];

  const doLogout = () => {
    localStorage.removeItem("token");
    // optionally clear other stored items
    navigate("/");
  };

  return (
    <div
      className={`h-screen bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-xl transition-all duration-300 flex flex-col fixed left-0 top-0 ${open ? "w-64" : "w-20"}`}
    >
      {/* Logo and toggle */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <h1 className={`font-Orbitron text-xl text-cyberPurple font-bold transition-all ${open ? "opacity-100" : "opacity-0 w-0"}`}>
          ThreatTrace
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20"
          title="Toggle menu"
        >
          <svg className="w-5 h-5 text-cyberNeon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="mt-6 flex flex-col gap-2 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-4 p-3 rounded-lg
               transition-all text-white ${isActive ? "bg-gray-800 text-cyberNeon" : "bg-white/5 hover:bg-cyberNeon/20 hover:border-cyberNeon/40"}`
            }
          >
            <div className="text-cyberNeon">{it.icon}</div>
            <span className={`font-medium transition-all ${open ? "opacity-100" : "opacity-0 w-0"}`}>{it.text}</span>
          </NavLink>
        ))}

        <div className="mt-auto mb-6 px-3">
          <button
            onClick={doLogout}
            className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-red-900/20 text-red-300 w-full"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className={`${open ? "opacity-100" : "opacity-0 w-0"}`}>Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
