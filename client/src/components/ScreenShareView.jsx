// src/components/ScreenShareView.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import {
  MonitorOff,
  WifiOff,
  Loader,
  Monitor,
  Smartphone,
  Camera,
  Play,
  MousePointer,
  MousePointerClick,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Type,
  Delete,
} from "lucide-react";
import socket from "../utils/socket";

/* ─── useCursorLongPress ────────────────────────────────────────────────────── */
const BASE_STEP = 10;
const MAX_STEP = 60;
const ACCEL_MS = 1200;
const TICK_MS = 40;
const HOLD_DELAY = 350;

const useCursorLongPress = (emitFn, dx, dy) => {
  const tickRef = useRef(null);
  const holdRef = useRef(null);
  const startRef = useRef(null);
  const activeRef = useRef(false);

  const tick = useCallback(() => {
    if (!activeRef.current) return;
    const progress = Math.min((Date.now() - startRef.current) / ACCEL_MS, 1);
    const step = BASE_STEP + (MAX_STEP - BASE_STEP) * progress;
    emitFn("cursor-move", {
      dx: Math.round(dx * step),
      dy: Math.round(dy * step),
    });
    tickRef.current = setTimeout(tick, TICK_MS);
  }, [emitFn, dx, dy]);

  const start = useCallback(
    (e) => {
      e.preventDefault();
      activeRef.current = true;
      startRef.current = Date.now();
      emitFn("cursor-move", { dx: dx * BASE_STEP, dy: dy * BASE_STEP });
      holdRef.current = setTimeout(() => {
        if (activeRef.current) tick();
      }, HOLD_DELAY);
    },
    [emitFn, dx, dy, tick],
  );

  const stop = useCallback(() => {
    activeRef.current = false;
    clearTimeout(holdRef.current);
    clearTimeout(tickRef.current);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
  };
};

/* ─── useKeyLongPress ──────────────────────────────────────────────────────── */
const useKeyLongPress = (emitFn, key, { delay = 350, interval = 80 } = {}) => {
  const holdRef = useRef(null);
  const repRef = useRef(null);
  const activeRef = useRef(false);

  const fire = useCallback(() => {
    if (activeRef.current) emitFn("key", { key });
  }, [emitFn, key]);

  const start = useCallback(
    (e) => {
      e.preventDefault();
      activeRef.current = true;
      fire();
      holdRef.current = setTimeout(() => {
        if (activeRef.current) repRef.current = setInterval(fire, interval);
      }, delay);
    },
    [fire, delay, interval],
  );

  const stop = useCallback(() => {
    activeRef.current = false;
    clearTimeout(holdRef.current);
    clearInterval(repRef.current);
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
  };
};

/* ═══════════════════════════════════════════════════════════════════════════════
   D-PAD PANEL — up / down / left / right with click in the center
   ═══════════════════════════════════════════════════════════════════════════ */
const DPad = ({ emit, isConnected }) => {
  const lpUp = useCursorLongPress(emit, 0, -1);
  const lpDown = useCursorLongPress(emit, 0, 1);
  const lpLeft = useCursorLongPress(emit, -1, 0);
  const lpRight = useCursorLongPress(emit, 1, 0);

  const pad = {
    wrapper: {
      display: "grid",
      gridTemplateColumns: "36px 36px 36px",
      gridTemplateRows: "36px 36px 36px",
      gap: 3,
    },
    btn: (color = "#38bdf8") => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      border: `1px solid ${color}28`,
      background: `${color}14`,
      color,
      cursor: isConnected ? "pointer" : "not-allowed",
      opacity: isConnected ? 1 : 0.4,
      userSelect: "none",
      WebkitUserSelect: "none",
      touchAction: "none",
      transition: "background 0.12s, transform 0.08s",
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.05em",
    }),
    center: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      border: "1px solid #a855f728",
      background: "#a855f714",
      color: "#a855f7",
      cursor: isConnected ? "pointer" : "not-allowed",
      opacity: isConnected ? 1 : 0.4,
      userSelect: "none",
      fontSize: 8,
      fontWeight: 800,
      letterSpacing: "0.05em",
      flexDirection: "column",
      gap: 1,
    },
  };

  return (
    <div style={pad.wrapper}>
      {/* Row 1 */}
      <div />
      <button style={pad.btn()} title="Move Up (hold)" {...lpUp}>
        <ChevronUp size={16} />
      </button>
      <div />

      {/* Row 2 */}
      <button style={pad.btn()} title="Move Left (hold)" {...lpLeft}>
        <ChevronLeft size={16} />
      </button>

      {/* Center — left click */}
      <button
        style={pad.center}
        title="Left Click"
        onClick={() => emit("click", { button: "left" })}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.92)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <MousePointerClick size={11} />
        <span style={{ fontSize: 7, marginTop: 1 }}>CLICK</span>
      </button>

      <button style={pad.btn()} title="Move Right (hold)" {...lpRight}>
        <ChevronRight size={16} />
      </button>

      {/* Row 3 */}
      <div />
      <button style={pad.btn()} title="Move Down (hold)" {...lpDown}>
        <ChevronDown size={16} />
      </button>
      <div />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   ACTIONS PANEL — right-click, dbl-click, backspace, text
   ═══════════════════════════════════════════════════════════════════════════ */
