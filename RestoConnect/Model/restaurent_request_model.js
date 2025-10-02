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
  date_joined: {
    type: Date,
    required: true,
    validate:{
      validator: function(value){
        return value>=new Date().setHours(0,0,0,0);
      }
    }
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

restaurantSchema.pre("save", function(next) {
  if (this.isModified("owner_password")) {
    this.owner_password = bcrypt.hashSync(this.owner_password, 10);
  }
  next();
});

module.exports = mongoose.model("RestaurantRequest", restaurantSchema);


