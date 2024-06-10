import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'feature-data.db');
const fdb = new Database(dbPath, { verbose: console.log });

console.log('Tables dropped successfully.');

// Create the tables again
fdb.exec(`
  CREATE TABLE IF NOT EXISTS features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    title TEXT,
    description TEXT
  )
`);

fdb.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_id INTEGER NOT NULL,
    original_file_name TEXT NOT NULL,
    randomized_file_name TEXT NOT NULL,
    transaction_hash TEXT,
    FOREIGN KEY (feature_id) REFERENCES features(id)
  )
`);

fdb.exec(`
  CREATE TABLE IF NOT EXISTS github_paths (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL,
    FOREIGN KEY (feature_id) REFERENCES features(id)
  )
`);

// Function to print table contents
const printTableContents = (tableName: string) => {
  const stmt = fdb.prepare(`SELECT * FROM ${tableName}`);
  const rows = stmt.all();
  console.log(`Contents of ${tableName}:`, rows);
};

// Print the contents of the tables
printTableContents('features');
printTableContents('files');
printTableContents('github_paths');

console.log('Tables created successfully.');

export default fdb;