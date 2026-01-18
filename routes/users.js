const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes nécessitent d'être admin
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);
router.put('/:id/toggle-status', protect, authorize('admin'), toggleUserStatus);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;