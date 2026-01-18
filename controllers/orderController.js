const { Order, User } = require('../models');
const { Op } = require('sequelize');

// Créer une commande
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, paymentMethod, stripePaymentId, paymentStatus } = req.body;
    const userId = req.user.id;

    // Générer un numéro de commande unique
    const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order = await Order.create({
      userId,
      orderNumber,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod,
      stripePaymentId,
      paymentStatus: paymentStatus || 'Payé',
      status: 'En cours'
    });

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      order
    });

  } catch (error) {
    console.error('Erreur createOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: error.message
    });
  }
};

// Récupérer mes commandes (utilisateur)
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Erreur getMyOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message
    });
  }
};

// Récupérer TOUTES les commandes en attente (admin)
exports.getPendingOrders = async (req, res) => {
  try {
    // Récupère toutes les commandes avec statut "En cours", "Pending"
    const orders = await Order.findAll({
      where: {
        status: {
          [Op.in]: ['En cours', 'Pending']
        }
      },
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error('Erreur getPendingOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes en attente',
      error: error.message
    });
  }
};

// Récupérer une commande par ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que c'est l'utilisateur propriétaire ou un admin
    if (order.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Erreur getOrderById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
      error: error.message
    });
  }
};

// Récupérer TOUTES les commandes (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      orders: rows,
      pagination: {
        total: count,
        pages: totalPages,
        currentPage: page
      }
    });

  } catch (error) {
    console.error('Erreur getAllOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message
    });
  }
};

// Mettre à jour le statut d'une commande (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Valider le statut
    const validStatuses = ['En cours', 'Expédiée', 'Livrée', 'Annulée', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour',
      order
    });

  } catch (error) {
    console.error('Erreur updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// Supprimer une commande (admin)
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    await order.destroy();

    res.json({
      success: true,
      message: 'Commande supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur deleteOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la commande',
      error: error.message
    });
  }
};