import React, { useEffect, useState } from 'react';
import 'react-tooltip/dist/react-tooltip.css';
import { FaQuestionCircle } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import Image from 'next/image';
import logoTruststamp from '@/assets/icons/logoTruststamp.png';
import firebaseIcon from '@/assets/icons/firebaseIcon.png'; // Adjust the paths if necessary
import s3Icon from '@/assets/icons/s3Icon.png'; // Adjust the paths if necessary
import PasswordPopup from '@/components/PasswordPopup';
import { useSession, signOut } from 'next-auth/react';
import { Circles } from 'react-loader-spinner';
import Router from 'next/navigation';
import { useRouter } from 'next/navigation';

type Bucket = {
    Name: string;
    name: string;
};

export default function SetupContainer() {
    const [githubId, setGithubId] = useState('');
    const [githubToken, setGithubToken] = useState('');
    const [databaseType, setDatabaseType] = useState('');
    const [databaseUrl, setDatabaseUrl] = useState('');
    const [serviceAccount, setServiceAccount] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [timestampFrequency, setTimestampFrequency] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('');
    const [connectionStatusStyle, setConnectionStatusStyle] = useState({});
    const [connectionSuccessful, setConnectionSuccessful] = useState(false);
    const [githubConnectionStatus, setGithubConnectionStatus] = useState('');
    const [githubConnectionStatusStyle, setGithubConnectionStatusStyle] = useState({});
    const [verifiedGithubAccessToken, setVerifiedGithubAccessToken] = useState('');
    const [password, setPassword] = useState('');
    const [isDatabaseEmpty, setIsDatabaseEmpty] = useState(false);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [email, setEmail] = useState('');
    const [buckets, setBuckets] = useState<Bucket[]>([]);
    const [selectedBucket, setSelectedBucket] = useState('');
    const [loadedBucket, setLoadedBucket] = useState('');
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [githubLoading, setGithubLoading] = useState(false);
    const [connectionLoading, setConnectionLoading] = useState(false);
    const [nextLoading, setNextLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            const email = session.user.email;
            setEmail(email);

            const checkIfDatabaseIsEmpty = async () => {
                const response = await fetch(`/api/database/checkDatabaseEmpty?email=${encodeURIComponent(email)}`);
                const data = await response.json();
                setIsDatabaseEmpty(data.empty);

                if (!data.empty) {
                    setShowPasswordPopup(true);
                }
                setLoading(false);
            };

            checkIfDatabaseIsEmpty();
        } else {
            // signOut();
            setLoading(false);
        }
    }, [status, email]);

    const fetchCredential = async (service: string, key: string, password: string) => {
        const response = await fetch(`/api/database/credentials?email=${email}&service=${service}&key=${key}&password=${password}`);
        const data = await response.json();
        return data.value;
    };

    const loadCredentials = async (submittedPassword: string) => {
        const savedGithubToken = await fetchCredential('github', 'token', submittedPassword);
        const savedGithubId = await fetchCredential('github', 'id', submittedPassword);
        const savedAccessKey = await fetchCredential('aws', 'accessKey', submittedPassword);
        const savedSecretKey = await fetchCredential('aws', 'secretKey', submittedPassword);
        const savedBucket = await fetchCredential('database', 'bucket', submittedPassword);
        const savedDatabaseUrl = await fetchCredential('firebase', 'databaseUrl', submittedPassword);
        const savedServiceAccount = await fetchCredential('firebase', 'serviceAccount', submittedPassword);
        const savedTimestampFrequency = await fetchCredential('timestampFrequency', 'value', submittedPassword);

        if (savedGithubToken) setGithubToken(savedGithubToken);
        if (savedGithubId) setGithubId(savedGithubId);
        if (savedAccessKey) setAccessKey(savedAccessKey);
        if (savedSecretKey) setSecretKey(savedSecretKey);
        if (savedBucket) setLoadedBucket(savedBucket);
        if (savedDatabaseUrl) setDatabaseUrl(savedDatabaseUrl);
        if (savedServiceAccount) setServiceAccount(savedServiceAccount);
        if (savedTimestampFrequency) setTimestampFrequency(savedTimestampFrequency);

        // Set the selected service based on the stored credentials
        if (savedAccessKey || savedSecretKey) {
            setSelectedService('aws');
        } else if (savedDatabaseUrl || savedServiceAccount) {
            setSelectedService('firebase');
        }
    };

    const handlePasswordSubmit = async (submittedPassword: string) => {
        const response = await fetch('/api/database/verifyPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password: submittedPassword }),
        });

        const result = await response.json();

        if (result.valid) {
            setPassword(submittedPassword);
            await loadCredentials(submittedPassword);
            setShowPasswordPopup(false);
        } else {
            alert('Invalid password');
        }
    };

    const handleTestConnection = async () => {
        setConnectionLoading(true);
        try {
            let response, result;
            if (selectedService === 'aws') {
                setDatabaseType('aws');
                response = await fetch('/api/aws/validateCredentials', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        accessKeyId: accessKey,
                        secretAccessKey: secretKey,
                        region: 'us-east-1',
                    }),
                });

                result = await response.json();
                if (response.ok) {
                    setConnectionStatus('Connection successful');
                    setConnectionStatusStyle({ color: 'green' });
                    setConnectionSuccessful(true);
                    setBuckets(result.buckets);
                } else {
                    setConnectionStatus(`Connection failed: ${result.error}`);
                    setConnectionStatusStyle({ color: 'red' });
                }
            } else if (selectedService === 'firebase') {
                setDatabaseType('firebase');
                response = await fetch('/api/firebase/validateCredentials', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        databaseUrl: databaseUrl,
                        serviceAccount: serviceAccount,
                    }),
                });

                result = await response.json();
                if (response.ok) {
                    setConnectionStatus('Connection successful');
                    setConnectionStatusStyle({ color: 'green' });
                    setConnectionSuccessful(true);
                    setBuckets(result.buckets);
                } else {
                    setConnectionStatus(`Connection failed: ${result.error}`);
                    setConnectionStatusStyle({ color: 'red' });
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setConnectionStatus(`Connection failed: ${errorMessage}`);
            setConnectionStatusStyle({ color: 'red' });
        } finally {
            setConnectionLoading(false);
        }
    };

    const handleNext = async () => {
        setNextLoading(true);
        const storeCredential = async (service: string, key: string, value: string, password: string) => {
            await fetch('/api/database/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, service, key, value, password }),
            });
        };

        const storePassword = async (email: string, password: string) => {
            await fetch('/api/database/password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    plainPassword: password
                })
            });
        };

        // Store credentials when the "Next" button is clicked
        await storeCredential('github', 'token', githubToken, password);
        await storeCredential('github', 'id', githubId, password);
        if (selectedService === 'aws') {
            await storeCredential('aws', 'accessKey', accessKey, password);
            await storeCredential('aws', 'secretKey', secretKey, password);
        } else if (selectedService === 'firebase') {
            await storeCredential('firebase', 'databaseUrl', databaseUrl, password);
            await storeCredential('firebase', 'serviceAccount', serviceAccount, password);
        }
        await storeCredential('database', 'bucket', selectedBucket, password);
        await storeCredential('timestampFrequency', 'value', timestampFrequency, password);

        await storePassword(email, password);

        console.log('Credentials stored and proceeding to the next step');
        setNextLoading(false);
        router.push('/feature');
        
    };

    const handleReset = async () => {
        setResetLoading(true);
        await fetch('/api/database/credentials', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        setGithubToken('');
        setGithubId('');
        setDatabaseUrl('');
        setServiceAccount('');
        setAccessKey('');
        setSecretKey('');
        setTimestampFrequency('');
        setSelectedService('');
        setConnectionStatus('');
        setConnectionStatusStyle({});
        setGithubConnectionStatus('');
        setGithubConnectionStatusStyle({});
        setIsDatabaseEmpty(true);
        setPassword('');
        setLoadedBucket('');
        console.log('Credentials reset successfully');
        setResetLoading(false);
    };

    const handleGithubTestConnection = async () => {
        setGithubLoading(true);
        try {
            const response = await fetch('/api/github/checkPAT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    githubId,
                    githubToken,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setGithubConnectionStatus('Connection successful');
                setGithubId(result.data.login);
                setVerifiedGithubAccessToken(githubToken);
                setGithubConnectionStatusStyle({ color: 'green' });
            } else {
                setGithubConnectionStatus(`Connection failed: ${result.message}`);
                setGithubConnectionStatusStyle({ color: 'red' });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setGithubConnectionStatus(`Connection failed: ${errorMessage}`);
            setGithubConnectionStatusStyle({ color: 'red' });
        } finally {
            setGithubLoading(false);
        }
    };

    const renderServiceForm = () => {
        switch (selectedService) {
            case 'firebase':
                return (
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '24px', color: '#333' }}>Firebase Database Connection</h2>
                        <input
                            type="text"
                            placeholder="https://your-project-id.firebaseio.com"
                            value={databaseUrl}
                            onChange={(e) => setDatabaseUrl(e.target.value)}
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                        <input
                            type="text"
                            placeholder="Enter your service account credentials"
                            value={serviceAccount}
                            onChange={(e) => setServiceAccount(e.target.value)}
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                        {loadedBucket && (
                            <div style={{ marginTop: '20px' }}>
                                <h2 style={{ fontSize: '20px', color: '#333' }}>Currently selected bucket</h2>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <p style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f7f7f7', marginRight: '10px' }}>
                                        {loadedBucket}
                                    </p>
                                    <FaQuestionCircle
                                        data-tooltip-id="loadedBucketTooltip"
                                        data-tooltip-content="To change the selected bucket, please click the Test button and reselect"
                                        style={{ color: '#888', cursor: 'pointer' }}
                                    />
                                    <Tooltip id="loadedBucketTooltip" place="top" />
                                </div>
                            </div>
                        )}
                        {buckets.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h2 style={{ fontSize: '20px', color: '#333' }}>Select a Bucket</h2>
                                <select
                                    value={selectedBucket}
                                    onChange={(e) => setSelectedBucket(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                                >
                                    <option value="" disabled>Select a bucket</option>
                                    {buckets.map((bucket) => (
                                        <option key={bucket.name} value={bucket.name}>
                                            {bucket.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                );
            case 'aws':
                return (
                    <div style={{ marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '24px', color: '#333' }}>S3 Connection</h2>
                        <input
                            type="text"
                            placeholder="Access Key"
                            value={accessKey}
                            onChange={(e) => setAccessKey(e.target.value)}
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                        <input
                            type="password"
                            placeholder="Secret Key"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                        {loadedBucket && (
                            <div style={{ marginTop: '20px' }}>
                                <h2 style={{ fontSize: '20px', color: '#333' }}>Currently selected bucket</h2>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <p style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#f7f7f7', marginRight: '10px' }}>
                                        {loadedBucket}
                                    </p>
                                    <FaQuestionCircle
                                        data-tooltip-id="loadedBucketTooltip"
                                        data-tooltip-content="To change the selected bucket, please click the Test button and reselect"
                                        style={{ color: '#888', cursor: 'pointer' }}
                                    />
                                    <Tooltip id="loadedBucketTooltip" place="top" />
                                </div>
                            </div>
                        )}
                        {buckets.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h2 style={{ fontSize: '20px', color: '#333' }}>Select a Bucket</h2>
                                <select
                                    value={selectedBucket}
                                    onChange={(e) => setSelectedBucket(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                                >
                                    <option value="" disabled>Select a bucket</option>
                                    {buckets.map((bucket) => (
                                        <option key={bucket.Name} value={bucket.Name}>
                                            {bucket.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderPasswordInput = () => (
        <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', color: '#333' }}>Set Password</h2>
            <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
        </div>
    );

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <Circles color="#00BFFF" height={80} width={80} />
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f7f1fc', minHeight: '100vh' }}>
            {showPasswordPopup && <PasswordPopup onClose={() => setShowPasswordPopup(false)} onSubmit={handlePasswordSubmit} />}
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                    <Image src={logoTruststamp} alt="TrustStamp Logo" height={60} />
                </div>
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', color: '#333' }}>Github Connection</h2>
                    {githubId && (
                        <div style={{ marginBottom: '10px', color: 'green' }}>
                            GitHub User ID: {githubId}
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <input
                            type="password"
                            placeholder="Organization Personal Access Token"
                            value={githubToken}
                            onChange={(e) => setGithubToken(e.target.value)}
                            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                        <FaQuestionCircle
                            data-tooltip-id="githubTokenTip"
                            data-tooltip-content="To set up a personal access token, go to GitHub Settings > Developer settings > Personal access tokens."
                            style={{ marginLeft: '10px', color: '#888', cursor: 'pointer' }}
                        />
                        <Tooltip id="githubTokenTip" place="top" />
                    </div>
                    <button onClick={handleGithubTestConnection} style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', position: 'relative' }}>
                        {githubLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Circles color="#FFF" height={20} width={20} />
                            </div>
                        ) : (
                            'Test'
                        )}
                    </button>
                    {githubConnectionStatus && <p style={githubConnectionStatusStyle}>{githubConnectionStatus}</p>}
                </div>
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', color: '#333' }}>Select Database Service</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                        <Image
                            src={firebaseIcon}
                            alt="Firebase Icon"
                            height={60}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedService('firebase')}
                        />
                        <Image
                            src={s3Icon}
                            alt="S3 Icon"
                            height={60}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedService('aws')}
                        />
                    </div>
                    {renderServiceForm()}
                    {selectedService && (
                        <button onClick={handleTestConnection} style={{ padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', position: 'relative' }}>
                            {connectionLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Circles color="#FFF" height={20} width={20} />
                                </div>
                            ) : (
                                'Test'
                            )}
                        </button>
                    )}
                    {connectionStatus && <p style={connectionStatusStyle}>{connectionStatus}</p>}
                </div>
                {isDatabaseEmpty && renderPasswordInput()}
                {!isDatabaseEmpty && password === '' && renderPasswordInput()}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '24px', color: '#333' }}>Timestamp Frequency</h2>
                    <select
                        value={timestampFrequency}
                        onChange={(e) => setTimestampFrequency(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    >
                        <option value="" disabled>Select Frequency</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                    </select>
                </div>
                <button
                    onClick={handleNext}
                    disabled={
                        !githubId ||
                        !verifiedGithubAccessToken ||
                        !connectionSuccessful ||
                        !timestampFrequency ||
                        !password ||
                        (selectedService === 'aws' && !selectedBucket)
                    }
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6a1b9a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: !githubId ||
                            !verifiedGithubAccessToken ||
                            !connectionSuccessful ||
                            !timestampFrequency ||
                            !password ||
                            (selectedService === 'aws' && !selectedBucket)
                            ? 'not-allowed'
                            : 'pointer',
                        display: 'block',
                        margin: '0 auto',
                        opacity: !githubId ||
                            !verifiedGithubAccessToken ||
                            !connectionSuccessful ||
                            !timestampFrequency ||
                            !password ||
                            (selectedService === 'aws' && !selectedBucket)
                            ? 0.5
                            : 1,
                        position: 'relative',
                    }}
                >
                    {nextLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Circles color="#FFF" height={20} width={20} />
                        </div>
                    ) : (
                        'Next'
                    )}
                </button>

                {!isDatabaseEmpty && (
                    <button
                        onClick={handleReset}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#ff4c4c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'block',
                            margin: '20px auto 0 auto',
                            position: 'relative',
                        }}
                    >
                        {resetLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Circles color="#FFF" height={20} width={20} />
                            </div>
                        ) : (
                            'Erase Stored Values and Reset'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
