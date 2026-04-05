// ============================================================
// middleware/auth.js — Vérification de l'authentification
// ============================================================

/**
 * Middleware qui bloque l'accès aux routes protégées
 * si l'utilisateur n'est pas connecté.
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Non authentifié. Veuillez vous connecter.' });
    }
    next();
}

module.exports = { requireAuth };
