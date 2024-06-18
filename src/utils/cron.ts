import { NextRequest, NextResponse } from 'next/server';
import { getCredential, getWallet } from '@/utils/credentials';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import sha256 from 'js-sha256';
import { updateFeatureCron } from '@/utils/features';

const url = process.env.NEXTAUTH_URL;

interface GitHubPath {
    path: string;
    type: 'file' | 'folder';
}

interface Feature {
    feature: {
        repo: string;
        branch: string;
        email: string;
        id: number;
        org: string;
        title: string;
    };
    githubPaths: GitHubPath[];
}

interface GitHubFile {
    type: 'file' | 'dir';
    path: string;
    name: string;
    download_url: string | null;
}

export async function processGithubZip(email: string, password: string): Promise<void> {
    const features = await fetchFeaturesFromAPI(email);
    for (const feature of features) {
        const { repo, branch } = feature.feature;
        const paths = feature.githubPaths;
        const zipBlob = await zipSelectedFilesAndFolders(paths, email, password, repo, branch);
        const zipFileName = generateRandomName('github-files.zip');

        // Upload to AWS
        await uploadFileToDatabase(zipBlob, zipFileName, email, password);
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '');

        // Publish on-chain
        const wallet = await getWallet();
        const publicKey = wallet?.publicKey;
        const privateKey = wallet?.privateKey;
        if (publicKey && privateKey) {
            const transactionHash = await hashifyAndPublish(zipBlob, zipFileName, publicKey, privateKey);
            console.log(`Published on chain with transaction hash: ${transactionHash}`);
            console.log(transactionHash);
            console.log(zipFileName);
            console.log(feature.feature.id);
            console.log(`${repo}/${branch}-selected-${timestamp}.zip`);
            await updateFeatureCron(feature.feature.id, `${repo}/${branch}-selected-${timestamp}.zip`, zipFileName, transactionHash);
        }
    }
}

// Function to fetch features from the API
async function fetchFeaturesFromAPI(email: string): Promise<Feature[]> {
    const response = await fetch(`${url}/api/database/saveFeature?email=${encodeURIComponent(email)}`);
    if (!response.ok) {
        throw new Error('Failed to fetch features from API');
    }
    return response.json();
}

// Function to zip selected files and folders
async function zipSelectedFilesAndFolders(paths: GitHubPath[], email: string, password: string, repo: string, branch: string): Promise<Buffer> {
    const zip = new JSZip();

    const addFileToZip = async (path: string, zipFolder: JSZip) => {
        const response = await fetch(`${url}/api/github/file?email=${email}&password=${password}&repository=${repo}&branch=${branch}&path=${path}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch file content: ${response.statusText}`);
        }
        const blob = await response.arrayBuffer();
        zipFolder.file(path.split('/').pop() || path, blob);
    };

    const addFolderToZip = async (folderPath: string, zipFolder: JSZip | null) => {
        const response = await fetch(`${url}/api/github/folder?email=${email}&password=${password}&repository=${repo}&branch=${branch}&path=${folderPath}`);
        const folderContent = await response.json();

        for (let item of folderContent) {
            if (item.type === 'dir' && zipFolder) {
                const folder = zipFolder.folder(item.name);
                await addFolderToZip(item.path, folder);
            } else {
                if (zipFolder)
                    await addFileToZip(item.path, zipFolder);
            }
        }
    };

    for (const path of paths) {
        if (path.type === 'file') {
            await addFileToZip(path.path, zip);
        } else if (path.type === 'folder') {
            const folderName = path.path.split('/').pop() || path.path;
            const folder = zip.folder(folderName);
            await addFolderToZip(path.path, folder);
        }
    }

    return zip.generateAsync({ type: 'nodebuffer' });
}

// Function to generate a fully random name without including the original file name
function generateRandomName(originalName: string): string {
    const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
    return extension ? `${uuidv4()}.${extension}` : uuidv4();
}

// Function to upload the file to the database (e.g., AWS S3)
async function uploadFileToDatabase(file: Buffer, fileName: string, email: string, password: string): Promise<void> {
    const accessKey = await getCredential(email, 'aws', 'accessKey', password);
    const secretKey = await getCredential(email, 'aws', 'secretKey', password);
    const bucket = await getCredential(email, 'database', 'bucket', password);

    if (!accessKey || !secretKey || !bucket) {
        throw new Error('Missing AWS credentials');
    }

    const fileUint8Array = new Uint8Array(file);

    const requestBody = {
        file: Array.from(fileUint8Array),
        credentials: JSON.stringify({
            accessKey,
            secretKey,
            bucket,
        }),
        fileName,
    };

    const response = await fetch(`${url}/api/aws/cronUpload`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`Failed to upload file to AWS: ${response.statusText}`);
    }
}

// Function to hash and publish the file on the blockchain
async function hashifyAndPublish(file: Buffer, fileName: string, publicKey: string, privateKey: string): Promise<string> {
    const arrayBuffer = file;
    const uint8Array = new Uint8Array(arrayBuffer);
    const hash = sha256.sha256.create();
    hash.update(uint8Array);
    const hexHash = hash.hex();

    const response = await fetch(`${url}/api/wallet/writeToChain?publicKey=${encodeURIComponent(publicKey)}&privateKey=${encodeURIComponent(privateKey)}&hashedData=${encodeURIComponent(hexHash)}&fileName=${encodeURIComponent(fileName)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to publish on chain: ${response.statusText}`);
    }

    const result = await response.json();
    return result.transactionHash;
}