import { NextRequest, NextResponse } from 'next/server';
import { getCredential } from '@/utils/credentials';

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');
    const password = req.nextUrl.searchParams.get('password');
    const repository = req.nextUrl.searchParams.get('repository');

    if (!email || !password || !repository) {
        return NextResponse.json({ error: 'Email, password, org, and repository are required' }, { status: 400 });
    }

    try {
        const token = await getCredential(email as string, 'github', 'token', password as string);


        if (!token) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
        const response = await fetch(`https://api.github.com/repos/${repository}/branches`, {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch branches');
        }

        const branches = await response.json();
        return NextResponse.json(branches, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}