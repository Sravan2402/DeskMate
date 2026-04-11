import React, { useState } from "react";
import {
  Monitor,
  Users,
  Settings,
  LogOut,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/";

const Sidebar = ({ activeTab, onTabChange }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const menuItems = [
    { icon: <Monitor size={20} />, label: "My Computers" },
    { icon: <Users size={20} />, label: "Help Someone" },
  ];
  const navigate = useNavigate();

  const handleLogOut = async () => {
    try {
      await fetch(`${API}api/account/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleTabChange = (label) => {
    onTabChange(label);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
            <ShieldAlert className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">
              Deskmate
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
              Remote
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-zinc-400 hover:text-white transition-colors"
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-16 left-0 bottom-0 w-64 bg-[#09090b]/80 backdrop-blur-xl border-r border-zinc-800/50 flex flex-col z-40 px-4 py-6 transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <nav className="flex-1 px-4 mt-8 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleTabChange(item.label)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 group ${
                activeTab === item.label
                  ? "bg-purple-900/20 text-purple-400 border border-purple-500/20 shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 border border-transparent"
              }`}
            >
              <span
                className={
                  activeTab === item.label
                    ? "text-purple-400"
                    : "group-hover:text-zinc-300 transition-colors"
                }
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium tracking-wide">
                {item.label}
              </span>
              {activeTab === item.label && (
                <div className="ml-auto w-1 h-1 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="px-8 my-4">
          <div className="h-[1px] w-full bg-zinc-800/50" />
        </div>

        <div className="px-4 pb-8 space-y-2">
          <button className="w-full flex cursor-pointer items-center gap-4 px-4 py-3 text-zinc-500 hover:text-zinc-300 transition-colors group">
            <Settings size={18} />
            <span className="text-[11px] uppercase tracking-widest font-semibold">
              Settings
            </span>
          </button>
          <button
            onClick={handleLogOut}
            className="w-full cursor-pointer flex items-center gap-4 px-4 py-3 text-red-500/70 hover:text-red-400 transition-colors group"
          >
            <LogOut size={18} />
            <span className="text-[11px] uppercase tracking-widest font-semibold">
              Log Out
            </span>
          </button>
          <div className="px-4 pt-6">
            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-bold">
              Orbital V2.5.0
            </span>
          </div>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-[#09090b]/80 backdrop-blur-xl border-r border-zinc-800/50 flex-col h-screen z-40 px-4 py-6">
        <div className="p-8 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              Deskmate
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
              Remote
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onTabChange(item.label)}
              className={`w-full flex items-center gap-4 px-10 py-4 rounded-xl transition-all duration-300 group ${
                activeTab === item.label
                  ? "bg-purple-900/20 text-purple-400 border border-purple-500/20 shadow-inner"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 border border-transparent"
              }`}
            >
              <span
                className={
                  activeTab === item.label
                    ? "text-purple-400"
                    : "group-hover:text-zinc-300 transition-colors"
                }
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium tracking-wide">
                {item.label}
              </span>
              {activeTab === item.label && (
                <div className="ml-auto w-1 h-1 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="px-8 my-4">
          <div className="h-[1px] w-full bg-zinc-800/50" />
        </div>

        <div className="px-4 pb-8 space-y-2">
          <button className="w-full flex cursor-pointer items-center gap-4 px-4 py-3 text-zinc-500 hover:text-zinc-300 transition-colors group">
            <Settings size={18} />
            <span className="text-[11px] uppercase tracking-widest font-semibold">
              Settings
            </span>
          </button>
          <button
            onClick={handleLogOut}
            className="w-full cursor-pointer flex items-center gap-4 px-4 py-3 text-red-500/70 hover:text-red-400 transition-colors group"
          >
            <LogOut size={18} />
            <span className="text-[11px] uppercase tracking-widest font-semibold">
              Log Out
            </span>
          </button>
          <div className="px-4 pt-6">
            <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-bold">
              Orbital V2.5.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
