const fs = require('fs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendWelcomeEmail } = require('../utils/emailService');

// Fonction pour logger dans un fichier
const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('C:\\projects\\ecommerce-backend\\logs.txt', `[${timestamp}] ${message}\n`);
};

// Générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    logToFile('🔵 DÉBUT INSCRIPTION');
    logToFile('📋 Données reçues: ' + JSON.stringify(req.body));
    
    const { name, email, password } = req.body;

    // Vérifier si tous les champs sont remplis
    if (!name || !email || !password) {
      logToFile('❌ Champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      logToFile('❌ Email déjà utilisé');
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    logToFile('✅ Création de l\'utilisateur...');
    
    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password
    });

    logToFile('✅ Utilisateur créé: ' + user.id);

    // Générer le token
    const token = generateToken(user.id);
    
    logToFile('✅ Token généré');
    logToFile('📧 Envoi de l\'email à: ' + user.email);

    // Attendre l'envoi de l'email
    const emailResult = await sendWelcomeEmail(user.email, user.name);

    logToFile('📧 Email envoyé, résultat: ' + JSON.stringify(emailResult));

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      emailPreviewUrl: emailResult.previewUrl
    });
    
    logToFile('🔵 FIN INSCRIPTION');
  } catch (error) {
    logToFile('❌ Erreur lors de l\'inscription: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si tous les champs sont remplis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Générer le token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logToFile('❌ Erreur lors de la connexion: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    logToFile('❌ Erreur lors de la récupération de l\'utilisateur connecté: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};