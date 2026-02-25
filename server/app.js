const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");

const app = express();

// security
app.use(helmet());

// allow frontend to talk to backend
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// parse JSON
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// log requests in terminal
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "deskmate-backend" });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

// 404
app.use((req, res) => {
  res
    .status(404)
    .json({ message: `Route ${req.method} ${req.path} not found.` });
});

// error handler — must be last
app.use(errorHandler);

module.exports = app;
