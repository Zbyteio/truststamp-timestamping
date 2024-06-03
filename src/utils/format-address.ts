export default function formatAddress(address, start = 5, end = 5) {
	return [...address.slice(0, start), '...', ...address.slice(-end)].join('');
};
