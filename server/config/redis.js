const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

redis
  .ping()
  .then(() => console.log("✅ Redis connected"))
  .catch((err) => console.error("❌ Redis error:", err.message));
const Keys = {
  session: (code) => `session:${code}`,
  refreshToken: (userId) => `token:refresh:${userId}`,
};

const setSession = async (
  code,
  data,
  ttl = process.env.ACCESS_CODE_TTL || 300,
) => {
  await redis.setex(Keys.session(code), parseInt(ttl), data);
};

const getSession = async (code) => {
  return await redis.get(Keys.session(code));
};

const updateSession = async (code, data) => {
  const ttl = await redis.ttl(Keys.session(code));
  if (ttl <= 0) return false;
  await redis.setex(Keys.session(code), ttl, data);
  return true;
};

const deleteSession = async (code) => {
  await redis.del(Keys.session(code));
};

const getSessionTTL = async (code) => {
  return await redis.ttl(Keys.session(code));
};

const setRefreshToken = async (userId, token) => {
  await redis.setex(Keys.refreshToken(userId), 7 * 24 * 60 * 60, token);
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
