import { ethers } from 'ethers';

interface CreateTransactionOptions {
	from: string;
	to: string;
	chainId: number;
	rpc: Object;
	value?: BigInt;
	data?: string;
	gasScaler?: number;
	nonce?: number;
}

export async function createTx(options) {
	const {
		from,
		to,
		rpc,
		value = 0n,
		data = '0x',
		gasScaler = 100,
		nonce: _nonce
	} = options;

	const [{ chainId }, nonce, gasLimit, gasFees] = await Promise.all([
		rpc.getNetwork(),
		rpc.getTransactionCount(from),
		rpc.estimateGas({ to, data }),
		fetch('https://gasstation.polygon.technology/v2').then(r => r.json())
	]);

	const maxFeePerGas = ethers.parseUnits(`${gasFees.fast.maxFee}`, 'gwei');
	const maxPriorityFeePerGas = ethers.parseUnits(`${gasFees.fast.maxPriorityFee}`, 'gwei');
	const gasMultiplier = ethers.toBigInt(gasScaler);

	return {
		from,
		to,
		chainId,
		value,
		data,
		nonce: _nonce ?? nonce,
		type: 2,
		gasLimit: gasLimit * ethers.toBigInt(2),
		maxFeePerGas: maxFeePerGas * gasMultiplier / 100n,
		maxPriorityFeePerGas: maxPriorityFeePerGas * gasMultiplier / 100n
	};
};

export async function signTx(raw, keyProvider) {
	return keyProvider.request({ method: 'eth_signTransaction', params: [raw] });
}

export async function broadcastTx(signed, rpc) {
	let error, result;
	try {
		result = await rpc.broadcastTransaction(signed);
	} catch(e) {
		error = e;
	}
	return [error, result];
}

export async function broadcastRawTx(options, rpc, keyProvider) {
	const tx = await createTx({ rpc, ...options });
	const signed = await signTx(tx, keyProvider);
	return broadcastTx(signed, rpc);
}
