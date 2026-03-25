const prisma = require("../config/prisma");
const {
  setSession,
  getSession,
  updateSession,
  deleteSession,
  getSessionTTL,
} = require("../config/redis");

// Generate a random 6-char alphanumeric code (A-Z, 0-9)
// Excludes easily confused chars: 0/O, 1/I/L
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generateCode = () =>
  Array.from(
    { length: 6 },
    () => CHARSET[Math.floor(Math.random() * CHARSET.length)],
  ).join("");

// POST /api/sessions/create
const createSession = async (req, res, next) => {
  try {
    const hostUserId = req.user.id;
    const code = generateCode();

    const connection = await prisma.connection.create({
      data: {
        hostUserId,
        accessCode: code,
        status: "PENDING",
      },
    });

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

    const updated = await updateSession(code, {
      ...session,
      guestUserId,
      status: "ACTIVE",
    });

    if (!updated) {
      return res.status(410).json({ message: "Session has expired." });
    }

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

    await deleteSession(code);

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
