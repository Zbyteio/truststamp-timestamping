import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './RecoveryKeys.module.css';
import logoTruststamp from '@/assets/icons/logoTruststamp.png';
import { useKeys } from '@/context/KeysContext';
import { Circles } from 'react-loader-spinner';
import { useSession } from 'next-auth/react';

const RecoveryContainer: React.FC = () => {
    const { publicKey, privateKey } = useKeys();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email) {
            if (publicKey !== '' && privateKey !== '') {
                // If keys are fetched but not valid
                setLoading(false);
            }
        }
        else
        {
            if (status==="unauthenticated") {
                router.push('/login');
            }
        }
    }, [publicKey, privateKey, router, status, session]);

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
                    <p><strong>Private Key:</strong></p>
                    <div className={styles.privateKeyContainer}>
                        {privateKey.split('').map((char, index) => (
                            <span key={index}>{char}</span>
                        ))}
                    </div>
                </div>
                <button className={styles.nextButton} onClick={handleNextClick}>Next</button>
            </div>
        </div>
    );
};

export default RecoveryContainer;