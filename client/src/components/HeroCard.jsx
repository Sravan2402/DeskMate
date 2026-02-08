import React from "react";

const HeroCard = ({ onAction }) => {
  return (
    <div className="relative group overflow-hidden bg-zinc-950/40 border border-zinc-800/50 rounded-[40px] p-1 shadow-2xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-center gap-12 lg:gap-20 p-8 md:p-12 lg:p-16 rounded-[38px] hero-gradient">
        <div className="relative w-full max-w-sm aspect-square bg-[#1a1a24]/50 rounded-3xl flex items-center justify-center p-8 overflow-hidden group-hover:shadow-[0_0_50px_rgba(139,92,246,0.1)] transition-all duration-700">
          <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-zinc-700 rounded-full" />
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-purple-900 rounded-full" />
          <div className="relative w-48 h-36 bg-purple-900/40 border-4 border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-zinc-800/50" />
          </div>
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-12 h-6 border-b-4 border-zinc-800 rounded-b-lg" />
          <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-20 h-1 bg-zinc-800 rounded-full" />
        </div>

        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Ready to Start?
          </h2>
          <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 mb-10">
            Turn on remote access to use this computer from anywhere else. It
            only takes a minute to set up.
          </p>

          <button
            onClick={onAction}
            className="
    mx-19 my-15 
    px-19 py-7 w-50 h-14
    rounded-3xl 
    cursor-pointer
    text-sm font-black uppercase tracking-[0.2em] 
    text-white
    bg-gradient-to-r from-[#7c3aed] to-[#c026d3]
    hover:from-[#8b5cf6] hover:to-[#d946ef]
    shadow-lg shadow-[rgba(124,58,237,0.3)]
    transition-all duration-300
    active:scale-95
  "
          >
            Turn On Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroCard;
