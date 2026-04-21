/**
 * sync_indexes.js – Ensure all Mongoose schema indexes exist on the database.
 *
 * Usage: MONGODB_URI="mongodb+srv://..." node scripts/sync_indexes.js
 */
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/test";

async function run() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  RestoConnect – Index Sync Tool");
  console.log("═══════════════════════════════════════════════════════════════\n");

  await mongoose.connect(MONGO_URI);
  console.log(`✅ Connected to MongoDB: ${MONGO_URI}\n`);

  // Import all models so their schemas (and index definitions) are registered
  require("../Model/Order_model");
  require("../Model/Restaurents_model");
  require("../Model/userRoleModel");
  require("../Model/Reservation_model");
  require("../Model/feedback");
  require("../Model/Dishes_model_test");

  console.log("─── Syncing indexes for all models ───────────────────────────\n");

  const models = mongoose.modelNames();
  for (const name of models) {
    const model = mongoose.model(name);
    try {
      await model.syncIndexes();
      const indexes = await model.collection.indexes();
      const custom = indexes.filter((idx) => idx.name !== "_id_");
      console.log(`✅ ${name}: ${custom.length} custom indexes synced`);
      custom.forEach((idx) =>
        console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`)
      );
    } catch (err) {
      console.error(`❌ ${name}: ${err.message}`);
    }
  }

  console.log("\n─── Verification: Full Index Inventory ───────────────────────\n");
  const collections = ["orders", "reservations", "users", "feedbacks", "restaurants", "dishes"];
  for (const collName of collections) {
    try {
      const indexes = await mongoose.connection.db.collection(collName).indexes();
      const custom = indexes.filter((idx) => idx.name !== "_id_");
      console.log(`📋 ${collName}: ${custom.length} custom indexes`);
      custom.forEach((idx) =>
        console.log(`   ${idx.name}: ${JSON.stringify(idx.key)}`)
      );
    } catch {
      console.log(`⚠️  ${collName}: collection not found`);
    }
  }

  await mongoose.disconnect();
  console.log("\n✅ Done – all indexes synced to database");
}


run().catch((err) => {
  console.error(err);
  process.exit(1);
});
