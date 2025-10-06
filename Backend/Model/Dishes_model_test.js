const mongoose = require('mongoose');
const shortid = require('shortid');

const dishSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: String,
  image: String
});

// Add dish to restaurant
dishSchema.methods.addDish = async function(rest_id) {
  await mongoose.model('Restaurant').updateOne(
    { _id: rest_id },
    { $push: { dishes: this._id } }
  );
  return this.save();
};

// Static method to remove dish
dishSchema.statics.removeDish = async function(rest_id, dish_id) {
  await mongoose.model('Restaurant').updateOne(
    { _id: rest_id },
    { $pull: { dishes: dish_id } }
  );
  return this.deleteOne({ _id: dish_id });
};

// Instance method to update dish
dishSchema.methods.updateDish = async function() {
  return this.save();
};

// Static method to find all dishes
dishSchema.statics.findAll = function() {
  return this.find({});
};

// Static method to find dish by ID
dishSchema.statics.find_by_id = function(d_id) {
  return this.findOne({ _id: d_id });
};

// Static method to find dish by name
dishSchema.statics.findByName = function(fname) {
  return this.findOne({ name: fname });
};

const Dish = mongoose.model('Dish', dishSchema);

module.exports = { Dish };
