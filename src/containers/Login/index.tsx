import React, { useContext, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { Button, Typography } from 'antd';
import AuthButton from '@/components/AuthButton';
import logo from '@/assets/images/logo.svg';
import keycloakIcon from '@/assets/icons/keycloak-svgrepo-com.svg';
import './style.scss';

export default function LoginContainer() {
	return (
		<main className="login-container">
			<Image src={logo} alt=""/>
			<Typography.Text className="description">zbyte wallet allows you to make fast and secure blockchain-based payments without intermediaries.</Typography.Text>

			<div className="auth-buttons">
				<Typography.Title level={2}>Sign in</Typography.Title>
				<AuthButton
					onClick={() => signIn('keycloak')}
					text="Sign in with Keycloak"
					icons={keycloakIcon}
				/>
			</div>
		</main>
	);
}
