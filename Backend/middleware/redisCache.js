const crypto = require("crypto");
const redis = require("../config/redis");  

const {

  isEnabled,

  getJson,

  setJsonWithTags,

  invalidateTags,

  clearAllDataCache,

} = require("../util/dataCache");

const { getFullPath, getReadTags, getMutationInvalidation } = require("../util/cacheRegistry");



const SKIP_CACHE_PATHS = [

  "/api/csrf-token",

  "/api/auth/login",

  "/api/auth/signup",

  "/api/auth/check-session",

  "/api-docs",

  "/api-docs.json",

];



/** GETs we cache: /api/* plus app-level JSON routes not under /api (e.g. /menu/:id). */

const isCacheableGetPath = (fullPath) => {

  if (fullPath.startsWith("/api")) return true;

  if (fullPath.startsWith("/menu/")) return true;

  return false;

};



const shouldSkip = (req) => {

  if (req.method !== "GET") return true;

  const fullPath = getFullPath(req);

  if (!isCacheableGetPath(fullPath)) return true;

  if (SKIP_CACHE_PATHS.some((prefix) => fullPath.startsWith(prefix))) return true;

  return false;

};



const getCacheTtlSeconds = () => {

  const ttl = Number(process.env.CACHE_DEFAULT_TTL_SECONDS || 120);

  return Number.isFinite(ttl) && ttl > 0 ? ttl : 120;

};



const normalizeQuery = (query = {}) => {

  const keys = Object.keys(query).sort();

  if (keys.length === 0) return "";

  const parts = [];

  for (const key of keys) {

    const value = query[key];

    if (Array.isArray(value)) {

      const sorted = value.map((v) => String(v)).sort();

      for (const entry of sorted) {

        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(entry)}`);

      }

      continue;

    }

    if (value === undefined || value === null) {

      continue;

    }

    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  }

  return parts.join("&");

};



const getNamespace = (req, fullPath) => {

  // Public routes should maximize sharing across users/sessions.

  if (fullPath === "/api/restaurants" || fullPath.startsWith("/menu/")) {

    return "public:discovery";

  }

  if (fullPath.startsWith("/api/customer") && !req.auth?.username) {

    return "public:customer";

  }

  if (fullPath.startsWith("/api/customer")) {

    const username = req.auth?.username || req.session?.username;

    return username ? `customer:${username}` : "customer:anonymous";

  }

  if (fullPath.startsWith("/api/owner")) {

    return req.auth?.rest_id ? `restaurant:${req.auth.rest_id}` : "owner:unknown";

  }

  if (fullPath.startsWith("/api/staff")) {

    return req.auth?.rest_id ? `restaurant:${req.auth.rest_id}` : "staff:unknown";

  }

  if (fullPath.startsWith("/api/admin") || fullPath.startsWith("/api/employee")) {

    return req.auth?.username ? `admin:${req.auth.username}` : "admin:shared";

  }

  if (fullPath.startsWith("/api/superadmin")) {

    return "superadmin:shared";

  }

  return "shared";

};



const cacheKeyFor = (req) => {

  const fullPath = getFullPath(req);

  const namespace = getNamespace(req, fullPath);

  const normalizedQuery = normalizeQuery(req.query || {});

  const keyBase = `${namespace}:${req.method}:${fullPath}`;

  if (!normalizedQuery) return keyBase;

  const queryHash = crypto.createHash("sha1").update(normalizedQuery).digest("hex");

  return `${keyBase}:q:${queryHash}`;

};



const redisReadCacheMiddleware = async (req, res, next) => {

  if (!isEnabled() || shouldSkip(req)) {

    req.cacheStatus = "BYPASS";

    return next();

  }



  // const key = cacheKeyFor(req);


let key;

if (req.path === "/api/customer/search") {
  // 🔥 FORCE SAME KEY FOR READ + WRITE
  key = "search:" + JSON.stringify(req.query);
} else {
  key = cacheKeyFor(req);
}

console.log("Cache Key Used:", key);


  try {

const cachedRaw = await redis.get(key);

let cached = null;
if (cachedRaw) {
  try {
    cached = JSON.parse(cachedRaw);
  } catch (e) {
    cached = null;
  }
}

if (cached) {
  req.cacheStatus = "HIT";
  return res.status(cached.statusCode || 200).json(cached.body);
}

  } catch (error) {

    console.error("Redis cache read failed:", error.message);

    req.cacheStatus = "BYPASS";

    return next();

  }



  req.cacheStatus = "MISS";

  const tags = getReadTags(req);

  const originalJson = res.json.bind(res);

  // res.json = (body) => {

  //   if (res.statusCode < 400) {

  //     setJsonWithTags(

  //       key,

  //       { statusCode: res.statusCode, body },

  //       getCacheTtlSeconds(),

  //       tags,

  //     ).catch((error) => {

  //       console.error("Redis cache write failed:", error.message);

  //     });

  //   }

  //   return originalJson(body);

  // };

res.json = (body) => {
  if (res.statusCode < 400) {
    console.log("👉 Writing to Redis cache...");

    redis.setEx(
      key,
      getCacheTtlSeconds(),
      JSON.stringify({ statusCode: res.statusCode, body })
    ).then(() => {
      console.log("✅ Cache stored successfully");
    }).catch((error) => {
      console.error("❌ Redis cache write failed:", error.message);
    });
  }

  return originalJson(body);
};

  return next();

};



const redisInvalidateOnMutationMiddleware = (req, res, next) => {

  if (!isEnabled()) {

    return next();

  }



  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);

  const fullPath = getFullPath(req);

  if (!isMutation || !fullPath.startsWith("/api")) {

    return next();

  }



  res.on("finish", () => {

    if (res.statusCode >= 400) {

      return;

    }



    const { tags, fallbackClearAll } = getMutationInvalidation(req);



    if (fallbackClearAll) {

      clearAllDataCache().catch((error) => {

        console.error("Redis cache full invalidation failed:", error.message);

      });

      return;

    }



    if (!tags.length) {

      return;

    }



    invalidateTags(tags).catch((error) => {

      console.error("Redis cache tag invalidation failed:", error.message);

    });

  });



  return next();

};



module.exports = {

  redisReadCacheMiddleware,

  redisInvalidateOnMutationMiddleware,

};


