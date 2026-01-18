# 🛒 E-Commerce Backend API

API RESTful développée avec Node.js et Express pour une plateforme e-commerce complète.

## 🚀 Fonctionnalités

- **🔐 Authentification & Autorisation**
  - Inscription et connexion sécurisées
  - JWT (JSON Web Tokens)
  - Gestion des rôles (Admin/Utilisateur)

- **📦 Gestion des Produits**
  - CRUD complet des produits
  - Upload d'images
  - Catégories et filtres
  - Gestion des stocks

- **🛍️ Panier d'Achat**
  - Ajout/Suppression d'articles
  - Mise à jour des quantités
  - Calcul automatique du total

- **💳 Paiement Stripe**
  - Intégration complète de Stripe
  - Paiements sécurisés
  - Gestion des transactions

- **📋 Gestion des Commandes**
  - Historique des commandes
  - Suivi des statuts
  - Gestion admin des commandes

- **⭐ Système d'Avis**
  - Avis et notes sur les produits
  - Moyenne des évaluations
  - Modération des commentaires

- **📊 Dashboard & Statistiques**
  - Statistiques de ventes
  - Analyse des revenus
  - Gestion des utilisateurs

## 🛠️ Technologies Utilisées

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de données
- **JWT** - Authentification
- **Stripe** - Paiements en ligne
- **Multer** - Upload de fichiers

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v8 ou supérieur)
- Compte Stripe

## ⚙️ Installation

1. Clonez le repository :
```bash
git clone https://github.com/sendadenguir/ecommerce-backend.git
cd ecommerce-backend
```

2. Installez les dépendances :
```bash
npm install
```

3. Configurez les variables d'environnement :
```bash
# Créez un fichier .env à la racine du projet
# Copiez le contenu de .env.example et remplissez vos valeurs
```

4. Créez la base de données MySQL et importez le schéma

5. Démarrez le serveur :
```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 🔑 Variables d'Environnement

Voir le fichier `.env.example` pour la liste complète des variables nécessaires.

## 📚 Documentation API

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit (Admin)
- `PUT /api/products/:id` - Modifier un produit (Admin)
- `DELETE /api/products/:id` - Supprimer un produit (Admin)

### Commandes
- `GET /api/orders` - Liste des commandes
- `POST /api/orders` - Créer une commande
- `GET /api/orders/:id` - Détails d'une commande

### Paiements
- `POST /api/payment/create-payment-intent` - Créer une intention de paiement Stripe

### Avis
- `GET /api/reviews/:productId` - Avis d'un produit
- `POST /api/reviews` - Ajouter un avis

## 👤 Auteur

**Senda Denguir**
- GitHub: [@sendadenguir](https://github.com/sendadenguir)

## 📄 Licence

Ce projet est sous licence MIT.