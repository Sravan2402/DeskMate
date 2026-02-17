import React from "react";
import { Sun, Moon, ChevronDown, Bell } from "lucide-react";

const Header = ({ activeTab, email, password }) => {
  return (
    <header className="h-14 md:h-20 px-4 sm:px-8 md:px-12 flex items-center justify-between border-b border-zinc-900/50 backdrop-blur-md sticky top-0 z-30">
      {/* Breadcrumb — hidden on small screens */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">
        <span className="hover:text-zinc-300 cursor-pointer transition-colors">
          Home
        </span>
        <span className="text-zinc-700 mx-1">/</span>
        <span className="text-zinc-300">{activeTab}</span>
      </div>

      {/* Mobile: active tab title */}
      <div className="sm:hidden text-sm font-bold text-zinc-300 uppercase tracking-widest">
        {activeTab}
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center bg-zinc-900/50 p-1 rounded-full border border-zinc-800 gap-1 h-5 w-8">
          <button className="p-1.5 rounded-full text-zinc-600 hover:text-zinc-400">
            <Sun size={14} />
          </button>
          <button className="p-1.5 rounded-full bg-purple-600 text-white shadow-lg shadow-purple-900/40">
            <Moon size={14} />
          </button>
        </div>

        <div className="hidden sm:block h-6 w-[1px] bg-zinc-800" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=OrbitalUser"
              alt="User"
            />
          </div>
          {/* Email + plan label — hidden on small screens */}
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors max-w-[120px] md:max-w-none truncate">
                {email}
              </span>
              {/* profile dropdown */}
              <ChevronDown
                size={12}
                className="text-zinc-500 group-hover:text-white transition-all"
              />
            </div>
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-black">
              Pro Plan
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
