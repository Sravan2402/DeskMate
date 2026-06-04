const http = require("http");
const app = require("./app");
const prisma = require("./config/prisma");
const { redis } = require("./config/redis");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
  },
});

// ── Socket.io — WebRTC signaling only ────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join-room", ({ code, role }) => {
    socket.join(code);
    socket.data.code = code;
    socket.data.role = role;
    console.log(`✅ ${role} joined room: ${code}`);
    socket.to(code).emit("peer-joined", { role });
  });

  socket.on("offer", ({ code, offer }) => {
    socket.to(code).emit("offer", offer);
  });

  socket.on("answer", ({ code, answer }) => {
    socket.to(code).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ code, candidate }) => {
    socket.to(code).emit("ice-candidate", candidate);
  });

  socket.on("remote-control", ({ code, type, payload }) => {
    socket.to(code).emit("remote-control", { type, payload });
  });

  socket.on("end-session", ({ code }) => {
    console.log("🔴 end-session:", code);
    socket.to(code).emit("session-ended");
    io.socketsLeave(code);
  });

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
    await redis.disconnect?.();
    process.exit(0);
  });
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
