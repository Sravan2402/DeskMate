require("dotenv").config();
const app = require("./app");
const prisma = require("./config/prisma");
const { redis } = require("./config/redis");

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Deskmate backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

// graceful shutdown
const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  });
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
