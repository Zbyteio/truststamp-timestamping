import { NextRequest, NextResponse } from 'next/server';
import { storeCredential, getCredential, resetCredentials } from '@/utils/credentials';

export async function POST(req: NextRequest) {
  const { email, service, key, value, password } = await req.json();
  storeCredential(email, service, key, value, password);
  return NextResponse.json({ message: 'Credential stored successfully' });
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  const service = req.nextUrl.searchParams.get('service');
  const key = req.nextUrl.searchParams.get('key');
  const password = req.nextUrl.searchParams.get('password');
  if (!email || !service || !key || !password) {
    return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
  }
  const value = getCredential(email, service, key, password);
  return NextResponse.json({ value });
}

export async function DELETE(req: NextRequest) {
  const { email } = await req.json();
  resetCredentials(email);
  return NextResponse.json({ message: 'Credentials for the specified email have been reset' });
}