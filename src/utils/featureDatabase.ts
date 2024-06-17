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

// migrations to `features`
const pragma: any = fdb.pragma(`table_info(features);`);

// add `org` column to `features`
if (!pragma.find((colData: any) => colData.name === 'org')) {
	fdb.exec(`ALTER TABLE features ADD org TEXT`);
}

// add `repo` column to `features`
if (!pragma.find((colData: any) => colData.name === 'repo')) {
	fdb.exec(`ALTER TABLE features ADD repo TEXT`);
}

// add `branch` column to `features`
if (!pragma.find((colData: any) => colData.name === 'branch')) {
	fdb.exec(`ALTER TABLE features ADD branch TEXT`);
}

export default fdb;
