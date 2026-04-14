const { RedisStore } = require("connect-redis");
const { createClient } = require("redis");
const config = require("../config/env");

const createSessionStoreManager = () => {
  if (!config.redisUrl) {
    return {
      store: undefined,
      connect: async () => {},
    };
  }

  const client = createClient({ url: config.redisUrl });
  client.on("error", (error) => {
    console.error("Redis connection error:", error);
  });

  return {
    store: new RedisStore({
      client,
      prefix: "restoconnect:sess:",
    }),
    connect: async () => {
      if (!client.isOpen) {
        await client.connect();
        console.log("Redis connected");
      }
    },
  };
};

module.exports = { createSessionStoreManager };
