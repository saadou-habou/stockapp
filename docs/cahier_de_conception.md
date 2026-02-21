# Cahier de Conception — StockApp
**Version** : 1.0  
**Date** : Février 2026

---

## 1. Architecture Générale

### 1.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT (Navigateur)                   │
│              React 18 + Vite (port 5173)                │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/HTTPS (JSON REST API)
                      │
┌─────────────────────▼──────────────────────────────────┐
│                  BACKEND (Node.js)                     │
│              Express.js (port 3000)                    │
│   ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│   │   Routes    │  │ Controllers │  │  Middleware  │   │
│   │  /auth      │  │  auth       │  │  JWT auth    │   │
│   │  /products  │  │  products   │  │  Role check  │   │
│   │  /stock     │  │  stock      │  │  Validation  │   │
│   └─────────────┘  └─────────────┘  └──────────────┘   │
└─────────────────────┬──────────────────────────────────┘
                      │ pg (node-postgres)
                      │
┌─────────────────────▼───────────────────────────────────┐
│               BASE DE DONNÉES                           │
│               PostgreSQL 14+                            │
│   users │ roles │ products │ stock_entries │ stock_exits│
└─────────────────────────────────────────────────────────┘
```

### 1.2 Principes d'Architecture
- **Séparation des responsabilités** : Routes (routing) → Controllers (logique métier) → DB (persistance)
- **Stateless** : Aucune session serveur, tout est dans le JWT
- **Transactions PostgreSQL** : Les mouvements de stock utilisent `BEGIN/COMMIT/ROLLBACK`
- **Soft delete** : Les produits sont archivés (`is_active=FALSE`), jamais supprimés

---

## 2. Modèle de Données

### 2.1 Diagramme Entité-Relation

```
roles (1) ─────────────── (N) users
              role_id FK

users (1) ───────────────── (N) products (created_by)
users (1) ───────────────── (N) stock_entries (created_by)
users (1) ───────────────── (N) stock_exits (created_by)

products (1) ──────────── (N) stock_entries (product_id)
products (1) ──────────── (N) stock_exits (product_id)
```

### 2.2 Description des Tables

#### Table `roles`
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL PK | Identifiant auto-incrémenté |
| name | VARCHAR(50) UNIQUE | 'admin' ou 'client' |
| description | TEXT | Description du rôle |
| created_at | TIMESTAMP | Date de création |

#### Table `users`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | Identifiant unique (uuid_generate_v4) |
| email | VARCHAR(255) UNIQUE | Email de connexion |
| password_hash | VARCHAR(255) | Hash bcrypt du mot de passe |
| first_name | VARCHAR(100) | Prénom |
| last_name | VARCHAR(100) | Nom de famille |
| role_id | INTEGER FK → roles.id | Rôle de l'utilisateur |
| is_active | BOOLEAN | Compte actif ou désactivé |
| last_login | TIMESTAMP | Dernière connexion |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Mise à jour automatique (trigger) |

#### Table `products`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | Identifiant unique |
| name | VARCHAR(255) | Nom du produit |
| description | TEXT | Description détaillée |
| sku | VARCHAR(100) UNIQUE | Code produit unique |
| price | DECIMAL(12,2) | Prix unitaire ≥ 0 |
| quantity | INTEGER | Stock actuel ≥ 0 |
| min_quantity | INTEGER | Seuil d'alerte ≥ 0 |
| category | VARCHAR(100) | Catégorie |
| unit | VARCHAR(50) | Unité de mesure |
| is_active | BOOLEAN | Produit archivé ou actif |
| created_by | UUID FK → users.id | Créateur |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Mise à jour automatique |

#### Table `stock_entries`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | Identifiant unique |
| product_id | UUID FK → products.id | Produit concerné |
| quantity | INTEGER CHECK > 0 | Quantité reçue |
| unit_price | DECIMAL(12,2) | Prix d'achat unitaire |
| reason | VARCHAR(255) | Motif de l'entrée |
| supplier | VARCHAR(255) | Nom du fournisseur |
| reference_doc | VARCHAR(100) | Référence bon de livraison |
| quantity_before | INTEGER | Stock avant l'opération |
| quantity_after | INTEGER | Stock après l'opération |
| created_by | UUID FK → users.id | Utilisateur ayant enregistré |
| created_at | TIMESTAMP | Horodatage de l'opération |

#### Table `stock_exits`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID PK | Identifiant unique |
| product_id | UUID FK → products.id | Produit concerné |
| quantity | INTEGER CHECK > 0 | Quantité sortie |
| reason | VARCHAR(255) | Motif de la sortie |
| client_name | VARCHAR(255) | Nom du client |
| reference_doc | VARCHAR(100) | Référence document |
| quantity_before | INTEGER | Stock avant l'opération |
| quantity_after | INTEGER | Stock après l'opération |
| created_by | UUID FK → users.id | Utilisateur ayant enregistré |
| created_at | TIMESTAMP | Horodatage de l'opération |

---

## 3. API REST

### 3.1 Authentification

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/auth/login` | Non | Connexion |
| POST | `/api/auth/register` | Non | Création de compte |
| GET | `/api/auth/me` | JWT | Profil courant |
| PUT | `/api/auth/change-password` | JWT | Changement de mot de passe |

