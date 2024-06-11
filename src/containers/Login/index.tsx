import React, { useEffect } from 'react';
import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import Image from 'next/image';
import logo from '@/assets/images/logo.svg';
import './style.scss';
import { useRouter } from 'next/navigation';
import { useKeys } from '@/context/KeysContext';

export default function LoginContainer() {
	const { data: session, status } = useSession();
	const { publicKey, privateKey } = useKeys();
	const router = useRouter();

	useEffect(() => {

		const routeIfLoggedIn = async () => {
			console.log(status);
			if (status === "authenticated" && session?.user?.email) {
				const email = session.user.email;
				if (publicKey && privateKey) {
					try {
						if (await checkIfDatabaseIsEmpty(email)) {
							router.push('/setup');
						}
						else{
							router.push('/dashboard');
						}
					}
					catch (err)
					{
						router.push('/recovery');
					}

				}
				else {
					router.push('/recovery');
				}
			}

		};

		routeIfLoggedIn();
	});

	const checkIfDatabaseIsEmpty = async (email: string) => {
		const response = await fetch(`/api/database/checkDatabaseEmpty?email=${encodeURIComponent(email)}`);
		const data = await response.json();

		if (data.empty) {
			return true;
		}
		else {
			return false;
		}
	};

	const authRedirect = async (idp?: string) => {
		try {
			const params: any = {};
			if (idp) params.kc_idp_hint = idp;
			const response = await signIn("keycloak", {}, params);
			if (!response || response.error) router.push("/login");
		} catch (e) {
			console.log("Exception in login", e);
		}
	};

	return (
		<main style={styles.container as React.CSSProperties}>
			<Image src={logo} alt="TrustStamp Logo" style={styles.logo as React.CSSProperties} />
			<section style={styles.loginSection as React.CSSProperties}>
				<h1 style={styles.title as React.CSSProperties}>Welcome to TrustStamp</h1>
				<div style={styles.buttonContainer as React.CSSProperties}>
					<button
						style={{ ...styles.button, ...styles.googleButton } as React.CSSProperties}
						onClick={() => authRedirect('google')}
					>
						<i className="fab fa-google" style={styles.icon as React.CSSProperties}></i> Login with Google
					</button>
					<button
						style={{ ...styles.button, ...styles.microsoftButton } as React.CSSProperties}
						onClick={() => authRedirect('microsoft')}
					>
						<i className="fab fa-microsoft" style={styles.icon as React.CSSProperties}></i> Login with Microsoft
					</button>
				</div>
			</section>
		</main>
	);
}

// Styles
const styles = {
	container: {
		height: '100vh',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FAF5FF',
		fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
		flexDirection: 'column',
	},
	loginSection: {
		backgroundColor: '#fff',
		padding: '40px',
		borderRadius: '10px',
		boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
		textAlign: 'center',
		maxWidth: '400px',
		width: '100%',
		marginTop: '20px',
	},
	logo: {
		width: '100px',
		position: 'absolute',
		top: '20px',
		left: '20px',
	},
	title: {
		marginBottom: '30px',
		color: '#333',
		fontSize: '24px',
	},
	buttonContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '15px',
	},
	button: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '12px 25px',
		fontSize: '16px',
		borderRadius: '5px',
		border: 'none',
		cursor: 'pointer',
		transition: 'background-color 0.3s ease, transform 0.3s ease',
	},
	googleButton: {
		backgroundColor: '#fff',
		color: '#007bff',
		border: '2px solid #007bff',
	},
	microsoftButton: {
		backgroundColor: '#fff',
		color: '#007bff',
		border: '2px solid #007bff',
	},
	icon: {
		marginRight: '10px',
	},
};

// Define TextAlignProperty type
type TextAlignProperty = 'center' | 'end' | 'inherit' | 'initial' | 'justify' | 'left' | 'match-parent' | 'right' | 'start' | 'unset';