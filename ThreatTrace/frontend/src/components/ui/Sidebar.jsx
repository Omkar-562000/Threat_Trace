// frontend/src/components/ui/Sidebar.jsx

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import socket from "../../utils/socket";
import { hasFeature } from "../../utils/role";
import Logo from "./Logo";

import {
  ArrowRightOnRectangleIcon,
  BellAlertIcon,
  Cog6ToothIcon,
  DocumentMagnifyingGlassIcon,
  GlobeAltIcon,
  LockClosedIcon,
  HomeIcon,
  InboxIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({ open, setOpen, mobileMenuOpen, setMobileMenuOpen }) {
  const [hovered, setHovered] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const expanded = open || hovered;

  /* ---------------------------------------------------------
     REAL-TIME ALERT BADGE UPDATES
  --------------------------------------------------------- */
  useEffect(() => {
    const increment = () => {
      setAlertCount((prev) => prev + 1);
    };

    socket.on("new_alert", increment);
    socket.on("tamper_alert", increment);
    socket.on("ransomware_alert", increment);

    return () => {
      socket.off("new_alert", increment);
      socket.off("tamper_alert", increment);
      socket.off("ransomware_alert", increment);
    };
  }, []);

  /* ---------------------------------------------------------
     MENU ITEMS
  --------------------------------------------------------- */
  const menu = [
    { to: "/dashboard", feature: "dashboard", label: "Dashboard", icon: <HomeIcon className="h-6 w-6" /> },
    { to: "/ransomware", feature: "ransomware", label: "Ransomware", icon: <ShieldCheckIcon className="h-6 w-6" /> },
    { to: "/audit", feature: "audit", label: "Audit Logs", icon: <DocumentMagnifyingGlassIcon className="h-6 w-6" /> },
    {
      to: "/alerts",
      feature: "alerts",
      label: "Alerts",
      icon: <BellAlertIcon className="h-6 w-6" />,
      badge: alertCount,
    },
    { to: "/reports", feature: "reports", label: "Reports", icon: <InboxIcon className="h-6 w-6" /> },
    { to: "/logs", feature: "logs", label: "System Logs", icon: <ServerStackIcon className="h-6 w-6" /> },
    { to: "/locations", feature: "locations", label: "Locations", icon: <GlobeAltIcon className="h-6 w-6" /> },
    { to: "/security", feature: "security_control", label: "Security Control", icon: <LockClosedIcon className="h-6 w-6" /> },
    { to: "/settings", feature: "settings", label: "Settings", icon: <Cog6ToothIcon className="h-6 w-6" /> },
  ];
  const visibleMenu = menu.filter((item) => hasFeature(item.feature));

  return (
    <aside
      className={`
        bg-white/10 backdrop-blur-xl border-r border-white/10 shadow-2xl
        h-screen flex flex-col transition-all duration-300
        ${expanded ? "w-64" : "w-20"}
      `}
      onMouseEnter={() => !mobileMenuOpen && setHovered(true)}
      onMouseLeave={() => !mobileMenuOpen && setHovered(false)}
    >
      {/* -------------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------------- */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div
          className={`
            transition-all duration-300
            ${expanded ? "opacity-100" : "opacity-0 w-0"}
          `}
        >
          {expanded && <Logo variant="full" size="40xl" />}
        </div>
        
        {!expanded && (
          <div className="flex justify-center w-full">
            <Logo variant="logo" size="40xl" />
          </div>
        )}

        {/* Desktop toggle button */}
        {expanded && (
          <button
            className="hidden lg:block p-2 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition"
            onClick={() => setOpen(!open)}
          >
            <svg
              className="w-5 h-5 text-cyberNeon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Mobile close button */}
        <button
          className="lg:hidden p-2 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition"
          onClick={() => setMobileMenuOpen(false)}
        >
          <XMarkIcon className="w-5 h-5 text-cyberNeon" />
        </button>
      </header>

      {/* -------------------------------------- */}
      {/* MENU */}
      {/* -------------------------------------- */}
      <nav className="flex-1 mt-4 px-3 space-y-2 overflow-y-auto">
        {visibleMenu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              // Close mobile menu on navigation
              if (window.innerWidth < 1024) {
                setMobileMenuOpen(false);
              }
            }}
            className={({ isActive }) =>
              `
              flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg transition-all text-white relative
              hover:bg-cyberNeon/10 
              ${isActive ? "bg-cyberNeon/10 border border-cyberNeon/30" : ""}
              `
            }
          >
            {/* ICON */}
            <span className="text-cyberNeon flex-shrink-0">{item.icon}</span>

            {/* LABEL */}
            <span
              className={`
                font-medium text-sm sm:text-base transition-all duration-300
                ${expanded ? "opacity-100" : "opacity-0 w-0"}
              `}
            >
              {item.label}
            </span>

            {/* NOTIFICATION BADGE */}
            {item.badge > 0 && (
              <span
                className={`
                  absolute right-2 sm:right-3 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-red-500 text-white
                  ${expanded ? "" : "hidden"}
                `}
              >
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* -------------------------------------- */}
      {/* LOGOUT */}
      {/* -------------------------------------- */}
      <div className="p-3 sm:p-4 border-t border-white/10">
        <NavLink
          to="/"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("access_token");
            localStorage.removeItem("role");
            localStorage.removeItem("user_profile");
            if (window.innerWidth < 1024) {
              setMobileMenuOpen(false);
            }
          }}
          className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg text-white hover:bg-white/10"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400 flex-shrink-0" />
          <span
            className={`
              text-sm sm:text-base transition-all duration-300
              ${expanded ? "opacity-100" : "opacity-0 w-0"}
            `}
          >
            Logout
          </span>
        </NavLink>
      </div>
    </aside>
  );
}
