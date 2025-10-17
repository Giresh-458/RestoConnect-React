const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    customerName: { type: String, required: true }, 
    diningRating: { type: Number },
    lovedItems: { type: String },
    orderRating: { type: Number },
    additionalFeedback: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
