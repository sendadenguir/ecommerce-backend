process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();

// Importer les modèles
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Review = require('./models/Review');

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Accepter toutes les origines en développement
  credentials: true
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/users', require('./routes/users'));
// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static('uploads'));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API E-commerce fonctionne !',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err);
  res.status(500).json({ 
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    // Connexion à MySQL
    await sequelize.authenticate();
    console.log('✅ Connexion à MySQL réussie !');

    // Définir les relations entre les modèles
Review.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Review, { foreignKey: 'userId' });

// Relation Order-User
Order.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Order, { foreignKey: 'userId' });
    // Créer/mettre à jour les tables
    await sequelize.sync({ alter: true });
    console.log('✅ Tables créées/mises à jour avec succès !');

    // Initialiser le service email
const emailService = require('./utils/emailService');
await emailService.initTransporter();

    // Démarrer le serveur
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage du serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await sequelize.close();
  console.log('✅ Connexion à la base de données fermée');
  process.exit(0);
});