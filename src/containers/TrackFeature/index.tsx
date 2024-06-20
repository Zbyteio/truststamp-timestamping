import React, { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import styles from './TrackFeature.module.css'; // Assuming you have a CSS module for styling
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid'; // Import UUID for random file names
import JSZip from 'jszip'; // Import JSZip for zipping files
import { useKeys } from '@/context/KeysContext';
import { Feature, AWSCredentials, FirebaseCredentials } from '@/containers/Dashboard';
import { Circles } from 'react-loader-spinner';
import { useRouter } from 'next/navigation';
import sha256 from 'js-sha256';
import Nav from '@/components/Nav';

interface Repository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
        login: string;
        id: number;
    };
}

interface Branch {
    name: string;
}

interface FileStructure {
    type: 'file' | 'dir';
    path: string;
    name: string;
}

interface FileItem extends FileStructure {
    items?: FileItem[];
    expanded?: boolean;
}

interface TrackFeatureProps {
    feature?: Feature;
    awsCredentials?: AWSCredentials | null;
    firebaseCredentials?: FirebaseCredentials | null;
}

export default function TrackFeatureContainer() {
    const router = useRouter();
    const [initialValues, setInitialValues] = useState<any>(null);
    const [crumb, setCrumb] = useState<number>(0); // 0 org, 1 repo, 2 branch, 3 files
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [selectedRepositories, setSelectedRepositories] = useState<{ [key: string]: boolean }>({});
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [fileStructure, setFileStructure] = useState<FileItem[]>([]);
    const [selectedRepository, setSelectedRepository] = useState<string>('');
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [organizations, setOrganizations] = useState<string[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<string>('');
    const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const { data: session, status } = useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { publicKey, privateKey } = useKeys();
    const [loading, setLoading] = useState(true);
    const [orgLoading, setOrgLoading] = useState(false);
    const [repoLoading, setRepoLoading] = useState(false);
    const [branchLoading, setBranchLoading] = useState(false);
    const [fileLoading, setFileLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            const email = session.user.email;
            setEmail(email);

            const initialize = async () => {
                try {

                    const response = await fetch(`/api/database/password?email=${email}`);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch decrypted password: ${response.statusText}`);
                    }

                    const data = await response.json();
                    setPassword(data.password);
                    await fetchOrganizations(email, data.password);
                    setLoading(false);
                }
                catch (err) {
                    router.push('/setup')
                }
            };

            initialize();
        } else {

            if (status === "unauthenticated") {
                router.push("/login");
            }

            setLoading(false);
        }
    }, [status, session]);

    useEffect(() => {
        if (!email || !password) return;

        const params = new URLSearchParams(window.location.search);
        params.has('id') && setFeatureIfEditing(parseInt(params.get('id') as string));
    }, [email, password]);

    const setFeatureIfEditing = async (featureId: number) => {
        const res = await fetch(`/api/database/features?id=${featureId}`);
        if (!res.ok) return console.warn(`Could not fetch feature with id ${featureId}.`);

        const feature = await res.json();
        if (!feature) return console.warn(`No feature exists with id ${featureId}.`);

        setTitle(feature.title);
        setDescription(feature.description);
        setSelectedOrg(feature.org);
        setSelectedRepository(feature.repo);
        setSelectedBranch(feature.branch);

        setInitialValues({
            title: feature.title,
            description: feature.description,
            org: feature.org,
            repo: feature.repo,
            branch: feature.branch
        });

        const files: string[] = [];
        const folders: string[] = [];
        feature?.githubPaths.forEach((item: { type: string, path: string }) => {
            item.type === 'file' && files.push(item.path);
            item.type === 'folder' && folders.push(item.path);
        });
        setSelectedFiles(files);
        setSelectedFolders(folders);

        feature.org && feature.repo && feature.branch && await Promise.all([
            fetchRepositories(feature.org),
            fetchBranches(feature.repo),
            fetchFileStructure(feature.repo, feature.branch)
        ]);

        let targetCrumb = 0;
        feature.org && targetCrumb++;
        feature.repo && targetCrumb++;
        feature.branch && targetCrumb++;
        setCrumb(targetCrumb);
    }

    const fetchOrganizations = async (email: string, password: string) => {
        setOrgLoading(true);
        try {
            const response = await fetch(`/api/github/organizations?email=${email}&password=${password}`);
            const data = await response.json();
            setOrganizations(Array.isArray(data) ? data : []);
            setSelectedOrg(data[0] ?? '');
        } catch (error) {
            console.error('Error fetching organizations:', error);
        } finally {
            setOrgLoading(false);
        }
    };

    const fetchRepositories = async (org: string) => {
        setRepoLoading(true);
        try {
            const response = await fetch(`/api/github/repositories?email=${email}&password=${password}&org=${org}`);
            const data = await response.json();
            setRepositories(Array.isArray(data) ? data : []);
            setSelectedRepository(data[0]?.full_name ?? '');
        } catch (error) {
            console.error('Error fetching repositories:', error);
        } finally {
            setRepoLoading(false);
        }
    };

    const fetchBranches = async (repository: string) => {
        setBranchLoading(true);
        try {
            const response = await fetch(`/api/github/branches?repository=${repository}&email=${email}&password=${password}`);
            const data = await response.json();
            setBranches(Array.isArray(data) ? data : []);
            setSelectedBranch(data[0]?.name ?? '');
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setBranchLoading(false);
        }
    };

    const fetchFileStructure = async (repository: string, branch: string, path = '') => {
        setFileLoading(true);
        try {
            const response = await fetch(`/api/github/contents?email=${email}&password=${password}&repository=${repository}&branch=${branch}&path=${path}`);
            const data = await response.json();
            if (path) {
                setFileStructure((prev) => updateFileStructure(prev, path, data));
            } else {
                setFileStructure(data);
            }
        } catch (error) {
            console.error('Error fetching file structure:', error);
        } finally {
            setFileLoading(false);
        }
    };

    const updateFileStructure = (structure: FileItem[], path: string, items: FileItem[]): FileItem[] => {
        return structure.map((item) => {
            if (item.path === path) {
                return { ...item, items, expanded: !item.expanded };
            } else if (item.items) {
                return { ...item, items: updateFileStructure(item.items, path, items) };
            } else {
                return item;
            }
        });
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            setUploadedFiles((prevFiles) => [...prevFiles, ...Array.from(files)]);
        }
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files) {
            setUploadedFiles((prevFiles) => [...prevFiles, ...Array.from(event.dataTransfer.files)]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const crumbNext = () => {
        const next = crumb + 1;
        setCrumb(next);
        next === 1 && fetchRepositories(selectedOrg);
        next === 2 && fetchBranches(selectedRepository);
        next === 3 && fetchFileStructure(selectedRepository, selectedBranch);
    };

    const handleFolderClick = (path: string) => {
        const folder = findFolder(fileStructure, path);
        if (folder && folder.expanded) {
            setFileStructure(collapseFolder(fileStructure, path));
        } else {
            fetchFileStructure(selectedRepository, selectedBranch, path);
        }
    };

    const findFolder = (structure: FileItem[], path: string): FileItem | undefined => {
        for (let item of structure) {
            if (item.path === path) {
                return item;
            } else if (item.items) {
                const found = findFolder(item.items, path);
                if (found) return found;
            }
        }
        return undefined;
    };

    const collapseFolder = (structure: FileItem[], path: string): FileItem[] => {
        return structure.map((item) => {
            if (item.path === path) {
                return { ...item, expanded: false, items: [] };
            } else if (item.items) {
                return { ...item, items: collapseFolder(item.items, path) };
            } else {
                return item;
            }
        });
    };

    const handleFileSelection = (path: string, type: 'file' | 'dir') => {
        if (type === 'dir') {
            setSelectedFolders((prev) => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
        } else {
            setSelectedFiles((prev) => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
        }
    };

    // Function to generate a fully random name without including the original file name
    const generateRandomName = (originalName: string) => {
        const extension = originalName.includes('.') ? originalName.split('.').pop() : '';
        return extension ? `${uuidv4()}.${extension}` : uuidv4();
    };

    const handleSubmit = async () => {
        setSubmitLoading(true);
        try {
            // Generate random names for uploaded files
            const randomizedFiles = uploadedFiles.map(file => ({
                original: file,
                random: generateRandomName(file.name),
                originalName: file.name
            }));

            const timestamp = new Date().toISOString().replace(/[-:.]/g, '');

            // Zip selected GitHub files and folders, and generate a random name for the zip file
            const zipBlob = await zipSelectedFilesAndFolders(selectedFiles, selectedFolders);
            const zipFileName = generateRandomName('github-files.zip');

            const fileNames = [
                ...randomizedFiles,
                { original: zipBlob, originalName: `${selectedRepository}/${selectedBranch}-selected-${timestamp}.zip`, random: zipFileName }
            ];

            const githubPaths = [
                ...selectedFiles.map(path => ({ path, type: 'file' })),
                ...selectedFolders.map(path => ({ path, type: 'folder' }))
            ];

            // Upload files to the database bucket and get transaction hashes
            const fileDataWithHashes = await Promise.all(
                fileNames.map(async (file) => {
                    await uploadFileToDatabase(file.original, file.random);
                    const transactionHash = await hashifyAndPublish(file.original, file.random);
                    return {
                        originalName: file.originalName,
                        random: file.random,
                        transactionHash
                    };
                })
            );

            const response = await fetch('/api/database/saveFeature', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    title,
                    description,
                    org: selectedOrg,
                    repo: selectedRepository,
                    branch: selectedBranch,
                    fileNames: fileDataWithHashes,
                    githubPaths
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save feature');
            }

            console.log('Feature tracked successfully');
            router.push('/dashboard');
        } catch (error) {
            console.error('Error handling submit:', error);
        } finally {
            setSubmitLoading(false);
        }
    };


    const hashifyAndPublish = async (file: File | Blob, fileName: string) => {
        try {
            // Step 1: Hash the file using SHA-256
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const hash = sha256.sha256.create();
            hash.update(uint8Array);
            const hexHash = hash.hex();

            if (!publicKey || !privateKey) {
                throw new Error('Public or private key not found');
            }

            // Step 3: Send the hashed data to the blockchain via the API
            const response = await fetch(`/api/wallet/writeToChain?publicKey=${encodeURIComponent(publicKey)}&privateKey=${encodeURIComponent(privateKey)}&hashedData=${encodeURIComponent(hexHash)}&fileName=${encodeURIComponent(fileName)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to publish on chain: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`File ${fileName} published on chain successfully with transaction hash: ${result.transactionHash}`);
            return result.transactionHash;
        } catch (error) {
            console.error('Error hashing and publishing file:', error);
        }
    };

    const renderFileStructure = (files: FileItem[]) => {
        return files.map((file) => (
            <div key={file.path} className={styles.fileItem}>
                <input
                    type="checkbox"
                    checked={file.type === 'dir' ? selectedFolders.includes(file.path) : selectedFiles.includes(file.path)}
                    onChange={() => handleFileSelection(file.path, file.type)}
                />
                <span onClick={file.type === 'dir' ? () => handleFolderClick(file.path) : undefined}>
                    {file.type === 'dir' && <> &#128448;</>} {file.name}
                </span>
                {file.expanded && file.items && (
                    <div className={styles.nestedFiles}>
                        {renderFileStructure(file.items)}
                    </div>
                )}
            </div>
        ));
    };

    const handleChooseFilesClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const renderFilePreview = (file: File) => {
        const objectUrl = URL.createObjectURL(file);
        const isImage = file.type.startsWith('image/');
        return (
            <div key={file.name} className={styles.filePreviewItem}>
                {isImage ? (
                    <Image src={objectUrl} alt={file.name} className={styles.filePreviewImage} width={100} height={100} />
                ) : (
                    <div className={styles.filePreviewPlaceholder}>
                        <span>{file.name}</span>
                    </div>
                )}
                <button className={styles.removeFileBtn} onClick={() => handleRemoveFile(uploadedFiles.indexOf(file))}>Remove</button>
            </div>
        );
    };

    const fetchFileContent = async (path: string) => {
        const response = await fetch(`/api/github/content?email=${email}&password=${password}&repository=${selectedRepository}&branch=${selectedBranch}&path=${path}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch file content: ${response.statusText}`);
        }
        return await response.blob();
    };

    const zipSelectedFilesAndFolders = async (selectedFiles: string[], selectedFolders: string[]) => {
        const zip = new JSZip();

        const addFileToZip = async (path: string, zipFolder: JSZip) => {
            const response = await fetch(`/api/github/file?email=${email}&password=${password}&repository=${selectedRepository}&branch=${selectedBranch}&path=${path}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch file content: ${response.statusText}`);
            }
            const fileContent = await response.blob();
            zipFolder.file(path.split('/').pop() || path, fileContent);
        };

        const addFolderToZip = async (folderPath: string, zipFolder: JSZip | null) => {
            const response = await fetch(`/api/github/folder?email=${email}&password=${password}&repository=${selectedRepository}&branch=${selectedBranch}&path=${folderPath}`);
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

        for (let filePath of selectedFiles) {
            await addFileToZip(filePath, zip);
        }

        for (let folderPath of selectedFolders) {
            const folderName = folderPath.split('/').pop() || folderPath;
            const folder = zip.folder(folderName);
            await addFolderToZip(folderPath, folder);
        }

        return zip.generateAsync({ type: 'blob' });
    };

    const fetchCredential = async (service: string, key: string, password: string) => {
        const response = await fetch(`/api/database/credentials?email=${email}&service=${service}&key=${key}&password=${password}`);
        const data = await response.json();
        return data.value;
    };

    const uploadFileToDatabase = async (file: File | Blob, fileName: string) => {
        const savedAccessKey = await fetchCredential('aws', 'accessKey', password);
        const savedSecretKey = await fetchCredential('aws', 'secretKey', password);
        const savedDatabaseUrl = await fetchCredential('firebase', 'databaseUrl', password);
        const savedServiceAccount = await fetchCredential('firebase', 'serviceAccount', password);
        const savedBucket = await fetchCredential('database', 'bucket', password);

        if (!savedBucket) {
            throw new Error('Bucket not found in credentials');
        }

        if (savedAccessKey && savedSecretKey) {
            const awsFormData = new FormData();
            awsFormData.append('file', file, fileName);
            awsFormData.append('credentials', JSON.stringify({
                accessKey: savedAccessKey,
                secretKey: savedSecretKey,
                bucket: savedBucket,
            }));

            const awsResponse = await fetch('/api/aws/uploadFiles', {
                method: 'POST',
                body: awsFormData,
            });

            if (!awsResponse.ok) {
                throw new Error(`Failed to upload file to AWS: ${awsResponse.statusText}`);
            }
        }

        if (savedDatabaseUrl && savedServiceAccount) {
            const firebaseFormData = new FormData();
            firebaseFormData.append('file', file, fileName);
            firebaseFormData.append('credentials', JSON.stringify({
                databaseUrl: savedDatabaseUrl,
                serviceAccount: savedServiceAccount,
                bucket: savedBucket,
            }));

            const firebaseResponse = await fetch('/api/firebase/uploadFiles', {
                method: 'POST',
                body: firebaseFormData,
            });

            if (!firebaseResponse.ok) {
                throw new Error(`Failed to upload file to Firebase: ${firebaseResponse.statusText}`);
            }
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Circles color="#00BFFF" height={80} width={80} />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className={styles.featurePage}>
            <Nav />
            <div className={styles.container}>
                <div className={styles.formContainer}>
                    <div className={styles.trackFeature}>
                        <h1>Track a feature</h1>
                        <div className={styles.inputGroup}>
                            <label htmlFor="title">Title</label>
                            <input
                                id="title"
                                type="text"
                                placeholder="Enter feature title"
                                defaultValue={initialValues?.title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                placeholder="Enter description"
                                defaultValue={initialValues?.description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <div className={styles.fileUpload}>
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className={styles.fileInput}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                            <div
                                className={styles.fileDropArea}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <p>Drag & Drop your files here</p>
                                <button className={styles.chooseFilesBtn} onClick={handleChooseFilesClick}>Choose Files</button>
                            </div>
                            <div className={styles.filePreviewContainer}>
                                {uploadedFiles.map((file) => renderFilePreview(file))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className={styles.crumbs}>
                            {['Org', 'Repo', 'Branch', 'Files'].map((string, i) => (
                                <React.Fragment key={string}>
                                    <span className={styles.divider}>&gt;</span>
                                    <button
                                        data-diff={Math.max(0, i - crumb + 1)}
                                        disabled={i - crumb >= 0}
                                        onClick={() => setCrumb(i)}
                                    >{string}</button>
                                </React.Fragment>
                            ))}

                            <div className={styles.crumbNavigation}>
                                <button onClick={() => setCrumb(crumb - 1)} disabled={crumb === 0}>Back</button>
                                <button onClick={crumbNext} disabled={orgLoading || repoLoading || branchLoading || fileLoading || crumb === 3}>Next</button>
                            </div>
                        </div>

                        <div className={styles.crumbValues}>
                            {crumb > 0 && selectedOrg && <div>Org: {selectedOrg}</div>}
                            {crumb > 1 && selectedRepository && <div>Repo: {selectedRepository}</div>}
                            {crumb > 2 && selectedBranch && <div>Branch: {selectedBranch}</div>}
                        </div>

                        {crumb === 0 && (
                            <div className={`${styles.selectOrganizations} ${styles.listContainer}`}>
                                <h2>Select Organization</h2>
                                {orgLoading ? (
                                    <div style={{ display: 'flex' }}>
                                        <Circles color="#00BFFF" height={40} width={40} />
                                    </div>
                                ) : (
                                    <select defaultValue={initialValues?.org} onChange={e => setSelectedOrg(e.target.value)}>
                                        {organizations.map((org, index) => (
                                            <option key={org} value={org}>{org}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                        {crumb === 1 && (
                            <div className={`${styles.selectRepositories} ${styles.listContainer}`}>
                                {repoLoading ? (
                                    <div style={{ display: 'flex' }}>
                                        <Circles color="#00BFFF" height={40} width={40} />
                                    </div>
                                ) : (
                                    repositories.length ? (
                                        <>
                                            <h2>Repositories for {selectedOrg}</h2>
                                            <select defaultValue={initialValues?.repo} onChange={e => setSelectedRepository(e.target.value)}>
                                                {repositories.map((repo, index) => (
                                                    <option key={repo.id} value={repo.full_name}>{repo.name}</option>
                                                ))}
                                            </select>
                                        </>
                                    ) : (
                                        <h2>No repositories found for organization &quot;{selectedOrg}&quot;.</h2>
                                    )
                                )}
                            </div>
                        )}
                        {crumb === 2 && (
                            <div className={`${styles.selectBranches} ${styles.listContainer}`}>
                                {branchLoading ? (
                                    <div style={{ display: 'flex' }}>
                                        <Circles color="#00BFFF" height={40} width={40} />
                                    </div>
                                ) : (
                                    branches.length ? (
                                        <>
                                            <h2>Branches for {selectedRepository}</h2>
                                            <select defaultValue={initialValues?.branch} onChange={e => setSelectedBranch(e.target.value)}>
                                                {branches.map((branch, index) => (
                                                    <option key={branch.name} value={branch.name}>{branch.name}</option>
                                                ))}
                                            </select>
                                        </>
                                    ) : (
                                        <h2>No branches found for repository &quot;{selectedRepository}&quot;.</h2>
                                    )
                                )}
                            </div>
                        )}
                        {crumb === 3 && (
                            <div className={`${styles.selectFiles} ${styles.listContainer}`}>
                                {fileLoading ? (
                                    <div style={{ display: 'flex' }}>
                                        <Circles color="#00BFFF" height={40} width={40} />
                                    </div>
                                ) : (
                                    fileStructure.length ? (
                                        <>
                                            <h2>Files for {selectedBranch}</h2>
                                            <div className={styles.fileList}>
                                                {renderFileStructure(fileStructure)}
                                            </div>
                                        </>
                                    ) : (
                                        <h2>No files found for branch &quot;{selectedBranch}&quot;.</h2>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                    <button className={styles.chooseFilesBtn} onClick={handleSubmit} disabled={submitLoading}>
                        {submitLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Circles color="#FFF" height={20} width={20} />
                            </div>
                        ) : (
                            'Submit'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
