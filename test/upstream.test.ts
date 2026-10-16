import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({ getAll: () => [] })),
}));

import { errorResponse, upstreamJson } from '@/lib/server/upstream';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('owner portal upstream resilience', () => {
	it('maps an unavailable API to a safe recoverable response', async () => {
		fetchMock.mockRejectedValueOnce(new Error('private connection detail'));

		let failure: unknown;
		try {
			await upstreamJson('/owner/auth/session', {}, z.object({ status: z.string() }));
		} catch (error) {
			failure = error;
		}

		const response = errorResponse(failure);
		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toEqual({
			message: 'The service is temporarily unavailable.',
		});
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('rejects non-JSON success responses as incompatible', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response('<html>proxy error</html>', {
				status: 200,
				headers: { 'Content-Type': 'text/html' },
			}),
		);

		await expect(
			upstreamJson('/owner/auth/session', {}, z.object({ status: z.string() })),
		).rejects.toMatchObject({
			status: 502,
			message: 'The service returned an incompatible response.',
		});
	});
});
