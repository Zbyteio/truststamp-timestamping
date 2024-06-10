import { NextRequest, NextResponse } from 'next/server';
import { getCredential } from '@/utils/credentials';

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get('email');
    const password = req.nextUrl.searchParams.get('password');

    if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    try {
        const token = await getCredential(email as string, 'github', 'token', password as string);

        if (!token) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        let page = 1;
        let repositories: any[] = [];
        let response;

        do {
            response = await fetch(`https://api.github.com/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&per_page=100&page=${page}`, {
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch repositories');
            }

            repositories = repositories.concat(data);
            page += 1;
        } while (response.headers.get('link')?.includes('rel="next"'));

        // Extract unique owners from repositories
        const uniqueOwners = Array.from(new Set(repositories.map(repo => repo.owner.login)));

        return NextResponse.json(uniqueOwners, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}