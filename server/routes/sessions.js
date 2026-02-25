const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  createSession,
  joinSession,
  endSession,
  getStatus,
} = require("../controllers/sessionController");

const router = express.Router();

// All session routes require authentication
router.use(authenticate);

router.post("/create", createSession);
router.post("/join", joinSession);
router.post("/end", endSession);
router.get("/status/:code", getStatus);

module.exports = router;
