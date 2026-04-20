# Database Optimization Report - RestoConnect

Author: Sofiya

This report intentionally avoids hard-coded performance numbers. Generate the before/after figures from the target MongoDB database using the commands below so the submission reflects real data instead of copied or guessed metrics.

## What Was Optimized

- Restaurant discovery/search now uses MongoDB text search and indexed filters instead of app-side regex filtering for the public search API.
- Owner dashboard summary now consolidates repeated order/reservation counts into MongoDB `$facet` aggregations and runs independent reads in parallel.
- Owner 7-day revenue/order trend now uses one MongoDB aggregation for order counts instead of seven sequential `countDocuments` calls.
- Staff homepage reservations are filtered by date in MongoDB before being returned to the application.
- Cacheable restaurant/search/dashboard APIs are now routed through the shared Redis read-through cache middleware with tag-based invalidation.

## Indexes Added

### restaurants

- `{ name: 1 }` via `unique: true`
- `{ city: 1 }`
- `{ cuisine: 1 }`
- `{ isOpen: 1 }`
- `{ city: 1, cuisine: 1, isOpen: 1, rating: -1 }`
- `{ name: "text", city: "text", cuisine: "text" }`

### orders

- `{ rest_id: 1, date: -1 }`
- `{ rest_id: 1, status: 1 }`
- `{ customerName: 1, date: -1 }`
- `{ rest_id: 1, date: -1, status: 1 }`
- `{ date: -1 }`
- `{ status: 1, date: -1 }`

### reservations

- `{ rest_id: 1, date: -1, status: 1 }`
- `{ customerName: 1 }`
- `{ status: 1, date: -1 }`

### users

- `{ username: 1 }` via `unique: true`
- `{ email: 1 }` via `unique: true`
- `{ role: 1 }`
- `{ rest_id: 1, role: 1 }`

### feedbacks

- `{ orderId: 1 }` via `unique: true`
- `{ rest_id: 1, createdAt: -1 }`
- `{ customerName: 1, createdAt: -1 }`

### dishes

- `{ name: 1 }`
- `{ rest_id: 1 }`

## How To Apply Indexes

Set `MONGODB_URI` to the target database, then run:

```bash
npm run db:indexes --prefix Backend
```

This calls Mongoose `syncIndexes()` for the registered models and prints the resulting index inventory.

## How To Produce The Required Before/After Comparison

Run the explain report against the same target database:

```bash
npm run db:explain --prefix Backend
```

The script compares selected query plans by forcing a `$natural` collection scan for the "before" row and then running the optimized query for the "after" row. Use the generated output table in the final submission.

The metrics to report are:

- Winning plan or index name
- Keys examined
- Documents examined
- Documents returned
- Execution time in milliseconds
- Whether an index was used

## Redis/Latency Measurement

To compare Redis performance, run the application twice and generate the performance report:

```bash
# Baseline
CACHE_ENABLED=false PERF_RUN_LABEL=baseline_no_cache npm start --prefix Backend

# Cached run
CACHE_ENABLED=true PERF_RUN_LABEL=redis_cache_enabled npm start --prefix Backend

# After exercising the same API sequence in both runs
npm run perf:report --prefix Backend
```

The generated files are:

- `Backend/logs/perf-metrics.ndjson`
- `Backend/logs/perf-report.json`
- `Backend/logs/perf-report.md`

Use those files for the final latency/throughput comparison.
