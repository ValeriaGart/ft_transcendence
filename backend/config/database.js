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
      CREATE TABLE IF NOT EXISTS friend (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        initiator_id INTEGER,
        recipient_id INTEGER,
        accepted BOOLEAN,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        acceptedAt TIMESTAMP,
        FOREIGN KEY (initiator_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE
    );
      CREATE TABLE IF NOT EXISTS match (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        player1_id INTEGER,
        player2_id INTEGER,
        winner_id INTEGER,
        player1_score INTEGER,
        player2_score INTEGER,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        gameFinishedAt TIMESTAMP,
        FOREIGN KEY (player1_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (player2_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (winner_id) REFERENCES users (id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS user_sessions (
        userId INTEGER PRIMARY KEY,
        sessionId TEXT UNIQUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        lastSeenAt TIMESTAMP,
        revoked INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_sessionId ON user_sessions(sessionId);
      `,
      async (err) => {
        if (err) return reject(err);
        try {
          await ensureUserSessionsColumns();
          resolve();
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

// Ensure newly added columns exist even if table pre-existed without them
async function ensureUserSessionsColumns() {
  const desired = {
    lastSeenAt: 'TIMESTAMP',
    revoked: 'INTEGER DEFAULT 0'
  };
  const existingCols = await new Promise((res, rej) => {
    db.all('PRAGMA table_info(user_sessions);', [], (e, rows) => e ? rej(e) : res(rows));
  });
  const existingNames = new Set(existingCols.map(r => r.name));
  for (const [col, def] of Object.entries(desired)) {
    if (!existingNames.has(col)) {
      await dbRun(`ALTER TABLE user_sessions ADD COLUMN ${col} ${def}`);
    }
  }
}

export { db, dbRun, dbGet, dbAll, initialize };