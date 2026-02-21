# Guide d'Installation — StockApp
**Version** : 1.0 | **Dernière mise à jour** : Février 2026

---

## Prérequis

| Outil | Version minimale | Vérification |
|-------|-----------------|--------------|
| Node.js | 18.x LTS | `node --version` |
| npm | 9.x | `npm --version` |
| PostgreSQL | 14.x | `psql --version` |
| Git | 2.x | `git --version` |

---

## 1. Cloner le Projet

```bash
git clone https://github.com/votre-org/stockapp.git
cd stockapp
```

---

## 2. Configuration de la Base de Données

### 2.1 Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql :
CREATE DATABASE stockapp;
CREATE USER stockapp_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE stockapp TO stockapp_user;
\q
```

### 2.2 Exécuter le schéma SQL

```bash
psql -U stockapp_user -d stockapp -f database/schema.sql
```

Vérification :
```bash
psql -U stockapp_user -d stockapp -c "\dt"
# Doit afficher : users, roles, products, stock_entries, stock_exits
```

---

## 3. Configuration Backend

### 3.1 Variables d'environnement

```bash
cd backend
cp ../.env.example .env
```

Éditer `.env` :
```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=stockapp
DB_USER=stockapp_user
DB_PASSWORD=votre_mot_de_passe_securise

# Générer avec : node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=REMPLACER_PAR_UNE_VALEUR_ALEATOIRE_64_CHARS_MINIMUM
JWT_EXPIRES_IN=24h

BCRYPT_ROUNDS=12
```

### 3.2 Installation des dépendances

```bash
cd backend
npm install
```

### 3.3 Seed (données initiales)

```bash
npm run db:seed
```

Comptes créés :
- **Admin** : `admin@stockapp.com` / `Admin@1234`
- **Client** : `client@stockapp.com` / `Client@1234`

> ⚠️ Changez ces mots de passe immédiatement en production !

### 3.4 Démarrer le backend

```bash
# Développement (rechargement automatique)
npm run dev

# Production
npm start
```

Le backend écoute sur `http://localhost:3000`

---

## 4. Configuration Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend est accessible sur `http://localhost:5173`

---

## 5. Vérification de l'Installation

### Test de santé de l'API :
```bash
curl http://localhost:3000/health
# Attendu: {"status":"OK","timestamp":"...","env":"development"}
```

### Test de connexion :
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stockapp.com","password":"Admin@1234"}'
```

---

## 6. Déploiement en Production

### 6.1 Variables d'environnement production

```env
NODE_ENV=production
FRONTEND_URL=https://votre-domaine.com
JWT_SECRET=valeur_generee_aleatoire_tres_longue
BCRYPT_ROUNDS=12
```

### 6.2 Build du frontend

```bash
cd frontend
npm run build
# Les fichiers statiques sont générés dans dist/
```

### 6.3 Avec PM2 (recommandé)

```bash
npm install -g pm2

# Démarrer le backend
cd backend
pm2 start src/server.js --name stockapp-api

# Sauvegarder la config PM2
pm2 save
pm2 startup
```

### 6.4 Configuration Nginx (reverse proxy)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend (fichiers statiques)
    location / {
        root /var/www/stockapp/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.5 Avec Docker (optionnel)

Créer un `docker-compose.yml` à la racine :

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: stockapp
      POSTGRES_USER: stockapp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres

volumes:
  pgdata:
```

```bash
docker-compose up -d
cd backend && npm run db:seed
```

---

## 7. Maintenance

### Backup de la base de données

```bash
# Sauvegarde complète
pg_dump -U stockapp_user stockapp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restauration
psql -U stockapp_user stockapp < backup_20260201_120000.sql
```

### Mise à jour des dépendances

```bash
cd backend && npm update
cd frontend && npm update
```

### Journaux (logs)

```bash
# Avec PM2
pm2 logs stockapp-api

# Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 8. Résolution des Problèmes Courants

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| `ECONNREFUSED 5432` | PostgreSQL non démarré | `sudo service postgresql start` |
| `JWT malformed` | Mauvais JWT_SECRET | Vérifier `.env`, redémarrer le backend |
| `CORS Error` | FRONTEND_URL mal configuré | Vérifier `.env` backend |
| `Port 3000 already in use` | Port occupé | `lsof -ti:3000 | xargs kill` |
| `relation "users" does not exist` | Schéma non appliqué | Re-exécuter `database/schema.sql` |

---

*Guide d'installation StockApp v1.0*
