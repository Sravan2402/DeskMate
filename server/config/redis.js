const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

const Keys = {
  session: (code) => `session:${code}`,
  userSession: (userId) => `user:session:${userId}`,
  refreshToken: (userId) => `token:refresh:${userId}`,
};

const setSession = async (
  code,
  data,
  ttl = process.env.ACCESS_CODE_TTL || 300,
) => {
  await redis.setex(Keys.session(code), ttl, JSON.stringify(data));
};

const getSession = async (code) => {
  const data = await redis.get(Keys.session(code));
  return data ? JSON.parse(data) : null;
};

const updateSession = async (code, data) => {
  const ttl = await redis.ttl(Keys.session(code));
  if (ttl <= 0) return false;
  await redis.setex(Keys.session(code), ttl, JSON.stringify(data));
  return true;
};

const deleteSession = async (code) => {
  await redis.del(Keys.session(code));
};

const getSessionTTL = async (code) => {
  return await redis.ttl(Keys.session(code));
};

const setRefreshToken = async (userId, token) => {
  const ttl = 7 * 24 * 60 * 60;
  await redis.setex(Keys.refreshToken(userId), ttl, token);
};

const getRefreshToken = async (userId) => {
  return await redis.get(Keys.refreshToken(userId));
};

const deleteRefreshToken = async (userId) => {
  await redis.del(Keys.refreshToken(userId));
};

module.exports = {
  redis,
  Keys,
  setSession,
  getSession,
  updateSession,
  deleteSession,
  getSessionTTL,
  setRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
};
