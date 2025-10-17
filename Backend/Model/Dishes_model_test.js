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
});

dishSchema.methods.addDish = async function(rest_id) {
  await mongoose.model('Restaurant').updateOne(
    { _id: rest_id },
    { $push: { dishes: this._id } }
  );
  return this.save();
};

dishSchema.statics.removeDish = async function(rest_id, dish_id) {
  await mongoose.model('Restaurant').updateOne(
    { _id: rest_id },
    { $pull: { dishes: dish_id } }
  );
  return this.deleteOne({ _id: dish_id });
};

dishSchema.methods.updateDish = async function() {
  return this.save();
};

dishSchema.statics.findAll = function() {
  return this.find({});
};

dishSchema.statics.find_by_id = function(d_id) {
  return this.findOne({ _id: d_id });
};

dishSchema.statics.findByName = function(fname) {
  return this.findOne({ name: fname });
};

const Dish = mongoose.model('Dish', dishSchema);

module.exports = { Dish };
