import React, { useState, useEffect } from 'react';
import styles from './DashboardModal.module.css';
import { AWSCredentials, FirebaseCredentials } from '@/containers/Dashboard';
import { useKeys } from '@/context/KeysContext';
import { useRouter } from 'next/navigation';
import { Circles } from 'react-loader-spinner';
import sha256 from 'js-sha256';

interface Feature {
    id: number;
    title: string;
    description: string;
    files: { originalName: string, random: string, transactionHash: string }[];
    githubPaths: { path: string, type: string }[];
}

interface ModalProps {
    feature: Feature;
    onClose: () => void;
    awsCredentials: AWSCredentials | null;
    firebaseCredentials: FirebaseCredentials | null;
}

const DashboardModal: React.FC<ModalProps> = ({ feature, onClose, awsCredentials, firebaseCredentials }) => {
    const [fileData, setFileData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { publicKey, privateKey } = useKeys();
    const router = useRouter();

    useEffect(() => {
        fetchFileHashes();
    }, [feature]);

    const fetchFileHashes = async () => {
        setIsLoading(true);
        const response = await fetch(`/api/wallet/getData?publicKey=${publicKey}&privateKey=${privateKey}`);
        const data = await response.json();

        const filePromises = feature.files.map(async (file) => {
            const onChainData = data.result.find((d: any) => d[2] === file.random);
            if (!onChainData) {
                return {
                    random: file.random,
                    originalName: file.originalName,
                    transactionHash: null,
                    computedHash: null,
                    onChainHash: null,
                    timestampDate: null,
                    timestampTime: null,
                    message: "Blockchain still indexing..."
                };
            }

            const explorerLink = `https://polygonscan.com/tx/${file.transactionHash}`;
            const onChainHash = onChainData[1];
            const blockTime = parseInt(onChainData[3].hex, 16);

            const fileHash = await fetchAndHashFile(file.random);

            return {
                random: file.random,
                originalName: file.originalName,
                transactionHash: explorerLink,
                computedHash: fileHash,
                onChainHash: onChainHash,
                timestampDate: new Date(blockTime * 1000).toLocaleDateString(),
                timestampTime: new Date(blockTime * 1000).toLocaleTimeString(),
                message: null
            };
        });

        const results = await Promise.all(filePromises);
        setFileData(results);
        setIsLoading(false);
    };

    const fetchFileContents = async (fileName: string) => {
			let params = [['fileName', fileName]];
			if (awsCredentials) {
				params.push(
					['accessKey', awsCredentials.accessKey],
					['secretKey', awsCredentials.secretKey],
					['bucket', awsCredentials.bucket]
				);
			} else if (firebaseCredentials) {
				params.push(
					['databaseUrl', firebaseCredentials.databaseUrl],
					['serviceAccount', firebaseCredentials.serviceAccount],
					['bucket', firebaseCredentials.bucket]
				);
			} else {
				throw new Error('No AWS or Firebase credentials.');
			}

			const paramString = params.map(([k, v]) => {
				return `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
			}).join('&');

			const url = awsCredentials ? `/api/aws/getFile?${paramString}` : `/api/firebase/getFile?${paramString}`;
			const response = await fetch(url);
			const fileBase64 = await response.json();
			return Buffer.from(fileBase64.file, 'base64');
    };

    const fetchAndHashFile = async (fileName: string) => {
        const fileBuffer = await fetchFileContents(fileName);

        // Step 3: Calculate the SHA-256 hash using js-sha256
        const hash = sha256.sha256.create();
        hash.update(fileBuffer);
        return hash.hex();
    };

    const downloadFile = async (file: any) => {
        const contents = await fetchFileContents(file.random);
        if (/\.zip$/.test(file.originalName)) {
           downloadString(contents.toString('base64'), file.originalName, 'data:application/zip;base64,');
        } else {
           downloadString(contents.toString('utf-8'), file.originalName);
        }
    };

    const downloadString = (contents: string, fileName: string = 'download.txt', prefix: string = 'data:text/plain;charset=utf-8,') => {
        const a = document.createElement('a');
        a.href = `${prefix}${encodeURIComponent(contents)}`;
        a.download = fileName;
        a.click();
    };

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <span className={styles.close} onClick={onClose}>&times;</span>
                <h2 className={styles.modalTitle}>{feature.title}</h2>
                <p className={styles.description}>{feature.description}</p>
                <h3 className={styles.filesHeader}>Files</h3>
                {isLoading ? (
                    <div className={styles.loaderContainer}>
                        <Circles height="100" width="100" color="#4fa94d" ariaLabel="loading" />
                    </div>
                ) : (
                    <table className={styles.fileTable}>
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Hash Details</th>
                                <th>Timestamping date</th>
                                <th>Timestamping time</th>
                                <th>View on Blockchain</th>
                                <th>Download File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fileData.map((file, index) => (
                                <tr key={index}>
                                    <td>{file.originalName}</td>
                                    <td>
                                        {file.message ? (
                                            <div>{file.message}</div>
                                        ) : (
                                            <>
                                                <div>On-chain hash: {file.onChainHash}</div>
                                                <div>Hash from database: {file.computedHash}</div>
                                            </>
                                        )}
                                    </td>
                                    <td>{file.timestampDate || 'N/A'}</td>
                                    <td>{file.timestampTime || 'N/A'}</td>
                                    <td>{file.transactionHash ? <a href={file.transactionHash} target="_blank" rel="noopener noreferrer">Link</a> : 'N/A'}</td>
                                    <td>{file.computedHash ? <button className={styles.downloadButton} onClick={() => downloadFile(file)}>Download</button> : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <a className={styles.addButton} href={`/feature?id=${feature.id}`}>Add to feature</a>
            </div>
        </div>
    );
};

export default DashboardModal;
