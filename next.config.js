// @ts-check

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	typescript: {
		ignoreBuildErrors: !!process.env.IGNORE_BUILD_ERRORS
	},
	sassOptions: {
		includePaths: [path.join(__dirname, "src/styles")],
		prependData: '@import "./base.scss";',
		logger: {
			debug: m => console.log(m)
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**',
			},
		],
	},
	env: {
		REACT_APP_ENV: process.env.REACT_APP_ENV,
		REACT_APP_URL: process.env.REACT_APP_URL,
		REACT_APP_KEYCLOAK_URL: process.env.REACT_APP_KEYCLOAK_URL,
		REACT_APP_KEYCLOAK_REALM: process.env.REACT_APP_KEYCLOAK_REALM,
		REACT_APP_KEYCLOAK_CLIENT_ID: process.env.REACT_APP_KEYCLOAK_CLIENT_ID,
		REACT_APP_KEYCLOAK_REDIRECT_URL: process.env.REACT_APP_KEYCLOAK_REDIRECT_URL,

		REACT_APP_BASE_URL: process.env.REACT_APP_BASE_URL,
		REACT_APP_TOKEN_EXPIRY: process.env.REACT_APP_TOKEN_EXPIRY,
		REACT_APP_TYPE_OF_TOKEN: process.env.REACT_APP_TYPE_OF_TOKEN,
		REACT_APP_DOMAIN: process.env.REACT_APP_DOMAIN,
		REACT_APP_CLIENT_ID: process.env.REACT_APP_CLIENT_ID,
		REACT_APP_VERIFIER: process.env.REACT_APP_VERIFIER,
		REACT_APP_AUTH_NETWORK_TYPE: process.env.REACT_APP_AUTH_NETWORK_TYPE,
		REACT_APP_AUTH_CLIENT_ID: process.env.REACT_APP_AUTH_CLIENT_ID,
		REACT_APP_ENABLE_LOGGING: process.env.REACT_APP_ENABLE_LOGGING,

		REACT_APP_CAPTCHA_SITEKEY: process.env.REACT_APP_CAPTCHA_SITEKEY,

		REACT_APP_WALLET_URL: process.env.REACT_APP_WALLET_URL,
		REACT_APP_POLYGONSCAN_API_KEY: process.env.REACT_APP_POLYGONSCAN_API_KEY,
		REACT_APP_MORALIS_API_KEY: process.env.REACT_APP_MORALIS_API_KEY,
	},
};

module.exports = nextConfig;
