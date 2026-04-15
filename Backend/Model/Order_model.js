const mongoose = require("mongoose");
const shortid = require("shortid");

const orderSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  dishes: [
    {
      type: String,
      ref: "Dish",
    },
  ],
  customerName: {
    type: String,
    required: true,
  },
  restaurant: {
    type: String,
  },
  rest_id: {
    type: String,
    ref: 'Restaurant',
  },
  reservation_id: {
    type: String,
    ref: 'Reservation',
    default: null,
  },
  status: {
    type: String,
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid",
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  table_id: {
    type: String,
  },
  tableNumber: {
    type: String,
    default: null,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  orderTime: {
    type: Date,
    default: Date.now,
  },
  completionTime: {
    type: Date,
    default: null,
  },
  estimatedTime: {
    type: Number,
    default: 15,
  },
  assignedStaff: {
    type: [String],
    default: [],
  },
  feedback: {
    type: String,
    default: "",
  },
  promoCode: {
    type: String,
    default: null,
  },
  promoDiscount: {
    type: Number,
    default: 0,
    min: 0,
  },
},
  { timestamps: true }
);

// Indexes for common query patterns
orderSchema.index({ rest_id: 1, date: -1 });              // Dashboard queries: orders by restaurant sorted by date
orderSchema.index({ rest_id: 1, status: 1 });              // Status-based filtering per restaurant
orderSchema.index({ customerName: 1, date: -1 });          // Customer order history
orderSchema.index({ rest_id: 1, date: -1, status: 1 });   // Combined dashboard queries (date range + status)

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order };
