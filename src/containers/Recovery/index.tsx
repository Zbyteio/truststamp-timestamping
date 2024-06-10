'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './RecoveryKeys.module.css';
import logoTruststamp from '@/assets/icons/logoTruststamp.png';
import { useKeys } from '@/context/KeysContext';
import { Circles } from 'react-loader-spinner';

const RecoveryContainer: React.FC = () => {
    const { publicKey, privateKey } = useKeys();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if keys are fetched
        if (publicKey && privateKey) {
            // If keys exist, redirect to setup page
            router.push('/setup');
        } else if (publicKey !== '' && privateKey !== '') {
            // If keys are fetched but not valid
            setLoading(false);
        }
    }, [publicKey, privateKey, router]);

    const handleNextClick = () => {
        router.push('/setup');
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
        <div className={styles.container}>
            <div className={styles.logoContainer}>
                <Image src={logoTruststamp} alt="TrustStamp Logo" width={80} height={80} />
            </div>
            <div className={styles.recoveryContainer}>
                <h2 className={styles.heading}>Recovery Keys</h2>
                <p className={styles.instructions}>
                    Below you will find your recovery keys. Please save them to ensure you maintain access to the data.
                </p>
                <div className={styles.keysContainer}>
                    <p><strong>Public Key:</strong> {publicKey}</p>
                    <p><strong>Private Key:</strong> {privateKey}</p>
                </div>
                <button className={styles.nextButton} onClick={handleNextClick}>Next</button>
            </div>
        </div>
    );
};

export default RecoveryContainer;
