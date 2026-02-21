# Cahier des Charges — StockApp
**Version** : 1.0  
**Date** : Février 2026  
**Statut** : Validé

---

## 1. Présentation du Projet

### 1.1 Contexte
StockApp est une application web de gestion de stock destinée aux entreprises souhaitant moderniser leur suivi d'inventaire. Elle remplace les tableurs Excel par une solution centralisée, sécurisée et multi-utilisateurs accessible depuis n'importe quel navigateur.

### 1.2 Objectifs
- Centraliser la gestion des produits et du stock
- Tracer tous les mouvements d'entrée et de sortie
- Contrôler les accès par rôle (Admin / Client)
- Alerter sur les niveaux de stock critiques
- Fournir un tableau de bord en temps réel

### 1.3 Périmètre
Le projet couvre la gestion d'un entrepôt unique. La gestion multi-sites, la comptabilité et les fournisseurs sont hors périmètre pour la version 1.0.

---

## 2. Acteurs et Rôles

### 2.1 Administrateur
L'administrateur est le gestionnaire principal du stock. Il dispose de toutes les fonctionnalités :
- Créer, modifier, archiver des produits
- Enregistrer des entrées de stock (réceptions fournisseur)
- Enregistrer des sorties de stock (livraisons client)
- Consulter l'historique complet des mouvements
- Accéder au tableau de bord avec les indicateurs clés
- Gérer les comptes utilisateurs

### 2.2 Client
Le client dispose d'un accès en lecture seule au catalogue produit :
- Consulter la liste des produits disponibles
- Voir les prix, descriptions et quantités en stock
- Rechercher et filtrer les produits

---

## 3. Besoins Fonctionnels

### 3.1 Authentification et Sécurité
- **BF-01** : Connexion par email et mot de passe
- **BF-02** : Déconnexion sécurisée
- **BF-03** : Sessions gérées par JWT avec expiration à 24h
- **BF-04** : Hashage des mots de passe avec bcrypt (12 tours minimum)
- **BF-05** : Restriction des routes selon le rôle de l'utilisateur
- **BF-06** : Blocage des tentatives de connexion répétées (rate limiting)

### 3.2 Gestion des Produits
- **BF-07** : Création d'un produit avec : nom, SKU, description, prix, catégorie, unité, quantité initiale, stock minimum
- **BF-08** : Modification des informations produit (hors quantité directe)
- **BF-09** : Archivage logique (soft delete) d'un produit
- **BF-10** : Recherche par nom, SKU, description
- **BF-11** : Filtrage par catégorie
- **BF-12** : Filtre des produits en stock bas

### 3.3 Mouvements de Stock
- **BF-13** : Enregistrement d'une entrée de stock avec : produit, quantité, prix unitaire, fournisseur, motif, référence document
- **BF-14** : Enregistrement d'une sortie de stock avec : produit, quantité, client, motif, référence document
- **BF-15** : Vérification automatique du stock disponible avant sortie
- **BF-16** : Mise à jour atomique de la quantité produit après chaque mouvement
- **BF-17** : Traçabilité : enregistrement automatique de l'utilisateur et de l'horodatage

### 3.4 Tableau de Bord
- **BF-18** : Nombre total de produits actifs
- **BF-19** : Total d'unités en stock
- **BF-20** : Valeur totale du stock
- **BF-21** : Liste des produits en rupture ou sous le seuil minimum
- **BF-22** : 5 dernières entrées et sorties

---

## 4. Besoins Non Fonctionnels

| Critère | Exigence |
|---------|----------|
| **Performance** | Réponse API < 500ms pour les requêtes courantes |
| **Disponibilité** | 99,5% uptime (hors maintenance) |
| **Sécurité** | HTTPS obligatoire en production, headers sécurisés (Helmet) |
| **Scalabilité** | Pool de connexions PostgreSQL, architecture stateless |
| **Maintenabilité** | Code structuré en couches (routes/controllers/config) |
| **Compatibilité** | Navigateurs modernes (Chrome, Firefox, Safari, Edge) |
| **Responsive** | Interface utilisable sur desktop et tablette |

---

## 5. Contraintes Techniques

- **Backend** : Node.js 18+ avec Express.js
- **Base de données** : PostgreSQL 14+
- **Frontend** : React 18 + Vite
- **Authentification** : JWT (jsonwebtoken) + bcrypt
- **Hébergement** : Compatible Docker, VPS Linux, ou PaaS (Railway, Render)
- **Langue** : Interface en français

---

## 6. Livrables Attendus

1. Code source complet (backend + frontend)
2. Script SQL de création de la base de données
3. Documentation technique (cahier de conception)
4. Guide d'installation et de déploiement
5. Données de test (seed)
6. Fichier `.env.example`

---

## 7. Planning Prévisionnel

| Phase | Durée | Description |
|-------|-------|-------------|
| Conception | 1 semaine | Architecture, base de données, maquettes |
| Développement Backend | 2 semaines | API REST, authentification, logique métier |
| Développement Frontend | 2 semaines | Interfaces, intégration API |
| Tests | 1 semaine | Tests fonctionnels, sécurité, performance |
| Déploiement | 3 jours | Mise en production, documentation |

---

*Document approuvé — StockApp v1.0*
