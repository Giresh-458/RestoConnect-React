const mongoose = require('mongoose');
const shortid = require('shortid');

const restaurantSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  name: {
    type: String,
    required: true
  },
  image: String,
  rating: Number,
  location: String,
  amount: Number,
  date: {
    type: Date,
    default: Date.now
  },
  dishes: [{
    type: String,
    ref: 'Dish'
  }],
  orders: [{
    type: String,
    ref: 'Order'
  }],
  reservations: [{
    id: String,
    name: String,
    guests: Number,
    date: String,
    time: String,
    tables: [String],
    allocated: {
      type: Boolean,
      default: false
    }
  }],
  tables: [{
    number: String,
    status: String,
    seats: Number
  }],
  totalTables: {
    type: Number,
    default: 0
  },
  inventory: [String],
  orderData: {
    labels: [String],
    values: [Number]
  },
  inventoryData: {
    labels: [String],
    values: [Number]
  },
  tasks: [{
    id: Number,
    name: String
  }],
  payments: [{
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }]
});

// Instance method to add restaurant
restaurantSchema.methods.addRestaurant = async function() {
  return this.save();
};

// Static method to find by ID
restaurantSchema.statics.find_by_id = function(rest_id) {
  return this.findOne({ _id: rest_id });
};

// Static method to find all restaurants
restaurantSchema.statics.findAll = function() {
  return this.find({});
};

// Static method to update specific field
restaurantSchema.statics.updateField = function(id, field, value) {
  return this.updateOne(
    { _id: id },
    { $push: { [field]: value } }
  );
};

// Static method to update full document
restaurantSchema.statics.updateFull = function(obj) {
  const { _id, ...updateData } = obj;
  return this.updateOne(
    { _id },
    { $set: updateData }
  );
};

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = { Restaurant };
