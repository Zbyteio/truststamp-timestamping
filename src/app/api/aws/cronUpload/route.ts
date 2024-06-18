import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import { Buffer } from 'node:buffer';

interface AWSCredentials {
    accessKey: string;
    secretKey: string;
    bucket: string;
}

export async function POST(req: NextRequest) {
    try {
        const { file, credentials, fileName } = await req.json();

        if (!file || !credentials || !fileName) {
            return NextResponse.json({ error: 'Missing file, credentials, or file name' }, { status: 400 });
        }

        const fileBuffer = Buffer.from(file);

        const parsedCredentials = JSON.parse(credentials);

        const s3 = new AWS.S3({
            accessKeyId: parsedCredentials.accessKey,
            secretAccessKey: parsedCredentials.secretKey,
        });

        const params = {
            Bucket: parsedCredentials.bucket,
            Key: fileName,
            Body: fileBuffer,
            ContentType: 'application/zip',
        };

        await s3.upload(params).promise();

        return NextResponse.json({ message: 'File uploaded to AWS successfully' });
    } catch (error) {
        console.error('Error uploading file to AWS:', error);
        return NextResponse.json({ error: 'Failed to upload file to AWS' }, { status: 500 });
    }
}