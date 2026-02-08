import React from "react";
import { Shield, Activity, Cpu, Network, Server } from "lucide-react";
import HeroCard from "./HeroCard";

const DashboardView = ({ onAction }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <HeroCard onAction={onAction} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: <Shield size={20} className="text-purple-500" />,
            label: "Security",
            val: "AES-256",
            desc: "End-to-end encrypted",
          },
          {
            icon: <Activity size={20} className="text-green-500" />,
            label: "Status",
            val: "Ready",
            desc: "Node synchronization active",
          },
          {
            icon: <Cpu size={20} className="text-blue-500" />,
            label: "Latency",
            val: "Low-Band",
            desc: "Optimal pathing enabled",
          },
          {
            icon: <Network size={20} className="text-fuchsia-500" />,
            label: "Network",
            val: "P2P Mesh",
            desc: "Zero-config routing",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-[#09090b]/40 border border-zinc-800/50 p-6 rounded-[32px] hover:border-zinc-700 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-zinc-900 rounded-2xl group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500">
                {stat.label}
              </span>
            </div>
            <div className="text-xl font-bold text-white mb-1">{stat.val}</div>
            <div className="text-xs text-zinc-500 font-medium">{stat.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardView;
