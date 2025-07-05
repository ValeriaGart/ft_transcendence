import sqlite3 from 'sqlite3';
import path from 'path';
import { promisify } from 'util';

sqlite3.verbose();

const db = new sqlite3.Database(
  path.resolve('./db.sqlite'),
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

// Enable foreign key constraints
db.run('PRAGMA foreign_keys = ON');

// Promisify database methods
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

function initialize() {
  return new Promise((resolve, reject) => {
    db.exec(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT,
        googleId TEXT UNIQUE,
        name TEXT,
        profilePicture TEXT,
        emailVerified BOOLEAN DEFAULT FALSE,
        isActive BOOLEAN DEFAULT TRUE,
        lastLoginAt TIMESTAMP,
        failedLoginAttempts INTEGER DEFAULT 0,
        lockedUntil TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER UNIQUE,
        nickname TEXT UNIQUE,
        bio TEXT,
        profilePictureUrl TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
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