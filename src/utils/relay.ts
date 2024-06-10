import { RelayClient } from '@zbyteio/zbyte-relay-client';

interface RelayOptions {
	relayBaseUrl?: string;
	nativeChainId?: number;
}

export default function relay(walletCore: any, relayOptions: RelayOptions = {}) {
	const DEFAULT_RELAY_OPTIONS = { relayBaseURL: 'https://dplat.zbyte.io/relay/v1' };
	const options = { ...DEFAULT_RELAY_OPTIONS, ...relayOptions };
	options.nativeChainId ||= walletCore.getNetwork().chainId;
	return new RelayClient(options, walletCore);
};
