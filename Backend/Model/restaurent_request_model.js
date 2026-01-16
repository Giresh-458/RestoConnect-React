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
  created_at: {
    type: Date,
    default: Date.now,
  },
});

restaurantSchema.pre("save", function (next) {
  next();
});

module.exports = mongoose.model("RestaurantRequest", restaurantSchema);
