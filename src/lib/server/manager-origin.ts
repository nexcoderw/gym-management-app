import 'server-only';

import { environment } from './environment';

const RESERVED_SLUGS = new Set([
	'admin',
	'api',
	'app',
	'www',
	'auth',
	'login',
	'member',
	'members',
	'portal',
	'dashboard',
	'billing',
	'support',
	'status',
	'static',
	'assets',
	'cdn',
	'mail',
	'notify',
	'dev',
	'staging',
	'test',
	'localhost',
	'account',
	'accounts',
	'oauth',
	'console',
	'internal',
	'health',
	'metrics',
	'production',
	'development',
	'bootstrap',
]);

export function resolveManagerOrigin(
	headers: Pick<Headers, 'get'>,
	requireBrowserOrigin: boolean,
): string {
	const browserOrigin = headers.get('origin');
	if (environment.MANAGER_ORIGIN !== null) {
		if (requireBrowserOrigin && browserOrigin !== environment.MANAGER_ORIGIN) {
			throw new ManagerOriginError();
		}
		if (browserOrigin !== null && browserOrigin !== environment.MANAGER_ORIGIN) {
			throw new ManagerOriginError();
		}
		return environment.MANAGER_ORIGIN;
	}

	const baseDomain = environment.MANAGER_BASE_DOMAIN;
	const host = headers.get('host')?.toLowerCase();
	if (baseDomain === null || host === undefined) throw new ManagerOriginError();
	const expectedOrigin = tenantOriginFromHost(host, baseDomain);
	if (expectedOrigin === null) throw new ManagerOriginError();
	if (requireBrowserOrigin && browserOrigin !== expectedOrigin) throw new ManagerOriginError();
	if (browserOrigin !== null && browserOrigin !== expectedOrigin) throw new ManagerOriginError();
	return expectedOrigin;
}

export function tenantOriginFromHost(host: string, baseDomain: string): string | null {
	const normalizedHost = host.toLowerCase();
	const normalizedBaseDomain = baseDomain.toLowerCase();
	if (normalizedHost.includes(':')) return null;
	const suffix = `.${normalizedBaseDomain}`;
	if (!normalizedHost.endsWith(suffix)) return null;
	const slug = normalizedHost.slice(0, -suffix.length);
	if (
		slug.includes('.') ||
		slug.length < 3 ||
		slug.length > 63 ||
		!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(slug) ||
		RESERVED_SLUGS.has(slug)
	) {
		return null;
	}
	return `https://${normalizedHost}`;
}

export class ManagerOriginError extends Error {
	constructor() {
		super('The request origin is not allowed.');
	}
}
