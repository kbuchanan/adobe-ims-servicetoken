/**
 * adobe-ims-servicetoken
 *
 * @copyright 2023 Jason Mulligan <jason.mulligan@avoidwork.com>
 * @license BSD-3-Clause
 * @version 3.0.0
 */
'use strict';

var murmurHash3 = require('murmurhash3js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var murmurHash3__default = /*#__PURE__*/_interopDefaultLegacy(murmurHash3);

const hash128 = murmurHash3__default["default"].x64.hash128,
	tokens = new Map(),
	clone = typeof structuredClone === "function" ? structuredClone : arg => JSON.parse(JSON.stringify(arg));

async function token ({
	url = "https://ims-na1.adobelogin.com/ims/token",
	grant_type = "authorization_code",
	client_id = "",
	client_secret = "",
	code = "",
	jwt_token = ""
} = {}) {
	const key = hash128(`${url}|${client_id}|${grant_type}`);
	let result;

	if (tokens.has(key) === false) {
		const form = new FormData();
		let res;

		if (grant_type.length > 0) {
			form.append("grant_type", grant_type);
		}

		form.append("client_id", client_id);
		form.append("client_secret", client_secret);

		if (code.length > 0) {
			form.append("code", code);
		}

		if (jwt_token.length > 0) {
			form.append("jwt_token", jwt_token);
		}

		try {
			res = await fetch(url, {
				method: "POST",
				body: form
			});
		} catch (err) {
			res = {
				ok: false,
				statusText: err.message || err,
				json: async () => {
					return {
						error: res.statusText,
						error_description: err.message
					};
				},
				text: async () => err.message || err
			};
		}

		const data = await res.json();

		if (res.ok) {
			tokens.set(key, data.access_token);
			result = clone(data.access_token);

			if (data.expires_in !== void 0) {
				setTimeout(() => tokens.delete(key), data.expires_in); // 24hr validity at time of dev
			}
		} else {
			throw new Error(`[${res.status}] ${data.error}: ${data.error_description}`);
		}
	} else {
		result = clone(tokens.get(key));
	}

	return result;
}

module.exports = token;
