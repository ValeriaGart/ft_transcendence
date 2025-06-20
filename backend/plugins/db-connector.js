import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';

sqlite3.verbose();

const db = new sqlite3.Database(
  path.resolve('./db.sqlite'),
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

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

export { db, dbRun, dbGet, dbAll, initialize };
