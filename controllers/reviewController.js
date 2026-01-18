const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/User');
const { Op } = require('sequelize');

// Créer un avis
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Vérifier si le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit
    const existingReview = await Review.findOne({
      where: { productId, userId }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis pour ce produit'
      });
    }

    // Créer l'avis
    const review = await Review.create({
      productId,
      userId,
      rating,
      comment,
      userName: req.user.name,
      isApproved: true
    });

    // Recalculer la note moyenne du produit
    await updateProductRating(productId);

    res.status(201).json({
      success: true,
      message: 'Avis ajouté avec succès',
      review
    });
  } catch (error) {
    console.error('Erreur création avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'avis'
    });
  }
};

// Obtenir tous les avis d'un produit
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.findAll({
      where: { 
        productId,
        isApproved: true
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'rating', 'comment', 'userName', 'createdAt']
    });

    // Calculer les statistiques
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.json({
      success: true,
      reviews,
      stats: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Erreur récupération avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis'
    });
  }
};

// Supprimer un avis (utilisateur propriétaire ou admin)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire ou admin
    if (review.userId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer cet avis'
      });
    }

    const productId = review.productId;
    await review.destroy();

    // Recalculer la note moyenne du produit
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Avis supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'avis'
    });
  }
};

// Modifier un avis
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cet avis'
      });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Recalculer la note moyenne du produit
    await updateProductRating(review.productId);

    res.json({
      success: true,
      message: 'Avis modifié avec succès',
      review
    });
  } catch (error) {
    console.error('Erreur modification avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'avis'
    });
  }
};

// Fonction utilitaire pour mettre à jour la note moyenne d'un produit
async function updateProductRating(productId) {
  try {
    const reviews = await Review.findAll({
      where: { productId, isApproved: true }
    });

    if (reviews.length === 0) {
      await Product.update(
        { rating: 0 },
        { where: { id: productId } }
      );
      return;
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await Product.update(
      { rating: parseFloat(averageRating.toFixed(1)) },
      { where: { id: productId } }
    );
  } catch (error) {
    console.error('Erreur mise à jour rating produit:', error);
  }
}

// Obtenir les avis d'un utilisateur
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.findAll({
      where: { userId },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'img']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Erreur récupération avis utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis'
    });
  }
};