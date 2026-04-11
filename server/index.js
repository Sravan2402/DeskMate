const http = require("http");
const app = require("./app");
const prisma = require("./config/prisma");
const { redis } = require("./config/redis");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// ── Socket.io — WebRTC signaling only ────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Host or guest joins a room by session code
  socket.on("join-room", ({ code, role }) => {
    socket.join(code);
    socket.data.code = code;
    socket.data.role = role;
    console.log(`✅ ${role} joined room: ${code}`);
    // FIX: pass the role so the host can ignore agent joins
    socket.to(code).emit("peer-joined", { role });
  });

  // WebRTC screen share signaling
  socket.on("offer", ({ code, offer }) => {
    socket.to(code).emit("offer", offer);
  });

  socket.on("answer", ({ code, answer }) => {
    socket.to(code).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ code, candidate }) => {
    socket.to(code).emit("ice-candidate", candidate);
  });

  // Remote control — relay from guest to agent (or host)
  socket.on("remote-control", ({ code, type, payload }) => {
    socket.to(code).emit("remote-control", { type, payload });
  });

  // Session end — notify everyone in the room
  socket.on("end-session", ({ code }) => {
    console.log("🔴 end-session:", code);
    socket.to(code).emit("session-ended");
    io.socketsLeave(code);
  });

  // If a peer disconnects unexpectedly, notify the other side
  socket.on("disconnect", () => {
    const { code, role } = socket.data || {};
    if (code) {
      console.log(`❌ ${role || "peer"} disconnected from room: ${code}`);
      socket.to(code).emit("session-ended");
    }
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Deskmate backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let isShuttingDown = false;
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${signal} — shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
