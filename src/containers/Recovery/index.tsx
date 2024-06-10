'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './RecoveryKeys.module.css';
import logoTruststamp from '@/assets/icons/logoTruststamp.png';
import { useKeys } from '@/context/KeysContext';

const RecoveryContainer: React.FC = () => {
    const { publicKey, privateKey } = useKeys();
    const router = useRouter();

    useEffect(() => {
        if (publicKey && privateKey) {
            // If keys exist, redirect to setup page
            //router.push('/setup');
        }
    }, [publicKey, privateKey, router]);

    const handleNextClick = () => {
        router.push('/setup');
    };

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