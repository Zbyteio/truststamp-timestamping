import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

interface AWSCredentials {
    accessKey: string;
    secretKey: string;
    bucket: string;
}

export async function GET(req: NextRequest) {
    try {
        const fileName = req.nextUrl.searchParams.get('fileName');
        const accessKey = req.nextUrl.searchParams.get('accessKey');
        const secretKey = req.nextUrl.searchParams.get('secretKey');
        const bucket = req.nextUrl.searchParams.get('bucket');

        if (!fileName || !accessKey || !secretKey || !bucket) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const s3 = new AWS.S3({
            accessKeyId: accessKey,
            secretAccessKey: secretKey,
        });

        const params = {
            Bucket: bucket,
            Key: fileName
        };

        const data = await s3.getObject(params).promise();

        return NextResponse.json({ file: data.Body?.toString('base64') });
    } catch (error) {
        console.error('Error fetching file from AWS:', error);
        return NextResponse.json({ error: 'Failed to fetch file from AWS' }, { status: 500 });
    }
}