// ============================================================
// routes/auth.js — Routes d'authentification (API REST)
// ============================================================
const express  = require('express');
const bcrypt   = require('bcrypt');
const { db }   = require('../database');
const router   = express.Router();

const SALT_ROUNDS = 10;

// ----------------------------------------------------------
// POST /api/auth/register — Inscription d'un nouvel utilisateur
// ----------------------------------------------------------
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation des champs
        if (!username || !password) {
            return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis.' });
        }
        if (username.length < 3 || username.length > 50) {
            return res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
        }

        // Hashage du mot de passe avec bcrypt
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Insertion en base
        await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );

        res.status(201).json({ message: 'Compte créé avec succès.' });

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ce nom d\'utilisateur est déjà pris.' });
        }
        console.error('Erreur inscription :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// POST /api/auth/login — Connexion
// ----------------------------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Champs requis.' });
        }

        // Recherche de l'utilisateur
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants incorrects.' });
        }

        const user = rows[0];

        // Comparaison du mot de passe hashé
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Identifiants incorrects.' });
        }

        // Création de la session
        req.session.userId   = user.id;
        req.session.username = user.username;

        res.json({
            message: 'Connexion réussie.',
            user: { id: user.id, username: user.username }
        });

    } catch (err) {
        console.error('Erreur connexion :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// POST /api/auth/logout — Déconnexion
// ----------------------------------------------------------
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la déconnexion.' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Déconnecté.' });
    });
});

// ----------------------------------------------------------
// GET /api/auth/me — Utilisateur courant (session)
// ----------------------------------------------------------
router.get('/me', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({
            authenticated: true,
            user: { id: req.session.userId, username: req.session.username }
        });
    } else {
        res.json({ authenticated: false, user: null });
    }
});

module.exports = router;
