// ============================================================
// routes/exchanges.js — Routes pour les échanges (API REST)
// ============================================================
const express        = require('express');
const { db }         = require('../database');
const { requireAuth } = require('../middleware/auth');
const router         = express.Router();

// ----------------------------------------------------------
// POST /api/exchanges — Proposer un échange
// ----------------------------------------------------------
router.post('/', requireAuth, async (req, res) => {
    try {
        const { game_id, message } = req.body;

        if (!game_id) {
            return res.status(400).json({ error: 'ID du jeu requis.' });
        }

        // Vérifier que le jeu existe et n'appartient pas au demandeur
        const [games] = await db.query(
            'SELECT * FROM games WHERE id = ?',
            [game_id]
        );

        if (games.length === 0) {
            return res.status(404).json({ error: 'Jeu non trouvé.' });
        }

        if (games[0].owner_id === req.session.userId) {
            return res.status(400).json({ error: 'Vous ne pouvez pas demander un échange pour votre propre jeu.' });
        }

        // Vérifier qu'il n'y a pas déjà une demande en attente
        const [existing] = await db.query(
            'SELECT * FROM exchanges WHERE game_id = ? AND requester_id = ? AND status = "en_attente"',
            [game_id, req.session.userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Vous avez déjà une demande en attente pour ce jeu.' });
        }

        await db.query(
            'INSERT INTO exchanges (game_id, requester_id, message) VALUES (?, ?, ?)',
            [game_id, req.session.userId, message || null]
        );

        res.status(201).json({ message: 'Demande d\'échange envoyée.' });

    } catch (err) {
        console.error('Erreur demande échange :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// GET /api/exchanges/received — Demandes reçues (mes jeux)
// ----------------------------------------------------------
router.get('/received', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                exchanges.id,
                exchanges.status,
                exchanges.message,
                exchanges.created_at,
                games.title      AS game_title,
                games.image      AS game_image,
                games.platform   AS game_platform,
                users.username   AS requester_username
            FROM exchanges
            JOIN games ON exchanges.game_id = games.id
            JOIN users ON exchanges.requester_id = users.id
            WHERE games.owner_id = ?
            ORDER BY exchanges.created_at DESC
        `, [req.session.userId]);

        res.json(rows);
    } catch (err) {
        console.error('Erreur récupération échanges reçus :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// GET /api/exchanges/sent — Mes demandes envoyées
// ----------------------------------------------------------
router.get('/sent', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                exchanges.id,
                exchanges.status,
                exchanges.message,
                exchanges.created_at,
                games.title      AS game_title,
                games.image      AS game_image,
                games.platform   AS game_platform,
                users.username   AS owner_username
            FROM exchanges
            JOIN games ON exchanges.game_id = games.id
            JOIN users ON games.owner_id = users.id
            WHERE exchanges.requester_id = ?
            ORDER BY exchanges.created_at DESC
        `, [req.session.userId]);

        res.json(rows);
    } catch (err) {
        console.error('Erreur récupération échanges envoyés :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// PATCH /api/exchanges/:id — Accepter ou refuser un échange
// ----------------------------------------------------------
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['accepte', 'refuse'].includes(status)) {
            return res.status(400).json({ error: 'Statut invalide (accepte ou refuse).' });
        }

        // Vérifier que l'échange concerne bien un jeu de l'utilisateur
        const [rows] = await db.query(`
            SELECT exchanges.*, games.owner_id
            FROM exchanges
            JOIN games ON exchanges.game_id = games.id
            WHERE exchanges.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Échange non trouvé.' });
        }

        if (rows[0].owner_id !== req.session.userId) {
            return res.status(403).json({ error: 'Non autorisé.' });
        }

        if (rows[0].status !== 'en_attente') {
            return res.status(400).json({ error: 'Cet échange a déjà été traité.' });
        }

        await db.query(
            'UPDATE exchanges SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        res.json({ message: `Échange ${status}.` });

    } catch (err) {
        console.error('Erreur mise à jour échange :', err);
        res.status(500).json({ error: 'Erreur serveur.' });
    }
});

module.exports = router;
