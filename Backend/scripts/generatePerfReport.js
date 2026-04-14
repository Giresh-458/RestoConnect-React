const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "..", "logs");
const metricsPath = path.join(logsDir, "perf-metrics.ndjson");
const jsonReportPath = path.join(logsDir, "perf-report.json");
const markdownReportPath = path.join(logsDir, "perf-report.md");

const readMetrics = () => {
  if (!fs.existsSync(metricsPath)) {
    throw new Error(`Metrics file not found: ${metricsPath}`);
  }

  const lines = fs
    .readFileSync(metricsPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
};

const avg = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

const summarizeRun = (runLabel, runMetrics) => {
  const responseTimes = runMetrics.map((m) => Number(m.responseTimeMs || 0));
  const dbTimes = runMetrics.map((m) => Number(m.dbTimeMs || 0));

  const cacheBreakdown = runMetrics.reduce(
    (acc, metric) => {
      const status = metric.cacheStatus || "BYPASS";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { HIT: 0, MISS: 0, BYPASS: 0 },
  );

  const totalRequests = runMetrics.length;
  const hitRate =
    totalRequests > 0 ? (cacheBreakdown.HIT / totalRequests) * 100 : 0;

  const routeMap = new Map();
  for (const metric of runMetrics) {
    const key = `${metric.method || "GET"} ${metric.route || metric.url || "unknown"}`;
    const current = routeMap.get(key) || { count: 0, responseTimes: [], dbTimes: [] };
    current.count += 1;
    current.responseTimes.push(Number(metric.responseTimeMs || 0));
    current.dbTimes.push(Number(metric.dbTimeMs || 0));
    routeMap.set(key, current);
  }

  const allEndpoints = Array.from(routeMap.entries())
    .map(([endpoint, stat]) => ({
      endpoint,
      count: stat.count,
      avgResponseTimeMs: Number(avg(stat.responseTimes).toFixed(3)),
      avgDbTimeMs: Number(avg(stat.dbTimes).toFixed(3)),
      p50ResponseTimeMs: Number(percentile(stat.responseTimes, 50).toFixed(3)),
      p95ResponseTimeMs: Number(percentile(stat.responseTimes, 95).toFixed(3)),
      p50DbTimeMs: Number(percentile(stat.dbTimes, 50).toFixed(3)),
      p95DbTimeMs: Number(percentile(stat.dbTimes, 95).toFixed(3)),
    }))
    .sort((a, b) => a.endpoint.localeCompare(b.endpoint));

  return {
    runLabel,
    requestCount: totalRequests,
    cache: {
      hitRatePercent: Number(hitRate.toFixed(2)),
      ...cacheBreakdown,
    },
    responseTimeMs: {
      avg: Number(avg(responseTimes).toFixed(3)),
      p50: Number(percentile(responseTimes, 50).toFixed(3)),
      p95: Number(percentile(responseTimes, 95).toFixed(3)),
    },
    dbTimeMs: {
      avg: Number(avg(dbTimes).toFixed(3)),
      p50: Number(percentile(dbTimes, 50).toFixed(3)),
      p95: Number(percentile(dbTimes, 95).toFixed(3)),
    },
    allEndpoints,
  };
};

const buildMarkdown = (report) => {
  const lines = [];
  lines.push("# Performance Report");
  lines.push("");
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push("");

  for (const run of report.runs) {
    lines.push(`## Run: ${run.runLabel}`);
    lines.push("");
    lines.push(`- Requests: ${run.requestCount}`);
    lines.push(
      `- Cache: hitRate=${run.cache.hitRatePercent}% (HIT=${run.cache.HIT}, MISS=${run.cache.MISS}, BYPASS=${run.cache.BYPASS})`,
    );
    lines.push(
      `- Response Time (ms): avg=${run.responseTimeMs.avg}, p50=${run.responseTimeMs.p50}, p95=${run.responseTimeMs.p95}`,
    );
    lines.push(
      `- DB Time (ms): avg=${run.dbTimeMs.avg}, p50=${run.dbTimeMs.p50}, p95=${run.dbTimeMs.p95}`,
    );
    lines.push("");
    lines.push("### All Endpoints");
    lines.push("");
    lines.push("| Endpoint | Count | Avg Resp (ms) | P50 Resp (ms) | P95 Resp (ms) | Avg DB (ms) | P50 DB (ms) | P95 DB (ms) |");
    lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
    for (const endpoint of run.allEndpoints) {
      lines.push(
        `| ${endpoint.endpoint} | ${endpoint.count} | ${endpoint.avgResponseTimeMs} | ${endpoint.p50ResponseTimeMs} | ${endpoint.p95ResponseTimeMs} | ${endpoint.avgDbTimeMs} | ${endpoint.p50DbTimeMs} | ${endpoint.p95DbTimeMs} |`,
      );
    }
    lines.push("");
  }

  if (report.runs.length >= 2) {
    const [first, second] = report.runs;
    const responseDelta =
      first.responseTimeMs.avg > 0
        ? ((first.responseTimeMs.avg - second.responseTimeMs.avg) / first.responseTimeMs.avg) * 100
        : 0;
    const dbDelta =
      first.dbTimeMs.avg > 0
        ? ((first.dbTimeMs.avg - second.dbTimeMs.avg) / first.dbTimeMs.avg) * 100
        : 0;

    lines.push("## First vs Second Run Comparison");
    lines.push("");
    lines.push(`- First run: ${first.runLabel}`);
    lines.push(`- Second run: ${second.runLabel}`);
    lines.push(`- Avg response time improvement: ${responseDelta.toFixed(2)}%`);
    lines.push(`- Avg DB time improvement: ${dbDelta.toFixed(2)}%`);
    lines.push("");
  }

  return lines.join("\n");
};

const main = () => {
  const metrics = readMetrics();
  if (!metrics.length) {
    throw new Error("No metrics found in perf-metrics.ndjson.");
  }

  const runMap = new Map();
  for (const metric of metrics) {
    const runLabel = metric.runLabel || "unlabeled_run";
    if (!runMap.has(runLabel)) {
      runMap.set(runLabel, []);
    }
    runMap.get(runLabel).push(metric);
  }

  const runs = Array.from(runMap.entries())
    .map(([runLabel, runMetrics]) => summarizeRun(runLabel, runMetrics))
    .sort((a, b) => a.runLabel.localeCompare(b.runLabel));

  const report = {
    generatedAt: new Date().toISOString(),
    metricsSource: metricsPath,
    totalRecords: metrics.length,
    runs,
  };

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(markdownReportPath, buildMarkdown(report));

  console.log(`Report generated: ${jsonReportPath}`);
  console.log(`Report generated: ${markdownReportPath}`);
};

main();
