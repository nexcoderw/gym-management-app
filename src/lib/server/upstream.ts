import 'server-only';

import { cookies } from 'next/headers';
import { ZodError, type z } from 'zod';

import { environment } from './environment';

const MAXIMUM_RESPONSE_BYTES = 64 * 1024;
const ALLOWED_COOKIE_NAMES = new Set([
	'nexcode-owner-session',
	'nexcode-owner-csrf',
	'__Host-nexcode-owner-session',
	'__Host-nexcode-owner-csrf',
]);

export async function upstreamJson<T>(
	path: string,
	init: { readonly method?: 'GET' | 'POST'; readonly body?: unknown; readonly csrfToken?: string },
	schema: z.ZodType<T>,
): Promise<{ readonly data: T; readonly response: Response }> {
	const cookieStore = await cookies();
	const cookieHeader = cookieStore
		.getAll()
		.filter(({ name }) => ALLOWED_COOKIE_NAMES.has(name))
		.map(({ name, value }) => `${name}=${value}`)
		.join('; ');
	const headers = new Headers({ Accept: 'application/json', Origin: environment.MANAGER_ORIGIN });
	if (cookieHeader !== '') headers.set('Cookie', cookieHeader);
	if (init.body !== undefined) headers.set('Content-Type', 'application/json');
	if (init.csrfToken !== undefined) headers.set('x-owner-csrf-token', init.csrfToken);
	const response = await fetch(`${environment.GYM_API_BASE_URL}/api/v1${path}`, {
		method: init.method ?? 'GET',
		headers,
		body: init.body === undefined ? undefined : JSON.stringify(init.body),
		cache: 'no-store',
		signal: AbortSignal.timeout(15_000),
	});
	const text = await response.text();
	if (Buffer.byteLength(text, 'utf8') > MAXIMUM_RESPONSE_BYTES) {
		throw new Error('The upstream response exceeded the safe size limit.');
	}
	if (!response.ok) throw new UpstreamError(response.status, safeMessage(response.status));
	return { data: schema.parse(text === '' ? undefined : (JSON.parse(text) as unknown)), response };
}

export class UpstreamError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

export function copyOwnerCookies(source: Response, target: Headers): void {
	const values = source.headers.getSetCookie();
	for (const value of values) {
		const name = value.slice(0, value.indexOf('='));
		if (ALLOWED_COOKIE_NAMES.has(name)) target.append('Set-Cookie', value);
	}
}

export function errorResponse(error: unknown): Response {
	const status =
		error instanceof ZodError
			? 400
			: error instanceof UpstreamError && error.status < 500
				? error.status
				: 503;
	const message =
		error instanceof ZodError
			? 'The request or service response was invalid.'
			: error instanceof UpstreamError
				? error.message
				: 'The service is temporarily unavailable.';
	return Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function safeMessage(status: number): string {
	if (status === 401) return 'The credentials or invitation could not be verified.';
	if (status === 403) return 'This request is not allowed.';
	if (status === 409) return 'This invitation can no longer be accepted.';
	if (status === 429) return 'Too many attempts. Wait before trying again.';
	return 'The service is temporarily unavailable.';
}
