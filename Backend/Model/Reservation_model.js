const mongoose = require("mongoose");
const shortid = require("shortid");

const reservationSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  customerName: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  // Primary table reserved for this booking
  table_id: {
    type: String,
    required: false, // Make optional - will be assigned by staff
    default: '',
  },
  guests: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "seated", "completed", "cancelled"],
    default: "pending",
  },
  cancellationReason: {
    type: String,
    default: "",
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  rest_id: {
    type: String,
    ref: 'Restaurant',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  // 👇 Fields used by the staff dashboard to mirror the old Restaurant.reservations
  allocated: {
    type: Boolean,
    default: false,
  },
  tables: [
    {
      type: String,
    },
  ],
});

// Indexes for common query patterns
reservationSchema.index({ rest_id: 1, date: -1, status: 1 }); // Restaurant reservation queries with date & status filter
reservationSchema.index({ customerName: 1 });                   // Customer reservation lookups

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = { Reservation };

