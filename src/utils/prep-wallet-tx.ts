import { createTx, signTx, broadcastTx, broadcastRawTx } from '@/utils/transaction';

// intermediary to gather data from zbyte wallet before exposing to ethers API.
// - create rpc provider
// - chainId
// - wallet address
// - key provider
export default async function prepWalletTx(walletCore) {
	const { networkRpcUrl, chainId } = walletCore.getNetwork();
	const rpc = new ethers.JsonRpcProvider(networkRpcUrl);
	const [address, keyProvider] = await Promise.all([
		walletCore.getAddress(),
		walletCore.getKeyProvider().then(p => p.getProvider())
	]);

	return {
		createTx: options => createTx({ rpc, from: address, ...options }),
		signTx: raw => signTx(raw, keyProvider),
		broadcastTx: signed => broadcastTx(signed, rpc),
		broadcastRawTx: options => broadcastRawTx({ from: address, ...options }, rpc, keyProvider)
	};
}
