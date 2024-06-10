'use client';

import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';

interface KeysContextType {
    publicKey: string;
    privateKey: string;
}

const KeysContext = createContext<KeysContextType | undefined>(undefined);

export const KeysProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');

    useEffect(() => {
        const fetchKeys = async () => {
            const response = await fetch('/api/wallet/walletCreate');
            const data: KeysContextType = await response.json();
            setPublicKey(data.publicKey);
            setPrivateKey(data.privateKey);
        };

        fetchKeys();
    }, []);

    return (
        <KeysContext.Provider value={{ publicKey, privateKey }}>
            {children}
        </KeysContext.Provider>
    );
};

export const useKeys = () => {
    const context = useContext(KeysContext);
    if (context === undefined) {
        throw new Error('useKeys must be used within a KeysProvider');
    }
    return context;
};