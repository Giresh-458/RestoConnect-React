// Stripe payment route for creating a PaymentIntent
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const config = require('../config/env');

if (!config.stripeSecretKey) {
  // Fail fast: running with a placeholder key makes debugging impossible and is unsafe.
  throw new Error('Missing STRIPE_SECRET_KEY in environment');
}

const stripe = Stripe(config.stripeSecretKey);

// POST /api/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
  const { amount, currency = 'usd' } = req.body;
  try {
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount. Must be a positive integer in the smallest currency unit (e.g. paise/cents).' });
    }
    const parsedCurrency = String(currency || '').toLowerCase();
    if (!/^[a-z]{3}$/.test(parsedCurrency)) {
      return res.status(400).json({ error: 'Invalid currency. Must be a 3-letter ISO code (e.g. inr, usd).' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: parsedAmount,
      currency: parsedCurrency,
      // You can add more options here (metadata, receipt_email, etc.)
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
