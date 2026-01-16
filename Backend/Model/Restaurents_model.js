const mongoose = require("mongoose");
const shortid = require("shortid");

const restaurantSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  image: String,
  rating: Number,
  location: String,
  amount: Number,
 cuisine: {
  type: [String],
  enum: [
    "BBQ",
    "Cafe",
    "Chinese",
    "Fast Food",
    "Indian",
    "Italian",
    "Mexican",
    "Non-Veg",
    "Organic",
    "Seafood",
    "South Indian",
    "Vegan",
    "Vegetarian"
  ],
  default: [],
},
  isOpen: {
    type: Boolean,
    default: true,
  },
  operatingHours: {
    open: { type: String, default: "09:00" },
    close: { type: String, default: "22:00" },
  },
  distance: {
    type: Number,
    default: 0, // distance in km
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dishes: [
    {
      type: String,
      ref: "Dish",
    },
  ],
  orders: [
    {
      type: String,
      ref: "Order",
    },
  ],
  reservations: [
    {
      id: String,
      name: String,
      guests: Number,
      date: String,
      time: String,
      tables: [String],
      allocated: {
        type: Boolean,
        default: false,
      },
    },
  ],
  tables: [
    {
      number: String,
      status: String,
      seats: Number,
    },
  ],
  totalTables: {
    type: Number,
    default: 0,
  },
  inventory: [String],
  orderData: {
    labels: [String],
    values: [Number],
  },
  inventoryData: {
    labels: [String],
    values: [Number],
    units: [String],
    suppliers: [String],
    minStocks: [Number],
  },
  tasks: [
    {
      id: Number,
      name: String,
    },
  ],
  payments: [
    {
      amount: Number,
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  announcements: [
    {
      message: String,
      priority: { type: String, default: "normal" },
      completedBy: [String],
      active: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  staffShifts: [
    {
      name: String,
      startTime: String,
      endTime: String,
      date: Date,
      assignedStaff: [String],
      completed: { type: Boolean, default: false },
    },
  ],
  staffTasks: [
    {
      description: String,
      status: { type: String, default: "Pending" },
      assignedTo: [String], // usernames
      priority: { type: String, default: "medium" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  supportMessages: [
    {
      from: String,
      message: String,
      timestamp: { type: Date, default: Date.now },
      status: { type: String, default: "pending" },
    },
  ],
});

// Instance method to add restaurant
restaurantSchema.methods.addRestaurant = async function () {
  return this.save();
};

// Static method to find by ID
restaurantSchema.statics.find_by_id = function (rest_id) {
  return this.findOne({ _id: rest_id });
};

// Static method to find all restaurants
restaurantSchema.statics.findAll = function () {
  return this.find({});
};

// Static method to update specific field
restaurantSchema.statics.updateField = function (id, field, value) {
  return this.updateOne({ _id: id }, { $push: { [field]: value } });
};

// Static method to update full document
restaurantSchema.statics.updateFull = function (obj) {
  const { _id, ...updateData } = obj;
  return this.updateOne({ _id }, { $set: updateData });
};

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = { Restaurant };
