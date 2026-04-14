const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  rest_id: {
    type: String,
    ref: "Restaurant",
    required: true,
  },

  orderId: {
    type: String,
    ref: 'Order',
    required: true,
    unique: true,
  },

  customerName: { type: String, required: true },

  diningRating: { type: Number, min: 1, max: 5 },
  lovedItems: { type: String },
  orderRating: { type: Number, min: 1, max: 5 },
  additionalFeedback: { type: String },

  status: {
    type: String,
    enum: ["Pending", "Resolved"],
    default: "Pending",
  },

  createdAt: { type: Date, default: Date.now },
});

// Indexes for common query patterns
feedbackSchema.index({ rest_id: 1, createdAt: -1 });       // Owner/staff feedback queries sorted by date
feedbackSchema.index({ customerName: 1, createdAt: -1 });   // Customer feedback history

module.exports = mongoose.model("Feedback", feedbackSchema);