### 3.2 Produits

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/products` | JWT | Liste paginée (client + admin) |
| GET | `/api/products/categories` | JWT | Liste des catégories |
| GET | `/api/products/:id` | JWT | Détail d'un produit |
| POST | `/api/products` | Admin | Créer un produit |
| PUT | `/api/products/:id` | Admin | Modifier un produit |
| DELETE | `/api/products/:id` | Admin | Archiver un produit |

**Paramètres de requête pour GET /api/products :**
- `page` (défaut: 1)
- `limit` (défaut: 20)
- `search` (nom, SKU, description)
- `category`
- `low_stock` (true/false)

### 3.3 Stock

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| GET | `/api/stock/dashboard` | Admin | Indicateurs du tableau de bord |
| GET | `/api/stock/entries` | Admin | Historique des entrées |
| POST | `/api/stock/entries` | Admin | Enregistrer une entrée |
| GET | `/api/stock/exits` | Admin | Historique des sorties |
| POST | `/api/stock/exits` | Admin | Enregistrer une sortie |
| GET | `/api/stock/history/:id` | Admin | Historique d'un produit |

---

## 4. Sécurité

### 4.1 Authentification JWT
- Token signé avec `HS256` et `JWT_SECRET`
- Expiration : 24 heures
- Payload : `{ userId, role }`
- Transmission : Header `Authorization: Bearer <token>`

### 4.2 Hashage des Mots de Passe
- Algorithme : bcrypt avec 12 tours de salage
- Résistant aux attaques par dictionnaire et force brute
- Jamais stocké en clair ou reversible

### 4.3 Protection des Routes
- Middleware `authenticate` : vérifie le JWT et charge l'utilisateur
- Middleware `requireAdmin` : bloque les non-admins avec 403
- Validation des entrées : `express-validator` sur tous les endpoints

### 4.4 Protections HTTP
- **Helmet.js** : Headers de sécurité (CSP, HSTS, X-Frame-Options…)
- **CORS** : Origine autorisée configurée via `FRONTEND_URL`
- **Rate Limiting** : 100 req/15min en général, 10 req/15min sur `/auth`
- **Taille payload** : Limitée à 10KB (`express.json({ limit: '10kb' })`)

### 4.5 Intégrité des Données
- Transactions PostgreSQL `BEGIN/COMMIT/ROLLBACK` pour les mouvements de stock
- Verrous `SELECT ... FOR UPDATE` pour éviter les races conditions
- Trigger PostgreSQL vérifiant le stock avant sortie
- Contraintes `CHECK` sur les colonnes quantité et prix

---

## 5. Structure du Projet

```
stockapp/
├── .env.example
├── README.md
├── database/
│   └── schema.sql              # Schéma PostgreSQL complet
├── backend/
│   ├── package.json
│   └── src/
│       ├── server.js           # Point d'entrée Express
│       ├── config/
│       │   ├── db.js           # Pool PostgreSQL
│       │   └── seed.js         # Données initiales
│       ├── middleware/
│       │   └── auth.js         # JWT + role check
│       ├── controllers/
│       │   ├── authController.js
|       |   ├── orderController.js
│       │   ├── productController.js
│       │   └── stockController.js
│       └── routes/
│           ├── authRoutes.js
|           ├── orderRoute.js
│           ├── productRoutes.js
│           └── stockRoutes.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # Router + Layout
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── services/
│       │   └── api.js          # Axios + interceptors
│       └── pages/
|           ├── AdminOrders.jsx
|           ├── MyOrders.jsx
|           ├── Register.jsx
│           ├── LoginPage.jsx
│           ├── DashboardPage.jsx
│           ├── ProductsPage.jsx
│           └── StockPage.jsx
└── docs/
    ├── cahier_de_charge.md
    ├── cahier_de_conception.md
    ├── guide_installation.md
    └── brouillon_contrat.md
```

---

## 6. Flux de Données Critiques

### 6.1 Flux d'authentification
```
Client → POST /api/auth/login { email, password }
       → Validation express-validator
       → SELECT user + role FROM users JOIN roles
       → bcrypt.compare(password, hash)
       → jwt.sign({ userId, role })
       → 200 { token, user }
Client → Stockage localStorage
Client → Chaque requête : Header Authorization: Bearer <token>
```

### 6.2 Flux de sortie de stock
```
Admin → POST /api/stock/exits { product_id, quantity }
      → Validation (quantity > 0, product_id UUID valide)
      → BEGIN TRANSACTION
      → SELECT quantity FROM products FOR UPDATE  ← verrou
      → Vérification: quantity_disponible >= quantity_demandée
      → INSERT INTO stock_exits (quantity_before, quantity_after)
      → Trigger: UPDATE products SET quantity = quantity - N
      → COMMIT
      → 201 { message, data }
```

---

*Document technique interne — StockApp v1.0*
