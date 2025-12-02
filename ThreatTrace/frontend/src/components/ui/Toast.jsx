// frontend/src/components/ui/Toast.jsx

import { XMarkIcon } from "@heroicons/react/24/solid";
import { useEffect } from "react";

/* ----------------------------------------------
   Severity Theme Colors for Tactical Neural UI
---------------------------------------------- */
const severityStyles = {
  info: {
    title: "Information",
    border: "border-cyan-400/40",
    text: "text-cyan-300",
    glow: "shadow-[0_0_12px_rgba(0,255,255,0.3)]",
  },
  success: {
    title: "Success ✔",
    border: "border-green-400/40",
    text: "text-green-300",
    glow: "shadow-[0_0_12px_rgba(0,255,128,0.3)]",
  },
  warn: {
    title: "Warning ⚠️",
    border: "border-yellow-400/40",
    text: "text-yellow-300",
    glow: "shadow-[0_0_12px_rgba(255,255,0,0.3)]",
  },
  error: {
    title: "Error ❌",
    border: "border-red-500/40",
    text: "text-red-300",
    glow: "shadow-[0_0_12px_rgba(255,0,0,0.3)]",
  },
  critical: {
    title: "Critical Alert 🚨",
    border: "border-purple-500/60",
    text: "text-purple-300",
    glow: "shadow-[0_0_12px_rgba(180,0,255,0.4)]",
  },
  tamper: {
    title: "Tamper Alert 🚨",
    border: "border-rose-500/60",
    text: "text-rose-300",
    glow: "shadow-[0_0_12px_rgba(255,0,128,0.4)]",
  },
  ransomware: {
    title: "Ransomware Alert 🛑",
    border: "border-red-600/70",
    text: "text-red-400",
    glow: "shadow-[0_0_12px_rgba(255,0,64,0.5)]",
  },
};

export default function Toast({ message, severity = "info", onClose }) {
  const style = severityStyles[severity] || severityStyles.info;

  // Auto-close after 4.5s
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slideUp">
      <div
        className={`glass-cyber px-4 py-3 rounded-xl border ${style.border} 
                    max-w-xs backdrop-blur-lg ${style.glow} transition-all`}
      >
        <div className="flex items-start justify-between">
          <div className="pr-6">
            <p className={`font-semibold ${style.text}`}>{style.title}</p>

            <p className="text-sm mt-1 break-words text-gray-200">
              {message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="ml-3 text-gray-300 hover:text-white hover:scale-110 transition"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
