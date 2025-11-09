const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true // e.g., "L", "Kg", "pieces"
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  rest_id: {
    type: String,
    required: true
  },
  minStock: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Static method to find by restaurant ID
inventorySchema.statics.findByRestaurant = function(rest_id) {
  return this.find({ rest_id });
};

// Static method to update quantity
inventorySchema.statics.updateQuantity = async function(id, change) {
  const item = await this.findById(id);
  if (!item) {
    throw new Error('Inventory item not found');
  }
  item.quantity = Math.max(0, item.quantity + change);
  return item.save();
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = { Inventory };

