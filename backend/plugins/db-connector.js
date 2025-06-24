
import sqlite3 from 'sqlite3';
import path from 'path';

sqlite3.verbose();

const db = new sqlite3.Database(
  path.resolve('./db.sqlite'),
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

function initialize() {
  return new Promise((resolve, reject) => {
    db.exec(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        passwordHash TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT UNIQUE,
        bio TEXT,
        profilePictureUrl TEXT,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id) REFERENCES users (id)
        );
      `,
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export { db, initialize };