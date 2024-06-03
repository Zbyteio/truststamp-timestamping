import { createContext, useEffect, useRef, useState } from "react";
import { KeycloakAuth } from "../keycloak";

export const KeycloakContext = createContext<KeycloakAuth | null>(null);

function KeycloakProvider({ children }: any) {
	const [authKeycloak, setAuthKeycloak] = useState<KeycloakAuth>();
	const checkedRef = useRef<boolean>(false);

	useEffect(() => {
		if (document) {
			const auth = new KeycloakAuth({
				url: process.env.REACT_APP_KEYCLOAK_URL || "",
				realm: process.env.REACT_APP_KEYCLOAK_REALM || "",
				clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || "",
				redirectUri: process.env.REACT_APP_KEYCLOAK_REDIRECT_URL || "",
				baseUrl: process.env.REACT_APP_URL || "",
			});

			if (!checkedRef.current) {
				checkedRef.current = true;
				auth.initSession("check-sso").then(() => {
					setAuthKeycloak(auth);
				});
			}
		}
	}, []);

	return <KeycloakContext.Provider value={authKeycloak!}>{children}</KeycloakContext.Provider>;
}
export default KeycloakProvider;
