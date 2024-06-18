import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { storePassword, getPassword } from '@/utils/credentials';

const secret = process.env.NEXTAUTH_SECRET;

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
    const token = await getToken({ req, secret });
    console.log(token);

    if (!token || !token.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
        return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }

    if (token.email !== email) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
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