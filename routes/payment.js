const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Routes protégées
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm-payment', protect, confirmPayment);

// Webhook (public, mais vérifié par signature Stripe)
router.post('/webhook', stripeWebhook);

module.exports = router;