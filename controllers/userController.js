const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { Op } = require('sequelize');

// Obtenir tous les utilisateurs (admin seulement)
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Ajouter les statistiques pour chaque utilisateur
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.count({ where: { userId: user.id } });
        const reviewCount = await Review.count({ where: { userId: user.id } });
        const totalSpent = await Order.sum('totalAmount', { where: { userId: user.id } }) || 0;

        return {
          ...user.toJSON(),
          stats: {
            orderCount,
            reviewCount,
            totalSpent: parseFloat(totalSpent).toFixed(2)
          }
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Erreur get all users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

// Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Statistiques détaillées
    const orders = await Order.findAll({ 
      where: { userId: id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const reviews = await Review.findAll({ 
      where: { userId: id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const orderCount = await Order.count({ where: { userId: id } });
    const reviewCount = await Review.count({ where: { userId: id } });
    const totalSpent = await Order.sum('totalAmount', { where: { userId: id } }) || 0;

    res.json({
      success: true,
      user: {
        ...user.toJSON(),
        stats: {
          orderCount,
          reviewCount,
          totalSpent: parseFloat(totalSpent).toFixed(2)
        },
        recentOrders: orders,
        recentReviews: reviews
      }
    });
  } catch (error) {
    console.error('Erreur get user by id:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
};

// Modifier le rôle d'un utilisateur
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Utilisez "user" ou "admin"'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de modifier son propre rôle
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `Rôle modifié en ${role} avec succès`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur update user role:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du rôle'
    });
  }
};

// Bloquer/débloquer un utilisateur
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de bloquer soi-même
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre statut'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 'Utilisateur activé' : 'Utilisateur bloqué',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Erreur toggle user status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut'
    });
  }
};

// ✅ SUPPRIMER UN UTILISATEUR (admin) - UNIQUE ET COMPLET
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Tentative de suppression utilisateur ${id}`);

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de supprimer soi-même
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Supprimer ses commandes d'abord
    console.log(`🗑️ Suppression des commandes de l'utilisateur ${id}`);
    const ordersDeleted = await Order.destroy({
      where: { userId: id }
    });

    console.log(`✅ ${ordersDeleted} commande(s) supprimée(s)`);

    // Supprimer ses avis
    console.log(`🗑️ Suppression des avis de l'utilisateur ${id}`);
    const reviewsDeleted = await Review.destroy({
      where: { userId: id }
    });

    console.log(`✅ ${reviewsDeleted} avis supprimé(s)`);

    // Supprimer l'utilisateur
    console.log(`🗑️ Suppression de l'utilisateur ${id}`);
    await user.destroy();

    console.log(`✅ Utilisateur ${id} supprimé avec succès`);

    res.json({
      success: true,
      message: `Utilisateur supprimé avec succès (${ordersDeleted} commandes, ${reviewsDeleted} avis)`
    });

  } catch (error) {
    console.error('❌ Erreur deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};