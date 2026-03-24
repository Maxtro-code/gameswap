const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt"); // Pour le hash du mot de passe (RGPD/DICP)
const db = require('./database'); // Ta base SQLite (Le coffre-fort)
const session = require('express-session'); // Pour que le serveur se rappelle de toi

const app = express();
const saltRounds = 10; // Puissance du hachage (sécurité)

// --- CONFIGURATION (MIDDLEWARES) ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Configuration de la session utilisateur
app.use(session({
    secret: 'cle_secrete_pour_gameswap',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Fonction utilitaire pour générer le début du HTML avec le CSS
const headerHTML = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="/css/style.css">
        <title>GameSwap 🎮</title>
    </head>
    <body>
`;

// ==========================================
// ROUTES DE NAVIGATION (Affichage des pages)
// ==========================================

// Accueil : Affiche la liste des jeux et un message si connecté
app.get("/", (req, res) => {
    // 1. On récupère les jeux et le nom du proprio via une JOINTURE SQL (Top pour le BTS)
    const query = `
        SELECT games.id, games.title, games.platform, users.username 
        FROM games 
        JOIN users ON games.owner_id = users.id`;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).send("Erreur lors de la récupération des jeux.");

        // On prépare la liste HTML pour les jeux
        let htmlJeux = "<h2>🎮 Jeux disponibles pour échange :</h2><ul>";
        rows.forEach(jeu => {
            htmlJeux += `<li>
                <span><strong>${jeu.title}</strong> (${jeu.platform}) - Proposé par : <em>${jeu.username}</em></span>`;

            // Si l'utilisateur est connecté ET que ce n'est pas son propre jeu, on affiche le bouton d'échange
            if (req.session.username && req.session.username !== jeu.username) {
                htmlJeux += `
                <form action="/request-exchange" method="POST" style="margin:0;">
                    <input type="hidden" name="game_id" value="${jeu.id}">
                    <button type="submit">Proposer un échange</button>
                </form>`;
            }
            htmlJeux += `</li>`;
        });
        if (rows.length === 0) htmlJeux += "<li>Aucun jeu pour le moment...</li>";
        htmlJeux += "</ul>";

        // 2. Affichage dynamique selon l'état de connexion
        let content = "";
        if (req.session.username) {
            content = `
                <h1>Bienvenue ${req.session.username} !</h1>
                <nav>
                    <a href="/add-game">➕ Ajouter un jeu</a> | 
                    <a href="/logout">🚪 Se déconnecter</a>
                </nav>
                <hr>
                ${htmlJeux}
            `;
        } else {
            content = `
                <h1>Bienvenue sur GameSwap 🎮</h1>
                <nav>
                    <a href="/login">Connexion</a> | 
                    <a href="/register">Inscription</a>
                </nav>
                <hr>
                ${htmlJeux}
            `;
        }
        res.send(headerHTML + content + "</body></html>");
    });
});

// Page Inscription
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

// Page de login
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Déconnexion
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ==========================================
// ROUTES LOGIQUES (Traitement des données)
// ==========================================

// Inscription avec HASH (Respect du RGPD et de la DICP)
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
        db.run(query, [username, hashedPassword], (err) => {
            if (err) return res.send(headerHTML + "Erreur : Ce nom d'utilisateur existe déjà. <a href='/register'>Retour</a></body></html>");
            res.send(headerHTML + "Compte créé ! <a href='/login'>Se connecter ici</a></body></html>");
        });
    } catch (error) {
        res.status(500).send("Erreur de hachage.");
    }
});

// Traitement du login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], async (err, user) => {
        if (err) return res.status(500).send("Erreur serveur.");
        if (!user) return res.send(headerHTML + "Utilisateur non trouvé. <a href='/login'>Retour</a></body></html>");

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.redirect('/');
        } else {
            res.send(headerHTML + "Mot de passe incorrect. <a href='/login'>Retour</a></body></html>");
        }
    });
});

// Afficher le formulaire d'ajout
app.get("/add-game", (req, res) => {
    if (!req.session.userId) {
        return res.send(headerHTML + "Tu dois être connecté. <a href='/login'>Connexion</a></body></html>");
    }
    res.sendFile(path.join(__dirname, "views", "add-game.html"));
});

// Enregistrer le jeu
app.post("/add-game", (req, res) => {
    if (!req.session.userId) return res.status(401).send("Non autorisé");
    const { title, platform } = req.body;
    const owner_id = req.session.userId;
    const query = `INSERT INTO games (title, platform, owner_id) VALUES (?, ?, ?)`;
    db.run(query, [title, platform, owner_id], (err) => {
        if (err) return res.send("Erreur lors de l'ajout.");
        res.redirect('/');
    });
});

// Gérer la demande d'échange
app.post("/request-exchange", (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const { game_id } = req.body;
    const requester_id = req.session.userId;

    const query = `INSERT INTO exchanges (game_id, requester_id) VALUES (?, ?)`;
    db.run(query, [game_id, requester_id], (err) => {
        if (err) return res.send("Erreur lors de la demande.");
        res.send(headerHTML + "Demande envoyée ! Le propriétaire va être informé. <a href='/'>Retour</a></body></html>");
    });
});

// --- LANCEMENT DU SERVEUR ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur GameSwap prêt : http://localhost:${PORT}`);
});