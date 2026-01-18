const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Créer une intention de paiement
// @route   POST /api/payment/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;

    // Vérifier le montant
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }

    // Créer une intention de paiement
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe utilise les centimes
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement',
      error: error.message
    });
  }
};

// @desc    Confirmer un paiement
// @route   POST /api/payment/confirm-payment
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'ID de paiement manquant'
      });
    }

    // Récupérer l'intention de paiement
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      status: paymentIntent.status,
      paymentIntent
    });
  } catch (error) {
    console.error('Erreur Stripe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement',
      error: error.message
    });
  }
};

// @desc    Webhook Stripe
// @route   POST /api/payment/webhook
// @access  Public
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Paiement réussi:', paymentIntent.id);
      // Ici vous pouvez mettre à jour la commande dans la BDD
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Paiement échoué:', failedPayment.id);
      break;

    default:
      console.log(`Événement non géré: ${event.type}`);
  }

  res.json({ received: true });
};