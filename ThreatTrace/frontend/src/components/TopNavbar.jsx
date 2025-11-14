import {
    BellIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function TopNavbar() {
    const [openMenu, setOpenMenu] = useState(false);

    return (
        <div className="w-full glass-cyber flex items-center justify-between px-6 py-3 border-b border-white/20">

            {/* ===== LEFT: SEARCH BAR ===== */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl 
                            border border-white/20 w-80 shadow-lg hover:border-cyberNeon/40 transition-all">
                <MagnifyingGlassIcon className="h-5 w-5 text-cyberNeon" />
                <input
                    className="bg-transparent w-full focus:outline-none text-white placeholder-gray-300"
                    placeholder="Search threats, logs, modules..."
                />
            </div>

            {/* ===== RIGHT: NOTIFICATION + PROFILE ===== */}
            <div className="flex items-center gap-6">

                {/* NOTIFICATIONS */}
                <div className="relative cursor-pointer group">
                    <BellIcon className="h-7 w-7 text-cyberNeon group-hover:text-cyberPurple transition-all" />

                    {/* glowing alert dot */}
                    <span className="absolute top-0 right-0 w-3 h-3 bg-cyberPurple rounded-full 
                                     animate-pulse shadow-[0_0_10px_#a855f7]"></span>
                </div>

                {/* PROFILE MENU */}
                <div className="relative">
                    <button
                        className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-xl 
                                   hover:border-cyberNeon/40 transition-all text-white"
                        onClick={() => setOpenMenu(!openMenu)}
                    >
                        <UserCircleIcon className="h-7 w-7 text-cyberNeon" />
                        <span className="font-semibold hidden md:block">Admin</span>
                        <ChevronDownIcon className="h-4 w-4 text-white" />
                    </button>

                    {/* DROPDOWN MENU */}
                    {openMenu && (
                        <div className="absolute right-0 mt-3 w-48 glass-cyber border border-white/20 rounded-xl p-3
                                        shadow-xl flex flex-col text-white z-50">
                            
                            <button className="px-3 py-2 rounded-lg hover:bg-white/10 text-left">
                                Profile Settings
                            </button>

                            <button className="px-3 py-2 rounded-lg hover:bg-white/10 text-left">
                                System Preferences
                            </button>

                            <button className="px-3 py-2 rounded-lg hover:bg-cyberPurple/30 text-left mt-1">
                                Logout
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
