const mongoose = require('mongoose');
const shortid = require('shortid');

const orderSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate
  },
  dishes: [{
    type: String,
    ref: 'Dish'
  }],
  customerName: {
    type: String,
    required: true
  },
  restaurant: {
    type: String
  },
  rest_id: {
    type: String
  },
  status: {
    type: String,
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = { Order };
