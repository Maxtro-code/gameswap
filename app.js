require('dotenv').config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require('./database');
const session = require('express-session');

const app = express();
const saltRounds = 10;

// --- MIDDLEWARES ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: process.env.SESSION_SECRET || 'cle_secrete',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

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

// --- ROUTES ---

app.get("/", async (req, res) => {
    const [rows] = await db.query(`
        SELECT games.id, games.title, games.platform, users.username 
        FROM games 
        JOIN users ON games.owner_id = users.id
    `);

    let htmlJeux = "<h2>🎮 Jeux disponibles pour échange :</h2><ul>";
    rows.forEach(jeu => {
        htmlJeux += `<li>
            <span><strong>${jeu.title}</strong> (${jeu.platform}) - Proposé par : <em>${jeu.username}</em></span>`;
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

    let content = "";
    if (req.session.username) {
        content = `
            <h1>Bienvenue ${req.session.username} !</h1>
            <nav>
                <a href="/add-game">➕ Ajouter un jeu</a> | 
                <a href="/logout">🚪 Se déconnecter</a>
            </nav>
            <hr>${htmlJeux}
        `;
    } else {
        content = `
            <h1>Bienvenue sur GameSwap 🎮</h1>
            <nav>
                <a href="/login">Connexion</a> | 
                <a href="/register">Inscription</a>
            </nav>
            <hr>${htmlJeux}
        `;
    }
    res.send(headerHTML + content + "</body></html>");
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await db.query(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword]);
        res.send(headerHTML + "Compte créé ! <a href='/login'>Se connecter ici</a></body></html>");
    } catch (err) {
        res.send(headerHTML + "Erreur : Ce nom d'utilisateur existe déjà. <a href='/register'>Retour</a></body></html>");
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await db.query(`SELECT * FROM users WHERE username = ?`, [username]);
    const user = rows[0];

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

app.get("/add-game", (req, res) => {
    if (!req.session.userId) {
        return res.send(headerHTML + "Tu dois être connecté. <a href='/login'>Connexion</a></body></html>");
    }
    res.sendFile(path.join(__dirname, "views", "add-game.html"));
});

app.post("/add-game", async (req, res) => {
    if (!req.session.userId) return res.status(401).send("Non autorisé");
    const { title, platform } = req.body;
    await db.query(`INSERT INTO games (title, platform, owner_id) VALUES (?, ?, ?)`, [title, platform, req.session.userId]);
    res.redirect('/');
});

app.post("/request-exchange", async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    const { game_id } = req.body;
    await db.query(`INSERT INTO exchanges (game_id, requester_id) VALUES (?, ?)`, [game_id, req.session.userId]);
    res.send(headerHTML + "Demande envoyée ! <a href='/'>Retour</a></body></html>");
});
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

// Route de recherche RAWG
app.get("/api/search-games", async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    try {
        const response = await fetch(
            `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=6`
        );
        const data = await response.json();

        // On filtre uniquement ce dont on a besoin
        const games = data.results.map(game => ({
            id: game.id,
            name: game.name,
            image: game.background_image,
            platforms: game.platforms
                ? game.platforms.map(p => p.platform.name).join(', ')
                : 'Non renseigné',
            rating: game.rating,
            released: game.released,
        }));

        res.json(games);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la recherche' });
    }
});

app.post("/add-game", async (req, res) => {
    if (!req.session.userId) return res.status(401).send("Non autorisé");
    const { title, platform, image } = req.body;
    await db.query(
        `INSERT INTO games (title, platform, image, owner_id) VALUES (?, ?, ?, ?)`,
        [title, platform, image, req.session.userId]
    );
    res.redirect('/');
});

// --- LANCEMENT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur GameSwap prêt : http://localhost:${PORT}`);
});