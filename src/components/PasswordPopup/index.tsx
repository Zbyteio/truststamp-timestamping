import styles from "./PasswordPopup.module.css";
import React, { useState } from "react";

interface PasswordPopupProps {
	onClose: () => void;
	onSubmit: (password: string) => void;
}

const PasswordPopup: React.FC<PasswordPopupProps> = ({ onClose, onSubmit }) => {
	const [password, setPassword] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(password);
	};

	return (
		<div className={styles.mainPart}>
			<div className={styles.textPart}>
				<h2>Enter Password</h2>
				<form onSubmit={handleSubmit}>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className={styles.passwordInput}
					/>
					<button type="submit" className={styles.buttonSubmit}>
						Submit
					</button>
				</form>
			</div>
		</div>
	);
};

export default PasswordPopup;
