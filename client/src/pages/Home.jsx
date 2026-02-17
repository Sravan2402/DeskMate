import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardView from "../components/DashboardView";
import HelpView from "../components/HelpView";
import ChatAssistant from "../components/ChatAssistant";

const Home = () => {
  const [activeTab, setActiveTab] = useState("My Computers");
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const { email, password } = window.location.state || {};
  const handleNoOp = () => {
    console.debug("Orbital Link: Signal received, standby mode.");
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white overflow-hidden w-full">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* pt-16 on mobile to clear the fixed mobile top bar from Sidebar */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative pt-16 md:pt-0">
        <Header activeTab={activeTab} email={email} password={password} />

        <div className="flex-1 px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:px-20 relative z-10 max-w-7xl mx-auto w-full">
          {activeTab === "Help Someone" ? (
            <HelpView />
          ) : (
            <DashboardView onAction={handleNoOp} />
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

      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
        <button
          onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center orbital-glow hover:scale-110 hover:-rotate-3 transition-all duration-300 shadow-2xl shadow-purple-900/50 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white group-hover:scale-110 transition-transform sm:w-7 sm:h-7"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </button>
      </div>

      {isAIAssistantOpen && (
        <ChatAssistant
          onClose={() => setIsAIAssistantOpen(false)}
          context={
            activeTab === "My Computers" ? "access-disabled" : "access-enabled"
          }
        />
      )}
    </div>
  );
};

export default Home;
