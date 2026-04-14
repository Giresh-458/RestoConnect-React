const mongoose = require('mongoose');
const config = require('../config/env');
const { getRequestContext } = require("./perfContext");

const originalExec = mongoose.Query.prototype.exec;
mongoose.Query.prototype.exec = async function instrumentedExec(...args) {
  const context = getRequestContext();
  const start = process.hrtime.bigint();

  try {
    return await originalExec.apply(this, args);
  } finally {
    if (context) {
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
      context.dbTimeMs = (context.dbTimeMs || 0) + elapsedMs;
      context.dbCalls = (context.dbCalls || 0) + 1;
    }
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB connected via Mongoose');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = {
  mongoose,
  connectDB
};
