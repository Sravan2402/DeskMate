require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");

const app = express();

const IS_PROD = process.env.NODE_ENV === "production";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!IS_PROD) return callback(null, true);
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.options("*", cors()); // FIX: Express 4 wildcard syntax (was "/{*path}" — Express 5 only)
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/account", authRoutes);
app.use("/api/sessions", sessionRoutes);

app.use(errorHandler);

module.exports = app;
