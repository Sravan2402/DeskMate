/**
 * DeskMate Agent — v2
 *
 * Changes from v1:
 *  - Auto-reconnect with exponential back-off (no manual restart needed)
 *  - Enter / Return key added to KEY_MAP
 *  - Audio volume bar  (system-level via pactl / osascript / nircmd)
 *  - Display brightness bar (via xrandr / brightnessctl / osascript)
 *  - Graceful SIGINT / SIGTERM shutdown
 *
 * Usage:
 *   node deskmate-agent.js <SESSION_CODE>
 *   SOCKET_URL=https://api.yourdomain.com node deskmate-agent.js ABC123
 */

require("dotenv").config();
const { io } = require("socket.io-client");
const {
  mouse,
  keyboard,
  Point,
  Button,
  Key,
  screen,
} = require("@nut-tree-fork/nut-js");
const { execSync } = require("child_process");
const os = require("os");

// ── Speed ────────────────────────────────────────────────────────────────────
mouse.config.mouseSpeed = 1500;
keyboard.config.autoDelayMs = 0;

// ── Config ───────────────────────────────────────────────────────────────────
const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:8080";
const SESSION_CODE = process.argv[2];
const PLATFORM = os.platform(); // 'linux' | 'darwin' | 'win32'

if (!SESSION_CODE) {
  console.error("❌  Usage: node deskmate-agent.js <SESSION_CODE>");
  process.exit(1);
}

// ── Key map ──────────────────────────────────────────────────────────────────
const KEY_MAP = {
  // Control keys
  Enter: Key.Return,
  Return: Key.Return,
  NumpadEnter: Key.Return,
  Tab: Key.Tab,
  Escape: Key.Escape,
  Backspace: Key.Backspace,
  Delete: Key.Delete,
  " ": Key.Space,
  Space: Key.Space,

  // Navigation
  ArrowUp: Key.Up,
  ArrowDown: Key.Down,
  ArrowLeft: Key.Left,
  ArrowRight: Key.Right,
  Home: Key.Home,
  End: Key.End,
  PageUp: Key.PageUp,
  PageDown: Key.PageDown,

  // Modifiers
  Control: Key.LeftControl,
  Alt: Key.LeftAlt,
  Shift: Key.LeftShift,
  Meta: Key.LeftSuper,
  CapsLock: Key.CapsLock,

  // Function keys
  F1: Key.F1,
  F2: Key.F2,
  F3: Key.F3,
  F4: Key.F4,
  F5: Key.F5,
  F6: Key.F6,
  F7: Key.F7,
  F8: Key.F8,
  F9: Key.F9,
  F10: Key.F10,
  F11: Key.F11,
  F12: Key.F12,

  // Letters
  a: Key.A,
  b: Key.B,
  c: Key.C,
  d: Key.D,
  e: Key.E,
  f: Key.F,
  g: Key.G,
  h: Key.H,
  i: Key.I,
  j: Key.J,
  k: Key.K,
  l: Key.L,
  m: Key.M,
  n: Key.N,
  o: Key.O,
  p: Key.P,
  q: Key.Q,
  r: Key.R,
  s: Key.S,
  t: Key.T,
  u: Key.U,
  v: Key.V,
  w: Key.W,
  x: Key.X,
  y: Key.Y,
  z: Key.Z,
  A: Key.A,
  B: Key.B,
  C: Key.C,
  D: Key.D,
  E: Key.E,
  F: Key.F,
  G: Key.G,
  H: Key.H,
  I: Key.I,
  J: Key.J,
  K: Key.K,
  L: Key.L,
  M: Key.M,
  N: Key.N,
  O: Key.O,
  P: Key.P,
  Q: Key.Q,
  R: Key.R,
  S: Key.S,
  T: Key.T,
  U: Key.U,
  V: Key.V,
  W: Key.W,
  X: Key.X,
  Y: Key.Y,
  Z: Key.Z,

  // Numbers
  0: Key.Num0,
  1: Key.Num1,
  2: Key.Num2,
  3: Key.Num3,
  4: Key.Num4,
  5: Key.Num5,
  6: Key.Num6,
  7: Key.Num7,
  8: Key.Num8,
  9: Key.Num9,
};

// ── System helpers ───────────────────────────────────────────────────────────

/**
 * Set system volume (0–100).
 * Linux: pactl  |  macOS: osascript  |  Windows: nircmd
 */
function setVolume(level) {
  const v = Math.max(0, Math.min(100, Math.round(level)));
  try {
    if (PLATFORM === "linux") {
      execSync(`pactl set-sink-volume @DEFAULT_SINK@ ${v}%`);
    } else if (PLATFORM === "darwin") {
      execSync(`osascript -e "set volume output volume ${v}"`);
    } else if (PLATFORM === "win32") {
      // nircmd must be installed: https://www.nirsoft.net/utils/nircmd.html
      execSync(`nircmd setsysvolume ${Math.round((v / 100) * 65535)}`);
    }
    console.log(`🔊  Volume set to ${v}%`);
  } catch (e) {
    console.warn("⚠️  setVolume failed:", e.message);
  }
}

/**
 * Set display brightness (0–100).
 * Linux: brightnessctl  |  macOS: osascript (keyboard brightness workaround)  |  Windows: nircmd
 */
