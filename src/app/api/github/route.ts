import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { githubToken } = await req.json();

  if (!githubToken) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.github.com/user`, {
      headers: {
        'Authorization': `token ${githubToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ message: 'Connection successful', data }, { status: 200 });
    } else {
      const error = await response.json();
      return NextResponse.json({ message: 'Connection failed', error: error.message }, { status: response.status });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Connection failed', error: errorMessage }, { status: 500 });
  }
}