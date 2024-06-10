import { NextRequest, NextResponse } from 'next/server';
import { storeFeature, getFeaturesWithFilesAndPathsByEmail, getFeatureId, storeGitHubPath } from '@/utils/features';

export async function POST(req: NextRequest) {
    try {
        const { email, title, description, fileNames, githubPaths } = await req.json();

        console.log('Received data:', { email, title, description, fileNames, githubPaths });

        const featureId = getFeatureId(email, title, description);
        storeFeature(email, title, description, fileNames);

        githubPaths.forEach((path: { path: string, type: string }) => {
            storeGitHubPath(featureId, path.path, path.type);
        });

        return NextResponse.json({ message: 'Feature stored successfully' });
    } catch (error) {
        console.error('Error storing feature:', error);
        return NextResponse.json({ error: 'Failed to store feature' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get('email');
        if (!email) {
            return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
        }
        const features = getFeaturesWithFilesAndPathsByEmail(email);
        return NextResponse.json(features);
    } catch (error) {
        console.error('Error getting features:', error);
        return NextResponse.json({ error: 'Failed to get features' }, { status: 500 });
    }
}
