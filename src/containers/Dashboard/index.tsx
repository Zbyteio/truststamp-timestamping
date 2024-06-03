import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession} from 'next-auth/react'
import User from '@/components/User';
import DashboardCard from '@/components/DashboardCard';
import Tabs from '@/components/Tabs';
import './style.scss';

const Wallet = dynamic(() => import('@/components/Wallet', { ssr: false }));

export default function DashboardContainer() {
	const session = useSession();
	const [ready, setReady] = useState(false);

	useEffect(() => {
		(async () => {
			if (ready) return;
			// user is already authenticated, ensure access_token is unique.
			// required by @/components/Wallet.
			await session.update('keycloak:refresh');
			setReady(true);
		})();
	}, [session]);

	return (
		<main className="dashboard-container">
			{ready && (
				<Wallet>
					<User/>
					<DashboardCard/>
					<Tabs/>
				</Wallet>
			)}
		</main>
	);
}
