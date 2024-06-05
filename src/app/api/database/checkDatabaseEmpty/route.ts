import { NextRequest, NextResponse } from 'next/server';
import db from '@/utils/database';

type CountRow = {
  count: number;
};

async function checkEmpty(email: string) {
  // Get the user_id for the provided email
  const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const userRow = userStmt.get(email) as { id: number } | undefined;

  if (!userRow) {
    // If the user does not exist, return empty as true
    return NextResponse.json({ empty: true });
  }

  const userId = userRow.id;

  // Check if the credentials table is empty for this specific user_id
  const stmt = db.prepare('SELECT COUNT(*) as count FROM credentials WHERE user_id = ?');
  const row = stmt.get(userId) as CountRow;

  return NextResponse.json({ empty: row.count === 0 });
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }
  return checkEmpty(email);
}