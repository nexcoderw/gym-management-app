import 'server-only';

import { cookies } from 'next/headers';
import { ZodError, type z } from 'zod';

import { environment } from './environment';

const MAXIMUM_RESPONSE_BYTES = 64 * 1024;
const UPSTREAM_TIMEOUT_MS = 20_000;
const ALLOWED_COOKIE_NAMES = new Set([
	'nexcode-owner-session',
	'nexcode-owner-csrf',
	'__Host-nexcode-owner-session',
	'__Host-nexcode-owner-csrf',
]);

export async function upstreamJson<T>(
	path: `/owner/${string}`,
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
	let response: Response;
	try {
		response = await fetch(`${environment.GYM_API_BASE_URL}/api/v1${path}`, {
			method: init.method ?? 'GET',
			headers,
			body: init.body === undefined ? undefined : JSON.stringify(init.body),
			cache: 'no-store',
			redirect: 'error',
			signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
		});
	} catch {
		throw new UpstreamError(503, 'The service is temporarily unavailable.');
	}
	if (!response.ok) throw new UpstreamError(response.status, safeMessage(response.status));
	if (
		response.status !== 204 &&
		response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
			'application/json'
	) {
		await response.body?.cancel();
		throw new UpstreamError(502, 'The service returned an incompatible response.');
	}
	const value = response.status === 204 ? undefined : await boundedJson(response.body);
	return { data: schema.parse(value), response };
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

async function boundedJson(body: ReadableStream<Uint8Array> | null): Promise<unknown> {
	if (body === null) throw new UpstreamError(502, 'The service returned an incompatible response.');
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let size = 0;
	let text = '';
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > MAXIMUM_RESPONSE_BYTES) {
				await reader.cancel();
				throw new UpstreamError(502, 'The service returned an incompatible response.');
			}
			text += decoder.decode(value, { stream: true });
		}
		text += decoder.decode();
		return JSON.parse(text) as unknown;
	} catch (error) {
		if (error instanceof UpstreamError) throw error;
		throw new UpstreamError(502, 'The service returned an incompatible response.');
	} finally {
		reader.releaseLock();
	}
}
