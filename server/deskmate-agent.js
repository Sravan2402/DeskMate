const { io } = require("socket.io-client");
const {
  mouse,
  keyboard,
  Point,
  Button,
  Key,
  screen,
} = require("@nut-tree-fork/nut-js");

// Speed settings
mouse.config.mouseSpeed = 1500;
keyboard.config.autoDelayMs = 0;

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:8080";
const SESSION_CODE = process.argv[2];

if (!SESSION_CODE) {
  console.error(
    "❌ Please provide a session code: node deskmate-agent.js ABC123",
  );
  process.exit(1);
}

// ── Key map: browser KeyboardEvent.key → nut-js Key enum ────────────────────
const KEY_MAP = {
  Enter: Key.Return,
  Return: Key.Return,
  Tab: Key.Tab,
  Escape: Key.Escape,
  Backspace: Key.Backspace,
  Delete: Key.Delete,
  " ": Key.Space,
  Space: Key.Space,
  ArrowUp: Key.Up,
  ArrowDown: Key.Down,
  ArrowLeft: Key.Left,
  ArrowRight: Key.Right,
  Home: Key.Home,
  End: Key.End,
  PageUp: Key.PageUp,
  PageDown: Key.PageDown,
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
  Control: Key.LeftControl,
  Alt: Key.LeftAlt,
  Shift: Key.LeftShift,
  Meta: Key.LeftSuper,
  CapsLock: Key.CapsLock,
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

// ── State ────────────────────────────────────────────────────────────────────
let screenW = 1920;
let screenH = 1080;

(async () => {
  try {
    screenW = await screen.width();
    screenH = await screen.height();
    console.log(`🖥️  Screen: ${screenW}x${screenH}`);
  } catch (e) {
    console.warn("⚠️  Could not read screen size, defaulting to 1920x1080");
  }
})();

// ── Socket ───────────────────────────────────────────────────────────────────
const socket = io(SOCKET_URL, { reconnection: true });

socket.on("connect", () => {
  console.log("✅ Agent connected:", socket.id);
  socket.emit("join-room", { code: SESSION_CODE, role: "agent" });
  console.log("🖥️  DeskMate Agent active for session:", SESSION_CODE);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Agent disconnected:", reason);
});

socket.on("session-ended", () => {
  console.log("🔴 Session ended by remote — exiting");
  process.exit(0);
});

// ── Remote control handler ───────────────────────────────────────────────────
socket.on("remote-control", async ({ type, payload }) => {
  try {
    switch (type) {
      // ── Mouse move (from trackpad / pointer drag on video) ───────────────
      case "mouse-move": {
        const absX = Math.round(payload.x * screenW);
        const absY = Math.round(payload.y * screenH);
        await mouse.setPosition(new Point(absX, absY));
        break;
      }

      // ── Cursor nudge (from arrow buttons in toolbar) ─────────────────────
      // payload: { dx, dy }  — pixel deltas, may be negative
      case "cursor-move": {
        const { dx = 0, dy = 0 } = payload;
        const current = await mouse.getPosition();
        const nextX = Math.max(0, Math.min(screenW - 1, current.x + dx));
        const nextY = Math.max(0, Math.min(screenH - 1, current.y + dy));
        await mouse.setPosition(new Point(nextX, nextY));
        break;
      }

      // ── Left click ──────────────────────────────────────────────────────
      case "click": {
        await mouse.click(Button.LEFT);
        console.log("🖱️  Left click");
        break;
      }

      // ── Double click ────────────────────────────────────────────────────
      case "double-click": {
        await mouse.doubleClick(Button.LEFT);
        console.log("🖱️  Double click");
        break;
      }

      // ── Right click ─────────────────────────────────────────────────────
      case "right-click": {
        await mouse.click(Button.RIGHT);
        console.log("🖱️  Right click");
        break;
      }

      // ── Scroll ──────────────────────────────────────────────────────────
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

      // ── Single key press ────────────────────────────────────────────────
      case "key": {
        const { key } = payload;
        const nutKey = KEY_MAP[key];
        if (nutKey !== undefined) {
          await keyboard.pressKey(nutKey);
          await keyboard.releaseKey(nutKey);
          console.log("⌨️  Key:", key);
        } else if (key.length === 1) {
          await keyboard.type(key);
          console.log("⌨️  Typed char:", key);
        } else {
          console.warn("⚠️  Unknown key:", key);
        }
        break;
      }

      // ── Type full text string ────────────────────────────────────────────
      case "type-text": {
        const { text } = payload;
        if (text) {
          await keyboard.type(text);
          console.log("⌨️  Typed text:", text);
        }
        break;
      }

      default:
        console.warn("⚠️  Unknown remote-control type:", type);
    }
  } catch (err) {
    console.error(`❌ Control error [${type}]:`, err.message);
  }
});
