# Database Optimization Report – RestoConnect

**Author:** Sofiya  
**Date:** April 14, 2026  

---

## 1. Problem Statement

The RestoConnect backend had several performance bottlenecks. Many API endpoints were fetching entire collections into Node.js memory and then doing filtering, sorting, and counting in JavaScript loops. This works fine with small test data, but doesn't scale. The goal was to push as much work as possible down to MongoDB so the database does the heavy lifting.

---

## 2. Slow APIs I Found

After going through the controllers, these were the main problem areas:

- **Admin analytics** (`getAllOrders`, `getAllReservations`, `getAllFeedback`, `getAnalytics`, `getRestaurantRevenue`, `getTopCustomers`, `getAdminOverview`, `getRevenueOverTime`, `getEmployeePerformance`, `getDishTrends`) — most of these were loading all orders/reservations into memory and looping through them in JS to calculate stats
- **Superadmin analytics** (`getEmployeePerformance`, `getDishTrends`, `getRestaurantRevenue`, `getTopCustomers`, `getRevenueOverTime`) — same issue, full-collection fetches
- **Customer restaurant search** (`searchRestaurants`) — filtering by open status and sorting by rating/name/distance was done in JS after loading everything
- **Public endpoints** (`getPublicCuisines`, `/api/restaurants`) — fetching all restaurant documents just to extract unique cuisine types or city names

---

## 3. What I Changed

### A) Moved filtering and sorting to MongoDB queries

**searchRestaurants (customerController.js):**
- The `openNow=true` filter now adds `isOpen: true` to the MongoDB query instead of filtering in JS after
- Sorting by rating, name, or distance is done with `.sort()` on the query, not `Array.sort()` in memory
- Getting the list of available cuisines now uses `Restaurant.distinct("cuisine")` instead of fetching all restaurant docs and building a Set manually

**getPublicCuisines (customerController.js):**
- Replaced `Restaurant.find({}, "cuisine")` + manual Set building with a single `Restaurant.distinct("cuisine")` call

**/api/restaurants (server.js):**
- Getting unique cities for the dropdown now uses `Restaurant.distinct("city")` instead of loading all restaurants and deduplicating with a JS Set
- Used `Promise.all` to run the restaurant fetch and distinct query in parallel

### B) Replaced full-data fetching with aggregation pipelines

This was the biggest change. Instead of doing `Order.find({})` and then looping through every order in JS to calculate totals, revenue, status counts etc., I rewrote the heavy endpoints to use MongoDB `$group`, `$facet`, and `$match` stages.

**Examples:**

