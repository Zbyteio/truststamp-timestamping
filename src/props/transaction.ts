import { MATIC_ADDRESS } from '@/constants/addresses';
import tokenUSD from '@/utils/token-usd';

// generates transaction object, * is required
// - *from
// - *to
// - *hash
// - *value -- wei units as string
// - *date -- Date
// - *status -- 'pending' | 'failed' | 'success'
// - *token_address
// - *token_symbol
// - token_logo
// - token_usd
export const formatTx = (obj, api = 'polygon') => {
	return {
		polygon: formatTxPolygon,
		moralis: formatTxMoralis
	}[api](obj);
}

export const formatTxPolygon = obj => {
	return {
		from: obj.from,
		to: obj.to,
		hash: obj.hash,
		value: obj.value,
		date: new Date(parseInt(obj.timeStamp) * 1000),
		status: { '': 'pending', 0: 'failed', 1: 'success' }[obj.txreceipt_status],
		token_address: MATIC_ADDRESS,
		token_symbol: 'MATIC',
		token_logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
		token_usd: tokenUSD.get('MATIC'),
	};
}

export const formatTxMoralis = obj => {
	return {
		from: obj.from_address,
		to: obj.to_address,
		hash: obj.transaction_hash,
		value: obj.value,
		date: new Date(obj.block_timestamp),
		status: 'success',
		token_address: obj.address,
		token_symbol: obj.token_symbol,
		token_logo: obj.token_logo,
		token_usd: tokenUSD.get(obj.token_symbol),
	};
}