const ActionsPanel = ({ emit, isConnected }) => {
  const [showText, setShowText] = useState(false);
  const [textVal, setTextVal] = useState("");
  const inputRef = useRef(null);

  const lpBackspace = useKeyLongPress(emit, "Backspace");

  const sendText = () => {
    const str = textVal.trim();
    if (!str) return;
    emit("type-text", { text: str });
    setTextVal("");
    setShowText(false);
  };

  const actionBtn = (color) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: "6px 4px",
    borderRadius: 8,
    width: 52,
    height: 44,
    border: `1px solid ${color}28`,
    background: `${color}14`,
    color,
    cursor: isConnected ? "pointer" : "not-allowed",
    opacity: isConnected ? 1 : 0.4,
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "none",
    fontSize: 7,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    transition: "background 0.12s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Top row: right-click | dbl-click */}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          style={actionBtn("#f59e0b")}
          title="Right Click"
          onClick={() => emit("right-click", {})}
        >
          <MousePointer size={13} />
          Right
        </button>
        <button
          style={actionBtn("#a855f7")}
          title="Double Click"
          onClick={() => emit("double-click", {})}
        >
          <MousePointerClick size={13} />
          Dbl
        </button>
      </div>

      {/* Bottom row: backspace | text */}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          style={actionBtn("#f87171")}
          title="Backspace (hold to repeat)"
          {...lpBackspace}
        >
          <Delete size={13} />⌫
        </button>
        <button
          style={{
            ...actionBtn("#4ade80"),
            background: showText ? "#4ade8028" : "#4ade8014",
          }}
          title="Type text"
          onClick={() => {
            setShowText((v) => !v);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <Type size={13} />
          Text
        </button>
      </div>

      {/* Inline text input — pops up above when open */}
      {showText && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            right: 0,
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 8px",
            borderRadius: 10,
            background: "rgba(9,9,11,0.97)",
            border: "1px solid rgba(168,85,247,0.35)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            minWidth: 240,
          }}
        >
          <input
            ref={inputRef}
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") sendText();
              if (e.key === "Escape") {
                setShowText(false);
                setTextVal("");
              }
            }}
            placeholder="Type & press Enter…"
            style={{
              flex: 1,
              padding: "5px 9px",
              borderRadius: 7,
              background: "rgba(39,39,42,0.9)",
              border: "1px solid rgba(168,85,247,0.35)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              outline: "none",
            }}
          />
          <button
            onClick={sendText}
            style={{
              padding: "5px 9px",
              borderRadius: 7,
              border: "1px solid #4ade8030",
              background: "#4ade8018",
              color: "#4ade80",
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Send
          </button>
          <button
            onClick={() => {
              setShowText(false);
              setTextVal("");
            }}
            style={{
              padding: "5px 7px",
              borderRadius: 7,
              border: "1px solid #f8717130",
              background: "#f8717118",
              color: "#f87171",
              cursor: "pointer",
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   REMOTE TOOLBAR — two floating panels with a divider
   ═══════════════════════════════════════════════════════════════════════════ */
const RemoteToolbar = ({ code, isConnected }) => {
  const emit = useCallback(
    (type, payload = {}) => {
      if (!isConnected) return;
      socket.emit("remote-control", { code, type, payload });
    },
    [isConnected, code],
  );

  const panel = {
    display: "flex",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 14,
    background: "rgba(9,9,11,0.93)",
    border: "1px solid rgba(63,63,70,0.65)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* ── Panel 1: D-pad ── */}
      <div style={panel}>
        <DPad emit={emit} isConnected={isConnected} />
      </div>

      {/* ── Divider label ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <div
          style={{ width: 1, height: 16, background: "rgba(63,63,70,0.5)" }}
        />
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: isConnected ? "#4ade80" : "#facc15",
            boxShadow: isConnected ? "0 0 6px #4ade80" : "0 0 6px #facc15",
          }}
        />
        <div
          style={{ width: 1, height: 16, background: "rgba(63,63,70,0.5)" }}
        />
      </div>

      {/* ── Panel 2: Actions ── */}
      <div style={{ ...panel, position: "relative" }}>
        <ActionsPanel emit={emit} isConnected={isConnected} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
const ScreenShareView = ({
  role,
  code,
  onEnd,
  guestReady: initialGuestReady = false,
}) => {
  const {
    localVideoRef,
    remoteVideoRef,
    isCapturing,
    isConnected,
    guestReady,
    error,
    isMobileHost,
    stopSharing,
    startScreenShare,
    startCameraShare,
  } = useWebRTC(role, code, onEnd, initialGuestReady);

  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    return () => Object.assign(document.body.style, prev);
  }, []);

  useEffect(() => {
    if (role !== "guest") return;
    const video = remoteVideoRef.current;
    if (!video) return;
    const tryPlay = () =>
      video
        .play()
        .then(() => setNeedsTap(false))
        .catch(() => setNeedsTap(true));
    video.addEventListener("loadedmetadata", tryPlay);
    if (video.srcObject) tryPlay();
    return () => video.removeEventListener("loadedmetadata", tryPlay);
  }, [role, remoteVideoRef, isConnected]);

  const handleEnd = () => {
    socket.emit("end-session", { code });
    stopSharing();
    socket.disconnect();
    onEnd?.();
  };

  const s = {
    wrap: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "#09090b",
      display: "flex",
      flexDirection: "column",
    },
    topbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      flexShrink: 0,
      minHeight: 52,
      background: "rgba(9,9,11,0.98)",
      borderBottom: "1px solid rgba(63,63,70,0.5)",
    },
    dot: (ok) => ({
      width: 8,
      height: 8,
      borderRadius: "50%",
      flexShrink: 0,
      background: ok ? "#4ade80" : "#facc15",
      boxShadow: ok
        ? "0 0 8px rgba(74,222,128,0.8)"
        : "0 0 8px rgba(250,204,21,0.6)",
    }),
    label: (ok) => ({
      fontSize: 11,
      fontWeight: 700,
      whiteSpace: "nowrap",
      color: ok ? "#4ade80" : "#facc15",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    }),
    endBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 14px",
      borderRadius: 12,
      flexShrink: 0,
      background: "rgba(239,68,68,0.15)",
      border: "1px solid rgba(239,68,68,0.35)",
      color: "#f87171",
      fontSize: 11,
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
  };

  const TopBar = () => (
    <div style={s.topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={s.dot(isConnected)} />
        <span style={s.label(isConnected)}>
          {isConnected
            ? "Live"
            : role === "host"
              ? guestReady
                ? "Guest ready — start sharing"
                : "Waiting for guest..."
              : "Waiting for host..."}
        </span>
      </div>
      <button onClick={handleEnd} style={s.endBtn}>
        <MonitorOff size={13} /> {role === "host" ? "Stop" : "Disconnect"}
      </button>
    </div>
  );

  /* ── GUEST view ───────────────────────────────────────────────────────────── */
  if (role === "guest") {
    return (
      <div style={s.wrap}>
        <TopBar />
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            tabIndex={0}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "#09090b",
              display: "block",
              outline: "none",
              cursor: isConnected ? "crosshair" : "default",
            }}
            onPointerMove={(e) => {
              if (!isConnected) return;
              const rect = e.currentTarget.getBoundingClientRect();
              socket.emit("remote-control", {
                code,
                type: "mouse-move",
                payload: {
                  x: (e.clientX - rect.left) / rect.width,
                  y: (e.clientY - rect.top) / rect.height,
                },
              });
            }}
            onPointerDown={(e) => {
              if (!isConnected) return;
              e.currentTarget.focus();
              socket.emit("remote-control", {
                code,
                type: "click",
                payload: { button: "left" },
              });
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (!isConnected) return;
              socket.emit("remote-control", {
                code,
                type: "right-click",
                payload: {},
              });
            }}
            onWheel={(e) => {
              if (!isConnected) return;
              socket.emit("remote-control", {
                code,
                type: "scroll",
                payload: { dx: e.deltaX, dy: e.deltaY },
              });
            }}
            onKeyDown={(e) => {
              if (!isConnected) return;
              e.preventDefault();
              socket.emit("remote-control", {
                code,
                type: "key",
                payload: { key: e.key },
              });
            }}
          />

          {!isConnected && !needsTap && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "0 32px",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: "rgba(168,85,247,0.1)",
                  border: "1px solid rgba(168,85,247,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader size={28} color="#a855f7" />
              </div>
              <p
                style={{
                  color: "#a1a1aa",
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Waiting for host to share screen...
              </p>
              <p
                style={{
                  color: "#52525b",
                  fontSize: 13,
                  textAlign: "center",
                  margin: 0,
                }}
              >
                Host needs to click "Start Sharing Screen"
              </p>
            </div>
          )}

          {needsTap && (
            <div
              onClick={() =>
                remoteVideoRef.current?.play().then(() => setNeedsTap(false))
              }
              style={{
                position: "absolute",
                inset: 0,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                background: "rgba(9,9,11,0.85)",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(124,58,237,0.25)",
                  border: "2px solid rgba(124,58,237,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Play size={32} color="#a855f7" fill="#a855f7" />
              </div>
              <p
                style={{
                  color: "#a1a1aa",
                  fontSize: 14,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Tap to start viewing
              </p>
            </div>
          )}

          <RemoteToolbar code={code} isConnected={isConnected} />
        </div>
        {error && <ErrorOverlay error={error} onClose={handleEnd} />}
      </div>
    );
  }

  /* ── HOST view ────────────────────────────────────────────────────────────── */
  return (
    <div style={s.wrap}>
      <TopBar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          overflow: "auto",
        }}
      >
        <video ref={remoteVideoRef} style={{ display: "none" }} />

        {!isCapturing && !guestReady && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              textAlign: "center",
              maxWidth: 360,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: "rgba(168,85,247,0.1)",
                border: "1px solid rgba(168,85,247,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader size={32} color="#a855f7" />
            </div>
            <p
              style={{
                color: "#e4e4e7",
                fontWeight: 700,
                fontSize: 20,
                margin: 0,
              }}
            >
              Waiting for guest
            </p>
            <p
              style={{
                color: "#71717a",
                fontSize: 14,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Share your access code with the person you want to connect with.
            </p>
          </div>
        )}

        {!isCapturing && guestReady && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              textAlign: "center",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Monitor size={32} color="#4ade80" />
            </div>
            <div>
              <p
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 22,
                  margin: "0 0 8px",
                }}
              >
                Guest has joined! 🎉
              </p>
              {isMobileHost ? (
                <p
                  style={{
                    color: "#a1a1aa",
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Screen sharing isn't available on mobile. Share your{" "}
                  <strong style={{ color: "#e4e4e7" }}>camera</strong> or use a{" "}
                  <strong style={{ color: "#e4e4e7" }}>desktop browser</strong>.
                </p>
              ) : (
                <p
                  style={{
                    color: "#a1a1aa",
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Click below, then pick{" "}
                  <strong style={{ color: "#e4e4e7" }}>Entire Screen</strong>.
                </p>
              )}
            </div>
            {!isMobileHost && (
              <button
                onClick={startScreenShare}
                style={{
                  padding: "16px 40px",
                  borderRadius: 40,
                  border: "none",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  background: "linear-gradient(135deg, #7c3aed, #c026d3)",
                  cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
                }}
              >
                Start Sharing Screen
              </button>
            )}
            {isMobileHost && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  width: "100%",
                  maxWidth: 300,
                }}
              >
                <button
                  onClick={startCameraShare}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "14px 24px",
                    borderRadius: 40,
                    border: "none",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    background: "linear-gradient(135deg, #7c3aed, #c026d3)",
                    cursor: "pointer",
                    boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
                  }}
                >
                  <Camera size={16} /> Share Camera
                </button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    borderRadius: 14,
                    background: "rgba(250,204,21,0.08)",
                    border: "1px solid rgba(250,204,21,0.2)",
                  }}
                >
                  <Smartphone
                    size={15}
                    color="#facc15"
                    style={{ flexShrink: 0 }}
                  />
                  <p
                    style={{
                      color: "#fbbf24",
                      fontSize: 12,
                      fontWeight: 600,
                      margin: 0,
                      textAlign: "left",
                      lineHeight: 1.4,
                    }}
                  >
                    For screen sharing, use Chrome or Edge on desktop
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {isCapturing && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              width: "100%",
              maxWidth: 720,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#4ade80",
                  boxShadow: "0 0 8px rgba(74,222,128,0.8)",
                }}
              />
              <span
                style={{
                  color: "#4ade80",
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {isConnected
                  ? "Stream active — guest can see your screen"
                  : "Connecting via TURN relay..."}
              </span>
            </div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                maxHeight: "calc(100vh - 200px)",
                objectFit: "contain",
                borderRadius: 16,
                border: "1px solid rgba(63,63,70,0.6)",
                background: "#09090b",
              }}
            />
            <p
              style={{
                color: "#52525b",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                margin: 0,
              }}
            >
              {isMobileHost ? "Camera preview" : "Your screen preview"}
            </p>
          </div>
        )}
      </div>
      {error && <ErrorOverlay error={error} onClose={handleEnd} />}
    </div>
  );
};

const ErrorOverlay = ({ error, onClose }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(9,9,11,0.93)",
    }}
  >
    <div style={{ textAlign: "center", padding: "0 32px", maxWidth: 340 }}>
      <WifiOff size={36} color="#f87171" style={{ margin: "0 auto 16px" }} />
      <p
        style={{
          color: "#f87171",
          fontWeight: 700,
          fontSize: 15,
          marginBottom: 20,
          whiteSpace: "pre-line",
          lineHeight: 1.5,
        }}
      >
        {error}
      </p>
      <button
        onClick={onClose}
        style={{
          padding: "10px 28px",
          borderRadius: 12,
          background: "rgba(39,39,42,0.9)",
          border: "1px solid rgba(63,63,70,0.5)",
          color: "#d4d4d8",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  </div>
);

export default ScreenShareView;
