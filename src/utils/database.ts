import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'users-data.db');
const db = new Database(dbPath, { verbose: console.log });

// Create a table for storing users if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE
  )
`);

// Create a table for storing credentials if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    service TEXT,
    key TEXT,
    value TEXT,
    checker TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, service, key)
  )
`);

export default db;