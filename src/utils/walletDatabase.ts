import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'wallet-database.db');
const wdb = new Database(dbPath, { verbose: console.log });

// Create a table for storing keys if it doesn't exist
wdb.exec(`
  CREATE TABLE IF NOT EXISTS keys (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    publicKey TEXT NOT NULL,
    privateKey TEXT NOT NULL,
    contractAddress TEXT
  )
`);

export default wdb;
