const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const normalizeUrl = (value = "") => String(value || "").trim().replace(/\/+$/, "");

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const parseCsv = (value = "") =>
  String(value || "")
    .split(",")
    .map((entry) => normalizeUrl(entry))
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 3000),
  mongoUri: (process.env.MONGODB_URI || "").trim(),
  redisUrl: (process.env.REDIS_URL || "").trim(),
  clientUrl: normalizeUrl(process.env.CLIENT_URL),
  corsAllowedOrigins: Array.from(
    new Set([normalizeUrl(process.env.CLIENT_URL), ...parseCsv(process.env.CORS_ALLOWED_ORIGINS)]),
  ),
  publicApiUrl: normalizeUrl(process.env.PUBLIC_API_URL),
  sessionSecret: (process.env.SESSION_SECRET || "").trim(),
  sessionMaxAgeMs: Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 24 * 30),
  jwtSecret: (process.env.JWT_SECRET || "").trim(),
  jwtExpiry: (process.env.JWT_EXPIRY || "30d").trim(),
  cookieDomain: (process.env.COOKIE_DOMAIN || "").trim() || undefined,
  cookieSameSite: (process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax")).trim().toLowerCase(),
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, isProduction),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, isProduction),
  stripeSecretKey: (process.env.STRIPE_SECRET_KEY || "").trim(),
  emailUser: (process.env.EMAIL_USER || "").trim(),
  emailPass: (process.env.EMAIL_PASS || "").trim(),
  emailFrom: (process.env.EMAIL_FROM || "").trim(),
  smtpService: (process.env.SMTP_SERVICE || "").trim(),
  smtpHost: (process.env.SMTP_HOST || "").trim(),
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
};

const validateConfig = () => {
  const missing = ["MONGODB_URI", "SESSION_SECRET", "JWT_SECRET"].filter(
    (name) => !process.env[name],
  );

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (config.cookieSameSite === "none" && !config.cookieSecure) {
    throw new Error("COOKIE_SECURE must be true when COOKIE_SAME_SITE is set to none");
  }

  if (config.isProduction && config.corsAllowedOrigins.length === 0) {
    throw new Error("Set CLIENT_URL or CORS_ALLOWED_ORIGINS before running in production");
  }
};

validateConfig();

module.exports = config;
