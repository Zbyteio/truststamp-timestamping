import { NextRequest, NextResponse } from 'next/server';
import { App, AppOptions, initializeApp as initializeAdminApp, cert, deleteApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { Storage } from '@google-cloud/storage';

interface FirebaseCredentials {
    databaseUrl: string;
    serviceAccount: string;  // Storing as string to parse JSON later
    bucket: string;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;
        const credentials = JSON.parse(formData.get('credentials') as string) as FirebaseCredentials;

        if (!file || !credentials) {
            return NextResponse.json({ error: 'Missing file or credentials' }, { status: 400 });
        }

        const serviceAccountObj = JSON.parse(credentials.serviceAccount);

        const tempAppName = `tempApp-${Date.now()}`;

        let tempApp: App | null = null;

        try {
            const tempAppConfig: AppOptions = {
                credential: cert(serviceAccountObj),
                databaseURL: credentials.databaseUrl,
                storageBucket: credentials.bucket,
            };

            tempApp = initializeAdminApp(tempAppConfig, tempAppName);
            const bucket = getStorage(tempApp).bucket();

            const storage = new Storage({
                credentials: serviceAccountObj,
                projectId: serviceAccountObj.project_id,
            });

            const [buckets] = await storage.getBuckets();
            if (!buckets.some(b => b.name === credentials.bucket)) {
                throw new Error(`Bucket ${credentials.bucket} not found`);
            }

            const fileRef = bucket.file((file as File).name);
            await fileRef.save(Buffer.from(await file.arrayBuffer()), {
                metadata: { contentType: file.type },
            });

            return NextResponse.json({ message: 'File uploaded to Firebase successfully' });
        } finally {
            if (tempApp) {
                await deleteApp(tempApp);
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error uploading file to Firebase:', errorMessage);
        return NextResponse.json({ error: 'Failed to upload file to Firebase', details: errorMessage }, { status: 500 });
    }
}