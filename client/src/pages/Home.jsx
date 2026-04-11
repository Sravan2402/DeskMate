import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardView from "../components/DashboardView";
import HelpView from "../components/HelpView";
import ScreenShareView from "../components/ScreenShareView";
import { useLocation } from "react-router-dom";

const Home = () => {
  const location = useLocation();
  const email =
    location.state?.email || localStorage.getItem("userEmail") || "";

  const [activeTab, setActiveTab] = useState("My Computers");

  // session = { role, code, onEnd, guestReady }
  const [session, setSession] = useState(null);

  const startSession = (role, code, onEnd, guestReady = false) => {
    setSession({ role, code, onEnd, guestReady });
  };

  const endSession = () => setSession(null);

  // ── Render ScreenShareView fullscreen when session is active ──────────────
  if (session) {
    return (
      <ScreenShareView
        role={session.role}
        code={session.code}
        guestReady={session.guestReady}
        onEnd={() => {
          session.onEnd?.();
          endSession();
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white overflow-hidden w-full">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative pt-16 md:pt-0">
        <Header activeTab={activeTab} email={email} />

        <div className="flex-1 px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:px-20 relative z-10 max-w-7xl mx-auto w-full">
          {activeTab === "Help Someone" ? (
            <HelpView onStartSession={startSession} />
          ) : (
            <DashboardView onStartSession={startSession} />
          )}

          <div className="mt-12 opacity-10 pointer-events-none">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
          </div>
        </div>

        <footer className="px-4 py-6 sm:px-8 sm:py-8 md:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center text-[9px] uppercase tracking-[0.3em] text-zinc-600 gap-4 border-t border-zinc-900/50">
          <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
            <a
              href="#"
              className="hover:text-white transition-colors font-bold"
            >
              Documentation
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors font-bold"
            >
              Security Whitepaper
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors font-bold"
            >
              API Cloud
            </a>
          </div>
          <div className="font-black text-zinc-700">
            &copy; 2025 ORBITAL SYSTEMS • ALL RIGHTS RESERVED
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Home;
