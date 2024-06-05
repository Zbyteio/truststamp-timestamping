import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/database';
import { decrypt } from '@/utils/crypto';

type CredentialRow = {
  checker: string;
};

async function verifyPassword(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, password } = await req.json();

    // Fetch the "checker" entry from the database for the specified email
    const stmt = db.prepare(`
      SELECT c.checker
      FROM credentials c
      JOIN users u ON c.user_id = u.id
      WHERE u.email = ?
      LIMIT 1
    `);
    const row = stmt.get(email) as CredentialRow | undefined;

    if (row && row.checker) {
      try {
        // Decrypt the checker value and check if it matches "Verify"
        const decryptedChecker = decrypt(row.checker, password);
        if (decryptedChecker === 'Verify') {
          return NextResponse.json({ valid: true });
        }
        return NextResponse.json({ valid: false });
      } catch (error) {
        return NextResponse.json({ valid: false });
      }
    }

    // If no checker entry is stored, consider the password invalid
    return NextResponse.json({ valid: false });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json({ valid: false, error: 'Failed to verify password' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return verifyPassword(req);
}
