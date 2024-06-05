import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

export async function POST(req: NextRequest) {
  const { accessKeyId, secretAccessKey, region } = await req.json();

  if (!accessKeyId || !secretAccessKey || !region) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  AWS.config.update({
    accessKeyId,
    secretAccessKey,
    region,
  });

  const s3 = new AWS.S3();

  try {
    const buckets = await s3.listBuckets().promise();
    return NextResponse.json({ message: 'Successfully connected', buckets: buckets.Buckets }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Connection failed', error: errorMessage }, { status: 500 });
  }
}
