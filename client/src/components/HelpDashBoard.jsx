import React, { useState } from "react";
import socket from "../utils/socket";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080/";

const HelpDashBoard = ({ onStartSession }) => {
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | connecting | connected

  const handleConnect = async () => {
    const trimmed = inputCode.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter a session code");
      return;
    }
    setError("");
    setIsLoading(true);
    setStatus("connecting");

    try {
      const res = await fetch(`${API}api/sessions/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid or expired code");
        setStatus("idle");
        return;
      }

      socket.connect();
      socket.emit("join-room", { code: trimmed, role: "guest" });

      setStatus("connected");
      setTimeout(() => {
        onStartSession("guest", trimmed, () => resetToIdle(trimmed));
      }, 1200);
    } catch {
      setError("Network error — check your connection");
      setStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const resetToIdle = (sessionCode) => {
    socket.off("session-ended");
    socket.emit("end-session", { code: sessionCode });
    socket.disconnect();
    setInputCode("");
    setError("");
    setStatus("idle");
  };

  return (
    <>
      {/* ── MOBILE layout (matches screenshot exactly) ─────────────────────
          No card, no border, content centered on dark background          */}
      <div className="lg:hidden flex flex-col items-center px-5 pt-4 pb-10 min-h-[calc(100vh-64px)]">
        {/* Monitor illustration — centered, dark bg square */}
        <div className="relative w-[200px] aspect-square bg-[#0e0e14] rounded-3xl flex items-center justify-center mb-8 overflow-hidden flex-shrink-0">
          <div className="absolute top-5 left-5 w-1.5 h-1.5 bg-zinc-700 rounded-full" />
          <div className="absolute bottom-8 right-8 w-2 h-2 bg-purple-900 rounded-full" />

          {/* Monitor screen */}
          <div className="relative w-[110px] h-[82px] bg-purple-900/50 border-[3px] border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <div
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                status === "connected"
                  ? "bg-green-400 shadow-[0_0_14px_rgba(74,222,128,1)] animate-pulse"
                  : "bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]"
              }`}
            />
            <div className="absolute bottom-1.5 left-2 right-2 h-0.5 bg-zinc-800/50" />
          </div>

          {/* Stand */}
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-10 h-5 border-b-[3px] border-zinc-800 rounded-b-lg" />
          <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-16 h-0.5 bg-zinc-800 rounded-full" />
        </div>

        {/* Title — huge, matches screenshot weight & size */}
        <h1 className="text-[2rem] leading-tight font-extrabold text-white text-center mb-4 tracking-tight">
          Connect to another computer
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-zinc-400 text-center leading-relaxed mb-6 max-w-xs">
          to remotely access it and provide help. Generate a one-time access
          code and share it with the person you want to connect
        </p>

        {/* Code input — plain white border, matches screenshot */}
        <div className="w-full max-w-xs mb-3">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => {
              setInputCode(
                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
              );
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            placeholder="Enter code"
            maxLength={8}
            autoCapitalize="characters"
            spellCheck={false}
            disabled={status === "connected"}
            className="w-full px-4 py-3 rounded-lg bg-transparent border border-white/30 text-white font-mono text-lg font-bold tracking-[0.2em] placeholder:text-zinc-600 placeholder:font-normal placeholder:tracking-normal outline-none focus:border-white/60 transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="w-full max-w-xs mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <span>⚠️</span>
            <p className="text-xs text-red-400 font-semibold">{error}</p>
          </div>
        )}

        {/* Helper text / status — matches screenshot */}
        <div className="w-full max-w-xs text-center mb-6">
          {(status === "idle" || status === "connecting") && (
            <p className="text-xs text-zinc-500 leading-relaxed">
              The person you connect with will have 5 minutes to enter the code
              and connect to your computer.
            </p>
          )}
          {status === "connected" && (
            <p className="text-sm font-black uppercase tracking-wider text-green-400 animate-pulse leading-relaxed">
              CONNECTED! SCREEN SHARING WILL BEGIN SHORTLY...
            </p>
          )}
        </div>

        {/* Connect button — only show when idle */}
        {status !== "connected" && (
          <button
            onClick={handleConnect}
            disabled={isLoading || !inputCode.trim()}
            className="w-full max-w-xs h-14 rounded-2xl text-sm font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-[#7c3aed] to-[#c026d3] hover:from-[#8b5cf6] hover:to-[#d946ef] shadow-lg shadow-purple-900/40 transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Connecting...
              </span>
            ) : (
              "Connect"
            )}
          </button>
        )}
      </div>

      {/* ── DESKTOP layout (keeps existing card style) ─────────────────────── */}
      <div className="hidden lg:block">
        <div className="relative overflow-hidden bg-zinc-950/40 border border-zinc-800/50 rounded-[40px] p-1 shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-purple-600/5 blur-[120px] pointer-events-none" />

          <div className="relative flex flex-row items-center gap-16 p-16 rounded-[38px] hero-gradient">
            {/* Desktop monitor illustration */}
            <div className="relative w-72 aspect-square bg-[#1a1a24]/50 rounded-3xl flex items-center justify-center p-8 overflow-hidden flex-shrink-0">
              <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-zinc-700 rounded-full" />
              <div className="absolute bottom-10 right-10 w-2 h-2 bg-purple-900 rounded-full" />
              <div className="relative w-44 h-32 bg-purple-900/40 border-4 border-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                <div className="flex items-center gap-1.5 z-10">
                  <div className="w-5 h-7 rounded-md border-2 border-purple-400/60 bg-purple-500/10 flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-purple-400/60 rounded-full" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="w-3 h-0.5 bg-purple-400/40 rounded-full" />
                    <div className="w-4 h-0.5 bg-purple-400/60 rounded-full" />
                    <div className="w-3 h-0.5 bg-purple-400/40 rounded-full" />
                  </div>
                  <div
                    className={`w-7 h-5 rounded border-2 bg-zinc-800/60 flex items-center justify-center transition-all duration-500 ${status === "connected" ? "border-green-400/80" : "border-zinc-500/60"}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${status === "connected" ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)] animate-pulse" : "bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.8)]"}`}
                    />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-zinc-800/50" />
              </div>
              <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-12 h-6 border-b-4 border-zinc-800 rounded-b-lg" />
              <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-20 h-1 bg-zinc-800 rounded-full" />
            </div>

            {/* Desktop content */}
            <div className="flex-1">
              <h2 className="text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                Help Someone
              </h2>
              <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-md mb-8">
                Enter the code from the person you want to help. You'll see
                their screen and be able to guide them remotely.
              </p>

              <div className="max-w-sm mb-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                      );
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                    placeholder="Enter code (e.g. A3F9K2)"
                    maxLength={8}
                    autoCapitalize="characters"
                    spellCheck={false}
                    disabled={status === "connected"}
                    className="flex-1 min-w-0 px-5 py-3 rounded-2xl bg-zinc-900/80 border border-zinc-700 text-white font-mono text-lg font-bold tracking-[0.25em] placeholder:text-zinc-600 placeholder:font-normal placeholder:tracking-normal outline-none focus:border-purple-500/60 transition-colors disabled:opacity-60"
                  />
                  <button
                    onClick={handleConnect}
                    disabled={
                      isLoading || !inputCode.trim() || status === "connected"
                    }
                    className="flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-[#7c3aed] to-[#c026d3] hover:from-[#8b5cf6] hover:to-[#d946ef] shadow-lg shadow-purple-900/30 transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Joining...
                      </span>
                    ) : (
                      "Connect"
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <span>⚠️</span>
                    <p className="text-sm text-red-400 font-semibold">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              <div className="max-w-sm mb-6 min-h-[28px]">
                {status === "connected" ? (
                  <p className="text-sm font-black uppercase tracking-wider text-green-400 animate-pulse">
                    CONNECTED! SCREEN SHARING WILL BEGIN SHORTLY...
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    The person you connect with will have 5 minutes to enter the
                    code.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  "🔒 End-to-end encrypted",
                  "⚡ Low latency P2P",
                  "🖱️ Full remote control",
                ].map((b) => (
                  <div
                    key={b}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 font-semibold"
                  >
                    {b}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpDashBoard;
