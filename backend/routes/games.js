// ============================================================
// routes/games.js — Routes CRUD pour les jeux (API REST)
// ============================================================
const express        = require('express');
const { db }         = require('../database');
const { requireAuth } = require('../middleware/auth');
const router         = express.Router();

// Import dynamique de node-fetch (module ESM)
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

// ----------------------------------------------------------
// GET /api/games — Liste de tous les jeux disponibles
// ----------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                games.id,
                games.title,
                games.platform,
                games.image,
                games.rating,
                games.released,
                games.created_at,
                users.username  AS owner_username,
                users.id        AS owner_id
            FROM games
            JOIN users ON games.owner_id = users.id
            ORDER BY games.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Erreur récupération jeux :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// GET /api/games/mine — Jeux de l'utilisateur connecté
// ----------------------------------------------------------
router.get('/mine', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM games WHERE owner_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erreur récupération mes jeux :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// POST /api/games — Ajouter un jeu à sa collection
// ----------------------------------------------------------
router.post('/', requireAuth, async (req, res) => {
    try {
        const { title, platform, image, rating, released } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Le titre est obligatoire.' });
        }

        const [result] = await db.query(
            'INSERT INTO games (title, platform, image, rating, released, owner_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title, platform || null, image || null, rating || null, released || null, req.session.userId]
        );

        res.status(201).json({
            message: 'Jeu ajouté.',
            gameId: result.insertId
        });
    } catch (err) {
        console.error('Erreur ajout jeu :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// DELETE /api/games/:id — Supprimer un de ses jeux
// ----------------------------------------------------------
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM games WHERE id = ? AND owner_id = ?',
            [req.params.id, req.session.userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Jeu non trouvé ou non autorisé.' });
        }

        await db.query('DELETE FROM games WHERE id = ?', [req.params.id]);
        res.json({ message: 'Jeu supprimé.' });
    } catch (err) {
        console.error('Erreur suppression jeu :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// GET /api/games/search?q=... — Recherche via l'API RAWG
// ----------------------------------------------------------
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        const apiKey = process.env.RAWG_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Clé API RAWG non configurée.' });
        }

        const response = await fetch(
            `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=6`
        );
        const data = await response.json();

        const games = (data.results || []).map(game => ({
            rawg_id:   game.id,
            name:      game.name,
            image:     game.background_image,
            platforms: game.platforms
                ? game.platforms.map(p => p.platform.name).join(', ')
                : 'Non renseigné',
            rating:    game.rating,
            released:  game.released
        }));

        res.json(games);
    } catch (err) {
        console.error('Erreur recherche RAWG :', err);
        res.status(500).json({ error: 'Erreur lors de la recherche.' });
    }
});

module.exports = router;
