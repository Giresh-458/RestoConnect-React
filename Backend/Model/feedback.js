const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  rest_id: {
    type: String,
    ref: "Restaurant",
    required: true,
  },

  orderId: {
    type: String,
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

module.exports = mongoose.model("Feedback", feedbackSchema);
