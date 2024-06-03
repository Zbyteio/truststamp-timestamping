const URL = 'https://deep-index.moralis.io';

export default function moralis(path, options = {}) {
	return new Promise(async resolve => {
		const res = await fetch(`${URL}${path}`, {
			...options,
			headers: {
				accept: 'application/json',
				'Content-Type': 'application/json',
				'x-api-key': process.env.REACT_APP_MORALIS_API_KEY,
				...options.headers
			},
		});

		resolve(res.ok ? [null, await res.json()] : [new Error(`Moralis API request failed: ${await res.text()}`)]);
	});
}

// for debugging
globalThis.moralis = moralis;
