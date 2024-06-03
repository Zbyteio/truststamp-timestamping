// imports
import NextAuth from "next-auth"

// importing providers
import KeycloakProvider from "next-auth/providers/keycloak";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

const refreshAccessToken = refresh => {
	return new Promise(async resolve => {
		let response;
		try {
			// https://dplat.zbyte.io/kc/realms/community/.well-known/openid-configuration
			response = await fetch('https://dplat.zbyte.io/kc/realms/community/protocol/openid-connect/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					grant_type: 'refresh_token',
					client_id: process.env.KEYCLOAK_ID,
					client_secret: process.env.KEYCLOAK_SECRET,
					refresh_token: refresh
				})
			});
		} catch(e) {
			return resolve([new Error(`Error refreshing token: ${e.message}`)]);
		}

		if (!response.ok) return resolve([new Error(`Error refreshing token: ${response.statusText}`)]);

		resolve([null, await response.json()]);
	});
};

const handler = NextAuth({
	providers: [
		KeycloakProvider({
			clientId: process.env.KEYCLOAK_ID as string,
			clientSecret: process.env.KEYCLOAK_SECRET as string,
			issuer: process.env.KEYCLOAK_ISSUER
		}),
		GithubProvider({
			clientId: process.env.GITHUB_ID as string,
			clientSecret: process.env.GITHUB_SECRET as string,
		}),
	],
	callbacks: {
		async jwt({ token, account, trigger, session }) {
			const tk = { ...token };

			if (account) {
				Object.assign(tk, {
					access_token: account.access_token,
					expires_at: account.expires_at,
					refresh_token: account.refresh_token
				});
			}

			if (Date.now() > token.expires_at * 1000 || (trigger === 'update' && session === 'keycloak:refresh')) {
				const [error, refreshToken] = await refreshAccessToken(tk.refresh_token);
				error && console.error(error);
				error ? (token.error = error.message) : Object.assign(tk, refreshToken);
			}

			return tk;
		},

		async session({ session, token }) {
			session.access_token = token.access_token;
			session.refresh_token = token.refresh_token;
			session.error = token.error;
			return session;
		}
	}
})

export { handler as GET, handler as POST }
