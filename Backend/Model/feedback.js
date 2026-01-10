const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    // NEW FIELD: To link feedback to a specific restaurant
    rest_id: {
        type: String,
        ref: 'Restaurant',
        required: true,
    },
    
    customerName: { type: String, required: true }, 
    
    // Existing fields for comprehensive feedback:
    diningRating: { type: Number, min: 1, max: 5 },
    lovedItems: { type: String },
    orderRating: { type: Number, min: 1, max: 5 },
    additionalFeedback: { type: String },
    
    // NEW FIELD: Status for owner tracking (default 'Pending')
    status: {
        type: String,
        enum: ['Pending', 'Resolved'],
        default: 'Pending',
    },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);