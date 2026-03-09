const http = require("http");
const app = require("./app");
const prisma = require("./config/prisma");
const { redis } = require("./config/redis");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 8080;

// ✅ Create HTTP server from express app
const server = http.createServer(app);

// ✅ Attach Socket.io to HTTP server
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("join-room", ({ code, role }) => {
    socket.join(code);
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

  socket.on("end-session", ({ code }) => {
    console.log("🔴 Session ended:", code);
    socket.to(code).emit("session-ended");
    io.socketsLeave(code);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ✅ Use server.listen not app.listen
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Deskmate backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
};

let isShuttingDown = false;
process.on("SIGTERM", () => {
  if (!isShuttingDown) {
    isShuttingDown = true;
    shutdown("SIGTERM");
  }
});
process.on("SIGINT", () => {
  if (!isShuttingDown) {
    isShuttingDown = true;
    shutdown("SIGINT");
  }
});
