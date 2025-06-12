// our-db-route.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const util = require('util');

const dbPath = path.join(__dirname, 'pong.db');
const db = new sqlite3.Database(dbPath);


// Promisify db.run and db.all for async/await usage
const dbRun = util.promisify(db.run.bind(db));
const dbAll = util.promisify(db.all.bind(db));

// Initialize database
async function initialize() {
  // drop table to reset everything (during dev)
  // await db.run(`DROP TABLE IF EXISTS users`);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
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
  dbAll('SELECT * FROM users', (err, rows) => {
    console.log('DB QUERY: SELECT * FROM users');
    if (err) console.error(err);
    else console.log('DB RESULT:', rows);
  });
}

// filepath: /workspaces/nodejs/db.js

module.exports = { db, initialize };