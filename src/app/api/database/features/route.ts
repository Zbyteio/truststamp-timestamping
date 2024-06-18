import { NextRequest, NextResponse } from 'next/server';
import { getFeature, getFilesAndPathsForFeature } from '@/utils/features';

export async function GET(req: NextRequest) {
	const id = req.nextUrl.searchParams.get('id');
	if (!id) {
		return NextResponse.json({ message: 'Missing required id parameter' }, { status: 400 });
	}

	try {
		const feature = getFeature(parseInt(id));

		if (!feature) {
			return NextResponse.json(null);
		}

		const { files, githubPaths } = getFilesAndPathsForFeature(parseInt(id));
		return NextResponse.json({ ...feature, files, githubPaths });
	} catch (error) {
		console.error('Error getting feature:', error);
		return NextResponse.json({ error: 'Failed to get feature' }, { status: 500 });
	}
}

