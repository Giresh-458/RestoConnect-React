const express = require("express");
const cookieParser = require("cookie-parser");

function createTestApp(registerRoutes) {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => {
    const username = req.header("x-test-user");
    const restId = req.header("x-test-rest-id");

    if (username || restId) {
      req.auth = {};
      if (username) req.auth.username = username;
      if (restId) req.auth.rest_id = restId;
    }

    next();
  });

  registerRoutes(app);

  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  });

  return app;
}

module.exports = { createTestApp };
