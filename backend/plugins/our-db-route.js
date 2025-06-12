// our-db-route.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pong.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
async function initialize() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    INSERT INTO users (id, email, passwordHash, createdAt)
    VALUES ('1', 'lucamail', 'secret123', '21312312')
    ON CONFLICT (id) DO NOTHING;
    `)
  // await db.run(`
  //   CREATE TABLE IF NOT EXISTS profiles (
  //     id TEXT PRIMARY KEY,
  //     userId TEXT UNIQUE NOT NULL,
  //     nickname TEXT NOT NULL,
  //     bio TEXT,
  //     profilePictureUrl TEXT,
  //     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //     FOREIGN KEY (userId) REFERENCES users (id)
  //   )
  // `);
}

// filepath: /workspaces/nodejs/db.js
db.all('SELECT * FROM users', (err, rows) => {
  console.log('DB QUERY: SELECT * FROM users');
  if (err) console.error(err);
  else console.log('DB RESULT:', rows);
});

module.exports = { db, initialize };