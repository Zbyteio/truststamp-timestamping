import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image';
import { Button } from 'antd';
import Avatar from '@/assets/icons/avatar.svg';
import './style.scss';

export default function User() {
	const { data: session } = useSession();

	return (
		<div className="user">
			<div className="flex">
				<div className="user-avatar">
					<Image src={Avatar} alt=""/>
				</div>
				<div className="user-text">
					<div className="user-title">Hello</div>
					<div className="user-name">{session?.user?.name}</div>
				</div>
			</div>

			<Button className="logout" type="default" onClick={() => signOut()}>Logout</Button>
		</div>
	);
}
