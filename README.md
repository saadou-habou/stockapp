# 📦 StockApp — Application de Gestion de Stock

Application web complète de gestion de stock avec API REST sécurisée, authentification JWT et interface React.

---

## 🚀 Démarrage Rapide

```bash
# 1. Cloner et configurer
git clone https://github.com/saadou-habou/stockapp.git
cd stockapp
cp .env.example backend/.env
# Éditer backend/.env avec vos paramètres PostgreSQL

# 2. Base de données
psql -U postgres -c "CREATE DATABASE stockapp;"
psql -U postgres -d stockapp -f database/schema.sql
psql -U postgres -d stockapp -f database/migration_orders.sql
psql -U postgres -d stockapp -f database/migration_suppliers.sql

# 3. Backend
cd backend && npm install && npm run db:seed && npm run dev

# 4. Frontend (nouveau terminal)
cd frontend && npm install && npm run dev
```

**Accès :** http://localhost:5173

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@stockapp.com | Admin@1234 |
| Client | client@stockapp.com | Client@1234 |

---

## 🏗️ Architecture

```
stockapp/
├── backend/          # API REST Node.js/Express
├── frontend/         # Interface React + Vite
├── database/         # Schema PostgreSQL
│   └── schema.sql
|   └── migration_orders.sql
|   └── migration_suppliers.sql
├── docs/             # Documentation complète
│   ├── cahier_de_charge.md
│   ├── cahier_de_conception.md
│   ├── guide_installation.md
│   └── brouillon_contrat.md
└── .env.example
```

---

## 🔑 Fonctionnalités

### Rôle Admin
- ✅ Tableau de bord avec KPIs en temps réel
- ✅ CRUD complet sur les produits
- ✅ Enregistrement d'entrées de stock (avec fournisseur, prix, référence)
- ✅ Enregistrement de sorties de stock (avec vérification stock disponible)
- ✅ Historique complet des mouvements
- ✅ Valider ou refuser une commande
- ✅ Alertes produits en stock bas

### Rôle Client
- ✅ Consultation du catalogue produits
- ✅ Recherche et filtrage (nom, SKU, catégorie)
- ✅ Faire une commande
- ✅ Visualisation des stocks disponibles

---

## 🛡️ Sécurité

- **JWT** : Tokens signés HS256, expiration 24h
- **bcrypt** : Hashage mots de passe (12 rounds)
- **Helmet** : Headers HTTP sécurisés
- **Rate Limiting** : Protection anti-bruteforce
- **Transactions PostgreSQL** : Cohérence des données de stock
- **Validation** : Toutes les entrées validées côté serveur

---

## 📡 API Endpoints

```
POST   /api/auth/login            # Connexion
POST   /api/auth/register         # Inscription
GET    /api/auth/me               # Profil courant

GET    /api/products              # Liste produits [?search=&category=&low_stock=]
POST   /api/products              # Créer produit (admin)
PUT    /api/products/:id          # Modifier produit (admin)
DELETE /api/products/:id          # Archiver produit (admin)

GET    /api/stock/dashboard       # KPIs (admin)
GET    /api/stock/entries         # Historique entrées (admin)
POST   /api/stock/entries         # Nouvelle entrée (admin)
GET    /api/stock/exits           # Historique sorties (admin)
POST   /api/stock/exits           # Nouvelle sortie (admin)
GET    /api/stock/history/:id     # Historique produit (admin)
```

---

## 🗄️ Base de Données

| Table | Description |
|-------|-------------|
| `roles` | Rôles disponibles (admin, client) |
| `users` | Utilisateurs avec hash bcrypt |
| `products` | Catalogue produits avec stock |
| `stock_entries` | Historique des entrées |
| `stock_exits` | Historique des sorties |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Cahier des charges](docs/cahier_de_charge.md) | Besoins fonctionnels et non fonctionnels |
| [Cahier de conception](docs/cahier_de_conception.md) | Architecture, BDD, API, sécurité |
| [Guide d'installation](docs/guide_installation.md) | Installation, déploiement, maintenance |
| [Brouillon contrat](docs/brouillon_contrat.md) | Modèle de contrat de prestation |

---

## ⚙️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js 18 + Express 4 |
| Base de données | PostgreSQL 14+ |
| Auth | JWT + bcrypt |
| Frontend | React 18 + Vite |
| Sécurité | Helmet, CORS, Rate Limit |
| HTTP Client | Axios |

---

## 📄 Licence

MIT — Voir LICENSE pour plus de détails.
