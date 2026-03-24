const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gameswap',
    waitForConnections: true,
});

// On récupère une version "promise" du pool pour pouvoir utiliser async/await
const dbPromise = db.promise();

// Création des tables au démarrage
async function initDB() {
    await dbPromise.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `);

    await dbPromise.query(`
        CREATE TABLE IF NOT EXISTS games (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            platform VARCHAR(50),
            owner_id INT,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    `);

    await dbPromise.query(`
        CREATE TABLE IF NOT EXISTS exchanges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            game_id INT,
            requester_id INT,
            status VARCHAR(20) DEFAULT 'en_attente',
            FOREIGN KEY (game_id) REFERENCES games(id),
            FOREIGN KEY (requester_id) REFERENCES users(id)
        )
    `);

    console.log('Base de données initialisée.');
}

initDB().catch(console.error);

module.exports = dbPromise;