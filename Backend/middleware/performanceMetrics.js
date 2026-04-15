const fs = require("fs");
const path = require("path");
const { runWithRequestContext } = require("../util/perfContext");
const config = require("../config/env");

const logsDir = path.join(__dirname, "..", "logs");
const metricsFile = path.join(logsDir, "perf-metrics.ndjson");

const appendMetric = (metric) => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.appendFile(metricsFile, `${JSON.stringify(metric)}\n`, (err) => {
    if (err) {
      console.error("Failed to write performance metric:", err.message);
    }
  });
};

const performanceMetricsMiddleware = (req, res, next) => {
  const requestStartNs = process.hrtime.bigint();
  const context = {
    dbTimeMs: 0,
    dbCalls: 0,
  };

  runWithRequestContext(context, () => {
    res.on("finish", () => {
      const requestDurationMs = Number(process.hrtime.bigint() - requestStartNs) / 1e6;
      const routePath = req.route?.path || req.path || req.originalUrl;
      const metric = {
        ts: new Date().toISOString(),
        runLabel: config.perfRunLabel,
        cacheEnabled: config.cacheEnabled,
        cacheStatus: req.cacheStatus || "BYPASS",
        method: req.method,
        route: routePath,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTimeMs: Number(requestDurationMs.toFixed(3)),
        dbTimeMs: Number((context.dbTimeMs || 0).toFixed(3)),
        dbCalls: context.dbCalls || 0,
      };

      appendMetric(metric);
    });

    next();
  });
};

module.exports = {
  performanceMetricsMiddleware,
  metricsFile,
};
