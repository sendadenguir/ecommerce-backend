const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('En cours', 'Expédiée', 'Livrée', 'Annulée', 'Pending', 'Shipped', 'Delivered', 'Cancelled'),
    defaultValue: 'En cours'
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: 'Carte bancaire'
  },
  paymentStatus: {
    type: DataTypes.ENUM('En attente', 'Payé', 'Échoué', 'Pending', 'Paid', 'Failed'),
    defaultValue: 'En attente'
  },
  stripePaymentId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

// Association avec User
Order.associate = (models) => {
  Order.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'User'
  });
};

module.exports = Order;