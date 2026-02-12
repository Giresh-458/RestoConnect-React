const mongoose = require("mongoose");
const shortid = require("shortid");

const promoCodeSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0,
  },
  minAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxDiscount: {
    type: Number,
    default: null, // null means no max discount
    min: 0,
  },
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: null, // null means unlimited
    min: 0,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rest_id: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });

// Method to check if promo code is valid
promoCodeSchema.methods.isValid = function (orderAmount = 0) {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) {
    return { valid: false, error: "Promo code is not active" };
  }
  
  // Check date validity
  if (now < this.validFrom || now > this.validUntil) {
    return { valid: false, error: "Promo code has expired or is not yet valid" };
  }
  
  // Check usage limit
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { valid: false, error: "Promo code usage limit reached" };
  }
  
  // Check minimum amount
  if (orderAmount < this.minAmount) {
    return { 
      valid: false, 
      error: `Minimum order amount of ₹${this.minAmount} required` 
    };
  }
  
  return { valid: true };
};

// Method to calculate discount
promoCodeSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;
  
  if (this.discountType === "percentage") {
    discount = (orderAmount * this.discountValue) / 100;
    // Apply max discount if set
    if (this.maxDiscount !== null && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.discountType === "fixed") {
    discount = this.discountValue;
    // Don't exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }
  }
  
  return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
module.exports = { PromoCode };
