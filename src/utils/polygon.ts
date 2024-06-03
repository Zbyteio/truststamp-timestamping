const URL = 'https://api.polygonscan.com/api';

export default async function polygon(params = {}, options = {}) {
	params = Object.entries({
		apikey: process.env.REACT_APP_POLYGONSCAN_API_KEY,
		...params
	}).map(([k, v]) => `${k}=${v}`).join('&');

	const res = await fetch(`${URL}?${params}`, options);

	if (!res.ok) return [new Error(`Polygon API request failed: ${res.body}`)];

	const json = await res.json();
	return json.status === '0' ? [new Error(json.message), json] : [null, json.result];
}

// for debugging
globalThis.polygon = polygon;
