import sqlite3 from 'sqlite3';
import path from 'path';
import util from 'util';

sqlite3.verbose();

const db = new sqlite3.Database(
  path.resolve('./db.sqlite'),
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
);

function initialize() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        passwordHash TEXT,
        createdAt TEXT
      )`,
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export { db, initialize };