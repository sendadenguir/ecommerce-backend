const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Obtenir les statistiques générales
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    
    const revenueResult = await Order.sum('totalAmount');
    const totalRevenue = revenueResult || 0;
    
    const totalReviews = await Review.count();
    
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ordersThisMonth = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });
    
    const revenueThisMonth = await Order.sum('totalAmount', {
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    }) || 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue).toFixed(2),
        totalReviews,
        ordersThisMonth,
        revenueThisMonth: parseFloat(revenueThisMonth).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Obtenir les ventes par jour (30 derniers jours)
exports.getSalesByDay = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'revenue']
      ],
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      sales
    });
  } catch (error) {
    console.error('Erreur sales by day:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ventes'
    });
  }
};

// Obtenir les produits les plus vendus
exports.getTopProducts = async (req, res) => {
  try {
    const orders = await Order.findAll();
    const productSales = {};

    orders.forEach(order => {
      const items = JSON.parse(order.items);
      items.forEach(item => {
        if (productSales[item.id]) {
          productSales[item.id].quantity += item.quantity;
          productSales[item.id].orderCount += 1;
        } else {
          productSales[item.id] = {
            id: item.id,
            name: item.name,
            price: item.price,
            img: item.img,
            quantity: item.quantity,
            orderCount: 1
          };
        }
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.json({
      success: true,
      products: topProducts
    });
  } catch (error) {
    console.error('Erreur top products:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des top produits'
    });
  }
};

// Obtenir les dernières commandes
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const orders = await Order.findAll({
      include: [{
        model: User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit
    });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Erreur recent orders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes'
    });
  }
};

// Obtenir la distribution des avis
exports.getReviewsDistribution = async (req, res) => {
  try {
    const distribution = await Review.findAll({
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'DESC']],
      raw: true
    });

    const result = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    distribution.forEach(item => {
      result[item.rating] = parseInt(item.count);
    });

    res.json({
      success: true,
      distribution: result
    });
  } catch (error) {
    console.error('Erreur reviews distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la distribution des avis'
    });
  }
};
// Obtenir les alertes de stock
exports.getStockAlerts = async (req, res) => {
  try {
    // Produits en rupture de stock
    const outOfStock = await Product.findAll({
      where: { stock: 0 },
      order: [['name', 'ASC']]
    });

    // Produits avec stock faible (< 10)
    const lowStock = await Product.findAll({
      where: {
        stock: {
          [Op.gt]: 0,
          [Op.lt]: 10
        }
      },
      order: [['stock', 'ASC']]
    });

    res.json({
      success: true,
      alerts: {
        outOfStock,
        lowStock,
        totalAlerts: outOfStock.length + lowStock.length
      }
    });
  } catch (error) {
    console.error('Erreur stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes de stock'
    });
  }
};