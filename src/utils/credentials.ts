import db from './database';
import { encrypt, decrypt } from './crypto';

interface UserRow {
    id: number;
}

interface CredentialRow {
    value: string;
}

const getUserId = (email: string): number => {
    const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const row = stmt.get(email) as UserRow | undefined;

    if (row) {
        return row.id;
    } else {
        const insertStmt = db.prepare('INSERT INTO users (email) VALUES (?)');
        const info = insertStmt.run(email);
        return info.lastInsertRowid as number;
    }
};

export const storeCredential = (email: string, service: string, key: string, value: string, password: string): void => {
    const userId = getUserId(email);
    const encryptedValue = encrypt(value, password);
    const encryptedChecker = encrypt("Verify", password);
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO credentials (user_id, service, key, value, checker)
        VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId, service, key, encryptedValue, encryptedChecker);
};

export const getCredential = (email: string, service: string, key: string, password: string): string | null => {
    const userId = getUserId(email);
    const stmt = db.prepare('SELECT value FROM credentials WHERE user_id = ? AND service = ? AND key = ?');
    const row = stmt.get(userId, service, key) as CredentialRow | undefined;
    return row ? decrypt(row.value, password) : null;
};

export const resetCredentials = (email: string): void => {
    const userId = getUserId(email);
    const stmt = db.prepare('DELETE FROM credentials WHERE user_id = ?');
    stmt.run(userId);
};