const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');

// Définir les relations
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

// Synchroniser les modèles avec la base de données
const syncDatabase = async () => {
  try {
  await sequelize.sync({ force: false });    console.log('✅ Tables créées/mises à jour avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
  }
};

module.exports = {
  User,
  Product,
  Order,
  syncDatabase
};
