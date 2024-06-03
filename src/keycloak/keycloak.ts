import Keycloak from "keycloak-js";

import { AuthProps } from "./types";
import { ACCOUNT_LS } from "./config/constants";
import { logError } from "./utils/logging";

export class KeycloakAuth {
	private kc: any;
	private baseUrl: string;
	private redirectUri: string;
	private logoutUrl: string;
	username: string;

	constructor(initOpts: AuthProps) {
		const { clientId, url, realm, redirectUri, baseUrl } = initOpts;
		// See this link for more information on the keycloak object
		// https://www.this.kc.org/docs/latest/securing_apps/#_javascript_adapter
		this.kc = new Keycloak({ url, clientId, realm });
		this.redirectUri = redirectUri;
		this.baseUrl = baseUrl;
		this.logoutUrl = `${url}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${baseUrl}`;
		this.username = "";

		//keycloak listeners to listen auth events
		this.kc.onAuthSuccess = () => {
			console.log("Authentication successful");
			this.setLocalstorage(true);
		};

		this.kc.onAuthError = (error: any) => {
			console.log("Authentication error", error);
		};

		this.kc.onTokenExpired = () => {
			console.log("Token expired");
			this.refreshSession(10);
		};
		this.kc.onAuthRefreshSuccess = () => {
			console.log("Token refreshed");
		};
		this.kc.onAuthLogout = () => {
			console.log("Logged Out");
		};
	}

	// Add account to localstorage
	private setLocalstorage = (save: boolean) => {
		if (save)
			localStorage.setItem(
				ACCOUNT_LS,
				JSON.stringify({
					token: this.kc.token,
					refreshToken: this.kc.refreshToken,
					email: this.kc.idTokenParsed?.email,
					name: this.kc.idTokenParsed?.name,
					userId: this.kc.idTokenParsed?.sub,
				})
			);
			else localStorage.removeItem(ACCOUNT_LS);
	};

	// Updates the users keycloak token
	refreshSession = async (time = 10) => {
		try {
			await this.kc.updateToken(time);

			// Loads user data from keycloak
			// This is called from keycloak updateToken callback
			if (this.kc.idToken) {
				this.setLocalstorage(true);
				this.username = this.kc.idTokenParsed?.name;
			} else {
				try {
					await this.kc.loadUserProfile();
					this.setLocalstorage(true);
					this.username = this.kc.profile?.firstName + " " + this.kc.profile?.lastName;
				} catch (error) {
					logError(error);
				}
			}
			return {
				token: this.kc.token,
				refreshToken: this.kc.refreshToken
			};
		} catch (error) {
			logError(error);
			this.kc.clearToken();
			this.kc.logout();
		}
	};

	// Login user and create a session
	initSession = async (loadType = "login-required") => {
		try {
			if (loadType === "login-required") {
				return this.kc.init({
					onLoad: loadType,
					redirectUri: this.redirectUri,
				});
			} else {
				return this.kc.init({
					onLoad: "check-sso",
					promiseType: "native",
					checkLoginFrame: false,
				});
			}
		} catch (error) {
			logError(error);
		}
	};

	// Logout a user and remove session
	logoutSession = async () => {
		try {
			localStorage.removeItem(ACCOUNT_LS);
			this.kc.logout({ redirectUri: this.baseUrl });
		} catch (error) {
			console.error("Logout error", error);
		}
	};

	//login with idp
	loginUsingIdp = (idp: string, redirect_uri: string = this.redirectUri) => {
		this.kc.login({ idpHint: idp, redirectUri: redirect_uri });
	};
}
