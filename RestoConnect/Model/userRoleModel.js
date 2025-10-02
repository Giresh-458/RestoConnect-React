const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  role: { type: String, required: true },
  restaurantName: { type: String, default: null },
  rest_id: { type: String, default: null },
  password: { type: String, required: true }
});

// Pre-save hook to hash password
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    this.password = bcrypt.hashSync(this.password, 10);
  }
  next();
});

// Static method to find by username
userSchema.statics.findByname = async function(username) {
  return this.findOne({ username });
};

// Static method to update user
userSchema.statics.modify = async function(username, updateData) {
  return this.updateOne({ username }, { $set: updateData });
};

// Instance method to get user info
userSchema.methods.getUserInfo = function() {
  return {
    username: this.username,
    role: this.role,
    restaurantName: this.restaurantName
  };
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
