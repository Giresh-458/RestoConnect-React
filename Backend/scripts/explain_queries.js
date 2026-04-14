/**
 * explain_queries.js – reproducible explain-based verification.
 *
 * Usage: node scripts/explain_queries.js
 */
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/test";

function findStage(planNode, stageName) {
  if (!planNode || typeof planNode !== "object") return null;
  if (planNode.stage === stageName) return planNode;
  if (Array.isArray(planNode.inputStages)) {
    for (const s of planNode.inputStages) {
      const match = findStage(s, stageName);
      if (match) return match;
    }
  }
  return (
    findStage(planNode.inputStage, stageName) ||
    findStage(planNode.outerStage, stageName) ||
    findStage(planNode.innerStage, stageName) ||
    findStage(planNode.shards, stageName)
  );
}

function summarizeFindExplain(explain) {
  const stats = explain.executionStats || {};
  const winningPlan = explain.queryPlanner?.winningPlan || {};
  const ix = findStage(winningPlan, "IXSCAN");
  const coll = findStage(winningPlan, "COLLSCAN");

  const winningPlanLabel =
    ix?.indexName || coll?.stage || winningPlan.stage || "UNKNOWN";
  const indexUsed =
    ix || String(winningPlanLabel).includes("IXSCAN") ? "YES" : "NO";

  return {
    winningPlan: winningPlanLabel,
    keysExamined: stats.totalKeysExamined || 0,
    docsExamined: stats.totalDocsExamined || 0,
    returned: stats.nReturned || 0,
    executionMs: stats.executionTimeMillis || 0,
    indexUsed,
  };
}

async function runFindExplain(
  coll,
  filter,
  options = {},
  forceNatural = false,
) {
  const findOptions = {
    projection: options.projection || {},
  };
  if (forceNatural) {
    findOptions.hint = { $natural: 1 };
  }

  const cursor = coll.find(filter, findOptions);
  if (options.sort) cursor.sort(options.sort);
  if (options.limit) cursor.limit(options.limit);

  const explain = await cursor.explain("executionStats");
  return summarizeFindExplain(explain);
}

async function runAggExplain(coll, pipeline) {
  const explain = await coll.aggregate(pipeline).explain("executionStats");
  const cursorStage = (explain.stages || []).find((s) => s.$cursor)?.$cursor;
  const stats = cursorStage?.executionStats || {};
  const winningPlan = cursorStage?.queryPlanner?.winningPlan || {};
  const ix = findStage(winningPlan, "IXSCAN");

  return {
    winningPlan: ix?.indexName || winningPlan.stage || "AGG_PIPELINE",
    keysExamined: stats.totalKeysExamined || 0,
    docsExamined: stats.totalDocsExamined || 0,
    returned: stats.nReturned || 0,
    executionMs: stats.executionTimeMillis || 0,
    indexUsed: ix ? "YES" : "NO/NA",
  };
}