function setBrightness(level) {
  const b = Math.max(0, Math.min(100, Math.round(level)));
  try {
    if (PLATFORM === "linux") {
      // brightnessctl must be installed: sudo apt install brightnessctl
      execSync(`brightnessctl set ${b}%`);
    } else if (PLATFORM === "darwin") {
      // Requires the 'brightness' CLI: brew install brightness
      execSync(`brightness ${(b / 100).toFixed(2)}`);
    } else if (PLATFORM === "win32") {
      // nircmd must be installed
      execSync(`nircmd changebrightness ${b}`);
    }
    console.log(`🖥️   Brightness set to ${b}%`);
  } catch (e) {
    console.warn("⚠️  setBrightness failed:", e.message);
  }
}

// ── Screen size ──────────────────────────────────────────────────────────────
let screenW = 1920;
let screenH = 1080;

(async () => {
  try {
    screenW = await screen.width();
    screenH = await screen.height();
    console.log(`🖥️   Screen: ${screenW}×${screenH}`);
  } catch (e) {
    console.warn("⚠️  Could not read screen size, defaulting to 1920×1080");
  }
})();

// ── Socket with auto-reconnect ────────────────────────────────────────────────
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity, // never stop trying
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30_000, // cap at 30 s
  randomizationFactor: 0.3,
});

socket.on("connect", () => {
  console.log("✅  Agent connected:", socket.id);
  socket.emit("join-room", { code: SESSION_CODE, role: "agent" });
  console.log("🖥️   DeskMate Agent active — session:", SESSION_CODE);
});

socket.on("disconnect", (reason) => {
  console.warn("❌  Disconnected:", reason, "— will reconnect automatically");
});

socket.on("connect_error", (err) => {
  console.warn("🔄  Connection error:", err.message, "— retrying…");
});

socket.on("session-ended", () => {
  console.log("🔴  Session ended by remote — exiting");
  process.exit(0);
});

// ── Remote-control handler ───────────────────────────────────────────────────
socket.on("remote-control", async ({ type, payload }) => {
  try {
    switch (type) {
      // Mouse move (trackpad / pointer drag on video)
      case "mouse-move": {
        const absX = Math.round(payload.x * screenW);
        const absY = Math.round(payload.y * screenH);
        await mouse.setPosition(new Point(absX, absY));
        break;
      }

      // Cursor nudge (arrow buttons in toolbar)
      case "cursor-move": {
        const { dx = 0, dy = 0 } = payload;
        const cur = await mouse.getPosition();
        await mouse.setPosition(
          new Point(
            Math.max(0, Math.min(screenW - 1, cur.x + dx)),
            Math.max(0, Math.min(screenH - 1, cur.y + dy)),
          ),
        );
        break;
      }

      case "click":
        await mouse.click(Button.LEFT);
        console.log("🖱️   Left click");
        break;
      case "double-click":
        await mouse.doubleClick(Button.LEFT);
        console.log("🖱️   Double click");
        break;
      case "right-click":
        await mouse.click(Button.RIGHT);
        console.log("🖱️   Right click");
        break;

      case "scroll": {
        const { dx = 0, dy = 0 } = payload;
        if (dy !== 0) {
          const steps = Math.max(1, Math.round(Math.abs(dy) / 100));
          if (dy > 0) await mouse.scrollDown(steps);
          else await mouse.scrollUp(steps);
        }
        if (dx !== 0) {
          const steps = Math.max(1, Math.round(Math.abs(dx) / 100));
          if (dx > 0) await mouse.scrollRight(steps);
          else await mouse.scrollLeft(steps);
        }
        break;
      }

      // Single key press — Enter/Return now handled via KEY_MAP
      case "key": {
        const { key, modifiers = [] } = payload;
        const nutKey = KEY_MAP[key];

        // Press modifier keys first
        const nutMods = modifiers.map((m) => KEY_MAP[m]).filter(Boolean);
        for (const mod of nutMods) await keyboard.pressKey(mod);

        if (nutKey !== undefined) {
          await keyboard.pressKey(nutKey);
          await keyboard.releaseKey(nutKey);
          console.log(
            "⌨️   Key:",
            key,
            modifiers.length ? `[${modifiers}]` : "",
          );
        } else if (key.length === 1) {
          await keyboard.type(key);
          console.log("⌨️   Typed char:", key);
        } else {
          console.warn("⚠️  Unknown key:", key);
        }

        for (const mod of nutMods.reverse()) await keyboard.releaseKey(mod);
        break;
      }

      // Type full text string
      case "type-text": {
        if (payload.text) {
          await keyboard.type(payload.text);
          console.log("⌨️   Typed:", payload.text);
        }
        break;
      }

      // ── NEW: Volume bar ──────────────────────────────────────────────────
      case "set-volume": {
        // payload: { level: 0-100 }
        setVolume(payload.level);
        break;
      }

      // ── NEW: Brightness bar ──────────────────────────────────────────────
      case "set-brightness": {
        // payload: { level: 0-100 }
        setBrightness(payload.level);
        break;
      }

      default:
        console.warn("⚠️  Unknown remote-control type:", type);
    }
  } catch (err) {
    console.error(`❌  Control error [${type}]:`, err.message);
  }
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (sig) => {
  console.log(`\n${sig} — disconnecting agent…`);
  socket.disconnect();
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
