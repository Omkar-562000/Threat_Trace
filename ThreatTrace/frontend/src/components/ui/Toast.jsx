// frontend/src/components/ui/Toast.jsx

import { XMarkIcon } from "@heroicons/react/24/solid";
import { useEffect } from "react";

const severityStyles = {
  info: {
    title: "Info",
    border: "border-cyan-400/45",
    text: "text-cyan-300",
    glow: "shadow-[0_0_12px_rgba(0,217,255,0.35)]",
  },
  success: {
    title: "Success",
    border: "border-emerald-400/45",
    text: "text-emerald-300",
    glow: "shadow-[0_0_12px_rgba(34,197,94,0.32)]",
  },
  warn: {
    title: "Warning",
    border: "border-amber-400/45",
    text: "text-amber-300",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.34)]",
  },
  error: {
    title: "Error",
    border: "border-rose-500/45",
    text: "text-rose-300",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.34)]",
  },
  critical: {
    title: "Critical Alert",
    border: "border-red-600/60",
    text: "text-red-300",
    glow: "shadow-[0_0_12px_rgba(220,38,38,0.45)]",
  },
  tamper: {
    title: "Tamper Alert",
    border: "border-rose-500/60",
    text: "text-rose-300",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.4)]",
  },
  ransomware: {
    title: "Ransomware Alert",
    border: "border-red-600/70",
    text: "text-red-400",
    glow: "shadow-[0_0_12px_rgba(185,28,28,0.48)]",
  },
};

export default function Toast({ message, severity = "info", onClose }) {
  const style = severityStyles[severity] || severityStyles.info;

  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slideUp">
      <div
        className={`glass-cyber px-4 py-3 rounded-xl border ${style.border} max-w-xs backdrop-blur-lg ${style.glow} transition-all`}
      >
        <div className="flex items-start justify-between">
          <div className="pr-6">
            <p className={`font-semibold ${style.text}`}>{style.title}</p>
            <p className="text-sm mt-1 break-words text-gray-200">{message}</p>
          </div>

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
