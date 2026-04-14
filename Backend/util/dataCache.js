const { createClient } = require("redis");

const CACHE_PREFIX = "restoconnect:data:";
const TAG_PREFIX = "restoconnect:tag:";

let client = null;

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const getCacheEnv = () => {
  const redisUrl = String(process.env.REDIS_URL || "").trim();
  const cacheEnabled = parseBoolean(process.env.CACHE_ENABLED, false);
  const cacheDefaultTtlSeconds = Number(process.env.CACHE_DEFAULT_TTL_SECONDS || 120);
  return {
    redisUrl,
    cacheEnabled,
    cacheDefaultTtlSeconds: Number.isFinite(cacheDefaultTtlSeconds) && cacheDefaultTtlSeconds > 0
      ? cacheDefaultTtlSeconds
      : 120,
  };
};

const sanitizeTag = (tag) =>
  String(tag || "")
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "_")
    .slice(0, 200) || "tag";

const getClient = () => client;

const isEnabled = () => {
  const { cacheEnabled, redisUrl } = getCacheEnv();
  return Boolean(cacheEnabled && redisUrl);
};

const connectDataCache = async () => {
  if (!isEnabled()) {
    return;
  }

  if (!client) {
    const { redisUrl } = getCacheEnv();
    client = createClient({ url: redisUrl });
    client.on("error", (error) => {
      console.error("Redis data cache connection error:", error.message);
    });
  }

  if (!client.isOpen) {
    await client.connect();
    console.log("Redis data cache connected");
  }
};

const buildKey = (rawKey) => `${CACHE_PREFIX}${rawKey}`;

const getJson = async (rawKey) => {
  if (!isEnabled() || !client?.isOpen) {
    return null;
  }

  const key = buildKey(rawKey);
  const value = await client.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    // Corrupted payload should not keep breaking reads.
    await client.del(key);
    console.error("Redis cache payload parse failed, key evicted:", error.message);
    return null;
  }
};

const setJson = async (rawKey, value, ttlSeconds) => {
  if (!isEnabled() || !client?.isOpen) {
    return;
  }

  const key = buildKey(rawKey);
  const payload = JSON.stringify(value);
  const { cacheDefaultTtlSeconds } = getCacheEnv();
  const ttl = Number(ttlSeconds) || cacheDefaultTtlSeconds;
  await client.set(key, payload, { EX: ttl });
};

/**
 * Store JSON and register rawKey under each tag set (for targeted invalidation).
 */
const setJsonWithTags = async (rawKey, value, ttlSeconds, tags = []) => {
  await setJson(rawKey, value, ttlSeconds);
  if (!isEnabled() || !client?.isOpen || !tags?.length) {
    return;
  }

  const { cacheDefaultTtlSeconds } = getCacheEnv();
  const ttl = Number(ttlSeconds) || cacheDefaultTtlSeconds;
  const tagTtl = ttl + 600;

  for (const tag of tags) {
    const tagKey = `${TAG_PREFIX}${sanitizeTag(tag)}`;
    await client.sAdd(tagKey, rawKey);
    await client.expire(tagKey, tagTtl);
  }
};

/**
 * Delete all cached response keys listed under the given tags, then remove tag sets.
 * @returns {number} approximate number of cache entries removed
 */
const invalidateTags = async (tags = []) => {
  if (!isEnabled() || !client?.isOpen || !tags?.length) {
    return 0;
  }

  const uniqueTags = [...new Set(tags.map(sanitizeTag))];
  const rawKeys = new Set();

  for (const tag of uniqueTags) {
    const tagKey = `${TAG_PREFIX}${tag}`;
    const members = await client.sMembers(tagKey);
    members.forEach((m) => rawKeys.add(m));
    await client.del(tagKey);
  }

  if (rawKeys.size === 0) {
    return 0;
  }

  const redisKeys = [...rawKeys].map(buildKey);
  await client.del(redisKeys);
  return redisKeys.length;
};

const clearAllDataCache = async () => {
  if (!isEnabled() || !client?.isOpen) {
    return 0;
  }

  let cursor = 0;
  let removed = 0;
  do {
    const result = await client.scan(cursor, {
      MATCH: `${CACHE_PREFIX}*`,
      COUNT: 200,
    });
    cursor = result.cursor;
    if (result.keys.length > 0) {
      removed += result.keys.length;
      await client.del(result.keys);
    }
  } while (Number(cursor) !== 0);

  cursor = 0;
  do {
    const result = await client.scan(cursor, {
      MATCH: `${TAG_PREFIX}*`,
      COUNT: 200,
    });
    cursor = result.cursor;
    if (result.keys.length > 0) {
      removed += result.keys.length;
      await client.del(result.keys);
    }
  } while (Number(cursor) !== 0);

  return removed;
};

module.exports = {
  connectDataCache,
  getClient,
  isEnabled,
  getJson,
  setJson,
  setJsonWithTags,
  invalidateTags,
  clearAllDataCache,
};
