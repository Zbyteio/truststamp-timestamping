import { NextRequest, NextResponse } from 'next/server';
import { App, AppOptions } from 'firebase-admin/app';
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';

export async function POST(req: NextRequest) {
  const { databaseUrl, serviceAccount } = await req.json();

  if (!databaseUrl || !serviceAccount) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  let serviceAccountObj = JSON.parse(serviceAccount);

  const tempAppName = `tempApp-${Date.now()}`;

  let tempApp: App | null = null;

  try {
    const tempAppConfig: AppOptions = {
      credential: admin.credential.cert(serviceAccountObj),
      databaseURL: databaseUrl,
    };

    tempApp = admin.initializeApp(tempAppConfig, tempAppName);
    console.log(`Temporary app initialized with name: ${tempAppName}`);

    console.log('Listing users to verify credentials...');
    const userList = admin.auth(tempApp).listUsers;
    admin.app(tempAppName).delete();

    // Initialize Google Cloud Storage client
    const storage = new Storage({
      credentials: serviceAccountObj,
      projectId: serviceAccountObj.project_id,
    });

    // List buckets
    console.log('Listing buckets...');
    const [buckets] = await storage.getBuckets();

    return NextResponse.json({ message: 'Credentials are valid', buckets: buckets }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(errorMessage);

    return NextResponse.json({ message: 'Invalid credentials', error: errorMessage }, { status: 500 });
  }
}
