const mongoose = require('mongoose');

const passwordResetCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  used: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for automatic cleanup of expired codes
passwordResetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if code is valid
passwordResetCodeSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date();
};

const PasswordResetCode = mongoose.model('PasswordResetCode', passwordResetCodeSchema);

module.exports = { PasswordResetCode };
