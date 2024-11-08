import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { useSession } from 'next-auth/react';
import DashboardModal from '@/components/DashboardModal';
import { useRouter } from 'next/navigation';
import { Circles } from 'react-loader-spinner';
import Nav from '@/components/Nav';

export interface Feature {
    id: number;
    title: string;
    description: string;
    org: string;
    repo: string;
    branch: string;
    files: { originalName: string, random: string, transactionHash: string }[];
    githubPaths: { path: string, type: string }[];
}

export interface AWSCredentials {
    accessKey: string;
    secretKey: string;
    bucket: string;
}

export interface FirebaseCredentials {
    databaseUrl: string;
    serviceAccount: string;
    bucket: string;
}

interface FeatureResponse {
    feature: Feature;
    files: { originalName: string; random: string; transactionHash: string }[];
    githubPaths: { path: string; type: string }[];
}

export default function DashboardComponent() {
    const { data: session, status } = useSession();
    const [features, setFeatures] = useState<FeatureResponse[]>([]);
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [awsCredentials, setAwsCredentials] = useState<AWSCredentials | null>(null);
    const [firebaseCredentials, setFirebaseCredentials] = useState<FirebaseCredentials | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            const email = session.user.email;
            setEmail(email);

            const getPassword = async () => {
                try {
                    setIsLoading(true);
                    const response = await fetch(`/api/database/password?email=${email}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        }
                    });

                    const data = await response.json();
                    if (data.message === "Password not found") {
                        router.push('/setup');
                    }
                    else {
                        setIsLoading(false);
                    }
                    setPassword(data.password);
                    await loadCredentials(email, data.password);
                    await fetchFeatures(email);
                }
                catch (err) {
                    router.push('/setup');
                }

            };

            getPassword().catch(() => setIsLoading(false));
        }
        else{
            if (status==="unauthenticated") {
                router.push('/login');
            }
        }
    }, [status, session]);

    const loadCredentials = async (email: string, password: string) => {
        const savedAccessKey = await fetchCredential(email, 'aws', 'accessKey', password);
        const savedSecretKey = await fetchCredential(email, 'aws', 'secretKey', password);
        const savedBucket = await fetchCredential(email, 'database', 'bucket', password);
        const savedDatabaseUrl = await fetchCredential(email, 'firebase', 'databaseUrl', password);
        const savedServiceAccount = await fetchCredential(email, 'firebase', 'serviceAccount', password);

        if (savedAccessKey && savedSecretKey && savedBucket) {
            setAwsCredentials({ accessKey: savedAccessKey, secretKey: savedSecretKey, bucket: savedBucket });
        }

        if (savedDatabaseUrl && savedServiceAccount && savedBucket) {
            setFirebaseCredentials({ databaseUrl: savedDatabaseUrl, serviceAccount: savedServiceAccount, bucket: savedBucket });
        }
    };

    const fetchCredential = async (email: string, service: string, key: string, password: string) => {
        const response = await fetch(`/api/database/credentials?email=${email}&service=${service}&key=${key}&password=${password}`);
        const data = await response.json();
        return data.value;
    };

    const fetchFeatures = async (email: string) => {
        const response = await fetch(`/api/database/saveFeature?email=${email}`);
        const data = await response.json();
        setFeatures(data);
    };

    const handleFeatureClick = (feature: FeatureResponse) => {
        console.log("Feature clicked:", feature);
        setSelectedFeature({
            id: feature.feature.id,
            title: feature.feature.title,
            description: feature.feature.description,
            org: feature.feature.org,
            repo: feature.feature.repo,
            branch: feature.feature.branch,
            files: feature.files,
            githubPaths: feature.githubPaths
        });
    };

    const closeModal = () => {
        setSelectedFeature(null);
    };

    const handleAddFeatureClick = () => {
        router.push('/feature');
    };

    useEffect(() => {
        console.log("Selected feature:", selectedFeature);
    }, [selectedFeature]);

    if (isLoading) {
        return (
            <div className={styles.loaderContainer}>
                <Circles height="100" width="100" color="#4fa94d" ariaLabel="loading" />
            </div>
        );
    }

    return (
			<>
				<Nav/>
				<div className={styles.container}>
					<div className={styles.header}>
						<h1 className={styles.title}>Features</h1>
						<button className={styles.addButton} onClick={handleAddFeatureClick}>Add Feature</button>
					</div>
					<div className={styles.featureList}>
						{features.map((featureResponse, index) => (
							<div key={index} className={styles.featureCard} onClick={() => handleFeatureClick(featureResponse)}>
								<h2 className={styles.featureTitle}>{featureResponse.feature.title}</h2>
								<p className={styles.featureDescription}>{featureResponse.feature.description}</p>
							</div>
						))}
					</div>
					{selectedFeature && (
						<DashboardModal
							feature={selectedFeature}
							onClose={closeModal}
							awsCredentials={awsCredentials}
							firebaseCredentials={firebaseCredentials}
						/>
					)}
				</div>
			</>
    );
}
