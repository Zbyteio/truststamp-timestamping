// pages/api/github/folder.js

import { NextRequest, NextResponse } from 'next/server';
import { getCredential } from '@/utils/credentials';

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');
    const password = req.nextUrl.searchParams.get('password');
    const repository = req.nextUrl.searchParams.get('repository');
    const branch = req.nextUrl.searchParams.get('branch');
    const path = req.nextUrl.searchParams.get('path') || '';

    if (!email || !password || !repository || !branch) {
        return NextResponse.json({ error: 'Email, password, repository, and branch are required' }, { status: 400 });
    }

    try {
        const token = await getCredential(email, 'github', 'token', password);

        if (!token) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}?ref=${branch}`, {
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch repository contents');
        }

        const contents = await response.json();

        return NextResponse.json(contents, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}