async function run() {
  console.log(
    "===============================================================",
  );
  console.log("  RestoConnect - Explain Query Verification");
  console.log(
    "===============================================================\n",
  );

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`Connected to MongoDB: ${MONGO_URI}\n`);

  const ordersColl = db.collection("orders");
  const reservationsColl = db.collection("reservations");
  const usersColl = db.collection("users");
  const restaurantsColl = db.collection("restaurants");
  const feedbacksColl = db.collection("feedbacks");

  const sampleOrder = await ordersColl.findOne({});
  const sampleReservation = await reservationsColl.findOne({});

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const querySpecs = [
    {
      label: "Orders by rest_id + date (dashboard)",
      coll: ordersColl,
      filter: sampleOrder
        ? {
            rest_id: String(sampleOrder.rest_id),
            date: { $gte: new Date("2024-01-01") },
          }
        : { rest_id: "__none__" },
      options: { sort: { date: -1 }, limit: 20 },
    },
    {
      label: "Orders by rest_id + status",
      coll: ordersColl,
      filter: sampleOrder
        ? { rest_id: String(sampleOrder.rest_id), status: "pending" }
        : { rest_id: "__none__", status: "pending" },
      options: { limit: 20 },
    },
    {
      label: "Users by role",
      coll: usersColl,
      filter: { role: "customer" },
      options: { limit: 20 },
    },
    {
      label: "Users by username",
      coll: usersColl,
      filter: { username: "admin" },
      options: { limit: 1 },
    },
    {
      label: "Restaurants by city",
      coll: restaurantsColl,
      filter: { city: { $regex: /mumbai/i } },
      options: { limit: 20 },
    },
    {
      label: "Restaurants by cuisine",
      coll: restaurantsColl,
      filter: { cuisine: "Indian" },
      options: { limit: 20 },
    },
    {
      label: "Reservations by rest_id + date",
      coll: reservationsColl,
      filter: sampleReservation
        ? {
            rest_id: String(sampleReservation.rest_id),
            date: { $gte: todayStart, $lt: tomorrow },
          }
        : { rest_id: "__none__", date: { $gte: todayStart, $lt: tomorrow } },
      options: { sort: { date: -1 }, limit: 20 },
    },
    {
      label: "Feedback by rest_id + createdAt",
      coll: feedbacksColl,
      filter: sampleOrder
        ? { rest_id: String(sampleOrder.rest_id) }
        : { rest_id: "__none__" },
      options: { sort: { createdAt: -1 }, limit: 20 },
    },
  ];

  const comparisonRows = [];

  console.log(
    "--- Before vs After (Find Queries) ---------------------------\n",
  );
  for (const spec of querySpecs) {
    try {
      const before = await runFindExplain(
        spec.coll,
        spec.filter,
        spec.options,
        true,
      );
      const after = await runFindExplain(
        spec.coll,
        spec.filter,
        spec.options,
        false,
      );
      comparisonRows.push({ query: spec.label, before, after });

      console.log(`Query: ${spec.label}`);
      console.log(
        `   BEFORE -> plan=${before.winningPlan}, keys=${before.keysExamined}, docs=${before.docsExamined}, n=${before.returned}, ms=${before.executionMs}, indexUsed=${before.indexUsed}`,
      );
      console.log(
        `   AFTER  -> plan=${after.winningPlan}, keys=${after.keysExamined}, docs=${after.docsExamined}, n=${after.returned}, ms=${after.executionMs}, indexUsed=${after.indexUsed}`,
      );
    } catch (err) {
      console.log(`WARN  ${spec.label}: ${err.message}`);
    }
  }

  console.log(
    "\n--- Aggregation Explain (Current) ----------------------------\n",
  );
  const aggSpecs = [
    {
      label: "Order revenue total",
      coll: ordersColl,
      pipeline: [
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
      ],
    },
    {
      label: "Restaurant revenue grouped by rest_id",
      coll: ordersColl,
      pipeline: [
        {
          $group: {
            _id: "$rest_id",
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
      ],
    },
    {
      label: "Monthly revenue (date-filtered)",
      coll: ordersColl,
      pipeline: [
        {
          $match: {
            date: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) },
          },
        },
        {
          $group: {
            _id: { y: { $year: "$date" }, m: { $month: "$date" } },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ],
    },
  ];

  const aggRows = [];
  for (const spec of aggSpecs) {
    try {
      const stat = await runAggExplain(spec.coll, spec.pipeline);
      aggRows.push({ query: spec.label, ...stat });
      console.log(`Query: ${spec.label}`);
      console.log(
        `   plan=${stat.winningPlan}, keys=${stat.keysExamined}, docs=${stat.docsExamined}, n=${stat.returned}, ms=${stat.executionMs}, indexUsed=${stat.indexUsed}`,
      );
    } catch (err) {
      console.log(`WARN  ${spec.label}: ${err.message}`);
    }
  }

  console.log(
    "\n--- Index Inventory ------------------------------------------\n",
  );
  const collections = [
    "orders",
    "reservations",
    "users",
    "feedbacks",
    "restaurants",
    "dishes",
  ];
  for (const name of collections) {
    try {
      const indexes = await db.collection(name).indexes();
      const custom = indexes.filter((idx) => idx.name !== "_id_");
      console.log(`${name}: ${custom.length} custom indexes`);
      custom.forEach((idx) =>
        console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`),
      );
    } catch {
      console.log(`WARN  ${name}: collection not found`);
    }
  }

  console.log(
    "\n--- Markdown: Find Query Before vs After ---------------------\n",
  );
  console.log(
    "| Query | Phase | Winning Plan | Keys Examined | Docs Examined | Returned | Time (ms) | Index Used | ",
  );
  console.log("|---|---|---|---:|---:|---:|---:|---|");
  for (const row of comparisonRows) {
    console.log(
      `| ${row.query} | Before ($natural) | ${row.before.winningPlan} | ${row.before.keysExamined} | ${row.before.docsExamined} | ${row.before.returned} | ${row.before.executionMs} | ${row.before.indexUsed} |`,
    );
    console.log(
      `| ${row.query} | After (optimized) | ${row.after.winningPlan} | ${row.after.keysExamined} | ${row.after.docsExamined} | ${row.after.returned} | ${row.after.executionMs} | ${row.after.indexUsed} |`,
    );
  }

  if (aggRows.length) {
    console.log(
      "\n--- Markdown: Aggregation Explain (Current) ------------------\n",
    );
    console.log(
      "| Query | Winning Plan | Keys Examined | Docs Examined | Returned | Time (ms) | Index Used | ",
    );
    console.log("|---|---|---:|---:|---:|---:|---|");
    for (const row of aggRows) {
      console.log(
        `| ${row.query} | ${row.winningPlan} | ${row.keysExamined} | ${row.docsExamined} | ${row.returned} | ${row.executionMs} | ${row.indexUsed} |`,
      );
    }
  }

  await mongoose.disconnect();
  console.log("\nDone");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
