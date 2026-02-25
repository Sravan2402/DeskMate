const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/auth");
const {
  register,
  login,
  refresh,
  logout,
  me,
} = require("../controllers/authController");

const router = express.Router();
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many registration attempts. Try again later.",
  },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: "Too many login attempts. Try again in 15 minutes.",
  },
});

// ─────────────────────────────
// Public routes — no token needed
// ─────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

// ─────────────────────────────
// Protected routes — token required
// ─────────────────────────────
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

module.exports = router;
