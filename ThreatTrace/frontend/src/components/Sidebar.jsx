import {
    ArrowRightOnRectangleIcon,
    DocumentMagnifyingGlassIcon,
    HomeIcon,
    ShieldCheckIcon,
    WrenchIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
    const [open, setOpen] = useState(true);

    return (
        <div className={`h-screen bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-xl 
                         transition-all duration-300 ${open ? "w-64" : "w-20"} flex flex-col`}>

            {/* === Logo & Toggle Button === */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
                <h1
                    className={`font-Orbitron text-xl text-cyberPurple font-bold transition-all 
                                ${open ? "opacity-100" : "opacity-0 w-0"}`}
                >
                    ThreatTrace
                </h1>

                <button
                    onClick={() => setOpen(!open)}
                    className="p-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20"
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
            </div>

            {/* === Navigation Items === */}
            <div className="mt-6 flex flex-col gap-2 px-3">
                <NavItem to="/dashboard" icon={<HomeIcon className="h-6 w-6" />} text="Dashboard" open={open} />
                <NavItem to="/ransomware" icon={<ShieldCheckIcon className="h-6 w-6" />} text="Ransomware" open={open} />
                <NavItem to="/audit" icon={<DocumentMagnifyingGlassIcon className="h-6 w-6" />} text="Audit Logs" open={open} />
                <NavItem to="/settings" icon={<WrenchIcon className="h-6 w-6" />} text="Settings" open={open} />

                <div className="mt-auto mb-6">
                    <NavItem
                        to="/"
                        icon={<ArrowRightOnRectangleIcon className="h-6 w-6" />}
                        text="Logout"
                        open={open}
                    />
                </div>
            </div>
        </div>
    );
}

function NavItem({ to, icon, text, open }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/10 
                       hover:bg-cyberNeon/20 hover:border-cyberNeon/40 transition-all text-white"
        >
            <div className="text-cyberNeon">{icon}</div>
            <span className={`font-medium transition-all ${open ? "opacity-100" : "opacity-0 w-0"}`}>
                {text}
            </span>
        </Link>
    );
}
