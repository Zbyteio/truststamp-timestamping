import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { JWT } from "next-auth/jwt"; // Import the extended JWT interface

// Extend the Session interface
declare module "next-auth" {
  interface Session {
    access_token?: string;
    refresh_token?: string;
    error?: string;
  }
}

// Extend the JWT interface
declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    expires_at?: number;
    refresh_token?: string;
    error?: string;
  }
}

interface RefreshTokenResponse {
  access_token: string;
  expires_at: number;
  refresh_token: string;
  [key: string]: any;
}

const refreshAccessToken = (refresh: string): Promise<[Error | null, RefreshTokenResponse | null]> => {
  return new Promise(async (resolve) => {
    let response;
    try {
      const clientId = process.env.KEYCLOAK_ID as string;
      const clientSecret = process.env.KEYCLOAK_SECRET as string;

      if (!clientId || !clientSecret) {
        return resolve([new Error("Missing Keycloak client ID or secret"), null]);
      }

      response = await fetch(
        "https://dplat.zbyte.io/kc/realms/community/protocol/openid-connect/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refresh,
          }),
        }
      );
    } catch (e) {
      if (e instanceof Error) {
        return resolve([new Error(`Error refreshing token: ${e.message}`), null]);
      } else {
        return resolve([new Error("Unknown error refreshing token"), null]);
      }
    }

    if (!response.ok) {
      return resolve([new Error(`Error refreshing token: ${response.statusText}`), null]);
    }

    resolve([null, await response.json()]);
  });
};

const handler = NextAuth({
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID as string,
      clientSecret: process.env.KEYCLOAK_SECRET as string,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, account, trigger, session }) {
      if (account) {
        token.access_token = account.access_token;
        token.expires_at = account.expires_at;
        token.refresh_token = account.refresh_token;
      }

      if (token.expires_at && token.refresh_token) {
        if (
          Date.now() > token.expires_at * 1000 ||
          (trigger === "update" && session === "keycloak:refresh")
        ) {
          const [error, refreshToken] = await refreshAccessToken(token.refresh_token);
          if (error) {
            console.error(error);
            token.error = error.message;
          } else {
            Object.assign(token, refreshToken);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.access_token = token.access_token;
      session.refresh_token = token.refresh_token;
      session.error = token.error;
      return session;
    },
  },
});

export { handler as GET, handler as POST };