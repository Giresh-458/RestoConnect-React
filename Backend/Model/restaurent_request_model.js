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
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  owner_username: {
    type: String,
    required: true,
    unique: true,
  },
  owner_password: {
    type: String,
    required: true, 
  },
  email:{
    type:String,
    required:true
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

restaurantSchema.pre("save", function(next) {
 
  next();
});

module.exports = mongoose.model("RestaurantRequest", restaurantSchema);


