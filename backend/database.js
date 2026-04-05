// ============================================================
// database.js — Connexion MySQL et initialisation des tables
// ============================================================
const mysql = require('mysql2');

// Création du pool de connexions (réutilisation automatique)
const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'gameswap',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
});

// Version Promise pour utiliser async/await
const db = pool.promise();

// ----------------------------------------------------------
// Initialisation du schéma (tables + colonnes manquantes)
// ----------------------------------------------------------
async function initDB() {
    // Table des utilisateurs
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            username   VARCHAR(50)  UNIQUE NOT NULL,
            password   VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Table des jeux
    await db.query(`
        CREATE TABLE IF NOT EXISTS games (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            title      VARCHAR(150) NOT NULL,
            platform   VARCHAR(100),
            image      VARCHAR(500),
            rating     DECIMAL(3,2),
            released   VARCHAR(20),
            owner_id   INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Table des demandes d'échange
    await db.query(`
        CREATE TABLE IF NOT EXISTS exchanges (
            id             INT AUTO_INCREMENT PRIMARY KEY,
            game_id        INT NOT NULL,
            requester_id   INT NOT NULL,
            status         ENUM('en_attente','accepte','refuse') DEFAULT 'en_attente',
            message        TEXT,
            created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (game_id)      REFERENCES games(id) ON DELETE CASCADE,
            FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Base de données initialisée avec succès.');
}

module.exports = { db, initDB };
