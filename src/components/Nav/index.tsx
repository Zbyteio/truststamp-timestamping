import Image from 'next/image';
import logoTruststamp from '@/assets/icons/logoTruststamp.png';
import styles from './styles.module.css';

export default function Nav() {
	return (
		<nav className={styles.nav}>
			<Image src={logoTruststamp} alt="TrustStamp Logo" width={60} height={60} />
			<ul className={styles.links}>
				<li><a className={styles.link} href="/recovery">Recovery</a></li>
				<li><a className={styles.link} href="/setup">Setup</a></li>
				<li><a className={styles.link} href="/feature">Features</a></li>
				<li><a className={styles.link} href="/dashboard">Dashboard</a></li>
			</ul>
		</nav>
	);
}
