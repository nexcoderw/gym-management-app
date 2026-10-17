import 'server-only';

import { ManagerOriginError, resolveManagerOrigin } from './manager-origin';

const MAXIMUM_BODY_BYTES = 16 * 1024;

export function requireSameOrigin(request: Request): string {
	try {
		return resolveManagerOrigin(request.headers, true);
	} catch (error: unknown) {
		if (!(error instanceof ManagerOriginError)) throw error;
		throw new RequestError(403, 'This request is not allowed.');
	}
}

export async function readJson(request: Request): Promise<unknown> {
	const contentLength = Number(request.headers.get('content-length') ?? 0);
	if (contentLength > MAXIMUM_BODY_BYTES) throw new RequestError(413, 'The request is too large.');
	const text = await request.text();
	if (Buffer.byteLength(text, 'utf8') > MAXIMUM_BODY_BYTES) {
		throw new RequestError(413, 'The request is too large.');
	}
	try {
		return JSON.parse(text) as unknown;
	} catch {
		throw new RequestError(400, 'The request is invalid.');
	}
}

export class RequestError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}
