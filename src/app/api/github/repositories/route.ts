import { NextRequest, NextResponse } from 'next/server';
import { getCredential } from '@/utils/credentials';

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');
    const password = req.nextUrl.searchParams.get('password');
    const org = req.nextUrl.searchParams.get('org');

    if (!email || !password || !org) {
        return NextResponse.json({ error: 'Email, password, and organization are required' }, { status: 400 });
    }

    try {
        const token = await getCredential(email as string, 'github', 'token', password as string);
        const userId = await getCredential(email as string, 'github', 'id', password as string);

        if (!token) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        let response;
        if (org === userId) {
            console.log("user");
            // Fetch repositories owned by the user
            response = await fetch('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }

            // Filter repositories to only include those owned by the user
            const allRepos = await response.json();
            const userRepos = allRepos.filter((repo: any) => repo.owner.login === userId);
            return NextResponse.json(userRepos, { status: 200 });
        } else {
            // Fetch repositories for the specified organization
            response = await fetch(`https://api.github.com/orgs/${org}/repos`, {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }

            const orgRepos = await response.json();
            return NextResponse.json(orgRepos, { status: 200 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}