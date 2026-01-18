const { Sequelize } = require('sequelize');
require('dotenv').config();

// Créer une instance Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // Mettre à true pour voir les requêtes SQL
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Tester la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à MySQL réussie !');
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error.message);
  }
};

module.exports =  sequelize ;