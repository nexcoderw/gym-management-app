import 'server-only';

import { cookies, headers as requestHeaders } from 'next/headers';
import { ZodError, type z } from 'zod';

import { environment } from './environment';
import { resolveManagerOrigin } from './manager-origin';

const MAXIMUM_RESPONSE_BYTES = 64 * 1024;
const MAXIMUM_PDF_BYTES = 32 * 1024 * 1024;
const READ_TIMEOUT_MS = 30_000;
const COMMAND_TIMEOUT_MS = 45_000;
const PDF_TIMEOUT_MS = 90_000;
type OwnerUpstreamPath = `/owner/${string}` | `/owner-enrollment/${string}`;
interface OwnerRequestInit {
	readonly method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	readonly body?: unknown;
	readonly csrfToken?: string;
	readonly ifMatch?: string;
	readonly idempotencyKey?: string;
	readonly origin?: string;
}
const ALLOWED_COOKIE_NAMES = new Set([
	'nexcode-owner-session',
	'nexcode-owner-csrf',
	'__Host-nexcode-owner-session',
	'__Host-nexcode-owner-csrf',
]);

export async function upstreamJson<T>(
	path: OwnerUpstreamPath,
	init: OwnerRequestInit,
	schema: z.ZodType<T>,
): Promise<{ readonly data: T; readonly response: Response }> {
	const response = await requestOwnerUpstream(path, init, 'application/json');
	if (
		response.status !== 204 &&
		response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json'
	) {
		await response.body?.cancel();
		throw new UpstreamError(502, 'The service returned an incompatible response.');
	}
	const value = response.status === 204 ? undefined : await boundedJson(response.body);
	return { data: schema.parse(value), response };
}

/** Only server adapters request PDFs; browser headers and destinations never pass through. */
export async function upstreamPdf(path: OwnerUpstreamPath): Promise<Uint8Array<ArrayBuffer>> {
	const response = await requestOwnerUpstream(path, {}, 'application/pdf');
	if (
		response.status !== 200 ||
		response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/pdf'
	) {
		await response.body?.cancel();
		throw new UpstreamError(502, 'The service returned an incompatible response.');
	}
	const bytes = await boundedBytes(response.body, MAXIMUM_PDF_BYTES);
	if (bytes.length < 5 || new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
		throw new UpstreamError(502, 'The service returned an incompatible response.');
	}
	return bytes;
}

async function requestOwnerUpstream(
	path: OwnerUpstreamPath,
	init: OwnerRequestInit,
	accept: 'application/json' | 'application/pdf',
): Promise<Response> {
	const cookieStore = await cookies();
	const cookieHeader = cookieStore
		.getAll()
		.filter(({ name }) => ALLOWED_COOKIE_NAMES.has(name))
		.map(({ name, value }) => `${name}=${value}`)
		.join('; ');
	const origin =
		init.origin ??
		environment.MANAGER_ORIGIN ??
		resolveManagerOrigin(await requestHeaders(), false);
	const headers = new Headers({ Accept: accept, Origin: origin });
	if (cookieHeader !== '') headers.set('Cookie', cookieHeader);
	if (init.body !== undefined) headers.set('Content-Type', 'application/json');
	if (init.csrfToken !== undefined) headers.set('x-owner-csrf-token', init.csrfToken);
	if (init.ifMatch !== undefined) headers.set('If-Match', init.ifMatch);
	if (init.idempotencyKey !== undefined) {
		headers.set('Idempotency-Key', init.idempotencyKey);
	}
	let response: Response;
	try {
		const timeoutMs =
			accept === 'application/pdf'
				? PDF_TIMEOUT_MS
				: (init.method ?? 'GET') === 'GET'
					? READ_TIMEOUT_MS
					: COMMAND_TIMEOUT_MS;
		response = await fetch(`${environment.GYM_API_BASE_URL}/api/v1${path}`, {
			method: init.method ?? 'GET',
			headers,
			body: init.body === undefined ? undefined : JSON.stringify(init.body),
			cache: 'no-store',
			redirect: 'error',
			signal: AbortSignal.timeout(timeoutMs),
		});
	} catch {
		throw new UpstreamError(503, 'The service is temporarily unavailable.');
	}
	if (!response.ok) {
		const message = await upstreamErrorMessage(response);
		throw new UpstreamError(response.status, message);
	}
	return response;
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
	if (status === 400) return 'Review the request details and try again.';
	if (status === 401) return 'The credentials or invitation could not be verified.';
	if (status === 403) return 'This request is not allowed.';
	if (status === 404) return 'The requested record is no longer available.';
	if (status === 409) return 'This request conflicts with the current record.';
	if (status === 412) return 'This membership changed elsewhere. Reload it and try again.';
	if (status === 429) return 'Too many attempts. Wait before trying again.';
	return 'The service is temporarily unavailable.';
}

async function upstreamErrorMessage(response: Response): Promise<string> {
	const fallback = safeMessage(response.status);
	if (
		response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json'
	) {
		return fallback;
	}
	try {
		const body = (await response.json()) as {
			message?: unknown;
			error?: { message?: unknown; details?: unknown };
		};
		const messages = [body.message, body.error?.message];
		for (const message of messages) {
			if (typeof message === 'string' && message.trim() !== '') return message;
			if (Array.isArray(message)) {
				const values = message.filter((item): item is string => typeof item === 'string');
				if (values.length > 0) return values.join(' ');
			}
		}
		if (Array.isArray(body.error?.details)) {
			const details = body.error.details.filter((item): item is string => typeof item === 'string');
			if (details.length > 0) return details.join(' ');
		}
		return fallback;
	} catch {
		return fallback;
	}
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

async function boundedBytes(
	body: ReadableStream<Uint8Array> | null,
	maximumBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
	if (body === null) throw new UpstreamError(502, 'The service returned an incompatible response.');
	const reader = body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > maximumBytes) {
				await reader.cancel();
				throw new UpstreamError(502, 'The service returned an incompatible response.');
			}
			chunks.push(value);
		}
		const result = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			result.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return result;
	} catch (error: unknown) {
		if (error instanceof UpstreamError) throw error;
		throw new UpstreamError(502, 'The service returned an incompatible response.');
	} finally {
		reader.releaseLock();
	}
}
