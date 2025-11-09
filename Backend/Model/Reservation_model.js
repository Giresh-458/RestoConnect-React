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
  table_id: {
    type: String,
    required: true,
  },
  guests: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  rest_id: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = { Reservation };
