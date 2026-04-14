const mongoose = require('mongoose');
const shortid = require('shortid');

const cartSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  customerName: {
    type: String,
    required: true
  },
  restaurantId: {
    type: String,
    ref: 'Restaurant',
    required: true
  },
  items: [{
    dish: { type: String, ref: 'Dish', required: true },
    quantity: { type: Number, required: true }
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = { Cart };
