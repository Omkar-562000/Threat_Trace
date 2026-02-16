// frontend/src/components/ui/TopNavbar.jsx

import { useEffect, useState } from "react";
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
} from "@heroicons/react/24/outline";

export default function TopNavbar({ onMobileMenuClick, mobileMenuOpen }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newAlert, setNewAlert] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(() => readCachedProfile());
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  /* -------------------------------------------------------
     SOCKET.IO : REAL-TIME ALERT HANDLING
  ------------------------------------------------------- */
  useEffect(() => {
    const handleAlert = (msg) => {
      const alertText =
        msg?.message || msg?.title || "⚠ Security Event Detected";

      const entry = {
        message: alertText,
        severity: msg?.severity || "info",
        source: msg?.source || "system",
        time: new Date().toLocaleString(),
      };

      // add to list
      setNotifications((prev) => [entry, ...prev]);

      // show toast
      setToast(alertText);
      setTimeout(() => setToast(null), 3500);

      // bell icon pulse
      setNewAlert(true);
    };

    // listeners
    socket.on("new_alert", handleAlert);
    socket.on("tamper_alert", handleAlert);
    socket.on("ransomware_alert", handleAlert);

    // cleanup to prevent double listening
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
        // fallback to cached profile only
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setViewportWidth(w);
      // Close floating menus when switching to very small screens
      if (w < 640) {
        setOpenNotifications(false);
        setOpenUserMenu(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* -------------------------------------------------------
         MOBILE MENU BUTTON (Left side on mobile)
      ------------------------------------------------------- */}
      <button
        onClick={onMobileMenuClick}
        className="lg:hidden p-2 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition"
      >
        <Bars3Icon className="h-6 w-6 text-cyberNeon" />
      </button>

      {/* -------------------------------------------------------
         SEARCH BAR (Hidden on small mobile, visible on tablet+)
      ------------------------------------------------------- */}
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
            placeholder={isTiny ? "Search" : "Search..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent w-full min-w-0 focus:outline-none text-white placeholder-gray-300 text-xs sm:text-sm md:text-base"
          />
        )}
      </form>

      {/* -------------------------------------------------------
         RIGHT ACTIONS
      ------------------------------------------------------- */}
      <div className="flex items-center gap-1 sm:gap-3 md:gap-4 ml-auto">

        {/* -------------------------------------------------------
           ALERT BELL + DROPDOWN
        ------------------------------------------------------- */}
        <div className="relative">
          <button
            type="button"
            className="relative p-1 rounded-lg hover:bg-white/10 transition"
            onClick={() => {
              setNewAlert(false);
              setOpenNotifications((s) => !s);
              setOpenUserMenu(false);
            }}
          >
            <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-cyberNeon hover:text-cyberPurple transition" />
          </button>

          {newAlert && (
            <>
              <span className="absolute top-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-red-400 rounded-full animate-ping"></span>
              <span className="absolute top-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></span>
            </>
          )}

          {/* Dropdown */}
          {openNotifications && (
            <div
              className="
                absolute right-0 mt-2 w-[min(92vw,20rem)] glass-cyber p-3
                rounded-xl border border-white/20 shadow-xl z-50 max-h-72 overflow-y-auto
              "
            >
              <h3 className="font-semibold text-white mb-2 text-sm md:text-base">Recent Alerts</h3>

              {notifications.length === 0 ? (
                <p className="text-gray-300 text-xs md:text-sm">No alerts yet.</p>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={i}
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

        {/* -------------------------------------------------------
           USER MENU DROPDOWN
        ------------------------------------------------------- */}
        <div className="relative">
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
