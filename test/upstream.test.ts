import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('next/headers', () => ({
	cookies: vi.fn(async () => ({ getAll: () => [] })),
	headers: vi.fn(async () => new Headers({ host: 'soho.example.com' })),
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

	it('gives enrollment commands a bounded deadline without replaying them', async () => {
		const deadline = vi.spyOn(AbortSignal, 'timeout');
		fetchMock.mockResolvedValueOnce(Response.json({ status: 'ok' }));

		await upstreamJson(
			'/owner-enrollment/challenges',
			{ method: 'POST', body: { invitationToken: 'a'.repeat(43) } },
			z.object({ status: z.string() }),
		);

		expect(deadline).toHaveBeenCalledWith(45_000);
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('forwards only the membership command precondition and CSRF token', async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({
				id: '44444444-4444-4444-8444-444444444444',
				name: 'Monthly strength',
				price: 35_000,
				currency: 'RWF',
				description: null,
				status: 'ACTIVE',
				createdAt: '2030-01-01T08:00:00.000Z',
				updatedAt: '2030-01-01T08:00:00.000Z',
				archivedAt: null,
			}),
		);

		await upstreamJson(
			'/owner/membership-plans/44444444-4444-4444-8444-444444444444',
			{
				method: 'PATCH',
				body: { name: 'Monthly strength', price: 35_000, description: null },
				csrfToken: 'csrf-token',
				ifMatch: '"2030-01-01T08:00:00.000Z"',
				origin: 'https://soho.example.com',
			},
			z.object({ id: z.uuid() }).passthrough(),
		);

		const [, init] = fetchMock.mock.calls[0] ?? [];
		const headers = new Headers(init?.headers);
		expect(init?.method).toBe('PATCH');
		expect(headers.get('if-match')).toBe('"2030-01-01T08:00:00.000Z"');
		expect(headers.get('x-owner-csrf-token')).toBe('csrf-token');
		expect(headers.get('origin')).toBe('https://soho.example.com');
	});
});
