const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  // Prisma unique constraint violation (e.g. duplicate email)
  if (err.code === "P2002") {
    return res.status(409).json({
      message: `An account with this ${err.meta?.target?.join(", ") || "value"} already exists.`,
    });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Record not found." });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token has expired." });
  }

  // Default
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error.";
  res.status(status).json({ message });
};

module.exports = { errorHandler };
