import { NextRequest, NextResponse } from 'next/server';
import { storePassword, getPassword } from '@/utils/credentials';
import pdb from '@/utils/passwordDatabase';

export async function POST(req: NextRequest) {
    try {
        const { email, plainPassword } = await req.json();
        await storePassword(email, plainPassword);
        return NextResponse.json({ message: 'Password stored successfully' });
    } catch (error) {
        console.error('Error storing password:', error);
        return NextResponse.json({ error: 'Failed to store password' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // Print users table
        const users = pdb.prepare('SELECT * FROM passwords').all();

        const email = req.nextUrl.searchParams.get('email');
        if (!email) {
            return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
        }
        const decryptedPassword = await getPassword(email);
        if (!decryptedPassword) {
            return NextResponse.json({ message: 'Password not found' }, { status: 404 });
        }
        return NextResponse.json({ password: decryptedPassword });
    } catch (error) {
        console.error('Error getting password:', error);
        return NextResponse.json({ error: 'Failed to get password' }, { status: 500 });
    }
}
