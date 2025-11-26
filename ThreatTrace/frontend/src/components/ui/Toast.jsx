// frontend/src/components/ui/Toast.jsx
import { useEffect } from "react";

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className="bg-white/6 backdrop-blur-xl border border-purple-600/30 px-4 py-3 rounded-xl shadow-lg text-white max-w-xs">
        <p className="font-semibold text-cyberNeon">Tamper Alert 🚨</p>
        <p className="text-sm mt-1 break-words">{message}</p>
      </div>
    </div>
  );
}
