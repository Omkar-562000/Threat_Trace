// frontend/src/components/ui/TopNavbar.jsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../utils/socket";
import Toast from "./Toast";
import { getMyProfile, readCachedProfile, cacheProfile } from "../../services/profileService";

import {
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Bars3Icon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { getPreferredTheme, toggleTheme } from "../../utils/theme";

export default function TopNavbar({ onMobileMenuClick }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newAlert, setNewAlert] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(() => readCachedProfile());
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  const [theme, setTheme] = useState(() => getPreferredTheme());

  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleAlert = (msg) => {
      const alertText = msg?.message || msg?.title || "Security event detected";

      const entry = {
        message: alertText,
        severity: msg?.severity || "info",
        source: msg?.source || "system",
        time: new Date().toLocaleString(),
      };

      setNotifications((prev) => [entry, ...prev].slice(0, 50));
      setToast(alertText);
      setTimeout(() => setToast(null), 3500);
      setNewAlert(true);
      setUnreadCount((prev) => prev + 1);
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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getMyProfile();
        if (res.status === "success" && res.profile) {
          cacheProfile(res.profile);
          setProfile(res.profile);
        }
      } catch {
        // Use cached profile only.
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setViewportWidth(w);
      if (w < 640) {
        setOpenNotifications(false);
        setOpenUserMenu(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setOpenNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setOpenUserMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenNotifications(false);
        setOpenUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const isTiny = viewportWidth < 480;
  const showSearchInput = viewportWidth >= 360;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/logs?q=${encodeURIComponent(q)}`);
  };

  return (
    <header
      className="
        w-full glass-cyber px-2 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-white/20
        flex items-center gap-2 sm:gap-3 shadow-lg backdrop-blur-xl
        sticky top-0 z-40
      "
    >
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <button
        onClick={onMobileMenuClick}
        className="lg:hidden p-2 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition"
        aria-label="Open navigation menu"
      >
        <Bars3Icon className="h-6 w-6 text-cyberNeon" />
      </button>

      <form
        className="
          flex items-center gap-2 md:gap-3 bg-white/10 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl
          backdrop-blur-md border border-white/20 flex-1 min-w-0 max-w-md lg:max-w-lg
          shadow-md hover:border-cyberNeon/40 transition-all
        "
        onSubmit={handleSearchSubmit}
      >
        <MagnifyingGlassIcon className="h-4 w-4 md:h-5 md:w-5 text-cyberNeon flex-shrink-0" />
        {showSearchInput && (
          <input
            placeholder={isTiny ? "Search" : "Search logs, IP, user..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent w-full min-w-0 focus:outline-none text-white placeholder-gray-300 text-xs sm:text-sm md:text-base"
          />
        )}
      </form>

      <div className="flex items-center gap-1 sm:gap-3 md:gap-4 ml-auto">
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-white/10 border border-white/10 transition"
          onClick={() => setTheme((prev) => toggleTheme(prev))}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <MoonIcon className="h-5 w-5 sm:h-6 sm:w-6 text-cyberNeon" />
          ) : (
            <SunIcon className="h-5 w-5 sm:h-6 sm:w-6 text-cyberNeon" />
          )}
        </button>

        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            className="relative p-1 rounded-lg hover:bg-white/10 transition"
            onClick={() => {
              setNewAlert(false);
              setUnreadCount(0);
              setOpenNotifications((s) => !s);
              setOpenUserMenu(false);
            }}
            aria-label="Open notifications"
          >
            <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-cyberNeon hover:text-cyberPurple transition" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {newAlert && (
            <>
              <span className="absolute top-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-red-400 rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></span>
            </>
          )}

          {openNotifications && (
            <div
              className="
                absolute right-0 mt-2 w-[min(92vw,22rem)] glass-cyber p-3
                rounded-xl border border-white/20 shadow-xl z-50 max-h-80 overflow-y-auto
              "
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white text-sm md:text-base">Recent Alerts</h3>
                <button
                  type="button"
                  className="text-[11px] px-2 py-1 rounded border border-white/20 text-gray-300 hover:bg-white/10"
                  onClick={() => setNotifications([])}
                >
                  Clear
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className="text-gray-300 text-xs md:text-sm">No alerts yet.</p>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={`${n.time}-${i}`}
                    className="
                      p-2 mb-2 rounded-lg bg-white/10 border border-white/10
                      text-gray-200 text-xs md:text-sm cursor-pointer hover:bg-white/15
                    "
                    onClick={() => {
                      setOpenNotifications(false);
                      navigate("/alerts");
                    }}
                  >
                    <p className="font-medium">{n.message}</p>
                    <p className="text-xs text-gray-400">{n.time} | {n.source}</p>
                  </div>
                ))
              )}
              <button
                type="button"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-cyberNeon/20 hover:bg-cyberNeon/30 text-white text-xs sm:text-sm"
                onClick={() => {
                  setOpenNotifications(false);
                  navigate("/alerts");
                }}
              >
                View All Alerts
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setOpenUserMenu((s) => !s);
              setOpenNotifications(false);
            }}
            className="
              flex items-center gap-1 md:gap-2 bg-white/10 border border-white/20
              px-2 sm:px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl hover:border-cyberNeon/40
              transition-all text-white
            "
            aria-label="Open profile menu"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile avatar"
                className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 rounded-full object-cover border border-cyberNeon/40 flex-shrink-0"
              />
            ) : (
              <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-cyberNeon flex-shrink-0" />
            )}
            <span className="font-semibold hidden xl:block text-sm">
              {profile?.display_name || profile?.name || "User"}
            </span>
            <ChevronDownIcon className="hidden sm:block h-3 w-3 md:h-4 md:w-4" />
          </button>

          {openUserMenu && (
            <div
              className="
                absolute right-0 mt-3 w-44 md:w-48 glass-cyber border border-white/20
                rounded-xl p-2 md:p-3 shadow-lg flex flex-col text-white z-50
              "
            >
              <button
                onClick={() => {
                  setOpenUserMenu(false);
                  navigate("/settings");
                }}
                className="px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-white/10 text-left text-sm md:text-base"
              >
                Profile Settings
              </button>

              <button
                onClick={() => {
                  setOpenUserMenu(false);
                  navigate("/settings");
                }}
                className="px-2 md:px-3 py-1.5 md:py-2 rounded-lg hover:bg-white/10 text-left text-sm md:text-base"
              >
                System Preferences
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("access_token");
                  localStorage.removeItem("role");
                  localStorage.removeItem("user_profile");
                  window.location.href = "/";
                }}
                className="
                  px-2 md:px-3 py-1.5 md:py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30
                  text-left mt-1 text-sm md:text-base
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
