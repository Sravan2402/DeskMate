import React, { useState, useRef } from "react";
import socket from "../utils/socket";

const API = import.meta.env.VITE_API_URL;

const HeroCard = ({ onStartSession }) => {
  const [status, setStatus] = useState("off"); // off | on | generated
  const [code, setCode] = useState("");
  const [timeLeft, setTimeLeft] = useState("5:00");
  const [isLoading, setIsLoading] = useState(false);

  const timerRef = useRef(null);

  const onTurn = () => setStatus("on");

  const onGenerateCode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/sessions/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed:", data.message);
        return;
      }

      const sessionCode = data.code;
      setCode(sessionCode);
      setStatus("generated");

      // Countdown timer
      let seconds = data.expiresIn || 300;
      timerRef.current = setInterval(() => {
        seconds -= 1;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
        if (seconds <= 0) {
          clearInterval(timerRef.current);
          resetToOff();
        }
      }, 1000);

      // Join room as host, wait for guest
      socket.connect();
      socket.emit("join-room", { code: sessionCode, role: "host" });
      socket.on("peer-joined", () => {
        clearInterval(timerRef.current);
        // ← pass guestReady: true so ScreenShareView shows button immediately
        onStartSession(
          "host",
          sessionCode,
          () => stopSharing(sessionCode),
          true,
        );
      });
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToOff = () => {
    clearInterval(timerRef.current);
    setStatus("off");
    setCode("");
    setTimeLeft("5:00");
  };

  const stopSharing = async (sessionCode) => {
    const c = sessionCode || code;
    try {
      if (c) {
        await fetch(`${API}/api/sessions/end`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ code: c }),
        });
      }
    } catch (err) {
      console.error("End session error:", err);
    } finally {
      clearInterval(timerRef.current);
      socket.off("peer-joined");
      socket.emit("end-session", { code: c });
      socket.disconnect();
      resetToOff();
    }
  };

  return (
    <div className="relative group overflow-hidden bg-zinc-950/40 border border-zinc-800/50 rounded-[40px] p-1 shadow-2xl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-20 p-6 sm:p-8 md:p-12 lg:p-16 rounded-[38px] hero-gradient">
        {/* Monitor illustration */}
        <div className="relative w-full max-w-[220px] sm:max-w-sm aspect-square bg-[#1a1a24]/50 rounded-3xl flex items-center justify-center p-8 overflow-hidden flex-shrink-0">
          <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-zinc-700 rounded-full" />
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-purple-900 rounded-full" />
          <div className="relative w-36 sm:w-48 h-28 sm:h-36 bg-purple-900/40 border-4 border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <div
              className={`w-3 h-3 rounded-full ${status === "generated" ? "bg-yellow-400 animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)]" : "bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"}`}
            />
            <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-zinc-800/50" />
          </div>
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-12 h-6 border-b-4 border-zinc-800 rounded-b-lg" />
          <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-20 h-1 bg-zinc-800 rounded-full" />
        </div>

        {/* ── OFF ─────────────────────────────────────────────────────────── */}
        {status === "off" && (
          <div className="flex-1 text-center lg:text-left w-full">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 sm:mb-6 leading-tight">
              Ready to Start?
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 mb-8 sm:mb-10">
              Turn on remote access to let someone connect to your computer from
              anywhere.
            </p>
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={onTurn}
                className="px-8 py-3 w-44 h-14 rounded-3xl cursor-pointer text-sm font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-[#7c3aed] to-[#c026d3] hover:from-[#8b5cf6] hover:to-[#d946ef] shadow-lg shadow-[rgba(124,58,237,0.3)] transition-all duration-300 active:scale-95"
              >
                Turn On Now
              </button>
            </div>
          </div>
        )}

        {/* ── ON ──────────────────────────────────────────────────────────── */}
        {status === "on" && (
          <div className="flex-1 text-center lg:text-left w-full">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4 sm:mb-6 leading-tight">
              Share this Screen
            </h2>
            <p className="text-base sm:text-lg text-zinc-400 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 mb-8 sm:mb-10">
              Generate a code and share it. When the guest connects you'll pick
              which screen to share.
            </p>
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={onGenerateCode}
                disabled={isLoading}
                className="px-8 py-3 w-44 h-14 rounded-3xl cursor-pointer text-sm font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-[#7c3aed] to-[#c026d3] hover:from-[#8b5cf6] hover:to-[#d946ef] shadow-lg shadow-[rgba(124,58,237,0.3)] transition-all duration-300 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Generating..." : "+ Generate Code"}
              </button>
            </div>
          </div>
        )}

        {/* ── GENERATED ───────────────────────────────────────────────────── */}
        {status === "generated" && (
          <div className="flex-1 text-center lg:text-left w-full">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3 leading-tight">
              Waiting for Guest
            </h2>
            <p className="text-base text-zinc-400 font-medium leading-relaxed max-w-md mx-auto lg:mx-0 mb-6">
              Share this code. Once they join, you'll be asked to pick your
              screen.
            </p>

            <div className="mb-6 flex flex-col items-center lg:items-start gap-2">
              <div className="text-3xl sm:text-4xl font-black tracking-[0.3em] text-white font-mono bg-zinc-900/60 px-6 py-3 rounded-2xl border border-zinc-800">
                {code}
              </div>
              <p className="text-sm text-zinc-500">
                Expires in{" "}
                <span className="text-zinc-300 font-semibold">{timeLeft}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 justify-center lg:justify-start mb-6">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                Waiting for guest to join
              </span>
            </div>

            <div className="flex justify-center lg:justify-start">
              <button
                onClick={() => stopSharing(code)}
                className="px-8 py-3 w-44 h-14 rounded-3xl cursor-pointer text-sm font-black uppercase tracking-[0.2em] text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-all duration-300 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroCard;
