const { v4: uuidv4 } = require("uuid");
const prisma = require("../config/prisma");
const {
  setSession,
  getSession,
  updateSession,
  deleteSession,
  getSessionTTL,
} = require("../config/redis");

// Generate a random 6-digit access code
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/sessions/create
// Host creates a session and gets an access code
const createSession = async (req, res, next) => {
  try {
    const hostUserId = req.user.id;
    const code = generateCode();

    // Create a pending connection record in DB
    const connection = await prisma.connection.create({
      data: {
        hostUserId,
        accessCode: code,
        status: "PENDING",
      },
    });

    // Cache session state in Redis (TTL from env, default 5 min)
    await setSession(code, {
      connectionId: connection.id,
      hostUserId,
      guestUserId: null,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Session created.",
      code,
      connectionId: connection.id,
      expiresIn: parseInt(process.env.ACCESS_CODE_TTL || "300"),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions/join
// Guest joins a session using an access code
const joinSession = async (req, res, next) => {
  try {
    const { code } = req.body;
    const guestUserId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: "Access code is required." });
    }

    const session = await getSession(code);
    if (!session) {
      return res
        .status(404)
        .json({ message: "Invalid or expired access code." });
    }

    if (session.status !== "PENDING") {
      return res
        .status(409)
        .json({ message: "Session is no longer available." });
    }

    if (session.hostUserId === guestUserId) {
      return res
        .status(400)
        .json({ message: "You cannot join your own session." });
    }

    // Update Redis session state
    const updated = await updateSession(code, {
      ...session,
      guestUserId,
      status: "ACTIVE",
    });

    if (!updated) {
      return res.status(410).json({ message: "Session has expired." });
    }

    // Update DB record
    await prisma.connection.update({
      where: { id: session.connectionId },
      data: {
        guestUserId,
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });

    res.json({
      message: "Joined session.",
      connectionId: session.connectionId,
      hostUserId: session.hostUserId,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/sessions/end
// Host ends the session
const endSession = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: "Access code is required." });
    }

    const session = await getSession(code);
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (session.hostUserId !== userId) {
      return res
        .status(403)
        .json({ message: "Only the host can end the session." });
    }

    // Remove from Redis
    await deleteSession(code);

    // Update DB record
    await prisma.connection.update({
      where: { id: session.connectionId },
      data: { status: "ENDED", endedAt: new Date() },
    });

    res.json({ message: "Session ended." });
  } catch (err) {
    next(err);
  }
};

// GET /api/sessions/status/:code
// Check session status and TTL
const getStatus = async (req, res, next) => {
  try {
    const { code } = req.params;

    const session = await getSession(code);
    if (!session) {
      return res
        .status(404)
        .json({ message: "Invalid or expired access code." });
    }

    const ttl = await getSessionTTL(code);

    res.json({ session, ttl });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSession, joinSession, endSession, getStatus };
