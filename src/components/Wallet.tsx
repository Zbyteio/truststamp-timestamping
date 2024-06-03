import { useRef, useContext, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ethers } from 'ethers';
import { WalletCore, Web3AuthProvider, TORUS_NETWORK_TYPE } from '@zbyteio/zbyte-wallet-sdk-core';
import { getBlockchainNetwork, CHAIN_ID_MATIC_MAINNET } from '@zbyteio/zbyte-common';
import { Tabs } from 'antd';
import { WalletContext } from '../context/Wallet';

// connecting to wallet core using web3auth requires a unique access token for
// every connection. an ancestor component must ensure the user is
// authenticated and that the access token in session is unique. can be done
// via session.update('keycloak:refresh') endpoint.
export default function Wallet({ children }) {
	const session = useSession();

	const isMounted = useRef(false);
	const [core, setCore] = useState(null);
	const [connected, setConnected] = useState(0);
	const [address, setAddress] = useState('');

	useEffect(() => {
		isMounted.current = true;
		return () => isMounted.current = false;
	}, []);

	useEffect(() => {
		(async () => {
			const config = {
				networkType: process.env.REACT_APP_AUTH_NETWORK_TYPE as TORUS_NETWORK_TYPE,
				web3AuthClientId: process.env.REACT_APP_AUTH_CLIENT_ID as string,
				enableLogging: (process.env.REACT_APP_ENABLE_LOGGING as string) === "true",
				verifierName: process.env.REACT_APP_VERIFIER as string,
				clientId: process.env.REACT_APP_CLIENT_ID as string,
				domain: process.env.REACT_APP_DOMAIN as string,
			};

			// avoid instantiating multiple wallets for hot module reloading
			const walletAlreadyExists = !!globalThis.wallet;
			globalThis.wallet ||= new WalletCore(new Web3AuthProvider(config), getBlockchainNetwork(CHAIN_ID_MATIC_MAINNET));
			const walletCore = globalThis.wallet;
			setCore(walletCore);

			if (!walletAlreadyExists) {
				const [error, connected] = await connect(walletCore, session.data.access_token);

				if (error) {
					signOut();
				} else {
					const connected = walletCore.isConnected();
					setConnected(connected ? 2 : 0);
					connected && setAddress(await walletCore.getAddress());
				}
			}

			globalThis.session = session;
			globalThis.ethers = ethers;
			globalThis.wallet = walletCore;
		})();
	}, []);

	return (
		<WalletContext.Provider value={{ core, connected, address }}>
			{core && children}
		</WalletContext.Provider>
	);
};

async function connect(walletCore, accessToken) {
	walletCore.injectAuthVerifier({
		clientId: process.env.REACT_APP_CLIENT_ID as string,
		domain: process.env.REACT_APP_DOMAIN as string,
		tokenExpiry: Number(process.env.REACT_APP_TOKEN_EXPIRY || ''),
		typeOfToken: process.env.REACT_APP_TYPE_OF_TOKEN,
		verifier: process.env.REACT_APP_VERIFIER as string,
		accessToken
	});

	try {
		await walletCore.connect();
	} catch(e) {
		return [e];
	}

	return [null, walletCore.isConnected()];
}
