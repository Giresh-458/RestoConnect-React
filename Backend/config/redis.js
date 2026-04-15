const { createClient } = require("redis");
const config = require("./env"); // use your existing env.js

const client = createClient({
  url: config.redisUrl || "redis://127.0.0.1:6379",
});

client.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Redis connected");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
})();

module.exports = client;