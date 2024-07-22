import db from './database';
import pdb from './passwordDatabase'
import wdb from './walletDatabase'
import { encrypt, decrypt } from './crypto';
import { scheduleCronJobs } from '@/utils/scheduleCron';

interface UserRow {
    id: number;
}

interface CredentialRow {
    value: string;
}

interface PasswordRow {
    email: string;
    encryptedPassword: string;
    iv: string;
}

interface Keys {
    publicKey: string;
    privateKey: string;
    contractAddress: string;
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

export const storeCredential = async (email: string, service: string, key: string, value: string, password: string): Promise<void> => {
    const userId = getUserId(email);
    const encryptedValue = encrypt(value, password);
    const encryptedChecker = encrypt("Verify", password);
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO credentials (user_id, service, key, value, checker)
        VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(userId, service, key, encryptedValue, encryptedChecker);

     // Wait for 3 seconds
     await new Promise(resolve => setTimeout(resolve, 3000));


    try {
        const response = await fetch('http://localhost:3000/api/cron/cronStart?cron', {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error('Failed to call cronStart API');
        }
        console.log('Successfully called cronStart API');
    } catch (error) {
        console.error('Error calling cronStart API:', error);
    }
};

export function getAllEmails(): string[] {
    const stmt = db.prepare('SELECT email FROM users');
    const rows = stmt.all() as { email: string }[]; // Explicitly type the result
    return rows.map(row => row.email);
}


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

export const storePassword = async (email: string, plainPassword: string): Promise<void> => {

    // Function to encrypt the password
    const encryptPassword = async (password: string) => {
        const response = await fetch(`https://hashify-next-backend.vercel.app/encrypt/${password}`);
        const data = await response.json();
        return data; // Assuming the API response contains the encrypted password in the 'encryptedData' field and 'iv'
    };

    console.log(plainPassword);

    const encryptedPassword = await encryptPassword(plainPassword);

    const encryptedData = encryptedPassword.encryptedData;
    const iv = encryptedPassword.iv;

    const stmt = pdb.prepare(`
      INSERT INTO passwords (email, encryptedPassword, iv)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET encryptedPassword=excluded.encryptedPassword, iv=excluded.iv
    `);
    stmt.run(email, encryptedData, iv);
};

export const getPassword = async (email: string): Promise<string | null> => {

    const stmt = pdb.prepare('SELECT encryptedPassword, iv FROM passwords WHERE email = ?');
    const row = stmt.get(email) as PasswordRow | undefined;

    if (!row) {
        return null;
    }

    // Function to decrypt the password
    const decryptPassword = async (encryptedPassword: string, iv: string) => {
        const response = await fetch(`https://hashify-next-backend.vercel.app/decrypt/${iv}/${encryptedPassword}`);
        const data = await response.json();
        return data; // Assuming the API response contains the decrypted password in the 'decrypted' field
    };

    const decryptedData = await decryptPassword(row.encryptedPassword, row.iv);

    return decryptedData.decrypted;
};

// Function to store wallet (publicKey and privateKey)
export const storeWallet = async (privateKey: string, publicKey: string) => {
    const stmt = wdb.prepare(`
        INSERT INTO keys (id, publicKey, privateKey) 
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET publicKey=excluded.publicKey, privateKey=excluded.privateKey
      `);
    stmt.run(publicKey, privateKey);
    console.log('Wallet stored successfully.');
};

// Function to get wallet (publicKey and privateKey)
export const getWallet = async (): Promise<{ publicKey: string; privateKey: string } | undefined> => {
    const stmt = wdb.prepare('SELECT publicKey, privateKey FROM keys WHERE id = 1');
    const result = stmt.get();
    if (result) {
        return result as Keys;
    } else {
        console.log('No wallet found.');
        return undefined;
    } 
};

// Function to store contract address
export const storeContractAddress = async (privateKey: string, contractAddress: string) => {
    try {
        const stmt = wdb.prepare(`
        INSERT INTO keys (id, privateKey, contractAddress) 
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET contractAddress=excluded.contractAddress
      `);
        stmt.run(privateKey, contractAddress);
        console.log('Contract address updated successfully.');
    } catch (error) {
        console.error('Error updating contract address:', error);
    }
};

// Function to get contract address
export const getContractAddress = () => {
    try {
        const stmt = wdb.prepare('SELECT contractAddress FROM keys WHERE id = 1');
        const row = stmt.get() as Keys;
        if (row) {
            return row.contractAddress;
        } else {
            console.log('No contract address found.');
            return null;
        }
    } catch (error) {
        console.error('Error retrieving contract address:', error);
        return null;
    }
};