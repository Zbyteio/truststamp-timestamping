'use client';

import Nav from '@/components/Nav';

export default function HomePage() {
	return (
		<>
			<Nav/>
			<div style={{ padding: '8px' }}>Welcome to <span style={{ color: '#6a1b9a', fontWeight: '500' }}>TrustStamp</span>. Visit the <a href="/setup">Setup</a> page to get started.</div>
		</>
	);
}
