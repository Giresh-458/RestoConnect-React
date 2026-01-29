const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  owner_username: {
    type: String,
    required: true,
  },
  owner_password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: false,
  },
  cuisineTypes: {
    type: [String],
    required: false,
    default: [],
  },
  additionalNotes: {
    type: String,
    required: false,
    default: "",
  },
  operatingHours: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "22:00" },
  },
  operatingDays: {
    type: [String],
    default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
  image: {
    type: String,
    required: false,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

restaurantSchema.pre("save", function (next) {
  next();
});

module.exports = mongoose.model("RestaurantRequest", restaurantSchema);
