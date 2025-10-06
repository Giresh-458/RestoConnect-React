const mongoose = require('mongoose');

const uri = "mongodb://127.0.0.1:27017/test";

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
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
