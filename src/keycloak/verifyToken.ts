/**
 *
 * MIT License
 *
 * Copyright (c) 2019 OECD
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import axios from "axios";
/* eslint-disable */
const jwkToPem = require("jwk-to-pem");
/* eslint-disable */
const jwt = require("jsonwebtoken");
/* eslint-disable */
const url = require("url");

// Authenticates the url if zblocks.io/zbytes.io is token provider
const authenticateUrl = (issUrl: string) => {
	const parsedUrl = url.parse(issUrl);
	const hostName = parsedUrl.hostname;
	const domain = hostName?.split(".").splice(-2).join(".");
	if (domain === "zblocks.io") {
		return true;
	} else {
		return false;
	}
};

// Maps fields to camel case
const makeUser = (user: any) => ({
	id: user.sub,
	userName: user.preferred_username,
	emailVerified: user.email_verified,
	resourceAccess: user.resource_access,
	email: user.email,
	name: user.name,
	enterpriseId: user.enterprise_id,
});

// Add key:value here to expose more data to response
const filterUserResponse = (user: any) => {
	return {
		id: user.id,
		userName: user.userName,
		emailVerified: user.emailVerified,
		resourceAccess: user.resourceAccess,
		email: user.email,
		name: user.name,
		enterpriseId: user.enterpriseId,
	};
};

// Verify online function to authenticate user from userinfo endpoint
export const verifyOnline = async (accessToken: string) => {
	const data = jwt.decode(accessToken);
	if (data?.iss) {
		let user;
		if (authenticateUrl(data.iss)) {
			try {
				const response = await axios.get(`${data.iss}/protocol/openid-connect/userinfo`, {
					headers: { Authorization: `Bearer ${accessToken}` },
				});
				user = filterUserResponse(makeUser(response.data));
				return user;
			} catch (e: any) {
				return e;
			}
		} else {
			const err = new Error("ERROR, Invalid domain for the access token.");
			throw err;
		}
	} else {
		const err = new Error("ERROR, No endpoint found OR Unable to decode JWT.");
		throw err;
	}
};

// Verify offline function to authenticate and fetch user from the JWT token & public key
export const verifyOffline = async (accessToken: string) => {
	let user;
	const token = jwt.decode(accessToken, { complete: true });
	const data = token.payload;
	const kid = token?.header?.kid;

	if (data?.iss) {
		if (authenticateUrl(data.iss)) {
			const keysReponse = await axios.get(`${data.iss}/protocol/openid-connect/certs`, {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
			const keys = keysReponse?.data?.keys;
			const matchingKey = keys.filter((key: any) => {
				return key.kid === kid;
			});
			if (matchingKey.length > 0) {
				const pem = jwkToPem(matchingKey[0]);
				const userInfo = await jwt.verify(accessToken, pem);
				user = filterUserResponse(makeUser(userInfo));
				return user;
			}
		} else {
			const err = new Error("ERROR, Invalid domain for the access token.");
			throw err;
		}
	} else {
		const err = new Error("ERROR, No endpoint found OR Unable to decode JWT.");
		throw err;
	}
};
