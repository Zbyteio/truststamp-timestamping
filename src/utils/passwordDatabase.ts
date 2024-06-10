import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'password-data.db');
const pdb = new Database(dbPath, { verbose: console.log });

// Create a table for storing passwords if it doesn't exist
pdb.exec(`
  CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    encryptedPassword TEXT,
    iv TEXT
  )
`);

export default pdb;
