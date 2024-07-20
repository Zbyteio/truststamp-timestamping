import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export async function GET(req: NextRequest) {
	const params = req.nextUrl.searchParams;
	const [databaseUrl, serviceAccount, bucket, fileName] = [
		params.get('databaseUrl'),
		params.get('serviceAccount'),
		params.get('bucket'),
		params.get('fileName')
	];

  if (!databaseUrl || !serviceAccount || !bucket || !fileName) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  const serviceAccountObj = JSON.parse(req.nextUrl.searchParams.get('serviceAccount') as string);
	serviceAccountObj.private_key = serviceAccountObj.private_key.replace(/\\n/g, '\n');

	const storage = new Storage({
		credentials: serviceAccountObj,
		projectId: serviceAccountObj.project_id,
	});

	const file = await storage.bucket(bucket).file(fileName).download();
	return NextResponse.json({ file: file[0] });
}
