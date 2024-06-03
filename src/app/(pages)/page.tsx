'use client';

import { useSession} from 'next-auth/react';
import LoginContainer from '@/containers/Login';
import DashboardContainer from '@/containers/Dashboard';

export default function Home() {
	const { data: session } = useSession();
	globalThis.apiBaseUrl = 'https://dplat.zbyte.io';
	return session ? <DashboardContainer/> : <LoginContainer/>;
}
