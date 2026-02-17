import React, { useState, useEffect } from "react";

const ConnectionLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 1 : 100));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <div className="relative w-32 h-32 sm:w-48 sm:h-48 mb-6 sm:mb-8">
        <div className="absolute inset-0 border-4 border-zinc-900 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"
          style={{ animationDuration: "0.8s" }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl font-black text-white">
            {progress}%
          </span>
          <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-zinc-500">
            Syncing
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight">
          Establishing Secure Tunnel
        </h3>
        <p className="text-zinc-500 text-xs sm:text-sm max-w-xs font-medium">
          Creating an encrypted P2P bridge to your orbital network...
        </p>
      </div>

      <div className="mt-8 sm:mt-12 bg-black/40 border border-zinc-800/50 p-4 rounded-xl w-full max-w-xs sm:max-w-md font-mono text-[10px] text-zinc-500 text-left space-y-1 overflow-hidden">
        <div className="flex gap-2 min-w-0">
          <span className="text-purple-500 flex-shrink-0">INFO</span>
          <span className="truncate">
            Initializing Orbital handshake v2.5.0
          </span>
        </div>
        <div className="flex gap-2 min-w-0">
          <span className="text-purple-500 flex-shrink-0">INFO</span>
          <span className="truncate">
            Generated ephemeral session key: 0x82f...a12
          </span>
        </div>
        <div className="flex gap-2 min-w-0">
          <span className="text-green-500 flex-shrink-0">OK</span>
          <span className="truncate">NAT traversal successful (UDP)</span>
        </div>
        <div className="flex gap-2 min-w-0">
          <span className="text-zinc-600 flex-shrink-0">WAIT</span>
          <span className="truncate">
            Pinging edge locations for lowest latency...
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionLoader;
