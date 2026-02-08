
import React from 'react';
import { Monitor, Cpu, HardDrive, MoreVertical, Play } from 'lucide-react';

const devices = [
  { id: 1, name: 'Main Workstation', status: 'Online', cpu: '12%', ram: '4.2GB', ip: '192.168.1.104', type: 'Desktop' },
  { id: 2, name: 'MacBook Pro 16', status: 'Online', cpu: '5%', ram: '2.8GB', ip: '192.168.1.108', type: 'Laptop' },
  { id: 3, name: 'Render Server', status: 'Idle', cpu: '1%', ram: '64.0GB', ip: '10.0.0.45', type: 'Server' },
];

const DeviceGrid = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Active Devices</h2>
          <p className="text-zinc-500 mt-1">Manage and connect to your remote systems.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all active:scale-95">
          <span className="text-purple-500 font-black">+</span> Add Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl p-6 hover:border-purple-500/50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] pointer-events-none group-hover:bg-purple-500/10 transition-all" />
            
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl ${device.status === 'Online' ? 'bg-purple-500/10 text-purple-500' : 'bg-zinc-800 text-zinc-500'}`}>
                <Monitor size={24} />
              </div>
              <button className="text-zinc-500 hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <h3 className="text-lg font-bold mb-1">{device.name}</h3>
            <p className="text-xs text-zinc-500 font-mono mb-6">{device.ip}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-zinc-600" />
                <span className="text-xs font-medium text-zinc-300">{device.cpu}</span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive size={14} className="text-zinc-600" />
                <span className="text-xs font-medium text-zinc-300">{device.ram}</span>
              </div>
            </div>

            <button className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-purple-600 transition-all duration-300">
              <Play size={14} fill="currentColor" />
              Connect Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceGrid;
