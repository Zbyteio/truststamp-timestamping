import polygon from '@/utils/polygon';
import moralis from '@/utils/moralis';

// stores USD values of native+erc20 tokens
class TokenUSD {
	constructor() {
		this.values = {};
	}

	// https://docs.moralis.io/web3-data-api/evm/reference/get-multiple-token-prices
	// tokens: array of objects: { token_address: 'address', token_symbol: 'symbol' }
	async fetch(tokens, chain = 'polygon') {
		const nonMatics = tokens.filter(token => token.token_symbol !== 'MATIC');

		const promises = [polygon({ module: 'stats', action: 'maticprice' })];
		nonMatics.length && promises.push(moralis(`/api/v2.2/erc20/prices?chain=${chain}`, {
			method: 'POST',
			body: JSON.stringify({
				tokens: nonMatics.map(t => ({ token_address: t.token_address }))
			})
		}));

		const fetches = await Promise.all(promises);

		fetches.filter(t => t[0]).map(error => console.error(error));

		this.values.MATIC = parseFloat(fetches[0][1].maticusd) || 1;

		fetches[1] && fetches[1][1]?.forEach(result => {
			if (result.tokenSymbol !== 'MATIC') {
				const usd = this.values.MATIC * parseInt(result.nativePrice.value) / Math.pow(10, 18);
				this.values[result.tokenSymbol] = usd;
			}
		});
	}

	has(symbol) {
		return typeof this.values[symbol] === 'number';
	}

	get(symbol) {
		return this.values[symbol] || 0;
	}
}

const tokenUSD = new TokenUSD();
export default tokenUSD;

// for debugging
globalThis.tokenUSD = tokenUSD;
