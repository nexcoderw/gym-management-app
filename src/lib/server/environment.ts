import 'server-only';

import { z } from 'zod';

const exactOrigin = z.url().refine((value) => {
	const url = new URL(value);
	return !(
		url.origin !== value ||
		!['http:', 'https:'].includes(url.protocol) ||
		url.hostname.includes('*') ||
		url.username !== '' ||
		url.password !== '' ||
		url.pathname !== '/' ||
		url.search !== '' ||
		url.hash !== ''
	);
}, 'Must be an exact HTTP origin.');

const baseDomain = z
	.string()
	.max(253)
	.regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u)
	.refine(
		(value) =>
			value !== 'localhost' && !value.endsWith('.invalid') && !value.endsWith('.test'),
		'Must be a production DNS base domain.',
	);

const production = process.env.NODE_ENV === 'production';
const apiOrigin = exactOrigin.parse(process.env.GYM_API_BASE_URL);
if (production && !apiOrigin.startsWith('https://')) {
	throw new Error('GYM_API_BASE_URL must use HTTPS in production.');
}
if (!production && apiOrigin.startsWith('http://') && !isLoopbackOrigin(apiOrigin)) {
	throw new Error('GYM_API_BASE_URL may use HTTP only on a loopback host.');
}

const managerOrigin = production ? null : exactOrigin.parse(process.env.MANAGER_ORIGIN);
const managerBaseDomain = production
	? baseDomain.parse(process.env.MANAGER_BASE_DOMAIN?.toLowerCase())
	: null;

if (production && process.env.MANAGER_ORIGIN !== undefined) {
	throw new Error('Production uses MANAGER_BASE_DOMAIN instead of MANAGER_ORIGIN.');
}
if (!production && process.env.MANAGER_BASE_DOMAIN !== undefined) {
	throw new Error('MANAGER_BASE_DOMAIN is production-only.');
}
if (
	managerOrigin !== null &&
	managerOrigin.startsWith('http://') &&
	!isLoopbackOrigin(managerOrigin)
) {
	throw new Error('MANAGER_ORIGIN may use HTTP only on a loopback host.');
}

export const environment = Object.freeze({
	GYM_API_BASE_URL: apiOrigin,
	MANAGER_ORIGIN: managerOrigin,
	MANAGER_BASE_DOMAIN: managerBaseDomain,
	production,
});

function isLoopbackOrigin(origin: string): boolean {
	return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname);
}
