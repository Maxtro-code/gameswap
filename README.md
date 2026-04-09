# 🎮 GameSwap

Plateforme web d'échange de jeux vidéo entre particuliers, développée dans le cadre du BTS SIO SLAM — Session 2026.

Les utilisateurs peuvent mettre leurs jeux en ligne, consulter le catalogue des autres, et proposer des échanges.

---

## ✨ Fonctionnalités

- Inscription et connexion sécurisée (mots de passe hachés avec bcrypt)
- Recherche de jeux en temps réel via l'API RAWG.io (photo, plateforme, note automatiques)
- Ajout de jeux à sa collection personnelle
- Consultation du catalogue complet des jeux disponibles
- Envoi de demandes d'échange avec message personnalisé
- Acceptation ou refus des demandes reçues
- Suivi de l'état de ses demandes envoyées

---

## 🛠️ Stack technique

| Élément | Technologie |
|---|---|
| Backend | Node.js + Express.js (API REST) |
| Frontend | Vue.js 3 (Composition API) + Vue Router 4 |
| Style | Bulma CSS |
| Build | Vite 5 |
| Base de données | MySQL 8 |
| Authentification | express-session + bcrypt |
| API externe | RAWG.io |
| Gestion de versions | Git + GitHub |

---

## ⚙️ Installation

### Prérequis

- Node.js 20+
- npm
- MySQL 8
- Laragon (recommandé sur Windows)
- Une clé API RAWG.io gratuite sur [rawg.io/apidocs](https://rawg.io/apidocs)

### Étapes

**1. Cloner le dépôt**
```bash
git clone https://github.com/Maxtro-code/gameswap.git
cd gameswap
```

**2. Installer toutes les dépendances**
```bash
npm run setup
```

Cette commande installe les dépendances du backend et du frontend en une seule fois.

**3. Configurer l'environnement**
```bash
cp .env.example .env
```

Puis éditer `.env` :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=gameswap
SESSION_SECRET=une_chaine_secrete_longue
RAWG_API_KEY=ta_cle_api_rawg
PORT=3000
```

**4. Créer la base de données**

Ouvrir phpMyAdmin (ou MySQL) et créer une base nommée `gameswap`.

Les tables sont créées automatiquement au premier lancement.

**5. Lancer le projet**
```bash
npm start
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000)

> En développement, tu peux lancer le backend et le frontend séparément :
> ```bash
> npm run dev:back    # backend avec rechargement automatique
> npm run dev:front   # frontend Vite sur http://localhost:5173
> ```

---

## 📁 Structure du projet

```
gameswap/
├── backend/
│   ├── app.js              # Point d'entrée du serveur Express
│   ├── database.js         # Connexion MySQL + création des tables
│   ├── middleware/
│   │   └── auth.js         # Middleware requireAuth (routes privées)
│   └── routes/
│       ├── auth.js         # POST /register, POST /login, POST /logout, GET /me
│       ├── games.js        # GET / POST /games, DELETE /games/:id, GET /search
│       └── exchanges.js    # POST / GET /exchanges, PATCH /exchanges/:id
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── HomeView.vue        # Catalogue des jeux
│   │   │   ├── LoginView.vue       # Connexion
│   │   │   ├── RegisterView.vue    # Inscription
│   │   │   ├── AddGameView.vue     # Ajouter un jeu
│   │   │   ├── MyGamesView.vue     # Ma collection
│   │   │   └── ExchangesView.vue   # Mes échanges
│   │   ├── components/
│   │   │   ├── GameCard.vue        # Carte d'un jeu
│   │   │   └── LoadingSpinner.vue  # Indicateur de chargement
│   │   └── router/
│   │       └── index.js            # Routes + navigation guards
│   └── package.json
└── package.json
```

---

## 🔒 Sécurité

- Mots de passe hachés avec **bcrypt** (10 rounds)
- Sessions gérées côté serveur avec **express-session** (cookie httpOnly, 24h)
- Middleware **requireAuth** sur toutes les routes privées
- **Navigation guards** Vue Router (vérification session avant chaque page privée)
- Requêtes SQL avec **paramètres préparés** (protection injection SQL)
- Clé API RAWG stockée en **variable d'environnement** (jamais exposée côté client)
- Contrôle métier : impossible de demander l'échange de son propre jeu

---

## 🗄️ Modèle de données

```sql
users       (id, username, password, created_at)
games       (id, title, platform, image, rating, released, owner_id, created_at)
exchanges   (id, game_id, requester_id, status, message, created_at)
```

- `status` : `en_attente` | `accepte` | `refuse`
- Clés étrangères avec `ON DELETE CASCADE`
- Une seule demande en attente par couple (utilisateur + jeu)

---

## 👤 Auteur

**COCO Mathis** — BTS SIO SLAM, ENC Bessières — Session 2026
