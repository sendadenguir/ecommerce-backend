const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  deleteReview,
  updateReview,
  getUserReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Routes publiques
router.get('/product/:productId', getProductReviews);

// Routes protégées (utilisateur connecté)
router.post('/', protect, createReview);
router.get('/my-reviews', protect, getUserReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;