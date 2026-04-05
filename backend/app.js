// ============================================================
// app.js — Point d'entrée du serveur Express (GameSwap v2)
// ============================================================
require('dotenv').config();

const express  = require('express');
const path     = require('path');
const session  = require('express-session');
const cors     = require('cors');
const { initDB } = require('./database');

// Import des routeurs
const authRoutes      = require('./routes/auth');
const gamesRoutes     = require('./routes/games');
const exchangesRoutes = require('./routes/exchanges');

const app = express();

// ----------------------------------------------------------
// MIDDLEWARES GLOBAUX
// ----------------------------------------------------------

// Parsing du corps des requêtes (JSON + formulaires)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS (utile si le front est servi séparément en dev)
app.use(cors({
    origin: true,
    credentials: true
}));

// Gestion des sessions (stockées côté serveur)
app.use(session({
    secret:            process.env.SESSION_SECRET || 'cle_secrete_par_defaut',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        secure:   false,          // true si HTTPS en production
        httpOnly: true,
        maxAge:   24 * 60 * 60 * 1000  // 24 heures
    }
}));

// ----------------------------------------------------------
// ROUTES API (préfixées /api)
// ----------------------------------------------------------
app.use('/api/auth',      authRoutes);
app.use('/api/games',     gamesRoutes);
app.use('/api/exchanges', exchangesRoutes);

// ----------------------------------------------------------
// FICHIERS STATIQUES (build Vite → backend/public)
// En production : npm run build dans /frontend génère dans /backend/public
// ----------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// Toutes les routes non-API renvoient index.html (SPA Vue Router)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----------------------------------------------------------
// LANCEMENT DU SERVEUR
// ----------------------------------------------------------
const PORT = process.env.PORT || 3000;

initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🎮 GameSwap v2 démarré sur http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Impossible de démarrer :', err);
        process.exit(1);
    });
