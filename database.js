const sqlite3 = require('sqlite3').verbose();

// Connexion à la base (crée le fichier s'il n'existe pas)
const db = new sqlite3.Database('./gameswap.db', (err) => {
    if (err) console.error("Erreur de connexion :", err.message);
    else console.log("Connecté à la base de données SQLite.");
});

// Création de la table 'users'
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
});

// Création de la table 'games'
db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    platform TEXT,
    owner_id INTEGER,
    FOREIGN KEY(owner_id) REFERENCES users(id)
)`);

// Création de la table 'exchanges'
db.run(`CREATE TABLE IF NOT EXISTS exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,       -- Le jeu demandé
    requester_id INTEGER,  -- Celui qui veut le jeu
    status TEXT DEFAULT 'en_attente', -- 'en_attente', 'accepte', 'refuse'
    FOREIGN KEY(game_id) REFERENCES games(id),
    FOREIGN KEY(requester_id) REFERENCES users(id)
)`);


module.exports = db;