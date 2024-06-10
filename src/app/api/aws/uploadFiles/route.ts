import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

interface AWSCredentials {
    accessKey: string;
    secretKey: string;
    bucket: string;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;
        const credentials = JSON.parse(formData.get('credentials') as string) as AWSCredentials;

        if (!file || !credentials) {
            return NextResponse.json({ error: 'Missing file or credentials' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const s3 = new AWS.S3({
            accessKeyId: credentials.accessKey,
            secretAccessKey: credentials.secretKey,
        });

        const params = {
            Bucket: credentials.bucket, // Use the retrieved bucket name
            Key: (file as File).name,
            Body: buffer,
            ContentType: (file as File).type
        };

        await s3.upload(params).promise();

        return NextResponse.json({ message: 'File uploaded to AWS successfully' });
    } catch (error) {
        console.error('Error uploading file to AWS:', error);
        return NextResponse.json({ error: 'Failed to upload file to AWS' }, { status: 500 });
    }
}