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
            if (!onChainData) return null;

            const explorerLink = `https://polygonscan.com/tx/${file.transactionHash}`;
            const onChainHash = onChainData[1];
            const blockTime = parseInt(onChainData[3].hex, 16);

            const fileHash = await fetchAndHashFile(file.random);

            return {
                originalName: file.originalName,
                transactionHash: explorerLink,
                computedHash: fileHash,
                onChainHash: onChainHash,
                timestampDate: new Date(blockTime * 1000).toLocaleDateString(),
                timestampTime: new Date(blockTime * 1000).toLocaleTimeString(),
            };
        });

        const results = await Promise.all(filePromises);
        setFileData(results.filter((result) => result !== null));
        setIsLoading(false);
    };

    const fetchAndHashFile = async (fileName: string) => {
        const url = awsCredentials
            ? `/api/aws/getFile?fileName=${fileName}&accessKey=${awsCredentials.accessKey}&secretKey=${awsCredentials.secretKey}&bucket=${awsCredentials.bucket}`
            : `/api/firebase/getFile?fileName=${fileName}&databaseUrl=${firebaseCredentials?.databaseUrl}&serviceAccount=${firebaseCredentials?.serviceAccount}&bucket=${firebaseCredentials?.bucket}`;

        const response = await fetch(url);
        const fileBase64 = await response.json();
        const fileBuffer = Buffer.from(fileBase64.file, 'base64');

        // Step 3: Calculate the SHA-256 hash using js-sha256
        const hash = sha256.sha256.create();
        hash.update(fileBuffer);
        const hexHash = hash.hex();
        return hexHash;
    };

    const handleAddToFeature = () => {
        router.push(`/feature?feature=${encodeURIComponent(JSON.stringify(feature))}&awsCredentials=${encodeURIComponent(JSON.stringify(awsCredentials))}&firebaseCredentials=${encodeURIComponent(JSON.stringify(firebaseCredentials))}`);
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
                            </tr>
                        </thead>
                        <tbody>
                            {fileData.map((file, index) => (
                                <tr key={index}>
                                    <td>{file.originalName}</td>
                                    <td>
                                        <div>On-chain hash: {file.onChainHash}</div>
                                        <div>Hash from database: {file.computedHash}</div>
                                    </td>
                                    <td>{file.timestampDate}</td>
                                    <td>{file.timestampTime}</td>
                                    <td><a href={file.transactionHash} target="_blank" rel="noopener noreferrer">Link</a></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <button className={styles.addButton} onClick={handleAddToFeature}>Add to feature</button>
            </div>
        </div>
    );
};

export default DashboardModal;