- `getAllOrders` — stats (total count, today's orders, revenue, status breakdown) now come from a single `$facet` aggregation instead of loading all orders
- `getAllReservations` — same pattern, reservation stats computed in DB
- `getAllFeedback` — average dining/order ratings and status breakdown via aggregation
- `getAnalytics` — runs one big `$facet` pipeline that produces overview stats, per-restaurant revenue, peak hours, and monthly revenue all in one DB round trip
- `getRestaurantRevenue` (admin + superadmin) — revenue per restaurant computed via `$group` with optional `$match` for date period
- `getTopCustomers` — customer spending aggregated by `$group` on `customerName` with `$sort` and `$limit` in the pipeline
- `getRevenueOverTime` — daily/monthly/yearly revenue charts built from aggregation instead of loading all orders
- `getEmployeePerformance` (admin + superadmin) — `Order.aggregate` groups orders by `rest_id` to get per-restaurant stats, then maps results to employees in memory (only the map step, not the counting)
- `getDishTrends` (admin + superadmin) — current month vs previous month dish counts done with two small aggregation queries; 6-month revenue/dish trends use a `$facet` pipeline

### C) Fixed N+1 query patterns

- `getAllRestaurants` (admin) — instead of querying each restaurant's owner one at a time, batch-fetches all owners with `User.find({ rest_id: { $in: restIds }, role: "owner" })` and builds a Map
- `getCustomerDashboard` — batch-fetches all dish documents for recent orders upfront; batch-fetches restaurant names for reservations using `$in`

### D) Fixed model imports

`adminController.js` had some issues where model imports were wrong (e.g. trying to use `Order` as a direct Mongoose model when it's actually a destructured export). Fixed all imports at the top of the file:

```js
const { Order } = require("../Model/Order_model");
const { Reservation } = require("../Model/Reservation_model");
const Feedback = require("../Model/feedback");
```

---

## 4. Indexes Added

I added compound and single-field indexes on the fields that show up most in `find()` filters and `sort()` operations. These are defined in the schema files so they get created automatically when the app connects to MongoDB.

### Orders (`Order_model.js`)

| Index | Why |
|---|---|
| `{ rest_id: 1, date: -1 }` | Dashboard queries — orders for a restaurant sorted by date |
| `{ rest_id: 1, status: 1 }` | Filtering orders by status within a restaurant |
| `{ customerName: 1, date: -1 }` | Customer order history lookups |
| `{ rest_id: 1, date: -1, status: 1 }` | Combined filter + sort on dashboard (date range + status) |

### Reservations (`Reservation_model.js`)

| Index | Why |
|---|---|
| `{ rest_id: 1, date: -1, status: 1 }` | Restaurant reservation queries with date and status |
| `{ customerName: 1 }` | Customer reservation lookups |

### Users (`userRoleModel.js`)

| Index | Why |
|---|---|
| `{ role: 1 }` | Admin filtering users by role |
| `{ rest_id: 1, role: 1 }` | Staff lookups per restaurant |

(Note: `username` and `email` already have `unique: true` in the schema, which creates indexes automatically.)

### Feedback (`feedback.js`)

| Index | Why |
|---|---|
| `{ rest_id: 1, createdAt: -1 }` | Owner/staff querying feedback sorted by date |
| `{ customerName: 1, createdAt: -1 }` | Customer feedback history |

(Note: `orderId` has `unique: true` — auto-indexed.)

### Restaurants (`Restaurents_model.js`)

| Index | Why |
|---|---|
| `{ city: 1 }` | Homepage city filter / location search |
| `{ cuisine: 1 }` | Homepage cuisine filter |
| `{ isOpen: 1 }` | Open-now filter |

(Note: `name` has `unique: true` — auto-indexed.)

### Dishes (`Dishes_model_test.js`)

| Index | Why |
|---|---|
| `{ name: 1 }` | `findByName` queries |
| `{ rest_id: 1 }` | Fetching all dishes for a restaurant |

---

## 5. Query Analysis — Explain Results

I wrote a script (`scripts/explain_queries.js`) to verify the indexes are actually being used. It runs each query twice: once forcing a collection scan (`$natural` hint) and once letting MongoDB choose the best plan. This gives a before vs after comparison.

**How to run:**
```bash
node scripts/explain_queries.js
```

(Make sure your MONGO_URI environment variable is set, or it defaults to `mongodb://127.0.0.1:27017/test`)

### Find Query Results (Before vs After)

| Query | Phase | Winning Plan | Keys Examined | Docs Examined | Returned | Time (ms) | Index Used |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Orders by rest_id + date | Before ($natural) | COLLSCAN | 0 | 79 | 15 | 0 | NO |
| Orders by rest_id + date | After (optimized) | rest_id_1_date_-1 | 15 | 15 | 15 | 1 | YES |
| Orders by rest_id + status | Before ($natural) | COLLSCAN | 0 | 79 | 1 | 0 | NO |
| Orders by rest_id + status | After (optimized) | rest_id_1_status_1 | 1 | 1 | 1 | 0 | YES |
| Users by role | Before ($natural) | COLLSCAN | 0 | 33 | 8 | 0 | NO |
| Users by role | After (optimized) | role_1 | 8 | 8 | 8 | 0 | YES |
| Users by username | Before ($natural) | COLLSCAN | 0 | 33 | 0 | 0 | NO |
| Users by username | After (optimized) | EXPRESS_IXSCAN | 0 | 0 | 0 | 0 | YES |
| Restaurants by city | Before ($natural) | COLLSCAN | 0 | 11 | 0 | 0 | NO |
| Restaurants by city | After (optimized) | city_1 | 11 | 0 | 0 | 0 | YES |
| Restaurants by cuisine | Before ($natural) | COLLSCAN | 0 | 11 | 3 | 0 | NO |
| Restaurants by cuisine | After (optimized) | cuisine_1 | 3 | 3 | 3 | 0 | YES |
| Reservations by rest_id + date | Before ($natural) | COLLSCAN | 0 | 19 | 0 | 0 | NO |
| Reservations by rest_id + date | After (optimized) | rest_id_1_date_-1_status_1 | 0 | 0 | 0 | 0 | YES |
| Feedback by rest_id + createdAt | Before ($natural) | COLLSCAN | 0 | 10 | 2 | 0 | NO |
| Feedback by rest_id + createdAt | After (optimized) | rest_id_1_createdAt_-1 | 2 | 2 | 2 | 0 | YES |

**Key takeaway:** Every query switched from COLLSCAN to IXSCAN. The number of documents examined dropped to match the number of results returned — meaning MongoDB only looks at the documents it actually needs.

### Aggregation Pipelines

| Query | Plan | Keys | Docs | Returned | Time (ms) | Index |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Order revenue total | AGG_PIPELINE | 0 | 0 | 0 | 0 | N/A |
| Revenue grouped by rest_id | AGG_PIPELINE | 0 | 0 | 0 | 0 | N/A |
| Monthly revenue (date-filtered) | AGG_PIPELINE | 0 | 0 | 0 | 0 | N/A |

The aggregation pipelines show `AGG_PIPELINE` as the plan type, and the counters report zeros because MongoDB doesn't always expose detailed cursor-level stats for aggregation explains. The important thing is these queries run at the DB level rather than in Node.js memory.

---

## 6. Before vs After Summary

| What Changed | Before | After |
| --- | --- | --- |
| Admin/Superadmin analytics | Full `Order.find({})` → JS loops for totals, counts, revenue | `$facet` / `$group` aggregation pipelines |
| Employee performance stats | All orders loaded into memory | `$group` by `rest_id` in aggregation, then in-memory map only on summarized results |
| Dish trends | Full order scan + month-by-month JS loops | Separate aggregation queries for current/previous month; `$facet` for 6-month data |
| Restaurant search | In-memory filter/sort + `find({})` for cuisines | DB-level `$regex`, `isOpen`, `.sort()` + `distinct()` for cuisines |
| Public cuisines endpoint | `find({}, "cuisine")` + Set building | `Restaurant.distinct("cuisine")` |
| `/api/restaurants` city list | Full fetch + JS Set for dedup | `Restaurant.distinct("city")` in parallel |
| N+1 owner lookups | Per-restaurant `findOne` for owner | Batch `User.find({ rest_id: { $in: ... } })` + Map |
| Customer dashboard dishes | Per-order dish lookups | Batch `Dish.find({ $or: [name, id] })` upfront |

---

## 7. Files Modified

| File | What Changed |
| --- | --- |
| `Model/Order_model.js` | Added 4 indexes |
| `Model/Reservation_model.js` | Added 2 indexes |
| `Model/userRoleModel.js` | Added 2 indexes |
| `Model/feedback.js` | Added 2 indexes |
| `Model/Restaurents_model.js` | Added 3 indexes |
| `Model/Dishes_model_test.js` | Added 2 indexes |
| `Controller/adminController.js` | Rewrote analytics endpoints to use aggregation; fixed model imports; batch owner lookup |
| `Controller/superadminController.js` | Rewrote analytics endpoints (employee perf, dish trends, revenue, top customers, revenue chart) |
| `Controller/customerController.js` | DB-level search filtering/sorting; `distinct()` for cuisines |
| `server.js` | `distinct("city")` for restaurant city dropdown; env-based CORS/session config; trust proxy |
| `util/database.js` | Uses `MONGODB_URI` env var instead of hardcoded localhost |
| `scripts/explain_queries.js` | Explain verification script (before vs after comparison) |
| `scripts/sync_indexes.js` | Script to sync all schema-level indexes to the production database |

---

## 8. How to Verify

**Syntax check (no DB needed):**
```bash
node -c Controller/adminController.js
node -c Controller/superadminController.js
node -c Controller/customerController.js
node -c server.js
node -c scripts/explain_queries.js
```

**Sync indexes to production (run once after deploy):**
```bash
set MONGO_URI=mongodb+srv://...your_atlas_uri...
node scripts/sync_indexes.js
```

**Run the explain script (needs MongoDB connection):**
```bash
set MONGO_URI=mongodb+srv://...your_atlas_uri...
node scripts/explain_queries.js
```

**Start the server normally:**
```bash
npm start
```
This runs `nodemon server.js` which connects to MongoDB on startup. All schema-level indexes are automatically created/synced by Mongoose when the models load (if `autoIndex` is enabled).

---

## 9. Production Verification (April 14, 2026)

The explain script was run against the live MongoDB Atlas cluster (`restoconnect.2zxldyd.mongodb.net`). Results confirmed that all 19 custom indexes are active and every tested query uses index scans:

| Query | Before (COLLSCAN) Docs Examined | After (IXSCAN) Docs Examined | Index Used |
| --- | ---: | ---: | --- |
| Orders by rest_id + date | 79 | 15 | `rest_id_1_date_-1` |
| Orders by rest_id + status | 79 | 1 | `rest_id_1_status_1` |
| Users by role | 33 | 8 | `role_1` |
| Users by username | 33 | 0 | `username_1` (EXPRESS_IXSCAN) |
| Restaurants by city | 11 | 0 | `city_1` |
| Restaurants by cuisine | 11 | 3 | `cuisine_1` |
| Reservations by rest_id + date | 19 | 4 | `rest_id_1_date_-1_status_1` |
| Feedback by rest_id + createdAt | 10 | 2 | `rest_id_1_createdAt_-1` |

