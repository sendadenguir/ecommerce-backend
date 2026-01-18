const express = require('express');
const router = express.Router();
const {
  getStats,
  getSalesByDay,
  getTopProducts,
  getRecentOrders,
  getReviewsDistribution,
  getStockAlerts
} = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes nécessitent d'être admin
router.get('/overview', protect, authorize('admin'), getStats);
router.get('/sales-by-day', protect, authorize('admin'), getSalesByDay);
router.get('/top-products', protect, authorize('admin'), getTopProducts);
router.get('/recent-orders', protect, authorize('admin'), getRecentOrders);
router.get('/reviews-distribution', protect, authorize('admin'), getReviewsDistribution);
router.get('/stock-alerts', protect, authorize('admin'), getStockAlerts);
module.exports = router;